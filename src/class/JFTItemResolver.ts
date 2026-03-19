// ─────────────────────────────────────────────────────────────────────────────
// JFTItemResolver.ts
//
// Responsibility:
//   All document-scanning and item-metadata logic that was previously embedded
//   inside JFTProcessSequentially.  Extracted here so the main orchestrator
//   stays lean and this logic can be tested or reused independently.
//
// Public surface:
//   - resolveItemCache()   — single DOM pass, builds the full JFTItemCache
//   - resolveItem()        — find up to 2 PageItems matching a marker string
//   - buildActiveSizes()   — filter AutomateData.details to non-empty sizes
//   - buildNeckMarkers()   — derive neck marker list from jerseyType
//   - buildRibMarkers()    — derive rib marker/sleeveType pairs
//   - buildSleeveMarkers() — derive sleeve marker/sleeveType pairs
//   - buildPantMarkers()   — derive pant marker/pantType pairs
//   - jftItem()            — public one-off lookup by order string
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles all document-scanning and item-metadata extraction for the JFT
 * automation pipeline.
 *
 * ### Single DOM scan guarantee
 * `resolveItemCache()` calls `Organizer.pageItemsToArray()` exactly **once**
 * per instance.  Every subsequent lookup in the garment pipeline reads from
 * the in-memory cache — no further DOM traversal occurs at stage-processing
 * time.
 *
 * ### Marker building
 * The four `build*Markers()` methods convert the flat arrays from
 * `AutomateData.basic` (jerseyType, sleeve, rib, pant) into typed lookup
 * structures.  Each method is called once during construction and the results
 * are passed back to `JFTProcessSequentially` as immutable config.
 */
class JFTItemResolver {
  // ─── Private state ────────────────────────────────────────────────────────

  /**
   * Reference back to the owning orchestrator's `details` map.
   * Used by `buildActiveSizes()` to inspect DATA / SUMMARY counts.
   */
  private readonly details: AutomateData["details"];

  // ─── Constructor ──────────────────────────────────────────────────────────

  /**
   * @param details - The `AutomateData.details` map from the resolved payload.
   */
  constructor(details: AutomateData["details"]) {
    this.details = details;
  }

  // ─── Public: Marker builders ──────────────────────────────────────────────

  /**
   * Derives the ordered neck-area marker list from `jerseyType`.
   *
   * - POLO   → `[PLACKET, COLLAR]` (in that order)
   * - TSHIRT → `[NECK]`
   *
   * Called once at construction time — the `if/else` branch never runs per
   * size during stage processing.
   *
   * @param jerseyType - The garment type from `AutomateData.basic.type`.
   * @returns Ordered array of `{ marker, itemType }` pairs for the neck stage.
   */
  buildNeckMarkers(jerseyType: AutomateData["basic"]["type"]): Array<{
    marker: PairObjectMarkers;
    itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  }> {
    if (jerseyType === JerseyType.POLO) {
      // POLO has two distinct neck-area parts processed in order
      return [
        {
          marker: PairObjectMarkers.PLACKET,
          itemType: JFTCONFKeywords.PLACKET,
        },
        { marker: PairObjectMarkers.COLLAR, itemType: JFTCONFKeywords.COLLAR },
      ];
    }
    // TSHIRT has a single neck piece
    return [{ marker: PairObjectMarkers.NECK, itemType: JFTCONFKeywords.NECK }];
  }

  /**
   * Derives rib marker/sleeveType pairs from `rib.apply`.
   *
   * Returns an empty array when `rib.type === RIBType.NO` — the RIB stage
   * is a complete no-op in that case.
   *
   * Each entry in `rib.apply` maps to a `<slvType>_SLV_RIB` key in
   * `PairObjectMarkers` (e.g. `SHORT` → `SHORT_SLV_RIB`).
   *
   * @param rib    - Rib configuration from `AutomateData.basic.rib`.
   * @param sleeve - Sleeve configuration (not used here, kept for symmetry).
   * @returns Array of `{ marker, sleeveType }` pairs for the rib stage.
   */
  buildRibMarkers(
    rib: AutomateData["basic"]["rib"],
    sleeve: AutomateData["basic"]["sleeve"],
  ): Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> {
    // When rib type is NO, skip entirely — no rib artwork exists
    if (rib.type === RIBType.NO) return [];

    const result: Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> =
      [];

    for (let i = 0; i < rib.apply.length; i++) {
      const slvType = rib.apply[i];
      // Construct the enum key dynamically: "SHORT" → "SHORT_SLV_RIB"
      const markerKey = `${slvType}_SLV_RIB` as keyof typeof PairObjectMarkers;
      result.push({
        marker: PairObjectMarkers[markerKey],
        sleeveType: slvType,
      });
    }

    return result;
  }

