/**
 * Scans the active Illustrator layer for garment-part PageItems, resolves
 * them into typed {@link JFTItem} descriptors, and returns a lookup cache
 * keyed by {@link PairObjectMarkers}.
 *
 * @remarks
 * Items are matched by name token pattern `_<MARKER>_`. At most two items
 * per marker are collected; locked items are always skipped. When only one
 * item is found it is auto-duplicated to form the required pair.
 */
class JFTItemResolver {
  /**
   * Iterates every value in {@link PairObjectMarkers}, resolves matching
   * PageItems from the active layer, and returns a populated cache.
   *
   * @returns Cache of resolved {@link JFTItem} objects keyed by marker name.
   * @throws {Error} When the active layer contains no PageItems.
   */
  static getItems() {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    // Abort early when the active layer contains no items at all
    if (!pageItems.length)
      throw new Error("Active layer is empty — no items to resolve.");

    // Collect all PairObjectMarkers enum values to iterate
    const values = Object.values(PairObjectMarkers);

    // Initialise empty cache — entries are added only when a match is found
    const jftItems: JFTItemCache = {} as JFTItemCache;

    for (const order of values) {
      // Attempt to resolve a JFTItem for this marker
      const jftItem = this.resolveItem(order, pageItems);

      if (jftItem) {
        // Store using the enum key (e.g. "BODY") rather than the raw value
        const key = jftItem.order as keyof typeof PairObjectMarkers;
        jftItems[key] = jftItem;
      }
    }

    return jftItems;
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
   * @throws {Error} When `marker` is an empty string.
   */
  private static resolveItem(
    marker: string,
    pageItems: PageItem[],
  ): JFTItem | null {
    // A blank marker would match every item name — reject it immediately
    if (!marker || !marker.trim())
      throw new Error("resolveItem: marker must be a non-empty string.");

    const collected: PageItem[] = [];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];
      // Skip locked items — they are excluded from all processing
      if (!item.locked && item.name.includes(`_${marker}_`)) {
        collected.push(item);
        // Cap at two — pairs consist of at most 2 items
        if (collected.length === 2) break;
      }
    }

    // No match found for this marker — return null so the caller can skip it
    if (!collected.length) return null;

    // Derive pairing metadata and per-item flags from the collected items
    const { items, countType, pair, dync, mixed } = this.itemInfo(collected);

    return {
      // Prefer the enum key name (e.g. "BODY") over the raw value
      order:
        Utils.getKeyFromEnumValue(
          PairObjectMarkers,
          marker as PairObjectMarkers,
        ) || marker,
      info: { countType, pair, dync, mixed },
      items,
    };
  }

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
   * @throws {Error} When `objects` is empty.
   * @throws {Error} When the first item has no name (tokens cannot be parsed).
   */
  private static itemInfo(objects: PageItem[]): ItemsInfo {
    // itemInfo must receive at least one resolved PageItem
    if (!objects || !objects.length)
      throw new Error("itemInfo: objects array must not be empty.");

    // First item must have a name so marker tokens can be parsed from it
    if (!objects[0].name)
      throw new Error(
        `itemInfo: first item has no name — marker tokens cannot be resolved.`,
      );
    const directionsArr = Object.keys(DirectionMarkers);

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

    if (obj1Direction === obj2Direction && !wasSingleItem) {
      const opposite = getOppositeDirection(obj1Direction);

      if (opposite && obj2Direction !== opposite) {
        obj2.name = obj1.name.replace(`_${obj1Direction}_`, `_${opposite}_`);

        obj2Direction = opposite;
      }
    }

    // ── 3. Dynamic flag — read before direction assignment ───────────────

    const isObj1Dyn = obj1.name.includes(`_${BasicMarkers.DYNAMIC}_`);

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
        obj1.name += `${DirectionMarkers.LEFT}_`;
        obj2.name += `${DirectionMarkers.RIGHT}_`;
        obj1Direction = DirectionMarkers.LEFT;
        obj2Direction = DirectionMarkers.RIGHT;
      }
    }

    // ── 5. Classification flags ──────────────────────────────────────────

    const isObj1Pair = obj1.name.includes(`_${BasicMarkers.PAIR}_`);
    const isObj1Skip = obj1.name.includes(`_${BasicMarkers.SKIP}_`);
    const isObj2Dyn = obj2.name.includes(`_${BasicMarkers.DYNAMIC}_`);
    const isObj2Pair = obj2.name.includes(`_${BasicMarkers.PAIR}_`);
    const isObj2Skip = obj2.name.includes(`_${BasicMarkers.SKIP}_`);

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

    const items: ItemInfoEntry[] = [
      {
        object: obj1,
        isDynamic: CONFIG.STATIC_MODE ? false : isObj1Dyn,
        isSkip: isObj1Skip,
        isFillRec:
          obj1.typename === PageItemType.PathItem &&
          Utils.isRectangleShape(obj1 as PathItem),
        direction: obj1Direction as keyof typeof DirectionMarkers | "",
      },
      {
        object: obj2,
        isDynamic: CONFIG.STATIC_MODE ? false : isObj2Dyn,
        isSkip: isObj2Skip,
        isFillRec:
          obj2.typename === PageItemType.PathItem &&
          Utils.isRectangleShape(obj2 as PathItem),
        direction: obj2Direction as keyof typeof DirectionMarkers | "",
      },
    ];

    if (
      obj1Direction === DirectionMarkers.BACK ||
      obj1Direction === DirectionMarkers.RIGHT
    ) {
      const first = items[0];
      const second = items[1];
      items[0] = second;
      items[1] = first;
    }

    return {
      pair: CONFIG.STATIC_MODE ? true : isPaired,
      countType: CONFIG.STATIC_MODE
        ? CountType.SET
        : isPaired
          ? CountType.SET
          : CountType.PCS,
      dync: CONFIG.STATIC_MODE ? false : isObj1Dyn || isObj2Dyn,
      mixed: CONFIG.STATIC_MODE ? false : isObj1Dyn !== isObj2Dyn,
      items,
    };
  }
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

