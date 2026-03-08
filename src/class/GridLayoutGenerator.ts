// ─────────────────────────────────────────────────────────────────────────────
// GridLayoutGenerator.ts
// Orchestrates the full n-up grid layout pipeline for Illustrator ExtendScript.
//
// Responsibilities:
//   1. Duplicate & clean source artwork items (strip white-fill placeholders)
//   2. Obtain the optimal stack recommendation from GridCalculator
//   3. Initiate/arrange a single composed group via ItemsInitiater
//   4. Distribute that group across one or more EPS documents (createGrid)
//   5. Handle the "remainder" pass (items that didn't fill a complete row)
//   6. Handle the VRH / mixed static+dynamic special cases
//   7. Per-item text-frame mutation: content injection, gradient expansion,
//      smart font-size correction, and optional outline conversion
//
// NOTE: Core layout logic is intentionally preserved as-is.
//       All changes are structural / naming / memory / DRY / documentation only.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Ratio below which a text frame is considered "too much smaller" after a
 * content change.  When the new visual area drops below
 * `originalArea × TEXT_SHRINK_THRESHOLD` the font is bumped up slightly.
 *
 * Example: 0.60 → trigger if the frame shrinks to less than 60 % of original.
 */
const TEXT_SHRINK_THRESHOLD = 0.6;

/**
 * Ratio above which a text frame is considered "too much bigger" after a
 * content change.  When the new visual area grows beyond
 * `originalArea × TEXT_GROW_THRESHOLD` the font is scaled down proportionally,
 * but never below `originalArea × TEXT_GROW_MIN_KEEP` so that longer content
 * remains visually larger than the original layout intended.
 *
 * Example: 1.40 → trigger if the frame grows beyond 140 % of original.
 */
const TEXT_GROW_THRESHOLD = 1.4;

/**
 * Lower-bound multiplier applied to the **original** area when scaling a
 * "too-big" text frame back down.  Keeps the result above this floor so that
 * longer replacement text still appears larger than the original.
 *
 * Example: 1.10 → the scaled-down frame will be at least 110 % of original area.
 */
const TEXT_GROW_MIN_KEEP = 1.1;

/**
 * Fractional increase applied to each character's font size when a text frame
 * shrinks "too much" after content replacement.
 *
 * Example: 0.10 → bump each character's fontSize up by 10 %.
 */
const TEXT_BUMP_UP_FACTOR = 0.1;

// ─── Local Types ─────────────────────────────────────────────────────────────

/**
 * Constructor parameters consumed by {@link GridLayoutGenerator}.
 */
interface GridLayoutGeneratorParams {
  /** Apparel size identifier (e.g. "M", "XL") used for token replacement and naming. */
  sizeChar: ApparelSize;

  /** Total number of garment pieces to lay out. */
  quantity: number;

  /**
   * Target artwork dimensions **in inches**.
   * Converted to points internally before any Illustrator operations.
   */
  dimension: DimensionObject;

  /** Structured JFT item descriptor carrying artwork references and layout metadata. */
  jftItem: JFTItem;

  /**
   * Stack orientation preference forwarded to GridCalculator.
   * Overrides CONFIG.ORIENTATION when provided.
   */
  orientation: StackOrientation;

