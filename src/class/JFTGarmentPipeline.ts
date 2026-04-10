/** Constructor parameters for {@link JFTGarmentPipeline}. */
interface JFTGarmentPipelineParams {
  /** Pre-resolved cache of JFT items keyed by `PairObjectMarkers`. */
  jftItemsCache: JFTItemCache;
  /** Full automate data including size details and basic job info. */
  data: AutomateData;
}

/** Tracks which garment-part markers are active for the current job. */
type Workflow = {
  -readonly [key in keyof typeof PairObjectMarkers]: boolean;
};

/** An inclusive size range used to group adjacent sizes together. */
type SizeRanges = { from: ApparelSize; to: ApparelSize }[];

/** Parameters passed to {@link JFTGarmentPipeline.generateLayoutDoc}. */
interface GenerateLayoutDocParams {
  /** Garment-part key that maps to a `JFTItem` in the cache. */
  itemType: keyof JFTItemCache;
  /** Preferred stack orientation. Defaults to `"auto"`. */
  orientation?: StackOrientation;
  /** Optional size-range groupings. Applied only when `CONFIG.DIMENSION_RANGE` is enabled. */
  sizeRanges?: null | SizeRanges;
}

/** Extends {@link GenerateLayoutDocParams} with a single resolved range. */
interface HandleSizeRangeParams extends Omit<
  GenerateLayoutDocParams,
  "sizeRange"
> {
  /** The specific size range to merge. */
  readonly sizeRange: SizeRanges[0];
}

/** Maps each `ApparelSize` to the size-range label it belongs to. */
type TrackRangeSizeChar = Record<ApparelSize, ApparelSizeRange>;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the five-stage garment layout pipeline for a single print job.
 *
 * @remarks
 * Each stage calls {@link generateLayoutDoc} for one garment-part type.
 * The pipeline order is fixed:
 * 1. Collar (NECK for T-shirts, PLACKET + COLLAR for POLO)
 * 2. Rib (SHORT_SLEEVE_RIB / LONG_SLEEVE_RIB when applicable)
 * 3. Sleeve (SHORT_SLEEVE / LONG_SLEEVE or both)
 * 4. Body
 * 5. Pant (currently disabled)
 *
 * For each part, `generateLayoutDoc` resets the working size list, applies
 * optional size-range merges, then iterates over sorted sizes and delegates
 * to {@link GridLayoutGenerator} for the actual EPS document creation.
 */
class JFTGarmentPipeline {
  // ─── Immutable source data ────────────────────────────────────────────

  /** Original automate data — never mutated; `tempData` is the working copy. */
  private readonly data: JFTGarmentPipelineParams["data"];

  // ─── Mutable working state ────────────────────────────────────────────

  /** Resolved garment-part lookup table passed from {@link JFTProcessSequentially}. */
  private jftItemsCache: JFTGarmentPipelineParams["jftItemsCache"];

  // ─── Per-call override state ──────────────────────────────────────────
  // These fields are set by individual pipeline stages before calling
  // generateLayoutDoc and are cleared by _resetState() after each call.

  /**
   * When set, overrides the per-size dimension lookup inside `generateLayoutDoc`.
   * Used by fixed-size + dynamic items so all sizes share one dimension.
   */
  private _overrideDim: DimensionObject | null = null;

  /**
   * When `false`, SIZE_TKN replacement is disabled for the current call.
   * Collar, neck, and rib items carry their own fixed labels and must not
   * have their size tokens overwritten.
   */
  private _tknManip: boolean = true;

  /** Forwarded to {@link GridLayoutGenerator} for the current call. */
  private _skipStack: boolean = false;

  /** Forwarded to {@link GridLayoutGenerator} for the current call. */
  private _skipResize: boolean = false;

  /** Quantity multiplier applied to each size's count. Defaults to `1`. */
  private _qtyMultiply: number = 1;

  /** Active size list for the current `generateLayoutDoc` call; pruned as ranges are merged. */
  private _apparelSizesChar: ApparelSize[];