  /**
   * Derives sleeve marker/sleeveType pairs from `sleeve`.
   *
   * Each sleeve type maps to a `<slvType>_SLV` key in `PairObjectMarkers`
   * (e.g. `SHORT` → `SHORT_SLV`).
   *
   * @param sleeve - Array of active sleeve types from `AutomateData.basic.sleeve`.
   * @returns Array of `{ marker, sleeveType }` pairs for the sleeve stage.
   */
  buildSleeveMarkers(
    sleeve: AutomateData["basic"]["sleeve"],
  ): Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> {
    const result: Array<{ marker: PairObjectMarkers; sleeveType: SleeveType }> =
      [];

    for (let i = 0; i < sleeve.length; i++) {
      const slvType = sleeve[i];
      // Construct the enum key: "SHORT" → "SHORT_SLV"
      const markerKey = `${slvType}_SLV` as keyof typeof PairObjectMarkers;
      result.push({
        marker: PairObjectMarkers[markerKey],
        sleeveType: slvType,
      });
    }

    return result;
  }

  /**
   * Derives pant marker/pantType pairs from `pant`.
   *
   * Each pant type maps to a `<pantType>_PANT` key in `PairObjectMarkers`
   * (e.g. `SHORT` → `SHORT_PANT`).
   *
   * @param pant - Array of active pant types from `AutomateData.basic.pant`.
   * @returns Array of `{ marker, pantType }` pairs for the pant stage.
   */
  buildPantMarkers(
    pant: AutomateData["basic"]["pant"],
  ): Array<{ marker: PairObjectMarkers; pantType: SleeveType }> {
    const result: Array<{ marker: PairObjectMarkers; pantType: SleeveType }> =
      [];

    for (let i = 0; i < pant.length; i++) {
      const pantType = pant[i];
      // Construct the enum key: "SHORT" → "SHORT_PANT"
      const markerKey = `${pantType}_PANT` as keyof typeof PairObjectMarkers;
      result.push({ marker: PairObjectMarkers[markerKey], pantType });
    }

    return result;
  }

  // ─── Public: DOM resolution ───────────────────────────────────────────────

  /**
   * Performs a **single** `pageItemsToArray` call and resolves every marker
   * the pipeline will ever need into a flat `JFTItemCache` record.
   *
   * After this call, `cache[markerValue]` is either the resolved `JFTItem`
   * or `null` — no further document traversal is required during stage
   * processing.
   *
   * Duplicate markers in `markersToResolve` are silently skipped via the
   * `cache[marker] !== undefined` guard.
   *
   * @param neckMarkers   - Pre-built neck marker list.
   * @param ribMarkers    - Pre-built rib marker list.
   * @param sleeveMarkers - Pre-built sleeve marker list.
   * @param pantMarkers   - Pre-built pant marker list.
   * @returns Populated `JFTItemCache` keyed by `PairObjectMarkers` value.
   */
  resolveItemCache(
    neckMarkers: Array<{ marker: PairObjectMarkers }>,
    ribMarkers: Array<{ marker: PairObjectMarkers }>,
    sleeveMarkers: Array<{ marker: PairObjectMarkers }>,
    pantMarkers: Array<{ marker: PairObjectMarkers }>,
  ): JFTItemCache {
    const cache: JFTItemCache = {};

    // Collect every marker that will be needed across all stages
    const markersToResolve: PairObjectMarkers[] = [];

    for (let i = 0; i < neckMarkers.length; i++)
      markersToResolve.push(neckMarkers[i].marker);
    for (let i = 0; i < ribMarkers.length; i++)
      markersToResolve.push(ribMarkers[i].marker);
    for (let i = 0; i < sleeveMarkers.length; i++)
      markersToResolve.push(sleeveMarkers[i].marker);

    // BODY is always needed — present in every garment type
    markersToResolve.push(PairObjectMarkers.BODY);

    for (let i = 0; i < pantMarkers.length; i++)
      markersToResolve.push(pantMarkers[i].marker);

    // Single DOM scan — shared across all marker resolutions below
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    for (let i = 0; i < markersToResolve.length; i++) {
      const marker = markersToResolve[i];

      // Guard against duplicate markers (same marker in two lists)
      if (cache[marker] !== undefined) continue;

      cache[marker] = this.resolveItem(marker, pageItems);
    }

    return cache;
  }

