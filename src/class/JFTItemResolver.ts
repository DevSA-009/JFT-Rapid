class JFTItemResolver {
  static getItems() {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    const values = ES6_SA.objectValues(PairObjectMarkers);

    const jftItems: JFTItemCache = {} as JFTItemCache;

    for (const order of values) {
      const jftItem = this.resolveItem(order, pageItems);

      if (jftItem) {
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
   */
  private static resolveItem(
    marker: string,
    pageItems: PageItem[],
  ): JFTItem | null {
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
  private static itemInfo(objects: PageItem[]): ItemsInfo {
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

    // ── GLOBAL STATIC MODE OVERRIDE ─────────────────────────────

    if (CONFIG.STATIC_MODE) {
      return {
        pair: true,
        countType: CountType.SET,
        fixedSize: isObj1Fsz || isObj2Fsz,
        items: [
          {
            object: obj1,
            isDynamic: false,
            isFillRec:
              obj1.typename === PageItemType.PathItem &&
              Utils.isRectangleShape(obj1 as PathItem),
            direction: obj1Direction as keyof typeof DirectionMarkers | "",
          },
          {
            object: obj2,
            isDynamic: false,
            isFillRec:
              obj2.typename === PageItemType.PathItem &&
              Utils.isRectangleShape(obj2 as PathItem),
            direction: obj2Direction as keyof typeof DirectionMarkers | "",
          },
        ],
      };
    }

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
