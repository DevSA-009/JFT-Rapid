interface ItemInfoEntry {
  object: PageItem;
  isDynamic: boolean;
  isFillRec: boolean;
  direction: keyof typeof DirectionMarkers | "";
}

interface ItemsInfo {
  pair: boolean;
  countType: CountType;
  items: ItemInfoEntry[];
  fixedSize: boolean;
}

interface JFTItem {
  order: string;
  info: Omit<ItemsInfo, "items">;
  items: ItemInfoEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// JFTProcessSequentially.ts
// ─────────────────────────────────────────────────────────────────────────────

// ─── Local Types ─────────────────────────────────────────────────────────────

/**
 * Optional behavioural flags that alter how {@link JFTProcessSequentially}
 * runs the five-stage pipeline.
 */
interface JFTProcessSequentiallyOptions {
  /**
   * Controls the order in which sizes and stages are iterated.
   *
   * - `false` **(default)** — **Stage-first**: every size is processed for
   *   one stage before advancing to the next stage.
   *   ```
   *   NECK(s1…sN) → RIB(s1…sN) → SLEEVE(s1…sN) → BODY(s1…sN) → PANT(s1…sN)
   *   ```
   * - `true` — **Size-first**: every stage is processed for one size before
   *   advancing to the next size.
   *   ```
   *   s1(NECK→RIB→SLEEVE→BODY→PANT) → s2(…) → …
   *   ```
   */
  readonly perSizeMode?: boolean;
}

/** Parameters forwarded to every `process*Item` private method. */
interface ProcessItemParams {
  readonly jftItem: JFTItem;
  readonly itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  readonly sizeChar: ApparelSize;
}

/** {@link ProcessItemParams} extended with the sleeve variant. */
interface ProcessSleeveItemParams extends ProcessItemParams {
  readonly sleeveType: SleeveType;
}

/** {@link ProcessItemParams} extended with pant variant and face. */
interface ProcessPantItemParams extends ProcessItemParams {
  readonly pantType: SleeveType;
  readonly face: "FRONT" | "BACK";
}

/**
 * Pre-resolved cache entry for a single garment-part marker.
 * `null` means the item was not found in the document.
 */
type JFTItemCache = Record<string, JFTItem | null>;

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the complete five-stage JFT garment decoration workflow.
 *
 * ### Pipeline stages (strict order)
 * 1. **Neck**   — `PLACKET → COLLAR` (POLO) | `NCK` (TSHIRT)
 * 2. **Rib**    — `S_RIB` / `L_RIB`, skipped when `rib.type === NO`
 * 3. **Sleeve** — `S_SLV` / `L_SLV`
 * 4. **Body**   — `BODY`
 * 5. **Pant**   — `S_PANT` / `L_PANT`, FRONT then BACK
 *
 * ### Performance design
 * All `jftItem()` DOM lookups are performed **exactly once** during
 * construction and stored in `itemCache`.  Size loops read from the cache —
 * no document traversal occurs during stage processing.
 *
 * Pre-computed at construction time (never recomputed per size):
 * - `itemCache`          — resolved `JFTItem | null` per marker
 * - `activeSizes`        — only sizes with at least one data row or SUMMARY count > 0
 * - `neckMarkers`        — marker list derived from `jerseyType` (evaluated once)
 * - `ribMarkers`         — marker/sleeveType pairs derived from `rib.apply`
 * - `sleeveMarkers`      — marker/sleeveType pairs derived from `this.sleeve`
 * - `pantMarkers`        — marker/pantType pairs derived from `this.pant`
 *
 * ### Fixed-size guard
 * Items marked `fixedSize` are processed exactly once regardless of how many
 * sizes exist.  `fixedSizeProcessed` tracks which stage keys have already run.
 *
 * ### Quantity resolution
 * | Stage       | Source                            |
 * |-------------|-----------------------------------|
 * | Neck / Body | `fixedSize→totalQTY` else `DATA.length` |
 * | Sleeve/Rib  | `SUMMARY.SLEEVE[type]`            |
 * | Pant        | `SUMMARY.PANT[type]`              |
 *
 * @example
 * ```typescript
 * new JFTProcessSequentially(automateData);                      // stage-first
 * new JFTProcessSequentially(automateData, { perSizeMode:true }); // size-first
 * ```
 */
class JFTProcessSequentially {
  // ─── Immutable config ────────────────────────────────────────────────────