  /** Maps each size character to its merged range label for filename generation. */
  private _trackRangeSizeChar: TrackRangeSizeChar = {} as TrackRangeSizeChar;

  /** Deep-copied working snapshot of `data` — reset at the start of each `generateLayoutDoc` call. */
  private _tempData: JFTGarmentPipelineParams["data"];

  /**
   * When `true`, size-range merges are applied even if `CONFIG.DIMENSION_RANGE`
   * is `false`.  Set by collar and rib stages that always need range grouping.
   */
  private _forceSizeRanges: boolean = false;

  /**
   * When `true`, forces `isPaired = true` inside `GridLayoutGenerator`
   * regardless of the item's auto-detected pairing state.  Used by the pant
   * stage which always needs paired front/back layout.
   */
  private _forcePair: boolean = false;

  /**
   * When set, provides an asymmetric secondary dimension to `GridLayoutGenerator`
   * for items whose two pieces have different dimensions (e.g. pant front vs back).
   */
  private _secondaryDimension: DimensionObject | null = null;

  /**
   * The `FlatSummary` key used to look up the quantity when `itemType` is not
   * itself a key of `FlatSummary` (e.g. rib markers).  Defaults to `"BODY"`.
   */
  private _qtyItemType: keyof FlatSummary = "BODY";

  // ─── Constructor ──────────────────────────────────────────────────────

  /**
   * Validates inputs and immediately runs the full five-stage pipeline.
   *
   * @param params - Resolved item cache and automate data.
   * @throws {Error} When `data.details` is empty — no sizes to process.
   * @throws {Error} When `jftItemsCache` is empty — no items found in the layer.
   */
  constructor(params: JFTGarmentPipelineParams) {
    // data.details must be a non-empty map — each key is an ApparelSize
    if (
      !params.data ||
      !params.data.details ||
      Utils.isEmptyObject(params.data.details)
    )
      throw new Error(
        "JFTGarmentPipeline: data.details is empty — no sizes to process.",
      );

    // jftItemsCache must contain at least one resolved item
    if (!params.jftItemsCache || Utils.isEmptyObject(params.jftItemsCache))
      throw new Error(
        "JFTGarmentPipeline: jftItemsCache is empty — no items found in layer.",
      );

    this.jftItemsCache = params.jftItemsCache;
    this.data = params.data;

    // Initialise the active size list from the data's detail keys
    this._apparelSizesChar = Object.keys(params.data.details) as ApparelSize[];

    // Create the first working copy of the data
    this._tempData = Utils.deepCopy(this.data);

    // Execute all pipeline stages
    this.run();
  }

  // ─── Private: state helpers ───────────────────────────────────────────

  /**
   * Resets all per-call override fields to their defaults.
   * Must be called at the end of every `generateLayoutDoc` execution to
   * prevent state from leaking into the next pipeline stage.
   */
  private _resetState(): void {
    this._overrideDim = null;
    this._tknManip = true;
    this._skipStack = false;
    this._skipResize = false;
    this._qtyMultiply = 1;
    this._forceSizeRanges = false;
    this._forcePair = false;
    this._secondaryDimension = null;
    this._qtyItemType = "BODY";
    this._trackRangeSizeChar = {} as TrackRangeSizeChar;
    this._apparelSizesChar = Object.keys(this.data.details) as ApparelSize[];
    this._tempData = Utils.deepCopy(this.data);
  }

  // ─── Private: Pipeline entry ──────────────────────────────────────────

  /**
   * Runs all active pipeline stages in the required order.
   * Each stage is responsible for one garment-part family.
   * Garbage collection is requested after all stages complete to reclaim
   * memory held by duplicated artwork and closed documents.
   */
  private run() {
    this.collarFlowHandle();

    this.ribFlowHandler();

    this.sleeveFlowHandle();

    this.bodyFlowHandle();

    this.pantFlowHandle();

    // Request garbage collection after the full pipeline completes — releases
    // memory from all duplicated artwork, temp groups, and closed documents
    if (typeof $ !== "undefined") {
      $.gc();
      $.gc();
    }
  }

