// ─────────────────────────────────────────────────────────────────────────────
// JFTGarmentPipeline.ts
//
// Responsibility:
//   Executes the five-stage garment decoration pipeline after all pre-computation
//   has been done by JFTProcessSequentially's constructor.
//
//   Owns:
//     - Fixed-size guard  (shouldRunFixedSize)
//     - Run mode dispatch (run → runStageFirst | runSizeFirst)
//     - Stage 1 — Neck    (processNeck, processNeckItem)
//     - Stage 2 — Rib     (processRib,  processRibItem)
//     - Stage 3 — Sleeve  (processSleeve, processSleeveItem)
//     - Stage 4 — Body    (processBody)
//     - Stage 5 — Pant    (processPant, processPantItem)
//
//   Does NOT own:
//     - DOM scanning / item resolution  → JFTItemResolver
//     - Static-mode pass                → JFTStaticProcessor
//     - Constructor / orchestration     → JFTProcessSequentially
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constructor parameter bag ────────────────────────────────────────────────

/**
 * All pre-computed data that `JFTGarmentPipeline` needs to execute the five
 * stages.  Built once by `JFTProcessSequentially`'s constructor and passed
 * in here so the pipeline class itself is stateless with respect to DOM
 * operations.
 */
interface JFTGarmentPipelineParams {
  /** Rib configuration — type (NO / RIB / CUFF) and which sleeves it applies to. */
  readonly rib: AutomateData["basic"]["rib"];
  /** Sum of all per-size quantities — used as quantity for fixedSize items. */
  readonly totalQTY: AutomateData["basic"]["total"];
  /** Full per-size detail map — DATA rows and SUMMARY counts per size. */
  readonly details: AutomateData["details"];
  /** Whether to run size-first instead of the default stage-first order. */
  readonly perSizeMode: boolean;
  /** Pre-filtered list of sizes that have at least one DATA row or SUMMARY count. */
  readonly activeSizes: ApparelSize[];
  /** Pre-resolved DOM lookup table — `JFTItem | null` per `PairObjectMarkers` value. */
  readonly itemCache: JFTItemCache;
  /** Ordered neck markers derived from `jerseyType` — `[PLACKET, COLLAR]` or `[NECK]`. */
  readonly neckMarkers: Array<{
    marker: PairObjectMarkers;
    itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  }>;
  /** Rib marker/sleeveType pairs. Empty array when `rib.type === NO`. */
  readonly ribMarkers: Array<{
    marker: PairObjectMarkers;
    sleeveType: SleeveType;
  }>;
  /** Sleeve marker/sleeveType pairs derived from `basic.sleeve`. */
  readonly sleeveMarkers: Array<{
    marker: PairObjectMarkers;
    sleeveType: SleeveType;
  }>;
  /** Pant marker/pantType pairs derived from `basic.pant`. */
  readonly pantMarkers: Array<{
    marker: PairObjectMarkers;
    pantType: SleeveType;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes the five-stage JFT garment decoration pipeline.
 *
 * Instantiated and immediately invoked by `JFTProcessSequentially` when
 * `CONFIG.STATIC_MODE` is `false`.  All pre-computation (DOM scanning,
 * marker building, size filtering) is done before this class is created —
 * it receives the finished results as constructor parameters and runs.
 *
 * ### Pipeline stages (strict order)
 * ```
 * Stage 1 — Neck    PLACKET → COLLAR (POLO)  |  NCK (TSHIRT)
 * Stage 2 — Rib     S_RIB / L_RIB  (skipped when rib.type === NO)
 * Stage 3 — Sleeve  S_SLV / L_SLV
 * Stage 4 — Body    BODY
 * Stage 5 — Pant    S_PANT / L_PANT  (FRONT then BACK each)
 * ```
 *
 * ### Iteration order
 * Controlled by `perSizeMode`:
 * - `false` **(default — stage-first)**:
 *   ```
 *   NECK(s1…sN) → RIB(s1…sN) → SLEEVE(s1…sN) → BODY(s1…sN) → PANT(s1…sN)
 *   ```
 * - `true` **(size-first)**:
 *   ```
 *   s1(NECK→RIB→SLEEVE→BODY→PANT) → s2(…) → …
 *   ```
 *
 * ### Fixed-size guard
 * Items carrying `_FSZ_` in their name are dispatched **exactly once**
 * regardless of how many active sizes exist.  `fixedSizeProcessed` is a
 * mutable record written to once per key and checked on every subsequent call.
 *
 * ### Quantity resolution per stage
 * | Stage       | Source                                    |
 * |-------------|-------------------------------------------|
 * | Neck / Body | `fixedSize → totalQTY` else `DATA.length` |
 * | Sleeve      | `fixedSize → totalQTY` else `SUMMARY.SLEEVE[type]` |
 * | Rib         | sum `SUMMARY.SLEEVE[type]` across sizes (fixedSize) or per-size; × 2 when CUFF |
 * | Pant        | `fixedSize → totalQTY` else `SUMMARY.PANT[type]`  |
 */
class JFTGarmentPipeline {
  // ─── Immutable config (injected from JFTProcessSequentially) ─────────────
  private readonly rib: AutomateData["basic"]["rib"];
  private readonly totalQTY: AutomateData["basic"]["total"];
  private readonly details: AutomateData["details"];
  private readonly perSizeMode: boolean;
  private readonly activeSizes: ApparelSize[];
  private readonly itemCache: JFTItemCache;
  private readonly neckMarkers: JFTGarmentPipelineParams["neckMarkers"];
  private readonly ribMarkers: JFTGarmentPipelineParams["ribMarkers"];
  private readonly sleeveMarkers: JFTGarmentPipelineParams["sleeveMarkers"];
  private readonly pantMarkers: JFTGarmentPipelineParams["pantMarkers"];

  /**
   * Tracks which fixed-size stage keys have already been dispatched.
   * Keys are stage identifiers such as `"BODY"` or `"SLEEVE_SHORT"`.
   * Written to at most once per key — read on every subsequent size iteration.
   * Mutable because shouldRunFixedSize() must update it during execution.
   */
  private readonly fixedSizeProcessed: Record<string, boolean>;

  // ─── Constructor ──────────────────────────────────────────────────────────

  /**
   * Receives all pre-computed pipeline data and immediately calls `run()`.
   *
   * @param params - Pre-computed data bundle from `JFTProcessSequentially`.
   */
  constructor(params: JFTGarmentPipelineParams) {
    // Store all injected data as immutable fields
    this.rib = params.rib;
    this.totalQTY = params.totalQTY;
    this.details = params.details;
    this.perSizeMode = params.perSizeMode;
    this.activeSizes = params.activeSizes;
    this.itemCache = params.itemCache;
    this.neckMarkers = params.neckMarkers;
    this.ribMarkers = params.ribMarkers;
    this.sleeveMarkers = params.sleeveMarkers;
    this.pantMarkers = params.pantMarkers;

    // Mutable guard — starts empty, populated as fixedSize keys are dispatched
    this.fixedSizeProcessed = {};

    // Immediately execute the pipeline
    this.run();
  }

  // ─── Private: Fixed-size guard ────────────────────────────────────────────

  /**
   * Returns `true` the **first** time it is called for `key`, then `false`
   * on every subsequent call for the same key.
   *
   * Used to ensure `fixedSize` items are dispatched exactly once even when
   * `activeSizes` contains many sizes.
   *
   * @param key - Unique stage identifier (e.g. `"BODY"`, `"SLEEVE_SHORT"`).
   */
  private shouldRunFixedSize(key: string): boolean {
    // Already dispatched for this key — skip
    if (this.fixedSizeProcessed[key]) return false;
    // First time for this key — mark and allow
    this.fixedSizeProcessed[key] = true;
    return true;
  }

  // ─── Private: Pipeline entry point ───────────────────────────────────────

  /**
   * Dispatches to `runStageFirst` or `runSizeFirst` based on `perSizeMode`.
   * @private
   */
  private run(): void {
    if (this.perSizeMode) {
      this.runSizeFirst();
    } else {
      this.runStageFirst();
    }
  }

  /**
   * **Stage-first** iteration — all sizes processed for one stage before
   * advancing to the next stage.
   *
   * ```
   * NECK(s1…sN) → RIB(s1…sN) → SLEEVE(s1…sN) → BODY(s1…sN) → PANT(s1…sN)
   * ```
   * @private
   */
  private runStageFirst(): void {
    const sizes = this.activeSizes;
    const n = sizes.length;

    // Each loop iterates all sizes for one stage before moving on
    for (let i = 0; i < n; i++) this.processNeck(sizes[i]);
    for (let i = 0; i < n; i++) this.processRib(sizes[i]);
    for (let i = 0; i < n; i++) this.processSleeve(sizes[i]);
    for (let i = 0; i < n; i++) this.processBody(sizes[i]);
    for (let i = 0; i < n; i++) this.processPant(sizes[i]);
  }

  /**
   * **Size-first** iteration — all stages processed for one size before
   * advancing to the next size.
   *
   * ```
   * s1(NECK→RIB→SLEEVE→BODY→PANT) → s2(…) → …
   * ```
   * @private
   */
  private runSizeFirst(): void {
    const sizes = this.activeSizes;

    for (let i = 0; i < sizes.length; i++) {
      const sz = sizes[i];
      // All five stages run for this size before moving to the next
      this.processNeck(sz);
      this.processRib(sz);
      this.processSleeve(sz);
      this.processBody(sz);
      this.processPant(sz);
    }
  }

  // ─── Private: Stage 1 — Neck ─────────────────────────────────────────────

  /**
   * Iterates `neckMarkers` and dispatches each neck-area item for `sizeChar`.
   *
   * `neckMarkers` was derived from `jerseyType` once in the constructor of
   * `JFTProcessSequentially` — the POLO vs TSHIRT branch is never re-evaluated
   * here.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processNeck(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.neckMarkers.length; i++) {
      const { marker, itemType } = this.neckMarkers[i];
      const jftItem = this.itemCache[marker];
      // Item not found in document — skip silently
      if (!jftItem) continue;
      this.processNeckItem({ jftItem, itemType, sizeChar });
    }
  }

  /**
   * Dispatches one neck-area item to `GridLayoutGenerator`.
   *
   * **Dimension** : `CONFIG.SIZES_DETAILS[size].NECK_AREA[itemType]`
   * **Quantity**  : `fixedSize → totalQTY`  else  `DATA.length`
   *
   * @param params - `{ jftItem, itemType, sizeChar }`
   * @private
   */
  private processNeckItem(params: ProcessItemParams): void {
    const { jftItem, itemType, sizeChar } = params;
    const { fixedSize } = jftItem.info;

    // Fixed-size guard — dispatch only on the first size encountered for this key
    if (fixedSize && !this.shouldRunFixedSize(itemType)) return;

    // Quantity: fixed items use the total order qty; per-size items use DATA row count
    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].DATA.length;
    if (!quantity) return;

    // Fixed-size items always use "L" as the canonical size for dimension lookup
    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const sizeInfo = CONFIG.SIZES_DETAILS[finalSizeChar].NECK_AREA;
    const dimension = sizeInfo[itemType as keyof typeof sizeInfo];

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: this.details[sizeChar].DATA,
    });
  }

  // ─── Private: Stage 2 — Rib ──────────────────────────────────────────────

  /**
   * Iterates `ribMarkers` and dispatches each rib item for `sizeChar`.
   * No-op when `ribMarkers` is empty (i.e. `rib.type === RIBType.NO`).
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processRib(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.ribMarkers.length; i++) {
      const { marker, sleeveType } = this.ribMarkers[i];
      const jftItem = this.itemCache[marker];
      if (!jftItem) continue;
      this.processRibItem({
        jftItem,
        itemType: JFTCONFKeywords.SLEEVE,
        sizeChar,
        sleeveType,
      });
    }
  }

  /**
   * Dispatches one rib item to `GridLayoutGenerator`.
   *
   * **Dimension** : `CONFIG.SIZES_DETAILS[size].SLEEVE[sleeveType].RIB`
   *
   * **Quantity**:
   * - `fixedSize = true` → sum `SUMMARY.SLEEVE[sleeveType]` across **all** active
   *   sizes (not `totalQTY` which counts garments, not sleeves).
   *   Multiplied by 2 when `rib.type === CUFF` (both cuff ends per sleeve).
   * - `fixedSize = false` → `SUMMARY.SLEEVE[sleeveType]` for this size only,
   *   also multiplied by 2 when CUFF.
   *
   * @param params - `{ jftItem, itemType, sizeChar, sleeveType }`
   * @private
   */
  private processRibItem(params: ProcessSleeveItemParams): void {
    const { jftItem, sizeChar, sleeveType } = params;
    const { fixedSize } = jftItem.info;

    if (fixedSize && !this.shouldRunFixedSize(`RIB_${sleeveType}`)) return;

    let quantity: number;

    if (fixedSize) {
      // Accumulate sleeve count across all active sizes
      let sleeveTotal = 0;
      for (let i = 0; i < this.activeSizes.length; i++) {
        sleeveTotal +=
          this.details[this.activeSizes[i]].SUMMARY.SLEEVE[sleeveType];
      }
      // CUFF rib covers both ends of each sleeve — multiply by 2
      quantity = this.rib.type === RIBType.CUFF ? sleeveTotal * 2 : sleeveTotal;
    } else {
      const baseQty = this.details[sizeChar].SUMMARY.SLEEVE[sleeveType];
      quantity = this.rib.type === RIBType.CUFF ? baseQty * 2 : baseQty;
    }

    if (!quantity) return;

    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const dimension =
      CONFIG.SIZES_DETAILS[finalSizeChar].SLEEVE[sleeveType].RIB;

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      // Rib is always laid out vertically — orientation is not configurable
      orientation: "vertical",
      data: this.details[sizeChar].DATA,
    });
  }

  // ─── Private: Stage 3 — Sleeve ───────────────────────────────────────────

  /**
   * Iterates `sleeveMarkers` and dispatches each sleeve item for `sizeChar`.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processSleeve(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.sleeveMarkers.length; i++) {
      const { marker, sleeveType } = this.sleeveMarkers[i];
      const jftItem = this.itemCache[marker];
      if (!jftItem) continue;
      this.processSleeveItem({
        jftItem,
        itemType: JFTCONFKeywords.SLEEVE,
        sizeChar,
        sleeveType,
      });
    }
  }

  /**
   * Dispatches one sleeve item to `GridLayoutGenerator`.
   *
   * **Dimension** : `CONFIG.SIZES_DETAILS[size].SLEEVE[sleeveType].SIZE`
   * **Quantity**  : `fixedSize → totalQTY`  else  `SUMMARY.SLEEVE[sleeveType]`
   *
   * @param params - `{ jftItem, itemType, sizeChar, sleeveType }`
   * @private
   */
  private processSleeveItem(params: ProcessSleeveItemParams): void {
    const { jftItem, sizeChar, sleeveType } = params;
    const { fixedSize } = jftItem.info;

    if (fixedSize && !this.shouldRunFixedSize(`SLEEVE_${sleeveType}`)) return;

    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].SUMMARY.SLEEVE[sleeveType];
    if (!quantity) return;

    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const dimension =
      CONFIG.SIZES_DETAILS[finalSizeChar].SLEEVE[sleeveType].SIZE;

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: this.details[sizeChar].DATA,
    });
  }

  // ─── Private: Stage 4 — Body ─────────────────────────────────────────────

  /**
   * Processes the main body item for `sizeChar`.
   *
   * **Dimension** : `CONFIG.SIZES_DETAILS[size].BODY`
   * **Quantity**  : `fixedSize → totalQTY`  else  `DATA.length`
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processBody(sizeChar: ApparelSize): void {
    const jftItem = this.itemCache[PairObjectMarkers.BODY];
    if (!jftItem) return;

    const { fixedSize } = jftItem.info;

    // Fixed-size guard — BODY runs at most once across all sizes
    if (fixedSize && !this.shouldRunFixedSize("BODY")) return;

    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].DATA.length;
    if (!quantity) return;

    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const dimension = CONFIG.SIZES_DETAILS[finalSizeChar].BODY;

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: this.details[sizeChar].DATA,
    });
  }

  // ─── Private: Stage 5 — Pant ─────────────────────────────────────────────

  /**
   * Iterates `pantMarkers` and dispatches FRONT then BACK panels for `sizeChar`.
   * No-op when `pantMarkers` is empty.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processPant(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.pantMarkers.length; i++) {
      const { marker, pantType } = this.pantMarkers[i];
      const jftItem = this.itemCache[marker];
      if (!jftItem) continue;

      // Every pant marker generates two files — FRONT then BACK
      this.processPantItem({
        jftItem,
        itemType: JFTCONFKeywords.BODY,
        sizeChar,
        pantType,
        face: "FRONT",
      });
      this.processPantItem({
        jftItem,
        itemType: JFTCONFKeywords.BODY,
        sizeChar,
        pantType,
        face: "BACK",
      });
    }
  }

  /**
   * Dispatches one pant panel (FRONT or BACK) to `GridLayoutGenerator`.
   *
   * **Dimension** : `CONFIG.SIZES_DETAILS[size].PANT[pantType][face]`
   * **Quantity**  : `fixedSize → totalQTY`  else  `SUMMARY.PANT[pantType]`
   *
   * @param params - `{ jftItem, itemType, sizeChar, pantType, face }`
   * @private
   */
  private processPantItem(params: ProcessPantItemParams): void {
    const { jftItem, sizeChar, pantType, face } = params;
    const { fixedSize } = jftItem.info;

    // Fixed-size guard — keyed by both pantType and face (FRONT/BACK are separate)
    if (fixedSize && !this.shouldRunFixedSize(`PANT_${pantType}_${face}`))
      return;

    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].SUMMARY.PANT[pantType];
    if (!quantity) return;

    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const dimension = CONFIG.SIZES_DETAILS[finalSizeChar].PANT[pantType][face];

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: this.details[sizeChar].DATA,
    });
  }
}