  private readonly jerseyType: AutomateData["basic"]["type"];
  private readonly rib: AutomateData["basic"]["rib"];
  private readonly totalQTY: AutomateData["basic"]["total"];
  private readonly details: AutomateData["details"];
  private readonly perSizeMode: boolean;

  // ─── Pre-computed at construction ────────────────────────────────────────

  /**
   * Only sizes that have at least one player in DATA or one non-zero SUMMARY
   * count.  Sizes with all-zero counts are excluded up-front so no stage
   * method ever receives an empty size and wastes a cache lookup.
   */
  private readonly activeSizes: ApparelSize[];

  /**
   * Single-pass DOM lookup results.  Keys are `PairObjectMarkers` values.
   * Populated once before `run()` — never written to again.
   */
  private readonly itemCache: JFTItemCache;

  /**
   * Neck-area markers to process, in order.
   * POLO → `[{marker:PLACKET, itemType:PLACKET}, {marker:COLLAR, itemType:COLLAR}]`
   * TSHIRT → `[{marker:NECK, itemType:NECK}]`
   * Evaluated once from `jerseyType` — the branch never runs per size.
   */
  private readonly neckMarkers: Array<{
    marker: PairObjectMarkers;
    itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  }>;

  /**
   * Rib marker/sleeveType pairs derived from `rib.apply`.
   * Empty when `rib.type === NO`.
   */
  private readonly ribMarkers: Array<{
    marker: PairObjectMarkers;
    sleeveType: SleeveType;
  }>;

  /**
   * Sleeve marker/sleeveType pairs derived from `this.sleeve`.
   */
  private readonly sleeveMarkers: Array<{
    marker: PairObjectMarkers;
    sleeveType: SleeveType;
  }>;

  /**
   * Pant marker/pantType pairs derived from `this.pant`.
   */
  private readonly pantMarkers: Array<{
    marker: PairObjectMarkers;
    pantType: SleeveType;
  }>;

  /**
   * Tracks which fixed-size stage keys have already been dispatched.
   * Keys are stage-specific strings (e.g. `"BODY"`, `"SLEEVE_SHORT"`).
   * Written to at most once per key — read on every subsequent size iteration.
   */
  private readonly fixedSizeProcessed: Record<string, boolean>;

  // ─── Constructor ─────────────────────────────────────────────────────────

  /**
   * Builds all pre-computed state and immediately runs the pipeline.
   *
   * @param data    - Full `AutomateData` payload.
   * @param options - Optional flags; all default to `false`.
   */
  constructor(data: AutomateData, options: JFTProcessSequentiallyOptions = {}) {
    this.jerseyType = data.basic.type;
    this.rib = data.basic.rib;
    this.totalQTY = data.basic.total;
    this.details = data.details;
    this.perSizeMode = options.perSizeMode === true;

    this.fixedSizeProcessed = {};

    // ── Pre-compute marker lists (jerseyType / sleeve / rib / pant) ───────
    this.neckMarkers = this.buildNeckMarkers(data.basic.type);
    this.ribMarkers = this.buildRibMarkers(data.basic.rib, data.basic.sleeve);
    this.sleeveMarkers = this.buildSleeveMarkers(data.basic.sleeve);
    this.pantMarkers = this.buildPantMarkers(data.basic.pant);

    // ── Single-pass DOM resolution — all markers resolved here, never again ─
    this.itemCache = this.resolveItemCache();

    // ── Filter sizes to active ones only ─────────────────────────────────
    this.activeSizes = this.buildActiveSizes(data.details);

    this.run();
  }

  // ─── Private: Construction helpers ───────────────────────────────────────

  /**
   * Builds the ordered neck-area marker list from `jerseyType`.
   * Called once in the constructor — the `if/else` branch never repeats.
   * @private
   */
  private buildNeckMarkers(jerseyType: AutomateData["basic"]["type"]) {
    if (jerseyType === JerseyType.POLO) {
      return [
        {
          marker: PairObjectMarkers.PLACKET,
          itemType: JFTCONFKeywords.PLACKET,
        },
        { marker: PairObjectMarkers.COLLAR, itemType: JFTCONFKeywords.COLLAR },
      ];
    }
    return [{ marker: PairObjectMarkers.NECK, itemType: JFTCONFKeywords.NECK }];
  }