  // ─── Public: Run summary ──────────────────────────────────────────────

  /**
   * Builds a human-readable run summary based on what the job actually needed.
   *
   * ### Missed items logic
   * Expected markers are derived from the input config (`basic`), not from all
   * possible markers.  Only markers that the job required are checked:
   * - POLO → COLLAR + PLACKET; TSHIRT → NECK
   * - BODY — always
   * - SHORT_SLEEVE / LONG_SLEEVE — when present in `basic.sleeve`
   * - SHORT_SLEEVE_RIB / LONG_SLEEVE_RIB — when `rib.type !== NO` and sleeve applies
   * - SHORT_PANT / LONG_PANT — when present in `basic.pant`
   *
   * @returns Multi-line summary string ready to pass to `alertDialogSA`.
   */
  buildSummary(): string {
    const basic = this.data.basic;
    const details = this.data.details;
    const cache = this.jftItemsCache;

    // ── 1. Determine which markers this job needed ────────────────────────
    const needed: string[] = [];

    // Body is always required
    needed.push("BODY");

    // Collar pieces depend on jersey type
    if (basic.type === JerseyType.POLO) {
      needed.push("COLLAR");
      needed.push("PLACKET");
    } else {
      needed.push("NECK");
    }

    // Sleeves
    const sleeve = basic.sleeve || [];
    for (let s = 0; s < sleeve.length; s++) {
      if (sleeve[s] === SleeveType.SHORT) needed.push("SHORT_SLEEVE");
      if (sleeve[s] === SleeveType.LONG) needed.push("LONG_SLEEVE");
    }

    // Ribs — only when rib type is active
    if (basic.rib && basic.rib.type !== RIBType.NO) {
      const ribApply = basic.rib.apply || sleeve;
      for (let r = 0; r < ribApply.length; r++) {
        if (ribApply[r] === SleeveType.SHORT) needed.push("SHORT_SLEEVE_RIB");
        if (ribApply[r] === SleeveType.LONG) needed.push("LONG_SLEEVE_RIB");
      }
    }

    // Pants
    const pant = basic.pant || [];
    for (let p = 0; p < pant.length; p++) {
      if (pant[p] === SleeveType.SHORT) needed.push("SHORT_PANT");
      if (pant[p] === SleeveType.LONG) needed.push("LONG_PANT");
    }

    // ── 2. Find which needed markers were absent from the layer ───────────
    const missed: string[] = [];
    for (let n = 0; n < needed.length; n++) {
      const key = needed[n] as keyof JFTItemCache;
      if (!cache[key]) missed.push(needed[n]);
    }

    // ── 3. Sum quantities across all active sizes ─────────────────────────
    const totals: FlatSummary = {
      BODY: 0,
      SHORT_SLEEVE: 0,
      LONG_SLEEVE: 0,
      SHORT_PANT: 0,
      LONG_PANT: 0,
    };

    const allSizes = Object.keys(details) as ApparelSize[];
    for (let s = 0; s < allSizes.length; s++) {
      const sm = details[allSizes[s]] && details[allSizes[s]].SUMMARY;
      if (!sm) continue;
      totals.BODY += sm.BODY || 0;
      totals.SHORT_SLEEVE += sm.SHORT_SLEEVE || 0;
      totals.LONG_SLEEVE += sm.LONG_SLEEVE || 0;
      totals.SHORT_PANT += sm.SHORT_PANT || 0;
      totals.LONG_PANT += sm.LONG_PANT || 0;
    }

    // ── 4. Assemble output ────────────────────────────────────────────────
    const HR = "=========================================";
    const SEP = "----";
    const lines: string[] = [];

    lines.push(HR);
    lines.push("  JFT" + SEP + "Rapid " + SEP + " Run Summary");
    lines.push(HR);
    lines.push("");

    // Missed items section
    if (missed.length > 0) {
      lines.push("  [!] MISSED ITEMS");
      lines.push("  " + SEP + " " + missed.join(", "));
    } else {
      lines.push("  [OK] All required markers found.");
    }

    lines.push("");
    lines.push("  PROCESSED QUANTITIES");
    lines.push("  " + SEP + SEP + SEP + SEP + SEP + SEP + SEP + SEP);

    // Body — always shown
    lines.push("  TOTAL BODY         " + SEP + " " + totals.BODY);

    // Sleeve rows — only what this job ordered
    for (let s = 0; s < sleeve.length; s++) {
      if (sleeve[s] === SleeveType.SHORT) {
        lines.push("  SHORT SLEEVE       " + SEP + " " + totals.SHORT_SLEEVE);
      }
      if (sleeve[s] === SleeveType.LONG) {
        lines.push("  LONG SLEEVE        " + SEP + " " + totals.LONG_SLEEVE);
      }
    }

    // Rib rows
    if (basic.rib && basic.rib.type !== RIBType.NO) {
      const ribApply = basic.rib.apply || sleeve;
      for (let r = 0; r < ribApply.length; r++) {
        if (ribApply[r] === SleeveType.SHORT) {
          lines.push("  SHORT SLEEVE RIB   " + SEP + " " + totals.SHORT_SLEEVE);
        }
        if (ribApply[r] === SleeveType.LONG) {
          lines.push("  LONG SLEEVE RIB    " + SEP + " " + totals.LONG_SLEEVE);
        }
      }
    }

    // Pant rows
    for (let p = 0; p < pant.length; p++) {
      if (pant[p] === SleeveType.SHORT) {
        lines.push("  SHORT PANT         " + SEP + " " + totals.SHORT_PANT);
      }
      if (pant[p] === SleeveType.LONG) {
        lines.push("  LONG PANT          " + SEP + " " + totals.LONG_PANT);
      }
    }

    lines.push("");
    lines.push("  Brand  : " + CONFIG.BRAND);
    lines.push("  Type   : " + basic.type);
    lines.push(
      "  Mode   : " + (CONFIG.STATIC_MODE ? "Static" : "Normal (NA/NO)"),
    );
    lines.push(HR);

    return lines.join("\n");
  }