  /**
   * Searches `pageItems` for up to **two** unlocked items whose name contains
   * `_<marker>_` and builds a `JFTItem` from the matches via `itemInfo()`.
   *
   * The scan stops as soon as two items are found — no unnecessary iteration.
   * Locked items are skipped regardless of their name.
   *
   * @param marker    - `PairObjectMarkers` value to search for (e.g. `"BODY"`).
   * @param pageItems - Pre-fetched flat array of all layer page items.
   * @returns Resolved `JFTItem`, or `null` when no matching item is found.
   */
  resolveItem(marker: string, pageItems: PageItem[]): JFTItem | null {
    const collected: PageItem[] = [];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      // Skip locked items — they are excluded from all processing
      if (!item.locked && ES6_SA.stringIncludes(item.name, `_${marker}_`)) {
        collected.push(item);
        // Cap at two — pairs consist of at most 2 items
        if (collected.length === 2) break;
      }
    }

    if (!collected.length) return null;

    const { items, countType, pair, fixedSize } = this.itemInfo(collected);

    return {
      // Prefer the enum key name (e.g. "BODY") over the raw value (e.g. "BODY")
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
   * Filters `details` to only the sizes that have **meaningful work** to do.
   *
   * A size is considered active when at least one of the following is true:
   * - `DATA.length > 0` — at least one player data row exists
   * - Any `SUMMARY.SLEEVE` count > 0
   * - Any `SUMMARY.PANT` count > 0
   *
   * Sizes that are entirely zero are excluded up-front so no stage method
   * ever receives an empty size and wastes a cache lookup.
   *
   * @param details - Full `AutomateData.details` map to filter.
   * @returns Ordered array of active `ApparelSize` values.
   */
  buildActiveSizes(details: AutomateData["details"]): ApparelSize[] {
    const active: ApparelSize[] = [];
    const allSizes = ES6_SA.objectKeys(details) as ApparelSize[];

    for (let i = 0; i < allSizes.length; i++) {
      const sizeChar = allSizes[i];
      const entry = details[sizeChar];

      // DATA rows present → definitely active
      if (entry.DATA.length > 0) {
        active.push(sizeChar);
        continue;
      }

      // Check SUMMARY counts — any non-zero value makes this size active
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

  // ─── Public: one-off lookup ───────────────────────────────────────────────

  /**
   * Performs a fresh DOM scan to resolve a single `order` marker.
   *
   * This is the **public** entry point for external callers (e.g. ad-hoc
   * testing or CEP panel lookups).  During pipeline execution all lookups go
   * through the pre-built cache returned by `resolveItemCache()` — this method
   * is not called per-size at runtime.
   *
   * @param order - A `PairObjectMarkers` value to search for.
   * @returns Resolved `JFTItem`, or `null` if not found.
   */
  lookupItem(order: string): JFTItem | null {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );
    return this.resolveItem(order, pageItems);
  }

  // ─── Private: Item metadata extraction ───────────────────────────────────

  /**
   * Derives full pairing metadata and per-item classification flags from one
   * or two raw `PageItem`s collected for the same marker.
   *
   * ### Pair rules
   * | Condition                                        | `pair`  | `countType` |
   * |--------------------------------------------------|---------|-------------|
   * | Single item (auto-duplicated)                    | `true`  | `SET`       |
   * | Both dynamic                                     | `true`  | `SET`       |
   * | Both static (any/no PAIR marker)                 | `true`  | `SET`       |
   * | Mixed dynamic + at least one `PAIR` marker       | `true`  | `SET`       |
   * | Mixed dynamic + **no** `PAIR` marker on either   | `false` | `PCS`       |
   *
   * When a single item is passed, it is auto-duplicated and an alert is shown
   * if the original is dynamic (duplicate would carry identical tokens).
   *
   * @param objects - 1 or 2 PageItems from the active layer.
   * @returns Fully populated `ItemsInfo` with exactly two `ItemInfoEntry` records.
   */
  private itemInfo(objects: PageItem[]): ItemsInfo {
    const strInc = ES6_SA.stringIncludes;
    const directionsArr = ES6_SA.objectKeys(DirectionMarkers);

    // ── Local helpers ────────────────────────────────────────────────────

    /** Returns the last `_DIR_` token found in `str`, or `""` if none. */
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

    /**
     * Returns the logical opposite direction for pairing, or `null` when
     * the direction has no known opposite.
     */
    function getOppositeDirection(dir: string): string | null {
      if (dir === DirectionMarkers.LEFT) return DirectionMarkers.RIGHT;
      if (dir === DirectionMarkers.RIGHT) return DirectionMarkers.LEFT;
      if (dir === DirectionMarkers.FRONT) return DirectionMarkers.BACK;
      if (dir === DirectionMarkers.BACK) return DirectionMarkers.FRONT;
      return null;
    }

    // ── 1. Ensure two objects exist ──────────────────────────────────────

    let obj1 = objects[0];
    let obj2 = objects[1];

    // When only one item is found, duplicate it to form the pair
    const wasSingleItem = !obj2;
    if (wasSingleItem) {
      obj2 = obj1.duplicate();
    }

    // ── 2. Detect direction markers ──────────────────────────────────────

    let obj1Direction = getLastMatch(obj1.name);
    let obj2Direction = getLastMatch(obj2.name);

    // ── 3. Dynamic flag — read before direction assignment ───────────────

    const isObj1Dyn = strInc(obj1.name, `_${BasicMarkers.DYNAMIC}_`);

    // Warn when a dynamic item is auto-duplicated — the copy carries the same
    // dynamic tokens which almost always produces unintended output
    if (wasSingleItem && isObj1Dyn) {
      alertDialogSA(`Dynamic object is being auto-duplicated`);
    }

    // ── 4. Assign opposite directions for auto-duplicated items ──────────

    if (wasSingleItem) {
      if (obj1Direction) {
        // Mirror the direction: LEFT → RIGHT, FRONT → BACK, etc.
        const opposite = getOppositeDirection(obj1Direction);
        if (opposite && obj2Direction !== opposite) {
          obj2.name = obj1.name.replace(`_${obj1Direction}_`, `_${opposite}_`);
          obj2Direction = opposite;
        }
      } else {
        // No direction found — assign LEFT/RIGHT defaults
        obj1.name += `_${DirectionMarkers.LEFT}_`;
        obj2.name += `_${DirectionMarkers.RIGHT}_`;
        obj1Direction = DirectionMarkers.LEFT;
        obj2Direction = DirectionMarkers.RIGHT;
      }
    }

    // ── 5. Classification flags ──────────────────────────────────────────

    const isObj1Pair = strInc(obj1.name, `_${BasicMarkers.PAIR}_`);
    const isObj1Fsz = strInc(obj1.name, `_${BasicMarkers.FIXED_SIZE}_`);
    const isObj2Dyn = strInc(obj2.name, `_${BasicMarkers.DYNAMIC}_`);
    const isObj2Pair = strInc(obj2.name, `_${BasicMarkers.PAIR}_`);
    const isObj2Fsz = strInc(obj2.name, `_${BasicMarkers.FIXED_SIZE}_`);

    // ── 6. Pair decision ─────────────────────────────────────────────────

    let isPaired: boolean;

    if (wasSingleItem) {
      // Single item always pairs with its duplicate
      isPaired = true;
    } else {
      const bothDynamic = isObj1Dyn && isObj2Dyn;
      const bothStatic = !isObj1Dyn && !isObj2Dyn;
      const anyPairMarker = isObj1Pair || isObj2Pair;
      // The only false case: mixed dynamic where neither item has PAIR marker
      isPaired = bothDynamic || bothStatic || anyPairMarker;
    }

    // ── 7. Build and return result ────────────────────────────────────────

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