/**
 * One entry in the per-item array built by `JFTItemResolver.itemInfo()`.
 * Carries both the raw `PageItem` reference and all classification flags
 * derived from the item's name at resolution time.
 */
interface ItemInfoEntry {
  /** The raw Illustrator `PageItem`. */
  object: PageItem;
  /**
   * `true` when the item name contains `_DYN_`.
   * Dynamic items receive player-data text injection during grid layout.
   */
  isDynamic: boolean;
  /**
   * `true` when the item is a plain axis-aligned filled rectangle.
   * These items are handled by the fill-rec strip path in `GridLayoutGenerator`.
   */
  isFillRec: boolean;
  /**
   * Direction marker found in the item name (`"FRONT"`, `"BACK"`, `"LEFT"`,
   * `"RIGHT"`) or `""` when none is present.
   */
  direction: keyof typeof DirectionMarkers | "";

  /**
   * `true` when the item name contains `_SKP_`.
   * Skip items are excluded from dynamic text injection but still placed in
   * the grid layout.
   */
  isSkip: boolean;
}

/**
 * Raw pairing metadata returned by `JFTItemResolver.itemInfo()` before it is
 * wrapped into a `JFTItem`.
 */
interface ItemsInfo {
  /** `true` when the two items form a paired set (front+back, left+right, etc.). */
  pair: boolean;
  /** Count label written into the output filename (`SET`, `PCS`, or `CMD`). */
  countType: CountType;
  /** One or two resolved `ItemInfoEntry` records (always exactly two after `itemInfo`). */
  items: ItemInfoEntry[];
  /** `true` when at least one of the two items carries the `_DYN_` marker. */
  dync: boolean;
  /** `true` when one item is dynamic and the other is static (mixed pair). */
  mixed: boolean;
}

/**
 * Complete resolved descriptor for one garment-part marker.
 * Passed directly to `GridLayoutGenerator` for layout generation.
 */
interface JFTItem {
  /** Enum key name of the matched `PairObjectMarkers` value (e.g. `"BODY"`). */
  order: string;
  /** Pairing and fixed-size metadata — excludes the `items` array. */
  info: Omit<ItemsInfo, "items">;
  /**
   * Exactly two `ItemInfoEntry` records after `itemInfo()` completes.
   * The second entry is always present (auto-duplicated when only one item
   * was found in the document).
   */
  items: ItemInfoEntry[];
}