  /**
   * Ordered queue of per-item data rows consumed by {@link modifyTextFramesInItem}.
   * Each row is a plain object keyed by text-frame name → replacement string.
   * Pass `null` when no dynamic text injection is required.
   *
   * The array is treated as a **FIFO queue**: the first element is consumed for
   * the first placed item and removed via `shift()`.
   */
  data: AutomateData["details"]["L"]["DATA"] | null;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared grid-layout parameters derived once per layout pass.
 * Rows + cols describe the n-up grid dimensions; `reqDocs` governs
 * how many output EPS files are produced.
 */
type GridLayoutPassParams = Record<"rows" | "cols", number> & {
  /** Document-count and columns-per-document info returned by GridCalculator. */
  reqDocs: RequiredDocReturn;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extends {@link GridLayoutPassParams} for passes that involve a dynamic item.
 * An optional direction marker is forwarded to the document naming logic.
 */
type DynamicGridLayoutPassParams = GridLayoutPassParams & {
  /** Optional direction label embedded in the output filename (e.g. "FRONT", "BACK"). */
  direction?: DirectionMarkers;

  /** The source PageItem that will be duplicated to fill the grid. */
  dynamicItem: PageItem;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parameters forwarded to {@link GridLayoutGenerator.createGrid}.
 * Extends the base layout pass with document reference, reference item and
 * the true maximum column count for **this** document.
 */
type CreateGridParams = Omit<GridLayoutPassParams, "reqDocs"> & {
  /**
   * Maximum number of columns that fit in this single document
   * (may differ from `cols` due to canvas-height capping by GridCalculator).
   */
  maxCol: number;

  /** The Illustrator document that will receive the duplicated grid items. */
  doc: Document;

  /** Reference PageItem that will be duplicated column-by-column, row-by-row. */
  item: PageItem;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutable tracking object for the current layout pass (main or remainder).
 * Updated in place by `createGrid` as items are placed so that quantity
 * boundaries are respected across nested loops.
 */
interface LayoutPassTracker {
  /** Which pass this tracker belongs to — "main" or "rem" (remainder). */
  type: "main" | "rem";

  /** Running count of items placed so far in this pass. */
  placedQty: number;

  /** Total number of items that must be placed before this pass ends. */
  targetQty: number;

  /** Active stack type for this pass (controls VRH double-count logic). */
  stack: StackType;

  /** Number of rows in one document column for this pass. */
  rows: number;

  /** Number of document columns required across all output documents. */
  cols: number;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Snapshot of a text frame's visual dimensions captured **before** content
 * replacement.  Used by the smart font-size correction logic to compare
 * before-and-after sizes without re-querying the original frame.
 */
interface TextFrameSizeSnapshot {
  /** Frame width in **inches** at the moment of capture. */
  widthInch: number;

  /** Frame height in **inches** at the moment of capture. */
  heightInch: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the complete n-up grid layout workflow for a single JFT item.
 *
 * ### Lifecycle (constructor-driven)
 * ```
 * new GridLayoutGenerator(params)
 *   │
 *   ├── cleanWhiteFillItem()                  — remove white-fill placeholder paths
 *   ├── specialValidation()                   — neck items: always single, never paired
 *   ├── GridCalculator.getRecommendedStacks() — pick optimal stack type
 *   ├── ItemsInitiater.getItem()              — build composed reference group
 *   ├── begin("main")                         — distribute main-stack items → EPS files
 *   └── begin("rem")                          — distribute remainder items (if any)
 * ```
 *
 * ### Key design constraints
 * - Y-axis in Illustrator points **downward**; `AlignmentHandler` compensates.
 * - Items are duplicated from a single composed reference, never moved directly.
 * - The composed reference (`composedReferenceItem`) is removed after each pass.
 * - `layoutPassTracker` is the single source of truth for progress within a pass.
 * - `data` is a FIFO queue consumed one row per placed item via `Array.shift()`.
 *
 * @example
 * ```typescript
 * new GridLayoutGenerator({
 *   sizeChar: "XL",
 *   quantity: 12,
 *   dimension: { width: 14, height: 20 },
 *   jftItem: myJftItem,
 *   orientation: "vertical",
 *   data: automateData.details["XL"].DATA,
 * });
 * ```
 */
class GridLayoutGenerator {
  // ─── Immutable configuration ────────────────────────────────────────────

  /** Apparel size character forwarded to SIZE_TKN text-frame replacement. */
  private readonly sizeChar: GridLayoutGeneratorParams["sizeChar"];

  /** User-requested item count for the current run. */
  private quantity: GridLayoutGeneratorParams["quantity"];

  /** Artwork target dimensions in **inches** (converted to pt before use). */
  private readonly dimension: DimensionObject;

  /** Structured descriptor for the artwork items being laid out. */
  private readonly jftItem: JFTItem;

  /** Global gap between items / stacks (inches). Sourced from CONFIG. */
  private readonly itemGap: number = CONFIG.ITEMS_GAP;

  /**
   * Stack orientation preference — controls which stack variants GridCalculator
   * evaluates.  Sourced from `params.orientation`; falls back to CONFIG.ORIENTATION.
   */
  private readonly stackOrientation: StackOrientation;

  /** Filesystem path of the active document's folder — used as EPS save destination. */
  private readonly outputFolderPath: string = app.activeDocument.path.fsName;

  // ─── Mutable state ───────────────────────────────────────────────────────

  /** Live array of duplicated PageItems for the current pass (rebuilt per pass). */
  private artworkItems: PageItem[];

  /**
   * Whether this item has only one artwork piece (no front/back pair).
   * Derived from `artworkItems.length` after `cleanWhiteFillItem`.
   */
  private isSingleItem: boolean = false;

  /**
   * Whether front and back (or left and right) should be treated as a pair.
   * May be forced to `true` for the remainder pass.
   */
  private isPaired: boolean;

  /**
   * Count type label written into the document filename (SET / PCS / CMD).
   * May be overridden for the remainder pass.
   */
  private countType: CountType;

  /**
   * Composed reference GroupItem built by {@link ItemsInitiater}.
   * All grid items are duplicated from this group.
   * Explicitly set to `null` between passes to release the Illustrator reference.
   */
  private composedReferenceItem: GroupItem | null = null;

  /**
   * Recommended stack result from {@link GridCalculator.getRecommendedStacks}.
   * Cached on first calculation; replaced when the remainder pass recalculates.
   */
  private stackRecommendation: RecommendedStacksResult | null = null;

  /**
   * Sequential index used as a filename prefix for each generated EPS file.
   * Initialised from the directory's current file count so files sort correctly.
   */
  private outputFileIndex: number = Math.max(
    1,
    Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1),
  );

  /**
   * Mutable tracker for the currently active layout pass.
   * Updated in-place by `createGrid` as items are placed.
   */
  private layoutPassTracker: LayoutPassTracker = {
    type: "main",
    placedQty: 0,
    targetQty: 0,
    stack: "HH",
    rows: 0,
    cols: 0,
  };

  /**
   * FIFO queue of per-item data rows for dynamic text injection.
   * Each element is a `Record<frameName, replacementText>` object.
   * Consumed one element at a time via `Array.shift()` inside
   * {@link modifyTextFramesInItem}.  `null` when no dynamic data is provided.
   */
  private data: AutomateData["details"]["L"]["DATA"] | null;

  // ─── Constructor ─────────────────────────────────────────────────────────

  /**
   * Constructs a new layout generator and **immediately** runs the full
   * main + remainder layout pipeline.
   *
   * @param params - Configuration for this layout run.
   */
  constructor(params: GridLayoutGeneratorParams) {
    this.sizeChar = params.sizeChar;
    this.quantity = params.quantity;
    this.jftItem = params.jftItem;
    this.dimension = params.dimension;

    // Prefer explicit orientation param; fall back to global CONFIG
    this.stackOrientation = params.orientation ?? CONFIG.ORIENTATION;

    // Clone data array so internal mutations (shift) don't affect the caller's copy.
    // Kept as null when no dynamic text data is supplied.
    this.data = params.data ? [...params.data] : null;

    // Snapshot mutable JFT metadata — may be overridden in remainder pass
    this.countType = this.jftItem.info.countType;
    this.isPaired = this.jftItem.info.pair;

    // Duplicate source artwork before any mutation
    this.artworkItems = this.duplicateSourceItems();

    this.cleanWhiteFillItem();

    if (!this.artworkItems.length) return; // Nothing to lay out — bail early

    if (this.artworkItems.length === 1) {
      this.isSingleItem = true;
    }

    this.specialValidation();

    // ── Main pass ────────────────────────────────────────────────────────
    this.stackRecommendation = this.calculateStackRecommendation();

    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.mainStack,
    );

    this.layoutPassTracker = this.buildPassTracker("main");
    this.begin("main");

    // Discard composed reference — it has been fully consumed by the main pass
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;

    // ── Remainder pass (only when GridCalculator detected leftover items) ─
    if (this.stackRecommendation.hasRemainder) {
      this.runRemainderPass();
    }
  }

  // ─── Private: Pass orchestration ─────────────────────────────────────────

  /**
   * Executes the remainder pass for items that did not fill a complete row
   * in the main stack.
   *
   * Forces `isPaired = true` and `countType = CountType.SET` so that remainder
   * documents are labelled and positioned consistently regardless of the
   * original item configuration.
   *
   * Steps:
   * 1. Re-duplicate source artwork items (originals were consumed by main pass).
   * 2. Override pair / countType flags.
   * 3. Clean white-fill placeholders from the new duplicates.
   * 4. Recalculate stack recommendation with the updated `isPaired` flag.
   * 5. Build composed reference from the remainder stack type.
   * 6. Run the layout pass, then clean up the composed reference.
   *
   * @private
   */
  private runRemainderPass(): void {
    // Fresh duplicates — previous pass already consumed the originals
    this.artworkItems = this.duplicateSourceItems();

    // Remainder pass always treats items as paired sets
    this.isPaired = true;
    this.countType = CountType.SET;

    // Remove any white-fill placeholders from the newly duplicated items
    this.cleanWhiteFillItem();

    // Recalculate with the updated isPaired flag so the correct stack is chosen
    this.stackRecommendation = this.calculateStackRecommendation();

    // Build a fresh composed reference for the remainder stack type
    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.remainderStack,
    );

    this.layoutPassTracker = this.buildPassTracker("rem");
    this.begin("rem");

    // Release the composed reference — prevents orphaned Illustrator objects
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;
  }

  // ─── Private: Source item helpers ────────────────────────────────────────

  /**
   * Duplicates the first two artwork items from `jftItem.items`.
   *
   * The second slot may resolve to `null` for single-item designs; it is
   * filtered out downstream by {@link cleanWhiteFillItem} or handled via the
   * `isSingleItem` flag.
   *
   * @returns Fresh array of duplicated PageItems ready for mutation.
   * @private
   */
  private duplicateSourceItems(): PageItem[] {
    return [
      this.jftItem.items[0].object.duplicate(),
      this.jftItem.items[1].object.duplicate() || null,
    ] as PageItem[];
  }

  /**
   * Builds the {@link LayoutPassTracker} for the requested pass type from the
   * current `stackRecommendation`.
   *
   * All quantity counters are initialised to zero so `isPassComplete()` starts
   * as `false` and only becomes `true` once `incrementPlacedQty()` has been
   * called the required number of times.
   *
   * @param passType - `"main"` for the primary grid, `"rem"` for the remainder.
   * @returns Populated tracker ready to be assigned to `layoutPassTracker`.
   * @private
   */
  private buildPassTracker(passType: "main" | "rem"): LayoutPassTracker {
    const rec = this.stackRecommendation!;
    const isMainPass = passType === "main";

    return {
      type: passType,
      placedQty: 0,
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
   * instance configuration.  Invoked for both the main and remainder passes.
   *
   * @returns Fresh recommendation result from the calculator.
   * @private
   */
  private calculateStackRecommendation(): RecommendedStacksResult {
    return GridCalculator.getRecommendedStacks({
      gap: this.itemGap,
      maxColsInDoc: CONFIG.PER_DOC,
      quantity: this.quantity,
      size: this.dimension,
      pair: this.isPaired,
      pairGap: this.itemGap,
      heightPreference: "Less",
      stackOrientation: this.stackOrientation,
    });
  }

  /**
   * Constructs the composed reference {@link GroupItem} for the given stack type
   * by invoking {@link ItemsInitiater}.
   *
   * The returned group is the sole duplication source for the entire layout pass.
   * It must be removed after the pass completes to avoid accumulating orphaned
   * Illustrator objects.
   *
   * @param stackType - The stack variant to compose (e.g. `"HH"`, `"VRH"`).
   * @returns The resulting `GroupItem` used as the duplication source.
   * @private
   */
  private buildComposedReference(stackType: StackType): GroupItem {
    return new ItemsInitiater({
      dimension: this.dimension,
      items: this.artworkItems,
      fixedSize: this.jftItem.info.fixedSize,
      sizeChar: this.sizeChar,
      stack: stackType,
      gap: this.itemGap,
    }).getItem();
  }

  // ─── Private: Validation & cleanup ────────────────────────────────────────

  /**
   * Enforces special rules for NECK order items.
   *
   * Neck items are always single-sided; if two artwork items were duplicated,
   * the second is removed from the array and `isPaired` / `countType` are reset
   * to prevent incorrect set-counting in the output filename.
   *
   * @private
   */
  private specialValidation(): void {
    if (
      this.jftItem.order === PairObjectMarkers.NECK &&
      this.artworkItems.length > 1
    ) {
      // Remove the second item — neck layouts are always single-sided
      this.artworkItems.splice(1, 1);
      this.isPaired = false;
      this.countType = CountType.PCS;
    }
  }

  /**
   * Scans `artworkItems` for white-filled PathItems — blank placeholder
   * rectangles inserted so both array slots are always populated in the JFT
   * item structure.
   *
   * When a placeholder is found:
   * - It is removed from the Illustrator document via `item.remove()`.
   * - It is spliced out of `artworkItems`.
   * - `isPaired` and `countType` are reset to reflect the now-single item.
   *
   * @private
   */
  private cleanWhiteFillItem(): void {
    ES6_SA.arrayForEach(this.artworkItems, (item, idx) => {
      if (
        item &&
        item.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item as PathItem)
      ) {
        // Splice before remove so subsequent iterations see the correct indices
        this.artworkItems.splice(idx, 1);
        this.isPaired = false;
        this.countType = CountType.PCS;

        // Explicit Illustrator object removal — avoids orphaned PageItem accumulation
        item.remove();
      }
    });
  }

  // ─── Private: Naming helpers ──────────────────────────────────────────────

  /**
   * Pads a number with a leading zero for single-digit values.
   * Returns an empty string when the value is `0` (suppresses the index prefix
   * in filenames that should not carry a numeric order segment).
   *
   * @param value - Non-negative integer to format.
   * @returns `""` when `value === 0`; `"09"` for 9; `"10"` for 10, etc.
   * @private
   */
  private padZero(value: number): string {
    if (!value) return "";
    return value < 10 ? `0${value}` : value.toString();
  }

  /**
   * Returns `true` when at least one of the JFT item's artwork entries carries
   * a dynamic flag, indicating that text tokens (player name, number, etc.)
   * differ per placed unit.
   *
   * Single-item shortcut: only `items[0]` is checked when `isSingleItem` is set,
   * avoiding a potentially null access on `items[1]`.
   *
   * @returns `true` if the output document should be treated as dynamic.
   * @private
   */
  private isDocumentDynamic(): boolean {
    const entry1 = this.jftItem.items[0];

    // Single-item shortcut — avoids accessing the potentially null second entry
    if (this.isSingleItem && entry1.isDynamic) return true;

    const entry2 = this.jftItem.items[1];
    return entry1.isDynamic || entry2.isDynamic;
  }

  /**
   * Builds the base filename for an output EPS document.
   *
   * ### Quantity / count-type suppression rules (evaluated in strict priority order)
   *
   * | Priority | Condition                          | `qty`       | `countType`  |
   * |----------|------------------------------------|-------------|--------------|
   * | 1 (high) | `isDocDynamic && !forceStatic`     | `""`        | `""`         |
   * | 2        | `rows === 1 && cols === 1`          | `""`        | `""`         |
   * | 3        | `targetQty === 1 && cols === 1`     | `""`        | `""`         |
   * | 4        | `rows === 1 && cols > 1`            | `cols`      | `CMD`        |
   * | 5 (low)  | default (multi-row, static)         | `targetQty` | `countType`  |
   *
   * **Rule 3** intentionally does **not** suppress when `targetQty > 1 && cols === 1`
   * (multi-row single-column) — the quantity is meaningful and must be preserved.
   *
   * ### Filename structure
   * ```
   * {fileOrder}-{size}{qty}{countType}
   * ```
   * Unpaired items append the direction marker to `fileOrder` so FRONT and BACK
   * produce separate, distinguishable filenames.
   *
   * @param direction   - Optional direction marker appended when `!isPaired`.
   * @param forceStatic - When `true`, Rule 1 (dynamic suppression) is bypassed.
   * @returns           Formatted filename string (no numeric prefix, no extension).
   * @private
   */
  private buildDocName(
    direction: DirectionMarkers | null = null,
    forceStatic: boolean = false,
  ): string {
    const { rows, cols, targetQty } = this.layoutPassTracker;

    // Fixed-size items carry no per-size variant — omit the size segment
    const sizeSegment = this.jftItem.info.fixedSize ? "" : this.sizeChar;

    const isDocDynamic = this.isDocumentDynamic();

    // ── Default segments (may be overridden by rules below) ───────────────
    let quantitySegment = `-${targetQty.toString()}`;
    let countTypeSegment = ` ${this.countType}` as string;

    // ── Rule 1 · Dynamic document (highest priority) ──────────────────────
    // Dynamic docs contain unique content per unit — a fixed qty label is misleading
    if (isDocDynamic && !forceStatic) {
      quantitySegment = "";
      countTypeSegment = "";
    }

    // ── Rule 2 · Single-cell grid (rows === 1 AND cols === 1) ─────────────
    // A 1×1 grid always holds exactly one item — quantity is implied
    else if (rows === 1 && cols === 1) {
      quantitySegment = "";
      countTypeSegment = "";
    }

    // ── Rule 3 · Single-column, single-quantity ───────────────────────────
    // Only one piece exists in total — displaying "1 PCS" adds no information.
    // NOTE: targetQty > 1 with cols === 1 intentionally falls through to Rule 5
    else if (targetQty === 1 && cols === 1) {
      quantitySegment = "";
      countTypeSegment = "";
    }

    // ── Rule 4 · Single-row, multi-column → CMD layout ────────────────────
    // A single horizontal strip: the column count IS the printed quantity;
    // the label becomes CMD (command-strip / single-row run)
    else if (rows === 1 && cols > 1) {
      quantitySegment = `-${cols.toString()}`;
      countTypeSegment = ` ${CountType.CMD}`;
    }

    // ── Rule 5 (default) · Normal multi-row, static layout ────────────────
    // quantitySegment and countTypeSegment already hold the correct defaults

    // ── File-order segment ────────────────────────────────────────────────
    // Append direction only for unpaired items so FRONT / BACK filenames differ
    const fileOrderSegment = this.isPaired
      ? `${this.jftItem.order}`
      : `${this.jftItem.order}${direction ? `-${direction}` : ""}`;

    return `${fileOrderSegment}-${sizeSegment}${quantitySegment}${countTypeSegment}`;
  }

  // ─── Private: Text-frame helpers ─────────────────────────────────────────

  /**
   * Checks whether a text frame (or any of its individual characters) uses a
   * gradient fill.  Both a whole-range shortcut and a per-character fallback
   * are checked to handle mixed-formatting text frames.
   *
   * @param textFrame - The Illustrator TextFrame to inspect.
   * @returns `true` if any part of the text carries a gradient fill colour.
   * @private
   */
  private hasGradientFill(textFrame: TextFrame): boolean {
    // Whole-range quick check — most text frames have uniform formatting
    if (
      textFrame.textRange.characterAttributes.fillColor.typename ===
      "GradientColor"
    ) {
      return true;
    }

    // Per-character fallback for mixed-formatting text frames
    const chars = textFrame.textRange.characters;
    for (let i = 0; i < chars.length; i++) {
      const charFill = chars[i].characterAttributes.fillColor;
      if (charFill && charFill.typename === "GradientColor") {
        return true;
      }
    }

    return false;
  }

  /**
   * Captures the current visual dimensions of a text frame in **inches**.
   *
   * Uses the geometric bounds of the frame so the snapshot is independent of
   * the active ruler units and reflects the actual rendered size at the moment
   * of the call.
   *
   * @param textFrame - The TextFrame whose size should be snapshotted.
   * @returns An object with `widthInch` and `heightInch` expressed in inches.
   * @private
   */
  private captureTextFrameSize(textFrame: TextFrame): TextFrameSizeSnapshot {
    const bounds = Utils.getObjectBounds(textFrame);
    const dim = Utils.getDimension(bounds); // returns width/height in points

    return {
      // Convert from points (Illustrator internal unit) to inches for comparison
      widthInch: Utils.convertLength({
        value: dim.width,
        from: "pt",
        to: "inch",
      }),
      heightInch: Utils.convertLength({
        value: dim.height,
        from: "pt",
        to: "inch",
      }),
    };
  }

  /**
   * Applies smart font-size correction after a text frame's content has been
   * replaced with a new string.
   *
   * ### Comparison metric
   * Visual **area** (width × height in inches) is used as a single scalar so
   * that both portrait and landscape frames are handled uniformly.
   *
   * ### Decision table
   *
   * | New area vs original area             | Action taken                                                     |
   * |---------------------------------------|------------------------------------------------------------------|
   * | ≥ original AND ≤ GROW_THRESHOLD       | No change — size is within the acceptable range                  |
   * | > GROW_THRESHOLD × original           | Scale font **DOWN** toward `GROW_THRESHOLD × original`, but never below `GROW_MIN_KEEP × original` |
   * | < SHRINK_THRESHOLD × original         | Bump font **UP** by `TEXT_BUMP_UP_FACTOR` of current size        |
   * | ≥ SHRINK_THRESHOLD AND < original     | No change — slight shrinkage is acceptable                       |
   *
   * ### Why the "never below GROW_MIN_KEEP" floor?
   * Replacement text is often longer than the original (e.g. a longer player
   * name).  Scaling back all the way to the original size would make the new
   * content feel cramped compared to what the designer intended.  The floor
   * preserves intentional growth while preventing runaway overflow.
   *
   * @param textFrame    - The TextFrame to adjust.
   * @param originalSize - Size snapshot captured **before** content replacement.
   * @private
   */
  private adjustTextFrameFontSize(
    textFrame: TextFrame,
    originalSize: TextFrameSizeSnapshot,
  ): void {
    // Capture size AFTER content has been set
    const newSize = this.captureTextFrameSize(textFrame);

    // Use area (w × h) as a single comparable scalar
    const originalArea = originalSize.widthInch * originalSize.heightInch;
    const newArea = newSize.widthInch * newSize.heightInch;

    // Guard: zero-area frame (invisible / fully collapsed) — skip silently
    if (originalArea <= 0 || newArea <= 0) return;

    // Ratio of new area to original area
    const growRatio = newArea / originalArea;

    if (growRatio > TEXT_GROW_THRESHOLD) {
      // ── Case A: content caused the frame to grow "too much" ───────────────
      // Scale font DOWN proportionally toward TEXT_GROW_THRESHOLD × original.
      // Clamp the target to TEXT_GROW_MIN_KEEP × original so that longer
      // replacement content still appears visually larger than the original.

      const targetRatio = TEXT_GROW_THRESHOLD;

      // Clamp: never shrink below the MIN_KEEP floor
      const clampedRatio = Math.max(targetRatio, TEXT_GROW_MIN_KEEP);

      // The actual font scale factor needed to reach the clamped target area
      const fontScaleFactor = Math.sqrt(clampedRatio / growRatio);

      // Apply the scale to every character's fontSize individually
      this.scaleFontSize(textFrame, fontScaleFactor);
    } else if (growRatio < TEXT_SHRINK_THRESHOLD) {
      // ── Case B: content caused the frame to shrink "too much" ─────────────
      // Apply a gentle upward bump — not a full restore to original size.
      this.scaleFontSize(textFrame, 1 + TEXT_BUMP_UP_FACTOR);
    }

    // ── Case C: size is within the acceptable band ─────────────────────────
    // No action required — the frame looks correct as-is.
  }

  /**
   * Multiplies the font size (`size`) of every character in the text frame's
   * text range by the given `factor`.
   *
   * Iterates character by character to correctly handle mixed-size text frames
   * (e.g. a frame where the first character is 72 pt and the rest are 36 pt).
   * Results are rounded to 2 decimal places to avoid floating-point drift.
   *
   * @param textFrame - The TextFrame whose character font sizes should be scaled.
   * @param factor    - Multiplicative scale factor (e.g. `0.85` to reduce by 15 %).
   * @private
   */
  private scaleFontSize(textFrame: TextFrame, factor: number): void {
    const chars = textFrame.textRange.characters;

    for (let i = 0; i < chars.length; i++) {
      const charAttribs = chars[i].characterAttributes;

      // `size` is the font size in points — multiply and round to 2 dp
      charAttribs.size = parseFloat((charAttribs.size * factor).toFixed(2));
    }
  }

  // ─── Private: Per-item mutation ───────────────────────────────────────────

  /**
   * Applies an arc envelope warp (50 % bend) to the given text frame and then
   * immediately expands the envelope into regular vector objects.
   *
   * ### Why arc warp is expanded right away
   * An unexpanded envelope remains a live effect that can interfere with
   * subsequent operations (bounding-box queries, outline conversion, etc.).
   * Expanding bakes it into plain path geometry.
   *
   * ### Menu command notes
   * - `"warpArc"` — triggers Illustrator's built-in Arc warp at the current
   *   envelope warp settings.  Illustrator's default bend value is 50 %, which
   *   matches the requirement.  The selection must be set to the target frame
   *   **before** the command is issued.
   * - `"expandStyle"` — expands the live envelope into editable vector geometry.
   *   This is the same command used elsewhere in this class for gradient expansion.
   *
   * @param textFrame - The TextFrame to warp and expand.
   * @private
   */
  private applyArcTextWarp(textFrame: TextFrame): void {
    // Deselect everything — menu commands operate on the active selection
    app.executeMenuCommand("deselectall");

    // Target only this text frame so the warp is isolated
    textFrame.selected = true;

    // Apply arc warp at Illustrator's default 50 % bend via the internal command
    app.executeMenuCommand("warpArc");

    // Expand the live envelope immediately into flat vector geometry
    app.executeMenuCommand("expandStyle");
  }

  /**
   * Injects dynamic text content into every relevant text frame inside
   * `placedItem` and applies a sequence of post-injection corrections.
   *
   * ### Item structure expected
   * ```
   * placedItem  (GroupItem)            ← top-level placed group
   *   └── subGroup  (GroupItem)        ← one or more sub-groups
   *         └── TextFrame "NAME"       ← text frames live here, not at top level
   *         └── TextFrame "NUMBER"
   * ```
   * Top-level children that are **not** GroupItems are skipped silently.
   * Text frames found directly under `placedItem` (not wrapped in a sub-group)
   * are not processed — the two-level structure is intentional.
   *
   * ### Execution order per text frame
   * 1. Look up the replacement string from the **front** of `this.data` using
   *    the frame's `.name` as the key.  Skip if the key is absent.
   * 2. Snapshot the frame's current visual size (in inches) **before** writing.
   * 3. Replace `textFrame.contents` with the new string.
   * 4. Apply smart font-size correction ({@link adjustTextFrameFontSize}).
   * 5. If `x` is `true`, apply arc warp at 50 % and expand ({@link applyArcTextWarp}).
   * 6. If the frame carries a gradient fill **and** the active stack is a
   *    rotated variant (RHH, RVV, or VRH), expand the gradient via `expandStyle`.
   * 7. If `CONFIG.OUTLINE_TEXT` is enabled, convert the frame to vector outlines.
   *
   * ### Data queue behaviour
   * `this.data` is a shared FIFO queue across the entire layout run.
   * After processing all frames in one placed item, the front row is consumed
   * via `Array.shift()` so the next placed item automatically receives the
   * next data row.  `shift()` (not `pop()`) preserves FIFO order.
   *
   * ### Gradient expansion
   * Gradient fills on rotated stacks (RHH, RVV, VRH) lose their visual
   * orientation.  Expanding bakes the gradient into vector fills.
   * HH and VV are axis-aligned — no expansion needed for them.
   *
   * ### When this method is a no-op
   * - `placedItem` is not a `GroupItem`.
   * - `this.data` is `null` or has been fully consumed.
   *
   * When CONFIG.WRAP_TEXT `true`, each text frame receives an arc warp (50 % bend)
   *                     followed by an immediate expand before further processing.
   *
   * @param placedItem - The freshly duplicated GroupItem in its final grid position.
   * @private
   */
  private modifyTextFramesInItem(placedItem: PageItem): void {
    // Only GroupItems carry sub-groups with text frames in this workflow
    if (placedItem.typename !== PageItemType.GroupItem) return;

    // Skip when no dynamic data is available or the queue is exhausted
    if (!this.data || !this.data.length) return;

    // The data row for THIS placed item — always the first (oldest) entry (FIFO)
    const currentDataRow = this.data[0];

    // Gradient expansion is needed only for rotated stacks (RHH, RVV, VRH).
    // HH and VV are axis-aligned so gradients render correctly without expansion.
    const stackRequiresGradientExpansion =
      this.layoutPassTracker.stack !== "HH" &&
      this.layoutPassTracker.stack !== "VV";

    // ── Outer loop: iterate direct children of the top-level placed group ──
    for (let i = 0; i < placedItem.pageItems.length; i++) {
      const subGroup = placedItem.pageItems[i];

      // Text frames live inside sub-groups — skip any non-group direct children
      if (subGroup.typename !== PageItemType.GroupItem) continue;

      // ── Inner loop: find and process TextFrames inside this sub-group ─────
      for (let j = 0; j < (subGroup as GroupItem).pageItems.length; j++) {
        const child = (subGroup as GroupItem).pageItems[j];

        // Only process TextFrame children — skip paths, images, nested groups, etc.
        if (child.typename !== PageItemType.TextFrame) continue;

        const textFrame = child as TextFrame;

        // The frame's name is the lookup key into the current data row
        const frameName = textFrame.name;

        // Skip frames whose name is absent from the current data row
        const replacementText = currentDataRow[frameName];
        if (replacementText === undefined) continue;

        // ── Step 1: Snapshot original size BEFORE content change ─────────────
        // Must be captured now — the size will change once contents is set
        const originalSize = this.captureTextFrameSize(textFrame);

        // ── Step 2: Inject new content ────────────────────────────────────────
        textFrame.contents = replacementText;

        // ── Step 3: Smart font-size correction ───────────────────────────────
        // Adjusts font size if the content change caused the frame to grow or
        // shrink beyond the acceptable thresholds
        this.adjustTextFrameFontSize(textFrame, originalSize);

        // ── Step 4: Gradient expansion (rotated stacks only) ─────────────────
        // Must run AFTER arc warp (if any) because applyArcTextWarp already
        // deselects; we need to re-select for this expandStyle call
        if (this.hasGradientFill(textFrame) && stackRequiresGradientExpansion) {
          // Save the active selection so it can be restored after the menu command
          const previousSelection = app?.activeDocument?.selection[0];

          // expandStyle operates on the Illustrator active selection
          app.executeMenuCommand("deselectall");
          textFrame.selected = true;
          app.executeMenuCommand("expandStyle");

          // Restore the previous selection when running in action-engine mode
          if (Utils.isActionThreadEngine()) {
            app.executeMenuCommand("deselectall");
            if (previousSelection) {
              previousSelection.selected = true;
            }
          }
        }

        // ── Step 5: Arc warp (optional, controlled by caller via `x`) ────────
        // Applies a 50 % arc envelope warp and immediately expands it to flat
        // vector geometry so subsequent operations see correct bounding boxes
        if (CONFIG.WRAP_TEXT) {
          this.applyArcTextWarp(textFrame);
        }

        // ── Step 6: Convert to outlines (optional, controlled by CONFIG) ──────
        // Must be called LAST — createOutline() destroys the TextFrame object
        // and replaces it with a GroupItem; any operations after this point
        // cannot reference `textFrame` safely
        if (!CONFIG.WRAP_TEXT && CONFIG.OUTLINE_TEXT) {
          textFrame.createOutline();
        }
      }
    }

    // ── Step 7: Consume the front data row (FIFO) ─────────────────────────
    // shift() removes the FIRST element — correct for a FIFO queue.
    // pop() would remove the LAST element, which is a bug.
    this.data.shift();
  }

  // ─── Private: Grid building ───────────────────────────────────────────────

  /**
   * Fills a single output document with a column-major grid of duplicated items.
   *
   * ### Grid traversal order (column-major)
   * ```
   *  col 1       col 2       col 3
   * ┌──────┐    ┌──────┐    ┌──────┐
   * │ r1   │    │ r1   │    │ r1   │   ← columnFirstItem anchor per column
   * │ r2   │    │ r2   │    │ r2   │   ← placed to the RIGHT of r1
   * │ r3   │    │ r3   │    │ r3   │   ← placed to the RIGHT of r2
   * └──────┘    └──────┘    └──────┘
   *    ↑ col 2+ first item placed BELOW col 1 first item
   * ```
   * - Items are duplicated from `params.item` (reference copy inside the doc).
   * - `layoutPassTracker.placedQty` is incremented after each duplication.
   * - VRH stacks count 2 units per placed group — the tracker reflects this.
   * - The reference copy is removed at the end to prevent accumulation.
   * - All placed items are centred on the artboard via {@link alignAllItemsCenter}.
   *
   * @param params - Grid configuration for this document.
   * @private
   */
  private createGrid(params: CreateGridParams): void {
    const { maxCol, rows, doc, item: referenceItem } = params;

    // Pre-convert gap from inches → points (Illustrator internal unit)
    const gapInPoints = Utils.convertLength({
      value: this.itemGap,
      from: "inch",
      to: "pt",
    });

    // Accumulates all successfully placed items — used for final alignment
    const placedItems: PageItem[] = [];

    // ── Seed: first item in the grid (top-left cell) ──────────────────────
    let currentItem = referenceItem.duplicate();
    let columnFirstItem = currentItem; // vertical anchor for each new column's start

    placedItems.push(currentItem);
    this.incrementPlacedQty();
    // Modify immediately — single source of truth, same as every other placed item
    this.modifyTextFramesInItem(currentItem);

    // ── Main grid loop — column-major traversal ───────────────────────────
    for (let col = 1; col <= maxCol; col++) {
      if (this.isPassComplete()) break;

      // ── Inner loop: fill rows within the current column ──────────────────
      for (let row = 1; row <= rows; row++) {
        if (this.isPassComplete()) break;

        // Duplicate → position the new item to the RIGHT of the current one
        const nextItem = currentItem.duplicate();
        placedItems.push(nextItem);
        this.incrementPlacedQty();

        AlignmentHandler.moveObjectAfter({
          base: currentItem,
          moving: nextItem,
          position: "R",
          gap: gapInPoints,
          engine: CONFIG.THREAD_ENGINE,
        });

        // Modify immediately — once, right after placement
        this.modifyTextFramesInItem(nextItem);

        // Advance the current-item cursor for the next row iteration
        currentItem = nextItem;
      }

      if (this.isPassComplete()) break;

      // ── Start next column: duplicate from reference, place BELOW column anchor ─
      if (col !== maxCol) {
        const newColumnFirstItem = referenceItem.duplicate();

        AlignmentHandler.moveObjectAfter({
          base: columnFirstItem,
          moving: newColumnFirstItem,
          position: "B",
          gap: gapInPoints,
          engine: CONFIG.THREAD_ENGINE,
        });

        // Advance both anchors to the new column
        columnFirstItem = newColumnFirstItem;
        currentItem = newColumnFirstItem;
        placedItems.push(newColumnFirstItem);
        this.incrementPlacedQty();
        // Modify immediately — once, right after placement
        this.modifyTextFramesInItem(newColumnFirstItem);
      }
    }

    // ── Cleanup: remove orphaned reference, centre and fit artboard ───────
    if (referenceItem.parent === doc) {
      referenceItem.remove();
    }

    if (placedItems.length) {
      this.alignAllItemsCenter(doc, placedItems as Selection);
    }
  }

  /**
   * Increments `layoutPassTracker.placedQty` by the correct amount for the
   * active stack type.
   *
   * VRH stacks place a group that contains both an original and its mirrored
   * copy — each group therefore represents **two** physical garment pieces and
   * the counter is bumped by 2.  All other stacks bump by 1.
   *
   * @private
   */
  private incrementPlacedQty(): void {
    // Every placement counts as at least one unit
    this.layoutPassTracker.placedQty++;

    if (this.layoutPassTracker.stack === "VRH") {
      // VRH group = original + mirror → two units per placement
      this.layoutPassTracker.placedQty++;
    }
  }

  /**
   * Returns `true` when the current layout pass has placed all required items.
   *
   * Acts as a short-circuit guard at the start of each loop iteration in
   * {@link createGrid} to prevent over-duplication.
   *
   * @returns `true` when `placedQty >= targetQty`.
   * @private
   */
  private isPassComplete(): boolean {
    return this.layoutPassTracker.placedQty >= this.layoutPassTracker.targetQty;
  }

  // ─── Private: Document management ────────────────────────────────────────

  /**
   * Creates and saves one or more EPS documents for a dynamic-item layout pass.
   *
   * For **dynamic** documents, each output file receives a fresh grid built by
   * duplicating `dynamicItem`.  For **static** documents, only a single file is
   * created (all units are identical — repeating would be wasteful).
   *
   * @param params - Layout dimensions, document-count info, and the source item.
   * @private
   */
  private processDynamicPass(params: DynamicGridLayoutPassParams): void {
    const { cols, reqDocs, rows, dynamicItem, direction = null } = params;

    const isDynamic = this.isDocumentDynamic();

    for (let docNum = 1; docNum <= reqDocs.docsNeeded; docNum++) {
      const docTitle = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction)}`;
      const docHandler = new IllustratorDocument(docTitle);

      const newDoc = docHandler.create([dynamicItem]);
      const seedItem = newDoc.activeLayer.pageItems[0] as PageItem;

      if (isDynamic) {
        this.createGrid({
          cols,
          doc: newDoc,
          maxCol: reqDocs.colsPerDoc,
          item: seedItem,
          rows,
        });

        seedItem.remove();
      }

      // Always centre all items and shrink the artboard — both dynamic and static docs
      this.alignAllItemsCenter(newDoc);

      docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
      docHandler.close();
      this.outputFileIndex++;

      if (!isDynamic) break;
    }
  }

  /**
   * Creates and saves a single-item EPS document for a **static** artwork piece.
   *
   * No grid is built — the item is centred on the artboard as a single copy.
   * After saving, `staticItem` is removed from Illustrator to prevent accumulation
   * across document iterations.
   *
   * @param staticItem - The artwork PageItem to embed in the document.
   * @param direction  - Direction marker for the filename (e.g. `"FRONT"`, `"BACK"`).
   * @private
   */
  private saveStaticDocument(
    staticItem: PageItem,
    direction: DirectionMarkers,
  ): void {
    // forceStatic=true bypasses the dynamic-suppression Rule 1 in buildDocName
    const staticDocName = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction, true)}`;
    const staticDocHandler = new IllustratorDocument(staticDocName);
    const staticDoc = staticDocHandler.create([staticItem]);

    // Centre the single item on the artboard
    this.alignAllItemsCenter(staticDoc);

    staticDocHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
    staticDocHandler.close();

    // Explicit removal — prevents the static item lingering across document iterations
    staticItem.remove();
    this.outputFileIndex++;
  }

  /**
   * Inspects the JFT item pair and determines which entry is static and which
   * is dynamic when they differ.
   *
   * Returns `null` when both entries share the same `isDynamic` value — there
   * is no mixed case and the normal flow applies.
   *
   * @returns `{ staticEntry, dynamicEntry }` or `null` when not a mixed case.
   * @private
   */
  private resolveMixedEntries(): {
    staticEntry: ItemInfoEntry;
    dynamicEntry: ItemInfoEntry;
  } | null {
    const entry1 = this.jftItem.items[0];
    const entry2 = this.jftItem.items[1];

    // Both entries have the same dynamic status — no mixed case
    if (entry1.isDynamic === entry2.isDynamic) return null;

    return {
      staticEntry: entry1.isDynamic ? entry2 : entry1,
      dynamicEntry: entry1.isDynamic ? entry1 : entry2,
    };
  }

  // ─── Private: Main routing ────────────────────────────────────────────────

  /**
   * Top-level routing method for a single layout pass.
   *
   * Dispatches to one of three paths based on the item configuration:
   *
   * **Path 1 — Non-VRH mixed** (`!isPaired && !isSingleItem && !VRH && mixed dynamic`)
   * - Locates the static and dynamic sub-items inside the composed reference group.
   * - Saves the static sub-item as a standalone EPS (no grid).
   * - Runs the dynamic sub-item through the standard multi-doc grid pipeline.
   *
   * **Path 2 — VRH mixed** (`!isPaired && !isSingleItem && VRH && mixed dynamic`)
   * - Discards the current composed reference (cannot be split for VRH).
   * - Rebuilds a VRH-composed group for the static entry → saves as standalone EPS.
   * - Rebuilds a VRH-composed group for the dynamic entry → grid pipeline.
   *
   * **Path 3 — Normal flow** (paired / both dynamic / single item / no mixed case)
   * - Delegates directly to {@link processDynamicPass} using the existing
   *   `composedReferenceItem` as the duplication source.
   *
   * @param params - Grid layout dimensions and document requirements for this pass.
   * @private
   */
  private processDocumentAndLayout(params: GridLayoutPassParams): void {
    const { cols, reqDocs, rows } = params;
    const isVrhStack = this.layoutPassTracker.stack === "VRH";

    // ── Evaluate mixed-entry special cases ────────────────────────────────
    if (!this.isPaired && !this.isSingleItem) {
      const mixedEntries = this.resolveMixedEntries();

      if (mixedEntries) {
        const { staticEntry, dynamicEntry } = mixedEntries;

        if (!isVrhStack) {
          // ── Path 1: Non-VRH mixed ─────────────────────────────────────────
          // The two sub-items live inside the already-built composed reference
          const staticItem = ES6_SA.arrayFind(
            this.composedReferenceItem!.pageItems,
            (itm) => itm.name === staticEntry.object.name,
          );

          const dynamicItem = ES6_SA.arrayFind(
            this.composedReferenceItem!.pageItems,
            (itm) => itm.name === dynamicEntry.object.name,
          );

          if (!staticItem || !dynamicItem) {
            throw new Error(
              "Could not locate static or dynamic item in composed reference group.",
            );
          }

          // Save the static artwork as a single standalone EPS
          this.saveStaticDocument(
            staticItem,
            staticEntry.direction as DirectionMarkers,
          );

          // Run the dynamic artwork through the standard grid pipeline
          this.processDynamicPass({
            cols,
            reqDocs,
            rows,
            dynamicItem,
            direction: dynamicEntry.direction as DirectionMarkers,
          });

          return; // Path 1 fully handled
        }

        // ── Path 2: VRH mixed ─────────────────────────────────────────────
        // VRH groups cannot be split — rebuild a separate composed reference
        // for each entry

        // Release the shared composed reference before rebuilding
        this.composedReferenceItem!.remove();
        this.composedReferenceItem = null;

        // Build the static VRH group, save it, then release it
        // (saveStaticDocument calls staticItem.remove() internally)
        const staticVrhComposed = this.buildComposedReference("VRH");
        this.saveStaticDocument(
          staticVrhComposed,
          staticEntry.direction as DirectionMarkers,
        );

        // Build the dynamic VRH group and run the grid pipeline
        const dynamicVrhComposed = this.buildComposedReference("VRH");
        this.composedReferenceItem = dynamicVrhComposed;

        this.processDynamicPass({
          cols,
          reqDocs,
          rows,
          dynamicItem: dynamicVrhComposed,
          direction: dynamicEntry.direction as DirectionMarkers,
        });

        return; // Path 2 fully handled
      }
    }

    // ── Path 3: Normal flow ────────────────────────────────────────────────
    // Paired / both-dynamic / single-item / no mixed case —
    // use the existing composedReferenceItem directly as the duplication source
    this.processDynamicPass({
      cols,
      reqDocs,
      rows,
      dynamicItem: this.composedReferenceItem!,
    });
  }

  /**
   * Entry point for a single layout pass (main or remainder).
   *
   * Extracts the correct rows / cols / reqDocs from `stackRecommendation`
   * for the requested pass type and forwards them to
   * {@link processDocumentAndLayout}.
   *
   * @param passType - `"main"` for the primary grid, `"rem"` for the remainder.
   * @private
   */
  private begin(passType: "main" | "rem"): void {
    const rec = this.stackRecommendation!;

    // Select the correct subset of recommendation fields for this pass
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

  // ─── Private: Alignment ───────────────────────────────────────────────────

  /**
   * Centres the provided items (or all items in the active layer) on the
   * active artboard, then shrinks the artboard to a 1×1 inch sentinel via
   * {@link Organizer.smallArtboard}.
   *
   * When `items` is omitted, all PageItems in `doc.activeLayer` are aligned.
   * This fallback is used by {@link saveStaticDocument} where no explicit
   * item list is available.
   *
   * @param doc   - Document whose artboard is used as the alignment target.
   * @param items - Optional explicit item list; defaults to all active-layer items.
   * @private
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
      position: "C", // centre both horizontally and vertically on the artboard
      engine: CONFIG.THREAD_ENGINE,
    });

    // Shrink artboard to a 1×1 inch sentinel so the EPS crops tightly to content
    Organizer.smallArtboard(doc);
  }
}