  /**
   * Filters the current active size list to only those within `sizeRange`.
   *
   * @param sizeRange - Inclusive from/to size range.
   * @returns Filtered array of active sizes within the range.
   * @throws {Error} When `from` or `to` is not a recognised size.
   */
  private filterSizeRange(sizeRange: SizeRanges[0]): ApparelSize[] {
    const minValue = SIZE_ORDER_MAP[sizeRange!.from];
    const maxValue = SIZE_ORDER_MAP[sizeRange!.to];

    // Both boundary sizes must exist in the order map
    if (minValue === undefined || maxValue === undefined) {
      throw new Error("Invalid size range provided.");
    }

    // Return only sizes whose order value falls within [min, max]
    return this._apparelSizesChar.filter((size) => {
      const value = SIZE_ORDER_MAP[size];
      return value >= minValue && value <= maxValue;
    });
  }

  /**
   * Merges all sizes in a range into the largest size's detail entry.
   *
   * Smaller sizes are removed from `_apparelSizesChar` after merging so
   * they are not processed again. The target size's original DATA rows are
   * appended last so smaller-size players always appear first in the queue.
   * Routing fields (`SLEEVE`, `PANT`) are preserved — stripped later by
   * {@link filterAndStripData}.
   *
   * @param sizeRange - Inclusive `{ from, to }` range to merge.
   */
  private handleSizeRange(sizeRange: SizeRanges[0]) {
    // Collect only the active sizes that fall within this range
    const range = this.filterSizeRange(sizeRange);

    const { from, to } = sizeRange;

    // Build the combined range label used in output filenames e.g. "XS-S"
    const sizeChar = `${from}-${to}` as ApparelSizeRange;

    // The largest (last) size in the range is the merge target
    const details = this._tempData.details[sizeRange.to];

    // Snapshot the target's own DATA before clearing it — appended last
    // so smaller-size players precede the target size's players in the queue
    const targetSizeCharDetailsData = details.DATA;

    // Clear the target DATA so smaller sizes are prepended cleanly
    details.DATA = [];

    for (const size of range) {
      const sizeType = size as ApparelSize;

      if (sizeType === sizeRange.to) {
        // Record the range label for this target size — used in filenames
        this._trackRangeSizeChar[sizeType] = sizeChar;
        continue;
      }

      // Pull the smaller size's detail entry
      const nestDetails = this._tempData.details[sizeType];

      // Add every SUMMARY count from the smaller size into the target
      for (const key in details.SUMMARY) {
        const keyType = key as keyof FlatSummary;
        details.SUMMARY[keyType] =
          details.SUMMARY[keyType] + nestDetails.SUMMARY[keyType];
      }

      // Append this smaller size's DATA rows into the growing merged array
      details.DATA = Utils.deepCopy([...details.DATA, ...nestDetails.DATA]);

      // Remove the now-merged size from the active list to skip it later
      const idx = this._apparelSizesChar.indexOf(sizeType);
      this._apparelSizesChar.splice(idx, 1);
    }

    // Append the target size's own original rows last — preserves size order
    details.DATA = Utils.deepCopy([
      ...details.DATA,
      ...targetSizeCharDetailsData,
    ]);
  }

