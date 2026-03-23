/** Maximum height in inches for a single fill-rectangle strip document. */
const FILL_REC_STRIP_HEIGHT_INCH = 20;

/** Constructor parameters for {@link GridLayoutGenerator}. */
interface GridLayoutGeneratorParams {
  /** Apparel size identifier used for SIZE_TKN text replacement. */
  sizeChar: ApparelSize;
  /** Total number of items to place across all generated documents. */
  quantity: number;
  /** Target artwork dimensions in inches. */
  dimension: DimensionObject;
  /** Resolved garment-part descriptor containing source PageItems and pairing metadata. */
  jftItem: JFTItem;
  /** Preferred stack orientation: `"auto"` | `"vertical"` | `"horizontal"`. */
  orientation: StackOrientation;
  /** Size token written into SIZE_TKN frames. Defaults to `"ALL"` when omitted. */
  sizeTkn?: ApparelSize | ApparelSizeRange;
  /** FIFO data queue for dynamic text injection. `null` when no injection is needed. */
  data: AutomateData["details"]["L"]["DATA"] | null;
  /** Gap between placed items in inches. */
  distributeGap: number;
}

/** Parameters shared by layout pass entry points. */
type GridLayoutPassParams = Record<"rows" | "cols", number> & {
  /** Document count and per-document column allocation from {@link GridCalculator}. */
  reqDocs: RequiredDocReturn;
};

/** Extends {@link GridLayoutPassParams} with a dynamic source item and optional direction. */
type DynamicGridLayoutPassParams = GridLayoutPassParams & {
  /** Direction marker appended to the output filename for unpaired items. */
  direction?: DirectionMarkers;
  /** The composed GroupItem used as the duplication source for this pass. */
  dynamicItem: PageItem;
};

/** Parameters for the low-level grid duplication loop. */
type CreateGridParams = Omit<GridLayoutPassParams, "reqDocs"> & {
  /** Maximum number of columns per document. */
  maxCol: number;
  /** Target document that receives the duplicated items. */
  doc: Document;
  /** Clean reference item that acts as duplication source for each grid cell. */
  item: PageItem;
};

/** Mutable state snapshot for the active layout pass. */
interface LayoutPassTracker {
  /** Whether this is the main pass or the remainder pass. */
  type: "main" | "rem";
  /** Number of items placed so far in this pass. */
  placedQty: number;
  /** Total items this pass must place before stopping. */
  targetQty: number;
  /** Stack type active for this pass. */
  stack: StackType;
  /** Items per row for this pass. */
  rows: number;
  /** Number of rows (columns in the vertical sense) for this pass. */
  cols: number;
}

/**
 * Result of {@link GridLayoutGenerator.resolveMixedEntries}.
 * `null` when both JFT items share the same `isDynamic` flag.
 */
type ResolveMixedEntriesResult = {
  /** The static (non-dynamic) item entry. */
  staticEntry: ItemInfoEntry;
  /** The dynamic item entry. */
  dynamicEntry: ItemInfoEntry;
} | null;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates one or more Illustrator EPS documents for a single garment-part
 * size by duplicating composed artwork into an optimised grid layout.
 *
 * @remarks
 * The full pipeline executed in the constructor:
 * 1. Duplicate source artwork from the active layer.
 * 2. Remove white-fill placeholder items.
 * 3. Apply special-case validations (NECK single-sided, low-quantity forced pair).
 * 4. If `fixedSize + isFillRec` → delegate to the fill-rectangle strip path.
 * 5. Otherwise: ask {@link GridCalculator} for the best stack recommendation,
 *    build the composed reference group via {@link ItemsInitiater}, then run
 *    the main layout pass. If a remainder exists, run a second pass.
 */
class GridLayoutGenerator {
  // ─── Immutable configuration ──────────────────────────────────────────

  /** Target dimensions in inches as received from the pipeline. */
  private readonly dimension: DimensionObject;

  /** Resolved garment-part descriptor — source items and pairing metadata. */
  private readonly jftItem: JFTItem;

  /** Gap between items in inches. */
  private readonly distributeGap: number;

  /** Folder path of the active document — output EPS files are saved here. */
  private readonly outputFolderPath: string = app.activeDocument.path.fsName;

  // ─── Mutable state ────────────────────────────────────────────────────

  /** Preferred stack orientation; may fall back to `CONFIG.ORIENTATION`. */
  private stackOrientation: StackOrientation;

  /** Remaining quantity to place; shared across main and remainder passes. */
  private quantity: GridLayoutGeneratorParams["quantity"];

  /** Live duplicates of the source artwork — rebuilt at the start of each pass. */
  private artworkItems: PageItem[];

  /** Size token written into SIZE_TKN text frames. */
  private readonly sizeTkn: GridLayoutGeneratorParams["sizeTkn"] = "ALL";

  /** `true` when only one source item was found in the layer. */
  private isSingleItem: boolean = false;