  /**
   * Builds rib marker/sleeveType pairs from `rib.apply`.
   * Returns an empty array when `rib.type === NO` — the RIB stage is a no-op.
   * @private
   */
  private buildRibMarkers(
    rib: AutomateData["basic"]["rib"],
    sleeve: AutomateData["basic"]["sleeve"],
  ) {
    if (rib.type === RIBType.NO) return [];

    const result: Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> =
      [];

    for (let i = 0; i < rib.apply.length; i++) {
      const slvType = rib.apply[i];
      const markerKey = `${slvType}_SLV_RIB` as keyof typeof PairObjectMarkers;
      result.push({
        marker: PairObjectMarkers[markerKey],
        sleeveType: slvType,
      });
    }

    return result;
  }

  /**
   * Builds sleeve marker/sleeveType pairs from `this.sleeve`.
   * @private
   */
  private buildSleeveMarkers(sleeve: AutomateData["basic"]["sleeve"]) {
    const result: Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> =
      [];

    for (let i = 0; i < sleeve.length; i++) {
      const slvType = sleeve[i];
      const markerKey = `${slvType}_SLV` as keyof typeof PairObjectMarkers;
      result.push({
        marker: PairObjectMarkers[markerKey],
        sleeveType: slvType,
      });
    }

    return result;
  }

  /**
   * Builds pant marker/pantType pairs from `this.pant`.
   * @private
   */
  private buildPantMarkers(pant: AutomateData["basic"]["pant"]) {
    const result: Array<{ marker: PairObjectMarkers; pantType: SleeveType }> =
      [];

    for (let i = 0; i < pant.length; i++) {
      const pantType = pant[i];
      const markerKey = `${pantType}_PANT` as keyof typeof PairObjectMarkers;
      result.push({ marker: PairObjectMarkers[markerKey], pantType });
    }

    return result;
  }

  /**
   * Performs a **single** `pageItemsToArray` + filter pass for every marker
   * the pipeline will ever need, storing results in a flat `Record`.
   *
   * After this call `itemCache[marker]` is either the resolved `JFTItem` or
   * `null` — no further document traversal is required during stage processing.
   *
   * @private
   */
  private resolveItemCache(): JFTItemCache {
    const cache: JFTItemCache = {};

    // Collect all markers that will be needed
    const markersToResolve: PairObjectMarkers[] = [];

    for (let i = 0; i < this.neckMarkers.length; i++) {
      markersToResolve.push(this.neckMarkers[i].marker);
    }
    for (let i = 0; i < this.ribMarkers.length; i++) {
      markersToResolve.push(this.ribMarkers[i].marker);
    }
    for (let i = 0; i < this.sleeveMarkers.length; i++) {
      markersToResolve.push(this.sleeveMarkers[i].marker);
    }

    // BODY is always needed
    markersToResolve.push(PairObjectMarkers.BODY);

    for (let i = 0; i < this.pantMarkers.length; i++) {
      markersToResolve.push(this.pantMarkers[i].marker);
    }

    // One pageItemsToArray call — shared across all marker resolutions
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    for (let i = 0; i < markersToResolve.length; i++) {
      const marker = markersToResolve[i];

      // Skip duplicates (same marker registered twice — shouldn't happen but safe)
      if (cache[marker] !== undefined) continue;

      cache[marker] = this.resolveItem(marker, pageItems);
    }

    return cache;
  }

  /**
   * Resolves a single marker against an already-fetched `pageItems` array.
   * Used exclusively by {@link resolveItemCache} — never called during
   * stage processing.
   *
   * @param marker    - The `PairObjectMarkers` value to search for.
   * @param pageItems - Pre-fetched flat array of all layer page items.
   * @private
   */
  private resolveItem(marker: string, pageItems: PageItem[]): JFTItem | null {
    let collected: PageItem[] = [];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      if (!item.locked && ES6_SA.stringIncludes(item.name, `_${marker}_`)) {
        collected.push(item);
        if (collected.length === 2) break; // cap at two — no need to scan further
      }
    }

    if (!collected.length) return null;

    const { items, countType, pair, fixedSize } = this.itemInfo(collected);

    return {
      order:
        Utils.getKeyFromEnumValue(
          PairObjectMarkers,
          marker as PairObjectMarkers,
        ) || marker,
      info: { countType, pair, fixedSize },
      items,
    };
  }