  // ─── Private: Layout dispatch ─────────────────────────────────────────

  /**
   * Core layout dispatcher. Resets working state, applies optional size-range
   * merges, then iterates over the sorted active sizes and calls
   * {@link GridLayoutGenerator} for each.
   *
   * When `jftItem.info.fixedSize && hasDync`:
   * - Stores the `"L"` dimension in `_overrideDim` (once; skips re-assign if already set).
   * - Bypasses `handleFixedSizeItem` and range rules.
   * - Each size in the loop uses `_overrideDim` as its dimension.
   *
   * State overrides (`_overrideDim`, `_tknManip`, `_skipStack`, `_skipResize`)
   * are cleared by {@link _resetState} at the end of every call.
   *
   * @param params - Item type, orientation, size ranges and quantity multiplier.
   */
  private generateLayoutDoc(params: GenerateLayoutDocParams) {
    const { itemType, orientation = "auto", sizeRanges = null } = params;

    // Retrieve the resolved item — bail early if not in the layer
    const jftItem = this.jftItemsCache[itemType];
    if (!jftItem) {
      this._resetState();
      return;
    }

    // ── Size-range merges (skipped when fixed-size override is active) ────
    if (sizeRanges && (CONFIG.DIMENSION_RANGE || this._forceSizeRanges)) {
      for (const range of sizeRanges) {
        this.handleSizeRange(range);
      }
    }

    // Nothing left to process after merges
    if (!this._apparelSizesChar.length) {
      this._resetState();
      return;
    }

    // Sort sizes in ascending order for consistent output file ordering
    const sortedSizes = Utils.sortSizes(this._apparelSizesChar);

    for (const size of sortedSizes) {
      const sizeChar = size as ApparelSize;
      const details = this._tempData.details[sizeChar];
      // Skip sizes with no body quantity
      if (!details.SUMMARY.BODY) continue;

      // Filter the flat DATA array to only the players that belong to this
      // garment-type pass, then strip the routing fields (SLEEVE / PANT) so
      // GridLayoutGenerator receives clean { NAME, NUMBER } objects only.
      const data: SizeMarkerEntries | null =
        details.DATA && details.DATA.length
          ? JFTGarmentPipeline.filterAndStripData(details.DATA, itemType)
          : null;

      // Use the merged range label when available, otherwise the raw size char
      let sizeTkn = this._trackRangeSizeChar[sizeChar]
        ? this._trackRangeSizeChar[sizeChar]
        : sizeChar;

      // Use _overrideDim when present (fixedSize+dyn path), else conf lookup
      const primaryDimension = this._overrideDim
        ? this._overrideDim
        : CONFIG.SIZES_DETAILS[sizeChar][itemType];

      const secondaryDimension = this._secondaryDimension;

      let qty = details["SUMMARY"][itemType as keyof FlatSummary];

      if (typeof qty === "undefined") {
        qty = details.SUMMARY[this._qtyItemType];
      }

      // Skip
      if (!qty) continue;

      // Delegate to GridLayoutGenerator for this size
      new GridLayoutGenerator({
        primaryDimension,
        secondaryDimension,
        data,
        distributeGap: CONFIG.DIST_ITEMS_GAP,
        sizeTkn,
        jftItem,
        orientation,
        forcePair: this._forcePair,
        quantity: qty * this._qtyMultiply,
        manipulateTkn: this._tknManip,
        skipStack: this._skipStack,
        skipResize: this._skipResize,
      });
    }

    // Clear per-call overrides after every execution
    this._resetState();
  }