  /** Whether the two items form a paired set. Mutated by validations. */
  private isPaired: boolean;

  /** Count label used in the output filename: SET | PCS | CMD. */
  private countType: CountType;

  /** Fully composed GroupItem used as the duplication reference. Null between passes. */
  private composedReferenceItem: GroupItem | null = null;

  /** Stack layout recommendation from {@link GridCalculator}. Null before first calculation. */
  private stackRecommendation: RecommendedStacksResult | null = null;

  /**
   * 1-based index prefixed to each output filename.
   * Initialised from the number of existing files in the output folder.
   */
  private outputFileIndex: number = Math.max(
    1,
    Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1),
  );

  /** Live state for the currently executing layout pass. */
  private layoutPassTracker: LayoutPassTracker = {
    type: "main",
    placedQty: 0,
    targetQty: 0,
    stack: "HH",
    rows: 0,
    cols: 0,
  };

  /** FIFO data queue for dynamic text injection. Shared by reference across all passes. */
  private data: AutomateData["details"]["L"]["DATA"] | null;

  /** TextFrameProcessor instance rebuilt at the start of each layout pass. */
  private textProcessor: TextFrameProcessor | null = null;

  // ─── Constructor ──────────────────────────────────────────────────────

  /**
   * Executes the full layout pipeline synchronously.
   * All EPS documents for this size/item type are created before the
   * constructor returns.
   *
   * @param params - Size, quantity, artwork, and layout options.
   */
  constructor(params: GridLayoutGeneratorParams) {
    // Use provided sizeTkn or fall back to the default "ALL"
    this.sizeTkn = params?.sizeTkn || this.sizeTkn;
    this.distributeGap = params.distributeGap;
    this.quantity = params.quantity;
    this.jftItem = params.jftItem;
    this.dimension = params.dimension;

    // Prefer the caller's orientation; fall back to the global CONFIG setting
    this.stackOrientation = params.orientation ?? CONFIG.ORIENTATION;

    // Deep-copy the data queue so mutations here do not affect the caller's array
    this.data = params.data ? Utils.deepCopy([...params.data]) : null;

    this.countType = this.jftItem.info.countType;
    this.isPaired = this.jftItem.info.pair;

    // Create working duplicates of source artwork — originals are never modified
    this.artworkItems = this.duplicateSourceItems();

    // Remove any white-fill placeholder rectangle from the artwork array
    this.cleanWhiteFillItem();

    // Nothing to do if all items were cleaned out
    if (!this.artworkItems.length) return;

    // Mark as single-item when only one artwork survived cleanup
    if (this.artworkItems.length === 1) this.isSingleItem = true;

    // Apply NECK / low-quantity special-case rules
    this.specialValidation();

    // Fill-rectangle items use a simpler strip-document path
    if (this.shouldUseFillRecPath()) {
      this.runFillRecPath();
      return;
    }

    // Ask GridCalculator for the optimal stack type and column/row counts
    this.stackRecommendation = this.calculateStackRecommendation();

    // Build the composed reference group for the main stack type
    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.mainStack,
    );

    // Initialise the pass tracker for the main pass
    this.layoutPassTracker = this.buildPassTracker("main");

    // Run the main layout pass — creates one or more EPS documents
    this.begin("main");

    // The reference group is no longer needed after the main pass
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;

    // Run the remainder pass when items did not divide evenly into the main stack
    if (this.stackRecommendation.hasRemainder) {
      this.runRemainderPass();
    }
  }

  // ─── Private: Pass orchestration ─────────────────────────────────────

  /**
   * Executes the remainder pass using a fresh set of artwork duplicates.
   * Forces `isPaired = true` and `countType = SET` so remainder items are
   * always treated as matched pairs regardless of the original pairing state.
   */
  private runRemainderPass(): void {
    // Fresh duplicates for the remainder pass — avoids reusing modified artwork
    this.artworkItems = this.duplicateSourceItems();

    // Remainder pass always pairs items to keep the grid compact
    this.isPaired = true;
    this.countType = CountType.SET;

    // Remove any white-fill items from the fresh duplicates
    this.cleanWhiteFillItem();

    // Recalculate the stack recommendation with updated pairing state
    this.stackRecommendation = this.calculateStackRecommendation();

    // Build a new reference group for the remainder stack type
    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.remainderStack,
    );

    // Initialise the pass tracker for the remainder pass
    this.layoutPassTracker = this.buildPassTracker("rem");

    // Run the remainder layout pass
    this.begin("rem");

    // Clean up the reference group after the remainder pass
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;
  }

  // ─── Private: Fill-rectangle path ────────────────────────────────────

  /**
   * Returns `true` when the fill-rectangle strip path should be used instead
   * of the standard grid layout.
   *
   * @remarks
   * Only applicable when `jftItem.info.fixedSize` is set. For unpaired
   * mixed items, either side having `isFillRec` is sufficient; for paired
   * items, both must be fill-rectangles.
   */
  private shouldUseFillRecPath(): boolean {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];

    // Fill-rec path only applies to fixed-size items
    if (!this.jftItem.info.fixedSize) return false;

    // Single item — check only the first entry
    if (this.isSingleItem) return e1.isFillRec;

    // Unpaired — either item qualifies
    if (!this.isPaired) {
      return e1.isFillRec || e2.isFillRec;
    }

    // Paired — both must be fill-rectangles
    return e1.isFillRec && e2.isFillRec;
  }

  /**
   * Handles artwork that consists entirely of filled rectangles.
   *
   * @remarks
   * Instead of a grid, these items are resized to full paper width and saved
   * as a single tall strip. Mixed static+dynamic pairs are split: the static
   * side is saved as a strip, and the dynamic side goes through the normal
   * grid path as a single unpaired item.
   */
  private runFillRecPath(): void {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];

    // Single item — save directly as a strip and return
    if (this.isSingleItem) {
      this.saveFillRecStrips(this.artworkItems[0], false);
      return;
    }

    // Check whether one side is dynamic and the other is static
    const isMixed = e1.isDynamic !== e2.isDynamic;

    if (!this.isPaired && isMixed) {
      // Identify which entry is static and which is dynamic
      const staticEntry = e1.isDynamic ? e2 : e1;
      const dynamicEntry = e1.isDynamic ? e1 : e2;

      // Retrieve the corresponding artwork duplicates by index
      const staticItem = this.artworkItems[staticEntry === e1 ? 0 : 1];
      const dynamicItem = this.artworkItems[dynamicEntry === e1 ? 0 : 1];

      // Save the static fill-rec item as a strip and remove the original
      if (staticEntry.isFillRec) {
        this.saveFillRecStrips(staticItem, false);
        staticEntry.object.remove();
      }

      // Temporarily override pairing state to process the dynamic item alone
      const savedPaired = this.isPaired;
      const savedCountType = this.countType;
      this.isPaired = false;
      this.countType = CountType.PCS;

      // Recalculate layout for the dynamic item only
      this.stackRecommendation = this.calculateStackRecommendation();
      this.composedReferenceItem = this.buildComposedReference(
        this.stackRecommendation.mainStack,
      );
      this.layoutPassTracker = this.buildPassTracker("main");

      // Temporarily narrow artworkItems to the dynamic item
      const savedArtwork = this.artworkItems;
      this.artworkItems = [dynamicItem];
      this.begin("main");
      this.artworkItems = savedArtwork;

      this.composedReferenceItem!.remove();
      this.composedReferenceItem = null;

      // Run remainder pass if needed
      if (this.stackRecommendation.hasRemainder) this.runRemainderPass();

      // Restore original pairing state
      this.isPaired = savedPaired;
      this.countType = savedCountType;
      return;
    }

    // Paired fill-rec items — check whether both sides share the same fill colour
    const sameColor = this.haveSameFillColor(
      this.artworkItems[0],
      this.artworkItems[1],
    );

    if (sameColor) {
      // Same colour — save a single paired strip (doubles the quantity internally)
      this.saveFillRecStrips(this.artworkItems[0], true);
    } else {
      // Different colours — each side needs its own strip document
      this.saveFillRecStrips(this.artworkItems[0], false);
      this.saveFillRecStrips(this.artworkItems[1], false);
    }

    // Remove working duplicates after saving
    this.artworkItems.forEach((item) => item.remove());
  }

  /**
   * Resizes `sourceItem` to fill the full paper width and saves it as a
   * single EPS strip document.
   *
   * @param sourceItem - Artwork item to resize and save.
   * @param pair       - When `true`, doubles the quantity before calculating
   *                     the strip height (both sides of a pair on one strip).
   */
  private saveFillRecStrips(sourceItem: PageItem, pair: boolean): void {
    // Convert paper width from inches to points for Illustrator APIs
    const targetWidthPt = Utils.convertLength({
      value: CONFIG.PAPER_MAX_SIZE,
      from: "inch",
      to: "pt",
    });

    // How many items fit side-by-side across the full paper width
    const fitRow = GridCalculator.getRowFitCount({
      stackWidth: this.dimension.width,
      gap: 0,
    });

    // Total quantity for this strip — doubled when both pair sides are included
    const qty = !pair ? this.quantity : this.quantity * 2;

    // Number of stacked rows needed for the full quantity
    const cols = Math.ceil(qty / fitRow);

    // Total raw height in inches for all rows combined
    const height = this.dimension.height * cols;

    // Find the most printable height factorisation within FILL_REC_STRIP_HEIGHT_INCH
    const { baseHeight, divider } = Utils.getBestDividerAndHeight(height);

    // Resize the source item to full paper width × calculated strip height
    Utils.resizeObject(
      sourceItem,
      targetWidthPt,
      Utils.convertLength({ from: "inch", to: "pt", value: baseHeight }),
    );

    // Append divider count to the filename when the strip spans multiple sub-documents
    const qtyName = divider > 1 ? `-${divider} ${CountType.CMD}` : "";
    const docTitle = `${this.padZero(this.outputFileIndex)}-${this.jftItem.order}${qtyName}`;

    // Create, populate, save and close the strip document
    const docHandler = new IllustratorDocument(docTitle);
    const newDoc = docHandler.create([sourceItem]);
    this.alignAllItemsCenter(newDoc);
    docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
    docHandler.close();

    // Advance the file index for the next output document
    this.outputFileIndex++;
  }

  /**
   * Fills a single row across the full paper width by duplicating `item`
   * to the right until `fitRow` copies exist.
   *
   * @param params.doc    - Target document.
   * @param params.item   - Seed item; removed after duplication is complete.
   * @param params.fitRow - Number of copies to place in the row.
   */
  private fillWideArea(params: {
    doc: Document;
    item: PageItem;
    fitRow: number;
  }): void {
    const { item, fitRow } = params;

    // Convert gap from inches to points
    const gapPt = Utils.convertLength({
      value: this.distributeGap,
      from: "inch",
      to: "pt",
    });

    let current = item;

    // Duplicate and place each copy to the right of the previous
    for (let i = 1; i < fitRow; i++) {
      const next = current.duplicate();
      AlignmentHandler.moveObjectAfter({
        base: current,
        moving: next,
        position: "R",
        gap: gapPt,
        engine: CONFIG.THREAD_ENGINE,
      });
      current = next;
    }

    // Remove the original seed item — only the copies remain
    item.remove();
  }

  // ─── Private: Initialisation helpers ─────────────────────────────────

  /**
   * Creates working duplicates of both source PageItems.
   * The second slot may be `null` when only one item exists; callers must
   * check `isSingleItem` before accessing index 1.
   */
  private duplicateSourceItems(): PageItem[] {
    return [
      this.jftItem.items[0].object.duplicate(),
      this.jftItem.items[1].object.duplicate() || null,
    ] as PageItem[];
  }

  /**
   * Builds the {@link LayoutPassTracker} snapshot from the current stack recommendation.
   *
   * @param passType - `"main"` or `"rem"` — selects the correct recommendation fields.
   * @returns Initialised tracker with `placedQty` starting at 0.
   */
  private buildPassTracker(passType: "main" | "rem"): LayoutPassTracker {
    const rec = this.stackRecommendation!;
    const isMainPass = passType === "main";

    return {
      type: passType,
      placedQty: 0,
      // Target quantity differs between main and remainder passes
      targetQty: isMainPass
        ? rec.mainQuantityOccupied
        : rec.remainderQuantityOccupied,
      stack: isMainPass ? rec.mainStack : rec.remainderStack,
      rows: isMainPass ? rec.mainFitRow : rec.remainderFitRow,
      cols: isMainPass ? rec.mainCols : rec.remainderCols,
    };
  }

  /**
   * Calls {@link GridCalculator.getRecommendedStacks} with the current
   * instance state and returns the full recommendation result.
   */
  private calculateStackRecommendation(): RecommendedStacksResult {
    return GridCalculator.getRecommendedStacks({
      gap: this.distributeGap,
      maxColsInDoc: CONFIG.PER_DOC,
      quantity: this.quantity,
      size: this.dimension,
      pair: this.isPaired,
      pairGap: this.distributeGap,
      heightPreference: "Less",
      stackOrientation: this.stackOrientation,
    });
  }

  /**
   * Constructs the composed reference GroupItem for the given stack type via
   * {@link ItemsInitiater}. This group is duplicated for every grid cell.
   *
   * @param stackType - Stack pattern to apply when composing the group.
   */
  private buildComposedReference(stackType: StackType): GroupItem {
    return new ItemsInitiater({
      dimension: this.dimension,
      items: this.artworkItems,
      fixedSize: this.jftItem.info.fixedSize,
      sizeChar: this.sizeTkn as ApparelSize,
      stack: stackType,
      gap: this.distributeGap,
      pairable: this.isPaired,
    }).getItem();
  }

  // ─── Private: Validations ─────────────────────────────────────────────

  /**
   * Applies special-case rules before layout begins:
   * - NECK items are always single-sided — removes the second artwork.
   * - Non-paired two-item sets with quantity ≤ 3 are forced into paired mode
   *   to avoid creating a wasteful single-item grid.
   */
  private specialValidation(): void {
    const order = this.jftItem.order;

    // NECK is inherently single-sided — no pairing applies
    const isSingleSidedOrder = order === PairObjectMarkers.NECK;

    if (isSingleSidedOrder && this.artworkItems.length > 1) {
      // Discard the second duplicate
      this.artworkItems.splice(1, 1);
      this.isPaired = false;
      this.countType = CountType.PCS;
    }

    // For very small quantities, force pairing to keep the grid compact
    if (
      !this.isPaired &&
      !this.isSingleItem &&
      !isSingleSidedOrder &&
      this.quantity <= 3
    ) {
      this.isPaired = true;
      this.countType = CountType.SET;
    }
  }

  /**
   * Removes any artwork item that is a white-filled `PathItem`.
   * Such items are placeholders and must not appear in the output layout.
   * Sets `isPaired = false` and `countType = PCS` when an item is removed.
   */
  private cleanWhiteFillItem(): void {
    this.artworkItems.forEach((item, idx) => {
      if (
        item &&
        item.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item as PathItem)
      ) {
        // Remove the white placeholder from the working array
        this.artworkItems.splice(idx, 1);
        this.isPaired = false;
        this.countType = CountType.PCS;

        // Delete the duplicate from the Illustrator document
        item.remove();
      }
    });
  }

  // ─── Private: Utilities ───────────────────────────────────────────────

  /**
   * Returns `true` when both items are `PathItem`s with identical CMYK fill values.
   * Used by the fill-rec path to decide whether one or two strip documents are needed.
   *
   * @param itemA - First artwork item.
   * @param itemB - Second artwork item.
   */
  private haveSameFillColor(itemA: PageItem, itemB: PageItem): boolean {
    // Only PathItems carry a directly comparable fillColor
    if (
      itemA.typename !== PageItemType.PathItem ||
      itemB.typename !== PageItemType.PathItem
    )
      return false;

    const fillA = (itemA as PathItem).fillColor;
    const fillB = (itemB as PathItem).fillColor;

    // Only CMYK colours can be compared channel by channel
    if (fillA.typename !== "CMYKColor" || fillB.typename !== "CMYKColor")
      return false;

    const a = fillA as CMYKColor;
    const b = fillB as CMYKColor;

    // All four channels must match exactly
    return (
      a.cyan === b.cyan &&
      a.magenta === b.magenta &&
      a.yellow === b.yellow &&
      a.black === b.black
    );
  }

  /**
   * Zero-pads a number to two digits for use in output filenames.
   * Returns an empty string when `value` is falsy (0 or NaN).
   *
   * @param value - Positive integer to pad.
   */
  private padZero(value: number): string {
    if (!value) return "";
    return value < 10 ? `0${value}` : value.toString();
  }

  /**
   * Returns `true` when at least one source item in the current JFT item pair
   * is marked dynamic (`_DYN_`). For a single-item document, only `items[0]` is checked.
   */
  private isDocumentDynamic(): boolean {
    const e1 = this.jftItem.items[0];

    // Single-item document — only the first entry exists
    if (this.isSingleItem && e1.isDynamic) return true;

    // Paired document — either side being dynamic makes the whole document dynamic
    return e1.isDynamic || this.jftItem.items[1].isDynamic;
  }

  /**
   * Builds the output filename for the current layout pass.
   *
   * @remarks
   * The quantity/count-type segments are omitted when:
   * - The document is dynamic (player names vary per copy).
   * - Only a single cell exists in the grid.
   * A `CMD` suffix replaces `SET`/`PCS` when the grid has exactly one row with
   * multiple columns (a strip/command layout).
   *
   * @param direction   - Optional direction marker appended for unpaired items.
   * @param forceStatic - When `true`, always include quantity even for dynamic docs.
   */
  private buildDocName(
    direction: DirectionMarkers | null = null,
    forceStatic: boolean = false,
  ): string {
    const { rows, cols, targetQty } = this.layoutPassTracker;
    const sizeSegment = this.jftItem.info.fixedSize ? "" : this.sizeTkn;
    const isDocDynamic = this.isDocumentDynamic();

    // Default quantity segment — may be overridden below
    let quantitySegment = `-${targetQty.toString()}`;
    let countTypeSegment = ` ${this.countType}` as string;

    if (isDocDynamic && !forceStatic) {
      // Dynamic documents do not encode quantity in the filename
      quantitySegment = "";
      countTypeSegment = "";
    } else if (rows === 1 && cols === 1) {
      // Single-cell grid — quantity is implicit
      quantitySegment = "";
      countTypeSegment = "";
    } else if (targetQty === 1 && cols === 1) {
      // Only one item in a single column — no quantity needed
      quantitySegment = "";
      countTypeSegment = "";
    } else if (rows === 1 && cols > 1) {
      // Strip layout — use CMD count type and column count as quantity
      quantitySegment = `-${cols.toString()}`;
      countTypeSegment = ` ${CountType.CMD}`;
    }

    // Direction suffix is only added for unpaired items
    const fileOrderSegment = this.isPaired
      ? `${this.jftItem.order}`
      : `${this.jftItem.order}${direction ? `-${direction}` : ""}`;

    const sizeJoin = sizeSegment ? `-${sizeSegment}` : "";
    return `${fileOrderSegment}${sizeJoin}${quantitySegment}${countTypeSegment}`;
  }

  // ─── Private: Core grid loop ──────────────────────────────────────────

  /**
   * Duplicates `referenceItem` into a rows × maxCol grid, injects dynamic
   * text into each cell, then centres all placed items on the artboard.
   *
   * @remarks
   * ### Deferred-process pattern
   * `textProcessor.process()` modifies a placed item's TextFrames (content
   * injection, font resize, and optionally `createOutline()`). The row loop
   * creates each new item by calling `currentItem.duplicate()`. If
   * `process()` were called immediately after placing item[N], any subsequent
   * duplicate of that item would inherit injected text — and when
   * `OUTLINE_TEXT` is enabled, the TextFrames would already be destroyed,
   * making injection impossible for all following cells.
   *
   * Fix: a `pendingItem` pointer holds the most recently placed-but-not-yet-
   * processed item. `process()` is called on `pendingItem` only **after** the
   * next duplicate has been created and positioned. The last item in the grid
   * has no subsequent duplicate, so it is processed immediately after the loop.
   *
   * ```
   * place item[0]  →  pendingItem = item[0]
   * duplicate item[0] → item[1]  →  process(item[0])  →  pendingItem = item[1]
   * duplicate item[1] → item[2]  →  process(item[1])  →  pendingItem = item[2]
   * …
   * (last item placed) →  process(pendingItem)   ← no further duplicate needed
   * ```
   *
   * @param params - Grid dimensions, target document, and reference item.
   */
  private createGrid(params: CreateGridParams): void {
    const { maxCol, rows, doc, item: referenceItem } = params;

    // Convert gap from inches to points for AlignmentHandler calls
    const gapPt = Utils.convertLength({
      value: this.distributeGap,
      from: "inch",
      to: "pt",
    });

    // Alternating 180° rotation applies only to unpaired, non-single RHH/RVV stacks
    const applyAltRotation =
      (this.layoutPassTracker.stack === "RHH" ||
        this.layoutPassTracker.stack === "RVV") &&
      !this.isPaired &&
      !this.isSingleItem;

    // placementIndex drives alternating rotation direction (even = 180°, odd = -180°)
    let placementIndex = 0;

    // All successfully placed items — used for final centre alignment
    const placedItems: PageItem[] = [];

    // Tracks the most recently placed item that has not yet been processed
    let pendingItem: PageItem | null = null;

    // ── Place and track the first item ───────────────────────────────────

    // Duplicate the clean referenceItem for the first grid cell
    let currentItem = referenceItem.duplicate();
    let columnFirstItem = currentItem;
    placedItems.push(currentItem);
    this.incrementPlacedQty();

    // Apply rotation for alternating-rotation stacks
    if (applyAltRotation)
      this.applyAlternatingRotation(currentItem, placementIndex);
    placementIndex++;

    // Mark first item as pending — do NOT process yet; it may still be duplicated
    pendingItem = currentItem;

    // ── Row/column placement loop ─────────────────────────────────────────

    for (let col = 1; col <= maxCol; col++) {
      if (this.isPassComplete()) break;

      for (let row = 1; row < rows; row++) {
        if (this.isPassComplete()) break;

        // Duplicate currentItem BEFORE processing pendingItem —
        // this preserves live TextFrames in pendingItem at duplication time
        const nextItem = currentItem.duplicate();
        placedItems.push(nextItem);
        this.incrementPlacedQty();

        // Position nextItem to the right of currentItem
        AlignmentHandler.moveObjectAfter({
          base: currentItem,
          moving: nextItem,
          position: "R",
          gap: gapPt,
          engine: CONFIG.THREAD_ENGINE,
        });

        if (applyAltRotation)
          this.applyAlternatingRotation(nextItem, placementIndex);
        placementIndex++;

        // Now safe to process pendingItem — its duplicate (nextItem) is already created
        this.textProcessor!.process(pendingItem!);

        // Advance the pending pointer to the newly placed item
        pendingItem = nextItem;
        currentItem = nextItem;
      }

      if (this.isPassComplete()) break;

      if (col !== maxCol) {
        // Start a new column — duplicate from the clean referenceItem (not currentItem)
        // so columns always begin with unmodified TextFrames
        const newColFirst = referenceItem.duplicate();

        // Before creating the new column head, process the last item of the current row —
        // it will no longer be duplicated within the row loop
        this.textProcessor!.process(pendingItem!);
        pendingItem = null;

        // Position the new column head below the previous column's first item
        AlignmentHandler.moveObjectAfter({
          base: columnFirstItem,
          moving: newColFirst,
          position: "B",
          gap: gapPt,
          engine: CONFIG.THREAD_ENGINE,
        });

        columnFirstItem = newColFirst;
        currentItem = newColFirst;
        placedItems.push(newColFirst);
        this.incrementPlacedQty();

        if (applyAltRotation)
          this.applyAlternatingRotation(newColFirst, placementIndex);
        placementIndex++;

        // Mark new column head as pending — not yet processed
        pendingItem = newColFirst;
      }
    }

    // ── Process the final pending item ────────────────────────────────────
    // The last placed item never had a subsequent duplicate created,
    // so it was never processed inside the loop — apply it now
    if (pendingItem) {
      this.textProcessor!.process(pendingItem);
    }

    // ── Cleanup and alignment ─────────────────────────────────────────────

    // Remove the referenceItem if it ended up in the document (not already removed)
    if (referenceItem.parent === doc) referenceItem.remove();

    // Centre all placed items on the artboard
    if (placedItems.length)
      this.alignAllItemsCenter(doc, placedItems as Selection);
  }

  // ─── Private: Grid helpers ────────────────────────────────────────────

  /**
   * Rotates `item` 180° or −180° based on `placementIndex` parity.
   * Even index → 180°; odd index → −180°.
   *
   * @param item           - Item to rotate.
   * @param placementIndex - 0-based position in the grid sequence.
   */
  private applyAlternatingRotation(
    item: PageItem,
    placementIndex: number,
  ): void {
    item.rotate(placementIndex % 2 === 0 ? 180 : -180);
  }

  /**
   * Increments `placedQty` in the active pass tracker.
   * VRH items count as 2 because one VRH group represents two physical garments.
   */
  private incrementPlacedQty(): void {
    this.layoutPassTracker.placedQty++;

    // VRH packs two items into one group — count both
    if (this.layoutPassTracker.stack === "VRH") {
      this.layoutPassTracker.placedQty++;
    }
  }

  /** Returns `true` when the active pass has placed all required items. */
  private isPassComplete(): boolean {
    return this.layoutPassTracker.placedQty >= this.layoutPassTracker.targetQty;
  }

  // ─── Private: Document creation ──────────────────────────────────────

  /**
   * Creates one or more EPS documents for the dynamic layout pass.
   * Each document receives a fresh grid built from `dynamicItem`.
   * For static (non-dynamic) documents, only one document is created.
   *
   * @param params.cols        - Total column count for this pass.
   * @param params.reqDocs     - Number of documents and columns per document.
   * @param params.rows        - Items per row.
   * @param params.dynamicItem - Reference group duplicated into each grid cell.
   * @param params.direction   - Optional direction label for the filename.
   */
  private processDynamicPass(params: DynamicGridLayoutPassParams): void {
    const { cols, reqDocs, rows, dynamicItem, direction = null } = params;

    // Check once whether any item in this pass requires text injection
    const isDynamic = this.isDocumentDynamic();

    for (let docNum = 1; docNum <= reqDocs.docsNeeded; docNum++) {
      // Build the filename for this document
      const docTitle = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction)}`;
      const docHandler = new IllustratorDocument(docTitle);

      // Create the document and copy dynamicItem into it as the seed
      const newDoc = docHandler.create([dynamicItem]);

      // Retrieve the seed item that was copied into the new document
      const seedItem = newDoc.activeLayer.pageItems[0] as PageItem;

      if (isDynamic) {
        // Fill the document with a full grid; remove the seed after grid is built
        this.createGrid({
          cols,
          doc: newDoc,
          maxCol: reqDocs.colsPerDoc,
          item: seedItem,
          rows,
        });
        seedItem.remove();
      }

      // Centre all items and shrink the artboard before saving
      this.alignAllItemsCenter(newDoc);
      docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
      docHandler.close();

      this.outputFileIndex++;

      // Static documents only need one file — stop after first iteration
      if (!isDynamic) break;
    }
  }

  /**
   * Saves `staticItem` as a single EPS document without grid duplication.
   * Used when a mixed pair has one static and one dynamic side.
   *
   * @param staticItem - Artwork to save.
   * @param direction  - Direction label appended to the filename.
   */
  private saveStaticDocument(
    staticItem: PageItem,
    direction: DirectionMarkers,
  ): void {
    // Build filename with forceStatic=true so quantity is always included
    const docName = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction, true)}`;
    const docHandler = new IllustratorDocument(docName);

    // Create the document and centre the item
    const staticDoc = docHandler.create([staticItem]);
    this.alignAllItemsCenter(staticDoc);

    docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
    docHandler.close();

    // Remove the item from the source document after saving
    staticItem.remove();

    this.outputFileIndex++;
  }

  // ─── Private: Mixed-entry resolution ─────────────────────────────────

  /**
   * Checks whether the two JFT item entries have different `isDynamic` flags.
   *
   * @returns An object with `staticEntry` and `dynamicEntry` when mixed;
   *          `null` when both entries share the same dynamic state.
   */
  private resolveMixedEntries(): ResolveMixedEntriesResult {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];

    // If both flags are equal, there is no mixed state
    if (e1.isDynamic === e2.isDynamic) return null;

    return {
      staticEntry: e1.isDynamic ? e2 : e1,
      dynamicEntry: e1.isDynamic ? e1 : e2,
    };
  }

  /**
   * Dispatches to the correct document-creation strategy based on whether the
   * current item pair is mixed (one static + one dynamic) or uniform.
   *
   * @remarks
   * For mixed unpaired items:
   * - Non-VRH: static side → one EPS; dynamic side → grid EPS(s).
   * - VRH: each side gets its own VRH reference group before saving/gridding.
   *
   * For uniform pairs (both dynamic or both static):
   * - Delegates directly to {@link processDynamicPass}.
   *
   * @param params - Pass dimensions, document allocation, and row count.
   */
  private processDocumentAndLayout(params: GridLayoutPassParams): void {
    const { cols, reqDocs, rows } = params;

    // VRH requires special handling for mixed entries
    const isVrhStack = this.layoutPassTracker.stack === "VRH";

    if (!this.isPaired && !this.isSingleItem) {
      const mixedEntries = this.resolveMixedEntries();

      if (mixedEntries) {
        const { staticEntry, dynamicEntry } = mixedEntries;

        if (!isVrhStack) {
          // Find the static and dynamic sub-items inside the composed reference group
          const staticItem = this.composedReferenceItem!.pageItems.find(
            (itm) => itm.name === staticEntry.object.name,
          );

          const dynamicItem = this.composedReferenceItem!.pageItems.find(
            (itm) => itm.name === dynamicEntry.object.name,
          );

          // Both sub-items must be locatable — otherwise the reference group is corrupt
          if (!staticItem || !dynamicItem) {
            throw new Error(
              "Could not locate static or dynamic item in composed reference group.",
            );
          }

          // Save the static side as a single document
          this.saveStaticDocument(
            staticItem,
            staticEntry.direction as DirectionMarkers,
          );

          // Process the dynamic side as a grid
          this.processDynamicPass({
            cols,
            reqDocs,
            rows,
            dynamicItem,
            direction: dynamicEntry.direction as DirectionMarkers,
          });
          return;
        }

        // VRH mixed path — build separate VRH groups for each side
        this.composedReferenceItem!.remove();
        this.composedReferenceItem = null;

        // Static side: build its own VRH reference and save as a single document
        this.artworkItems = [staticEntry.object.duplicate()];
        const staticVrh = this.buildComposedReference("VRH");
        this.saveStaticDocument(
          staticVrh,
          staticEntry.direction as DirectionMarkers,
        );

        // Dynamic side: build its own VRH reference and process as a grid
        this.artworkItems = [dynamicEntry.object.duplicate()];
        const dynamicVrh = this.buildComposedReference("VRH");
        this.composedReferenceItem = dynamicVrh;
        this.processDynamicPass({
          cols,
          reqDocs,
          rows,
          dynamicItem: dynamicVrh,
          direction: dynamicEntry.direction as DirectionMarkers,
        });
        return;
      }
    }

    // Uniform pair (both same dynamic state) — process directly
    this.processDynamicPass({
      cols,
      reqDocs,
      rows,
      dynamicItem: this.composedReferenceItem!,
    });
  }

  // ─── Private: Pass entry point ────────────────────────────────────────

  /**
   * Entry point for both main and remainder layout passes.
   * Rebuilds the `TextFrameProcessor` for the current pass state, then
   * delegates to {@link processDocumentAndLayout}.
   *
   * @param passType - `"main"` or `"rem"`.
   */
  private begin(passType: "main" | "rem"): void {
    const rec = this.stackRecommendation!;

    // Rebuild the text processor — stack type and isPaired may have changed since last pass
    this.textProcessor = new TextFrameProcessor({
      stack: this.layoutPassTracker.stack,
      isPaired: this.isPaired,
      isMixedDynamic: !this.resolveMixedEntries(),
      data: this.data,
    });

    // Select pass parameters from the recommendation based on pass type
    const passParams: GridLayoutPassParams =
      passType === "main"
        ? {
            reqDocs: rec.requiredDocs,
            rows: rec.mainFitRow,
            cols: rec.mainCols,
          }
        : {
            reqDocs: rec.remainderRequiredDocs,
            rows: rec.remainderFitRow,
            cols: rec.remainderCols,
          };

    this.processDocumentAndLayout(passParams);
  }

  // ─── Private: Alignment ───────────────────────────────────────────────

  /**
   * Centres all items in `items` (or all active-layer items when omitted) on
   * the artboard, then shrinks the artboard to 1 × 1 inch via
   * {@link Organizer.smallArtboard}.
   *
   * @param doc   - Document whose artboard is the alignment target.
   * @param items - Optional explicit item list; defaults to all layer items.
   */
  private alignAllItemsCenter(
    doc: Document,
    items?: Selection | PageItem[],
  ): void {
    // Fall back to all active-layer items when no explicit list is provided
    const targets: PageItem[] =
      (items as PageItem[]) ??
      Organizer.pageItemsToArray(doc.activeLayer.pageItems);

    if (!targets.length) return;

    AlignmentHandler.alignPageItemsToArtboard({
      doc,
      objects: targets as Selection,
      position: "C",
      engine: CONFIG.THREAD_ENGINE,
    });

    // Shrink the artboard to a minimal size after alignment
    Organizer.smallArtboard(doc);
  }
}
