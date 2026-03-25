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

  private _fixedSizeChar: ApparelSize = "L";

  /** Quantity multiplier applied to each size's count. Defaults to `1`. */
  private _qtyMultiply: number = 1;

  /** Active size list for the current `generateLayoutDoc` call; pruned as ranges are merged. */
  private _apparelSizesChar: ApparelSize[];

  /** Maps each size character to its merged range label for filename generation. */
  private _trackRangeSizeChar: TrackRangeSizeChar = {} as TrackRangeSizeChar;

  /** Deep-copied working snapshot of `data` — reset at the start of each `generateLayoutDoc` call. */
  private _tempData: JFTGarmentPipelineParams["data"];

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
    this._fixedSizeChar = "L";
    this._qtyMultiply = 1;
    this._trackRangeSizeChar = {} as TrackRangeSizeChar;
    this._apparelSizesChar = Object.keys(this.data.details) as ApparelSize[];
    this._tempData = Utils.deepCopy(this.data);
  }

  // ─── Private: Pipeline entry ──────────────────────────────────────────

  /**
   * Runs all active pipeline stages in the required order.
   * Each stage is responsible for one garment-part family.
   */
  private run() {
    this.collarFlowHandle();
    this.ribFlowHandler();
    this.sleeveFlowHandle();
    this.bodyFlowHandle();
    this.pantFlowHandle();
  }

  // ─── Private: Size-range handling ────────────────────────────────────

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
   * Merges all sizes within a range into the largest size's detail entry
   * and removes the merged sizes from `apparelSizesChar`.
   *
   * @remarks
   * After merging, the largest size in the range carries the combined SUMMARY
   * counts and the concatenated DATA rows of all merged sizes. Smaller sizes
   * in the range are spliced out so they are not processed individually later.
   *
   * @param sizeRange - The size range to merge.
   */
  private handleSizeRange(sizeRange: SizeRanges[0]) {
    // Find all active sizes that fall within this range
    const range = this.filterSizeRange(sizeRange);

    const { from, to } = sizeRange;

    // Build the combined size-range label e.g. "XS-S"
    const sizeChar = `${from}-${to}` as ApparelSizeRange;

    // The largest size in the range acts as the merge target
    const details = this._tempData.details[sizeRange.to];

    for (const size of range) {
      const sizeType = size as ApparelSize;

      if (sizeType === sizeRange.to) {
        // Record the range label for the target size so filenames use it
        this._trackRangeSizeChar[sizeType] = sizeChar;
        continue;
      }

      // Retrieve the smaller size's detail entry
      const nestDetails = this._tempData.details[sizeType];

      // Accumulate SUMMARY counts into the target size's entry
      for (const key in details.SUMMARY) {
        const keyType = key as keyof FlatSummary;
        details.SUMMARY[keyType] =
          details.SUMMARY[keyType] + nestDetails.SUMMARY[keyType];
      }

      // Append this size's DATA rows to the target's DATA array
      details.DATA = Utils.deepCopy([...details.DATA, ...nestDetails.DATA]);

      // Remove the merged size from the active list
      const idx = this._apparelSizesChar.indexOf(sizeType);
      this._apparelSizesChar.splice(idx, 1);
    }
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

    // Check whether this item has dynamic injection on either side
    const hasDync = jftItem.items[0].isDynamic || jftItem.items[1].isDynamic;

    // ── Fixed-size routing ────────────────────────────────────────────────
    if (jftItem.info.fixedSize) {
      if (!this._overrideDim) {
        this._overrideDim = CONFIG.SIZES_DETAILS[this._fixedSizeChar][itemType];
      }
    }

    // ── Size-range merges (skipped when fixed-size override is active) ────
    if (!this._overrideDim && sizeRanges && CONFIG.DIMENSION_RANGE) {
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
      const data = details.DATA;

      // Use the merged range label when available, otherwise the raw size char
      let sizeTkn = this._trackRangeSizeChar[sizeChar]
        ? this._trackRangeSizeChar[sizeChar]
        : sizeChar;

      // Use _overrideDim when present (fixedSize+dyn path), else conf lookup
      const dimension = this._overrideDim
        ? this._overrideDim
        : CONFIG.SIZES_DETAILS[sizeChar][itemType];

      let qty = details["SUMMARY"][itemType as keyof FlatSummary];

      if (jftItem.info.fixedSize && !hasDync) {
        sizeTkn = "ALL";
        qty = this._tempData.basic.total;
      }

      // Delegate to GridLayoutGenerator for this size
      new GridLayoutGenerator({
        dimension,
        data,
        distributeGap: CONFIG.DIST_ITEMS_GAP,
        sizeTkn,
        jftItem,
        orientation,
        quantity: qty * this._qtyMultiply,
        manipulateTkn: this._tknManip,
        skipStack: this._skipStack,
        skipResize: this._skipResize,
      });

      if (jftItem.info.fixedSize && !hasDync) {
        break;
      }
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
    if (this.data.basic.type === JerseyType.POLO) {
      // POLO requires a placket piece in addition to the collar

      // Placket — fixed label, no size-token update
      this._tknManip = false;
      this.generateLayoutDoc({ itemType: "PLACKET" });

      // Collar — fixed label, no size-token update
      this._tknManip = false;
      this.generateLayoutDoc({ itemType: "COLLAR" });
    } else {
      // T-shirt uses a single neck piece in vertical orientation
      // Neck — fixed label, no size-token update
      this._tknManip = false;
      this.generateLayoutDoc({
        itemType: "NECK",
        orientation: "vertical",
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

    if (ribInfo.type !== RIBType.NO) {
      if (ribInfo.apply.length >= 2) {
        // Both short and long sleeve ribs are needed — disable tkn for each call
        this._tknManip = false;
        this._qtyMultiply = ribInfo.type === RIBType.CUFF ? 2 : 1;
        this.generateLayoutDoc({
          itemType: "SHORT_SLEEVE_RIB",
          orientation: "vertical",
        });

        this._tknManip = false;
        this.generateLayoutDoc({
          itemType: "LONG_SLEEVE_RIB",
          orientation: "vertical",
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
        this.generateLayoutDoc({
          itemType: enumKey,
          orientation: "vertical",
        });
      }
    }
  }

  /**
   * Stage 3 — Sleeve.
   * Handles one or both sleeve types. Size ranges are always applied to
   * group adjacent sizes for more efficient paper usage.
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
      this.generateLayoutDoc({ itemType: "LONG_SLEEVE", sizeRanges: slvRange });
    } else {
      // Only one sleeve type — derive the key from the sleeve array
      const enumKey: keyof Workflow = `${slvInfo[0]}_SLEEVE`;
      this.generateLayoutDoc({ itemType: enumKey });
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

    const sPantFront = CONFIG.SIZES_DETAILS["5XL"].SHORT_PANT_FRONT;
    const sPantBack = CONFIG.SIZES_DETAILS["5XL"].SHORT_PANT_BACK;

    const sPantHeight =
      sPantFront.height > sPantBack.height
        ? sPantFront.height
        : sPantBack.height;

    const sPantDimension: DimensionObject = {
      width: sPantFront.width + CONFIG.DIST_ITEMS_GAP + sPantBack.width,
      height: sPantHeight,
    };

    const lPantFront = CONFIG.SIZES_DETAILS["5XL"].LONG_PANT_FRONT;
    const lPantBack = CONFIG.SIZES_DETAILS["5XL"].LONG_PANT_BACK;

    const lPantHeight =
      lPantFront.height > lPantBack.height
        ? lPantFront.height
        : lPantBack.height;

    const lPantDimension: DimensionObject = {
      width: lPantFront.width + CONFIG.DIST_ITEMS_GAP + lPantBack.width,
      height: lPantHeight,
    };

    if (pantInfo.length >= 2) {
      // Both short and long pant are required
      this._skipResize = true;
      this._overrideDim = sPantDimension;
      this.generateLayoutDoc({ itemType: "SHORT_PANT" });
      this._skipResize = true;
      this._overrideDim = lPantDimension;
      this._skipStack = true;
      this.generateLayoutDoc({ itemType: "LONG_PANT" });
    } else {
      this._skipResize = true;
      this._overrideDim = sPantDimension;
      // Only one pant type — derive the key from the pant array
      const enumKey: keyof Workflow = `${pantInfo[0]}_PANT`;
      if (pantInfo[0] === SleeveType.LONG) {
        this._overrideDim = lPantDimension;
        this._skipStack = true;
      }
      this.generateLayoutDoc({ itemType: enumKey });
    }
  }
}