  // ─── Private: Pipeline stages ────────────────────────────────────────

  /**
   * Stage 1 — Collar.
   * Routes to PLACKET + COLLAR for POLO jerseys, or to NECK for T-shirts.
   *
   * Size-token manipulation is disabled for all collar/neck/placket items —
   * they carry fixed labels that must not be overwritten.
   */
  private collarFlowHandle() {
    const sizeRanges: SizeRanges = [{ from: "XS", to: "16" }];

    if (this.data.basic.type === JerseyType.POLO) {
      // POLO requires a placket piece in addition to the collar

      // Placket — fixed label, no size-token update
      this._tknManip = false;
      this._forceSizeRanges = true;
      this.generateLayoutDoc({
        itemType: "PLACKET",
        sizeRanges,
        orientation: "vertical",
      });

      // Collar — fixed label, no size-token update
      this._tknManip = false;
      this._forceSizeRanges = true;
      this.generateLayoutDoc({ itemType: "COLLAR", sizeRanges });
    } else {
      // T-shirt uses a single neck piece in vertical orientation
      // Neck — fixed label, no size-token update
      this._tknManip = false;
      this.generateLayoutDoc({
        itemType: "NECK",
        orientation: "vertical",
        sizeRanges,
      });
    }
  }

  /**
   * Stage 2 — Rib.
   * Skipped when `rib.type === NO`. Handles one or both sleeve-rib types
   * depending on `rib.apply` length. CUFF type doubles the short-sleeve quantity.
   *
   * Size-token manipulation is disabled for rib items — they carry fixed labels.
   */
  private ribFlowHandler() {
    const ribInfo = this.data.basic.rib;
    const sizeRanges: SizeRanges = [{ from: "XS", to: "16" }];

    if (ribInfo.type !== RIBType.NO) {
      if (ribInfo.apply.length >= 2) {
        // Both short and long sleeve ribs are needed — disable tkn for each call
        this._tknManip = false;
        this._forceSizeRanges = true;
        this._qtyMultiply = ribInfo.type === RIBType.CUFF ? 2 : 1;
        this._qtyItemType = "SHORT_SLEEVE";
        this.generateLayoutDoc({
          itemType: "SHORT_SLEEVE_RIB",
          orientation: "vertical",
          sizeRanges,
        });

        this._tknManip = false;
        this._forceSizeRanges = true;
        this._qtyItemType = "LONG_SLEEVE";
        this.generateLayoutDoc({
          itemType: "LONG_SLEEVE_RIB",
          orientation: "vertical",
          sizeRanges,
        });
      } else {
        // Only one rib type is needed — derive the key from the apply array
        const enumKey: keyof Workflow = `${ribInfo.apply[0]}_SLEEVE_RIB`;
        this._qtyMultiply =
          enumKey === "SHORT_SLEEVE_RIB" && ribInfo.type === RIBType.CUFF
            ? 2
            : 1;

        // Disable tkn for rib
        this._tknManip = false;
        this._forceSizeRanges = true;
        this._qtyItemType = `${ribInfo.apply[0]}_SLEEVE`;
        this.generateLayoutDoc({
          itemType: enumKey,
          orientation: "vertical",
          sizeRanges,
        });
      }
    }
  }