  /**
   * Filters `details` to only the sizes that have meaningful work to do:
   * at least one DATA row **or** any non-zero SUMMARY count.
   *
   * Sizes with all-zero counts are excluded here so no stage method ever
   * receives an empty size, avoiding unnecessary cache reads and guard checks.
   *
   * @private
   */
  private buildActiveSizes(details: AutomateData["details"]): ApparelSize[] {
    const active: ApparelSize[] = [];
    const allSizes = ES6_SA.objectKeys(details) as ApparelSize[];

    for (let i = 0; i < allSizes.length; i++) {
      const sizeChar = allSizes[i];
      const entry = details[sizeChar];

      if (entry.DATA.length > 0) {
        active.push(sizeChar);
        continue;
      }

      // Check SUMMARY counts — any non-zero value means this size is active
      const slv = entry.SUMMARY.SLEEVE;
      const pnt = entry.SUMMARY.PANT;

      if (
        slv[SleeveType.SHORT] > 0 ||
        slv[SleeveType.LONG] > 0 ||
        pnt[SleeveType.SHORT] > 0 ||
        pnt[SleeveType.LONG] > 0
      ) {
        active.push(sizeChar);
      }
    }

    return active;
  }

  // ─── Private: Fixed-size guard ───────────────────────────────────────────

  /**
   * Returns `true` the **first** time it is called for a given `key`, then
   * `false` on every subsequent call.
   *
   * Used to ensure fixed-size stage units are dispatched exactly once even
   * when `activeSizes` contains many sizes.
   *
   * @param key - Unique stage identifier (e.g. `"BODY"`, `"SLEEVE_SHORT"`).
   * @private
   */
  private shouldRunFixedSize(key: string): boolean {
    if (this.fixedSizeProcessed[key]) return false;
    this.fixedSizeProcessed[key] = true;
    return true;
  }

  // ─── Private: Pipeline entry point ───────────────────────────────────────

  /** Dispatches to the correct run mode. @private */
  private run(): void {
    if (this.perSizeMode) {
      this.runSizeFirst();
    } else {
      this.runStageFirst();
    }
  }

  /**
   * **Stage-first** — all sizes for one stage, then advance to the next.
   * ```
   * NECK(s1…sN) → RIB(s1…sN) → SLEEVE(s1…sN) → BODY(s1…sN) → PANT(s1…sN)
   * ```
   * @private
   */
  private runStageFirst(): void {
    const sizes = this.activeSizes;
    const n = sizes.length;

    for (let i = 0; i < n; i++) {
      this.processNeck(sizes[i]);
    }
    for (let i = 0; i < n; i++) {
      this.processRib(sizes[i]);
    }
    for (let i = 0; i < n; i++) {
      this.processSleeve(sizes[i]);
    }
    for (let i = 0; i < n; i++) {
      this.processBody(sizes[i]);
    }
    for (let i = 0; i < n; i++) {
      this.processPant(sizes[i]);
    }
  }

  /**
   * **Size-first** — all stages for one size, then advance to the next.
   * ```
   * s1(NECK→RIB→SLEEVE→BODY→PANT) → s2(…) → …
   * ```
   * @private
   */
  private runSizeFirst(): void {
    const sizes = this.activeSizes;

    for (let i = 0; i < sizes.length; i++) {
      const sizeChar = sizes[i];
      this.processNeck(sizeChar);
      this.processRib(sizeChar);
      this.processSleeve(sizeChar);
      this.processBody(sizeChar);
      this.processPant(sizeChar);
    }
  }

  // ─── Private: Stage 1 — Neck ─────────────────────────────────────────────