  /**
   * Stage 3 — Sleeve.
   * Handles one or both sleeve types. Size ranges are always applied to
   * group adjacent sizes for more efficient paper usage.
   */
  /**
   * Stage 3 — Sleeve.
   * Handles one or both sleeve types. Size ranges are always applied to
   * group adjacent sizes for more efficient paper usage.
   *
   * When `CONFIG.FULL_SLV_TWEAK` is active, `CONFIG.FILL_X_AXIS` is
   * temporarily forced `true` for the long-sleeve call so
   * `GridLayoutGenerator` dispatches to the full-sleeve tweak path.
   * It is restored after the call so other stages are not affected.
   */
  private sleeveFlowHandle() {
    const slvInfo = this.data.basic.sleeve;

    // Standard size groupings for sleeve dimensions
    const slvRange: SizeRanges = [
      { from: "XS", to: "S" },
      { from: "M", to: "L" },
      { from: "XL", to: "2XL" },
      { from: "3XL", to: "5XL" },
      { from: "2", to: "4" },
      { from: "6", to: "8" },
      { from: "10", to: "12" },
      { from: "14", to: "16" },
    ];

    if (slvInfo.length >= 2) {
      // Both short and long sleeves are required
      this.generateLayoutDoc({
        itemType: "SHORT_SLEEVE",
        sizeRanges: slvRange,
      });

      // For long sleeve: if FULL_SLV_TWEAK is on, enable FILL_X_AXIS so
      // GridLayoutGenerator enters the full-sleeve tweak path automatically.
      // Save and restore so downstream stages are not affected.
      const prevFillXAxis = CONFIG.FILL_X_AXIS;
      if (CONFIG.LONG_SLV_TWEAK) {
        CONFIG.FILL_X_AXIS = true;
      }
      this.generateLayoutDoc({ itemType: "LONG_SLEEVE", sizeRanges: slvRange });
      CONFIG.FILL_X_AXIS = prevFillXAxis;
    } else {
      const enumKey: keyof Workflow = `${slvInfo[0]}_SLEEVE`;

      // Single sleeve type — apply full-sleeve tweak only when LONG_SLEEVE
      const isLong = slvInfo[0] === SleeveType.LONG;
      const prevFillXAxis = CONFIG.FILL_X_AXIS;
      if (CONFIG.LONG_SLV_TWEAK && isLong) {
        CONFIG.FILL_X_AXIS = true;
      }
      this.generateLayoutDoc({ itemType: enumKey, sizeRanges: slvRange });
      CONFIG.FILL_X_AXIS = prevFillXAxis;
    }
  }

  /**
   * Stage 4 — Body.
   * Always processed; no special routing required.
   */
  private bodyFlowHandle() {
    this.generateLayoutDoc({ itemType: "BODY" });
  }

  /**
   * Stage 5 — Pant.
   * Reserved for future implementation.
   */
  private pantFlowHandle() {
    const pantInfo = this.data.basic.pant;

    const sizeRanges: SizeRanges = [
      { from: "XS", to: "S" },
      { from: "M", to: "XL" },
      { from: "2XL", to: "5XL" },
      { from: "2", to: "10" },
      { from: "12", to: "16" },
    ];

    const sPantFront = CONFIG.SIZES_DETAILS["5XL"].SHORT_PANT_FRONT;
    const sPantBack = CONFIG.SIZES_DETAILS["5XL"].SHORT_PANT_BACK;

    const sPantHeight =
      sPantFront.height > sPantBack.height
        ? sPantFront.height
        : sPantBack.height;

    const sPantDimension: DimensionObject = {
      width: sPantBack.width,
      height: sPantHeight,
    };

    const lPantFront = CONFIG.SIZES_DETAILS["5XL"].LONG_PANT_FRONT;
    const lPantBack = CONFIG.SIZES_DETAILS["5XL"].LONG_PANT_BACK;

    const lPantHeight =
      lPantFront.height > lPantBack.height
        ? lPantFront.height
        : lPantBack.height;

    const lPantDimension: DimensionObject = {
      width: lPantBack.width,
      height: lPantHeight,
    };

    if (pantInfo.length >= 2) {
      // Both short and long pant are required
      this._forceSizeRanges = true;
      this._forcePair = true;
      this._skipResize = true;
      this._skipStack = true;
      this._overrideDim = sPantDimension;
      this.generateLayoutDoc({ itemType: "SHORT_PANT", sizeRanges });
      this._forceSizeRanges = true;
      this._forcePair = true;
      this._skipResize = true;
      this._overrideDim = lPantDimension;
      this._skipStack = true;
      this.generateLayoutDoc({ itemType: "LONG_PANT", sizeRanges });
    } else {
      this._forceSizeRanges = true;
      this._skipResize = true;
      this._skipStack = true;
      this._forcePair = true;
      this._overrideDim = sPantDimension;
      // Only one pant type — derive the key from the pant array
      const enumKey: keyof Workflow = `${pantInfo[0]}_PANT`;
      if (pantInfo[0] === SleeveType.LONG) {
        this._overrideDim = lPantDimension;
      }
      this.generateLayoutDoc({ itemType: enumKey, sizeRanges });
    }
  }

  // ─── Private: Data filtering ──────────────────────────────────────────

  /**
   * Filters the flat `DATA` array to only the players relevant for
   * `itemType`, then returns a new array with the routing fields
   * (`SLEEVE`, `PANT`) stripped so only `NAME`, `NUMBER`, and any other
   * artwork-frame keys remain.
   *
   * ### Filtering rules by item type
   * | `itemType`       | Keep rows where…                        |
   * |------------------|-----------------------------------------|
   * | `SHORT_SLEEVE`   | `SLEEVE === "SHORT"` (or no SLEEVE key) |
   * | `LONG_SLEEVE`    | `SLEEVE === "LONG"`  (or no SLEEVE key) |
   * | `SHORT_PANT`     | `PANT === "SHORT"`   (or no PANT key)   |
   * | `LONG_PANT`      | `PANT === "LONG"`    (or no PANT key)   |
   * | `BODY` / others  | all rows (no routing filter applied)    |
   *
   * When a row has no routing field for the requested type it is included —
   * this keeps backward-compatible payloads (no SLEEVE/PANT fields) working
   * as before.
   *
   * @param data     - Full flat DATA array for the current size.
   * @param itemType - Garment-part key being processed by the current stage.
   * @returns Filtered array with `SLEEVE` and `PANT` fields removed from every entry.
   */
  private static filterAndStripData(
    data: SizeMarkerEntries,
    itemType: keyof JFTItemCache,
  ): SizeMarkerEntries {
    const filtered: SizeMarkerEntries = [];

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      let include = true;

      // Apply routing filter based on the garment type being processed
      if (itemType === "SHORT_SLEEVE") {
        // Include rows that explicitly target SHORT, or have no SLEEVE key at all
        include = !entry.SLEEVE || entry.SLEEVE === SleeveType.SHORT;
      } else if (itemType === "LONG_SLEEVE") {
        // Include rows that explicitly target LONG, or have no SLEEVE key at all
        include = !entry.SLEEVE || entry.SLEEVE === SleeveType.LONG;
      } else if (itemType === "SHORT_PANT") {
        // Include rows that explicitly target SHORT pant, or have no PANT key
        include = !entry.PANT || entry.PANT === SleeveType.SHORT;
      } else if (itemType === "LONG_PANT") {
        // Include rows that explicitly target LONG pant, or have no PANT key
        include = !entry.PANT || entry.PANT === SleeveType.LONG;
      }
      // BODY, COLLAR, NECK, PLACKET, RIB — no routing filter; all rows pass

      if (!include) continue;

      // Strip the routing fields so GridLayoutGenerator only receives
      // NAME, NUMBER, and any other artwork-frame keys — never SLEEVE or PANT
      const clean: Record<string, string> = {};
      for (const key in entry) {
        if (key !== "SLEEVE" && key !== "PANT") {
          clean[key] = entry[key];
        }
      }

      filtered.push(clean as PlayerEntry);
    }

    return filtered;
  }
}