  /**
   * Processes neck-area items for the given size using the pre-built
   * `neckMarkers` list — the `jerseyType` branch is never re-evaluated here.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processNeck(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.neckMarkers.length; i++) {
      const { marker, itemType } = this.neckMarkers[i];
      const jftItem = this.itemCache[marker];

      if (!jftItem) continue;

      this.processNeckItem({ jftItem, itemType, sizeChar });
    }
  }

  /**
   * Delegates a neck-area item to {@link GridLayoutGenerator}.
   *
   * **Fixed-size guard**: when `fixedSize` is `true`, dispatches only on the
   * first size encountered for this `itemType` key.
   *
   * @private
   */
  private processNeckItem(params: ProcessItemParams): void {
    const { jftItem, itemType, sizeChar } = params;
    const { fixedSize } = jftItem.info;

    if (fixedSize && !this.shouldRunFixedSize(itemType)) return;

    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].DATA.length;
    if (!quantity) return;

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
   * Processes rib items for the given size using the pre-built `ribMarkers`
   * list.  No-op when `ribMarkers` is empty (`rib.type === NO`).
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
   * Delegates a rib item to {@link GridLayoutGenerator}.
   *
   * **Dimension**: `SLEEVE[sleeveType].RIB`.
   * **Quantity**:  `SUMMARY.SLEEVE[sleeveType]`.
   *
   * @private
   */
  private processRibItem(params: ProcessSleeveItemParams): void {
    const { jftItem, sizeChar, sleeveType } = params;
    const { fixedSize } = jftItem.info;

    if (fixedSize && !this.shouldRunFixedSize(`RIB_${sleeveType}`)) return;

    const quantity = fixedSize
      ? this.totalQTY
      : this.details[sizeChar].SUMMARY.SLEEVE[sleeveType];
    if (!quantity) return;

    const finalSizeChar = fixedSize ? ("L" as ApparelSize) : sizeChar;
    const dimension =
      CONFIG.SIZES_DETAILS[finalSizeChar].SLEEVE[sleeveType].RIB;

    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: this.details[sizeChar].DATA,
    });
  }

  // ─── Private: Stage 3 — Sleeve ───────────────────────────────────────────

  /**
   * Processes sleeve SIZE items for the given size using the pre-built
   * `sleeveMarkers` list.
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
   * Delegates a sleeve SIZE item to {@link GridLayoutGenerator}.
   *
   * **Dimension**: `SLEEVE[sleeveType].SIZE`.
   * **Quantity**:  `SUMMARY.SLEEVE[sleeveType]`.
   *
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
   * Processes the main body item for the given size.
   *
   * **Dimension**: `BODY`.
   * **Quantity**:  `DATA.length`.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processBody(sizeChar: ApparelSize): void {
    const jftItem = this.itemCache[PairObjectMarkers.BODY];
    if (!jftItem) return;

    const { fixedSize } = jftItem.info;

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
   * Processes FRONT then BACK pant panels for the given size using the
   * pre-built `pantMarkers` list.  No-op when `pantMarkers` is empty.
   *
   * @param sizeChar - Active apparel size.
   * @private
   */
  private processPant(sizeChar: ApparelSize): void {
    for (let i = 0; i < this.pantMarkers.length; i++) {
      const { marker, pantType } = this.pantMarkers[i];
      const jftItem = this.itemCache[marker];

      if (!jftItem) continue;

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
   * Delegates a single pant panel to {@link GridLayoutGenerator}.
   *
   * **Dimension**: `PANT[pantType][face]`.
   * **Quantity**:  `SUMMARY.PANT[pantType]`.
   *
   * @private
   */
  private processPantItem(params: ProcessPantItemParams): void {
    const { jftItem, sizeChar, pantType, face } = params;
    const { fixedSize } = jftItem.info;

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

  // ─── Public: JFT item resolver ────────────────────────────────────────────

  /**
   * Searches the active document's active layer for PageItems whose name
   * contains `_<order>_`, excluding locked items.
   *
   * This method is **public** for external use (e.g. testing or one-off lookups).
   * During the pipeline all lookups go through `itemCache` — this method is not
   * called per-size at runtime.
   *
   * @param order - A `PairObjectMarkers` value to search for.
   * @returns Resolved `JFTItem` or `null`.
   * @public
   */
  public jftItem(order: string): JFTItem | null {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );
    return this.resolveItem(order, pageItems);
  }

  // ─── Private: Item metadata extraction ───────────────────────────────────

  /**
   * Derives pairing metadata and per-item flags from one or two raw PageItems.
   *
   * ### Pair rules
   * | Condition                                          | `pair`  | `countType` |
   * |----------------------------------------------------|---------|-------------|
   * | Single item (auto-duplicated)                      | `true`  | `SET`       |
   * | Both dynamic                                       | `true`  | `SET`       |
   * | Both static (any/no PAIR marker)                   | `true`  | `SET`       |
   * | Mixed dynamic + at least one `PAIR` marker         | `true`  | `SET`       |
   * | Mixed dynamic + **no** `PAIR` marker on either     | `false` | `PCS`       |
   *
   * Single dynamic items show an alert — the duplicate will carry identical
   * dynamic tokens, which is almost always unintended.
   *
   * @param objects - 1 or 2 PageItems from the active layer.
   * @returns Fully populated `ItemsInfo` with exactly two `ItemInfoEntry` records.
   * @private
   */
  private itemInfo(objects: PageItem[]): ItemsInfo {
    const strInc = ES6_SA.stringIncludes;
    const directionsArr = ES6_SA.objectKeys(DirectionMarkers);

    // ── Helpers ─────────────────────────────────────────────────────────

    function getLastMatch(str: string): string {
      let lastMatch = "";
      let lastIndex = -1;
      for (let d = 0; d < directionsArr.length; d++) {
        const dir = directionsArr[d];
        const idx = str.lastIndexOf(`_${dir}_`);
        if (idx > lastIndex) {
          lastIndex = idx;
          lastMatch = dir;
        }
      }
      return lastMatch;
    }

    function getOppositeDirection(dir: string): string | null {
      if (dir === DirectionMarkers.LEFT) return DirectionMarkers.RIGHT;
      if (dir === DirectionMarkers.RIGHT) return DirectionMarkers.LEFT;
      if (dir === DirectionMarkers.FRONT) return DirectionMarkers.BACK;
      if (dir === DirectionMarkers.BACK) return DirectionMarkers.FRONT;
      return null;
    }

    // ── 1. Prepare two objects ───────────────────────────────────────────

    let obj1 = objects[0];
    let obj2 = objects[1];

    const wasSingleItem = !obj2;
    if (wasSingleItem) {
      obj2 = obj1.duplicate();
    }

    // ── 2. Detect direction markers ──────────────────────────────────────

    let obj1Direction = getLastMatch(obj1.name);
    let obj2Direction = getLastMatch(obj2.name);

    // ── 3. Dynamic flag — needed before direction assignment ──────────────

    const isObj1Dyn = strInc(obj1.name, `_${BasicMarkers.DYNAMIC}_`);

    if (wasSingleItem && isObj1Dyn) {
      alertDialogSA(`Dynamic object is being auto-duplicated`);
    }

    // ── 4. Assign opposite directions when auto-duplicated ────────────────

    if (wasSingleItem) {
      if (obj1Direction) {
        const opposite = getOppositeDirection(obj1Direction);
        if (opposite && obj2Direction !== opposite) {
          obj2.name = obj1.name.replace(`_${obj1Direction}_`, `_${opposite}_`);
          obj2Direction = opposite;
        }
      } else {
        obj1.name += `_${DirectionMarkers.LEFT}_`;
        obj2.name += `_${DirectionMarkers.RIGHT}_`;
        obj1Direction = DirectionMarkers.LEFT;
        obj2Direction = DirectionMarkers.RIGHT;
      }
    }

    // ── 5. Classification flags ───────────────────────────────────────────

    const isObj1Pair = strInc(obj1.name, `_${BasicMarkers.PAIR}_`);
    const isObj1Fsz = strInc(obj1.name, `_${BasicMarkers.FIXED_SIZE}_`);
    const isObj2Dyn = strInc(obj2.name, `_${BasicMarkers.DYNAMIC}_`);
    const isObj2Pair = strInc(obj2.name, `_${BasicMarkers.PAIR}_`);
    const isObj2Fsz = strInc(obj2.name, `_${BasicMarkers.FIXED_SIZE}_`);

    // ── 6. Pair decision ─────────────────────────────────────────────────

    let isPaired: boolean;

    if (wasSingleItem) {
      // Single item always forms a pair with its duplicate
      isPaired = true;
    } else {
      const bothDynamic = isObj1Dyn && isObj2Dyn;
      const bothStatic = !isObj1Dyn && !isObj2Dyn;
      const anyPairMarker = isObj1Pair || isObj2Pair;
      // Only false: mixed dynamic with no PAIR marker on either item
      isPaired = bothDynamic || bothStatic || anyPairMarker;
    }

    // ── 7. Build result ───────────────────────────────────────────────────

    return {
      pair: isPaired,
      countType: isPaired ? CountType.SET : CountType.PCS,
      fixedSize: isObj1Fsz || isObj2Fsz,
      items: [
        {
          object: obj1,
          isDynamic: isObj1Dyn,
          isFillRec:
            obj1.typename === PageItemType.PathItem &&
            Utils.isRectangleShape(obj1 as PathItem),
          direction: obj1Direction as keyof typeof DirectionMarkers | "",
        },
        {
          object: obj2,
          isDynamic: isObj2Dyn,
          isFillRec:
            obj2.typename === PageItemType.PathItem &&
            Utils.isRectangleShape(obj2 as PathItem),
          direction: obj2Direction as keyof typeof DirectionMarkers | "",
        },
      ],
    };
  }
}
