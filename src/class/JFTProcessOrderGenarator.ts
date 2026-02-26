/**
 * Parameters required to generate a processing order for garment decoration workflow
 */
interface JFTProcessOrderGeneratorParams {
  /** Type of jersey (determines neck/collar/placket requirements) */
  readonly type: keyof typeof JerseyType;

  /** List of sleeve variations present in the design */
  readonly sleeve: SleeveType[];

  /** Rib configuration — type and on which sleeves it should be applied */
  readonly rib: {
    /** Type of rib (or "NO" if no rib is used) */
    readonly type: keyof typeof RIBType;
    /** Which sleeves should receive rib application */
    readonly apply: SleeveType[];
  };

  /** List of pant variations present in the design */
  readonly pant: SleeveType[];

  /** Total quantity  */
  readonly total: number;
}

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

interface ProcessItemParams {
  jftItem: JFTItem;
  itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  qty?: number;
  sizeChar: ApparelSize;
}

/**
 * Generates ordered list of processing steps (search keywords) for garment production
 * based on jersey type, sleeve variations, rib configuration and pant types.
 *
 * Used to determine the sequence in which named items should be searched/processed
 * in an Adobe Illustrator document (typically for apparel decoration workflows).
 */
class JFTProcessOrderGenerator {
  private readonly jerseyType: JFTProcessOrderGeneratorParams["type"];
  private readonly rib: JFTProcessOrderGeneratorParams["rib"];
  private readonly sleeve: JFTProcessOrderGeneratorParams["sleeve"];
  private readonly pant: JFTProcessOrderGeneratorParams["pant"];
  private readonly totalQTY: JFTProcessOrderGeneratorParams["total"];
  private readonly data: AutomateData["details"];

  /**
   * Creates a new process order generator instance
   * @param params - Configuration object defining the garment specifications
   */
  constructor(data: AutomateData) {
    this.jerseyType = data.basic.type;
    this.rib = data.basic.rib;
    this.sleeve = data.basic.sleeve;
    this.pant = data.basic.pant;
    this.totalQTY = data.basic.total;
    this.data = data.details;
  }

  /**
   * Initializes the processing workflow order based on garment configuration.
   * The sequence typically follows this logic:
   *
   * 1. Neck area (collar + placket for polo, or simple neck)
   * 2. Rib applications (if any)
   * 3. Sleeves
   * 4. Body
   * 5. Pants (if applicable)
   *
   * @private
   */
  private startAutomate(): void {
    for (const size in this.data) {
      const sizeChar = size as ApparelSize;

      // 1. Neck area items
      if (this.jerseyType === JerseyType.POLO) {
        const plkItem = this.jftItem(PairObjectMarkers.PLACKET);
        const clrItem = this.jftItem(PairObjectMarkers.COLLAR);

        if (plkItem) {
          this.processNeckAreaItem({
            jftItem: plkItem,
            itemType: JFTCONFKeywords.PLACKET,
            sizeChar,
          });
        }

        if (clrItem) {
          this.processNeckAreaItem({
            jftItem: clrItem,
            itemType: JFTCONFKeywords.COLLAR,
            sizeChar,
          });
        }
      } else {
        const nckItem = this.jftItem(PairObjectMarkers.NECK);
        if (nckItem) {
          this.processNeckAreaItem({
            jftItem: nckItem,
            itemType: JFTCONFKeywords.NECK,
            sizeChar,
          });
        }
      }

      // 2. Rib apply items (only if rib type is not "NO")
      if (this.rib.type !== RIBType.NO) {
        ES6_SA.arrayForEach(this.rib.apply, (slv) => {
          const key = `${slv}_SLV_RIB` as keyof typeof PairObjectMarkers;

          const ribItem = this.jftItem(key);

          if (ribItem) {
            // this.processSleeveItem({
            //   jftItem: ribItem,
            //   order: RIBType.RIB,
            // });
          }
        });
      }

      // 3. Sleeve items
      ES6_SA.arrayForEach(this.sleeve, (slv) => {
        const key = `${slv}_SLV` as keyof typeof PairObjectMarkers;

        const slvItem = this.jftItem(key);

        if (slvItem) {
          // this.processSleeveItem({
          //   jftItem: slvItem,
          //   itemType: JFTCONFKeywords.SLEEVE,
          // });
        }
      });

      // 4. Main body
      const bodyItem = this.jftItem(PairObjectMarkers.BODY);
      if (bodyItem) {
        // this.processNeckAreaItem({
        //   jftItem: bodyItem,
        //   itemType: JFTCONFKeywords.BODY,
        //   sizeChar
        // });
      }
    }
  }

  /**
   * find JFT items & info from active document & layer pageitems
   *
   * @returns {JFTItems[]} array of items object that contain order type and items
   */
  public jftItem(order: string): JFTItem | null {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    let collected = ES6_SA.arrayFilter(pageItems, (item) => {
      return ES6_SA.stringIncludes(item.name, `_${order}_`) && !item.locked;
    });

    const count = collected.length;
    const maxAllowed = order === PairObjectMarkers.NECK ? 1 : 2;

    if (count > maxAllowed) {
      collected = collected.slice(0, maxAllowed);
    }

    const finalItems = !!count ? collected : null;

    if (!finalItems) {
      return null;
    }

    const { items, countType, pair, fixedSize } = this.itemInfo(finalItems);

    return {
      order:
        Utils.getKeyFromEnumValue(
          PairObjectMarkers,
          order as PairObjectMarkers,
        ) || order,
      info: { countType, pair, fixedSize },
      items,
    };
  }

  /**
   * Extracts information from the given PageItem(s).
   * Always returns exactly two ItemInfoEntry objects (duplicates obj1 if only one was found).
   * Assigns/derives direction for each item (either from name or auto-assigned during mirroring).
   *
   * @param objects - Array of PageItem(s) — usually 1 or 2 items
   * @returns ItemsInfo object with pair info, count type, fixedSize flag, and exactly 2 items
   */
  private itemInfo(objects: PageItem[]): ItemsInfo {
    // ────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────

    // Shorthand for string includes check (used frequently)
    const strInc = ES6_SA.stringIncludes;

    // All possible direction markers (LEFT, RIGHT, FRONT, BACK)
    const directionsArr = ES6_SA.objectKeys(DirectionMarkers);

    // Returns the last (most specific) direction marker found in the name
    function getLastMatch(str: string): string {
      let lastMatch = "";
      let lastIndex = -1;

      for (const dir of directionsArr) {
        const index = str.lastIndexOf(`_${dir}_`);
        if (index > lastIndex) {
          lastIndex = index;
          lastMatch = dir;
        }
      }
      return lastMatch; // "" if no direction marker exists
    }

    // Returns the opposite direction or null if no logical opposite
    function getOppositeDirection(dir: string): string | null {
      if (dir === DirectionMarkers.LEFT) return DirectionMarkers.RIGHT;
      if (dir === DirectionMarkers.RIGHT) return DirectionMarkers.LEFT;
      if (dir === DirectionMarkers.FRONT) return DirectionMarkers.BACK;
      if (dir === DirectionMarkers.BACK) return DirectionMarkers.FRONT;
      return null;
    }

    // ────────────────────────────────────────────────
    // 1. Prepare the two objects (handle case of only one item found)
    // ────────────────────────────────────────────────
    let obj1 = objects[0]; // guaranteed to exist
    let obj2 = objects[1] || null; // may be missing

    const wasSingleItem = !obj2; // true → we will treat as mirrored pair
    if (wasSingleItem) {
      obj2 = obj1; // reference same object (common mirroring pattern)
    }

    // ────────────────────────────────────────────────
    // 2. Detect current directions from object names
    // ────────────────────────────────────────────────
    let obj1Direction = getLastMatch(obj1.name);
    let obj2Direction = getLastMatch(obj2.name);

    const hasDirection1 = !!obj1Direction;
    const hasDirection2 = !!obj2Direction;

    // ────────────────────────────────────────────────
    // 3. Warn only when dynamic object is being auto-mirrored
    // ────────────────────────────────────────────────
    const isObj1Dyn = strInc(obj1.name, `_${BasicMarkers.DYNAMIC}_`);

    if (isObj1Dyn && wasSingleItem) {
      alertDialogSA(`Dynamic object is being auto-duplicated`);
    }

    // ────────────────────────────────────────────────
    // 4. Auto-assign LEFT / RIGHT when single item + no direction present
    //    (most apparel symmetric parts without explicit side are left+right)
    // ────────────────────────────────────────────────
    if (wasSingleItem && !hasDirection1) {
      const baseName = obj1.name; // preserve original name without direction

      // WARNING: This modifies the actual PageItem.name in the document!
      obj1.name = baseName + `_${DirectionMarkers.LEFT}_`;
      obj2.name = baseName + `_${DirectionMarkers.RIGHT}_`;

      // Update local direction variables after renaming
      obj1Direction = DirectionMarkers.LEFT;
      obj2Direction = DirectionMarkers.RIGHT;
    }

    // Optional: auto-correct opposite direction if one side has it and the other doesn't
    // (currently disabled — uncomment if desired)

    if (hasDirection1 && !hasDirection2 && wasSingleItem) {
      const opposite = getOppositeDirection(obj1Direction);
      if (opposite) {
        obj2.name = obj1.name.replace(`_${obj1Direction}_`, `_${opposite}_`);
        obj2Direction = opposite;
      }
    }

    // ────────────────────────────────────────────────
    // 5. Collect all relevant classification flags
    // ────────────────────────────────────────────────
    const isObj1Pair = strInc(obj1.name, `_${BasicMarkers.PAIR}_`);
    const isObj1Fsz = strInc(obj1.name, `_${BasicMarkers.FIXED_SIZE}_`);

    const isObj2Dyn = strInc(obj2.name, `_${BasicMarkers.DYNAMIC}_`);
    const isObj2Pair = strInc(obj2.name, `_${BasicMarkers.PAIR}_`);
    const isObj2Fsz = strInc(obj2.name, `_${BasicMarkers.FIXED_SIZE}_`);

    // ────────────────────────────────────────────────
    // 6. Decide whether this is a paired/set item
    // ────────────────────────────────────────────────
    const itemsInfo: ItemsInfo = {
      pair: false,
      countType: CountType.PCS, // default: count individual pieces
      items: [],
      fixedSize: false,
    };

    // Activate pair/SET mode for these common cases
    if (
      isObj1Pair ||
      isObj2Pair || // explicit PAIR marker
      isObj1Dyn ||
      isObj2Dyn || // dynamic → usually mirrored
      obj1 !== obj2 || // originally two distinct objects
      wasSingleItem // we forced mirroring
    ) {
      itemsInfo.pair = true;
      itemsInfo.countType = CountType.SET; // count as matched left+right pair
    }

    // Fixed-size flag (affects quantity calculation later)
    if (isObj1Fsz || isObj2Fsz) {
      itemsInfo.fixedSize = true;
    }

    // ────────────────────────────────────────────────
    // 7. Build the items array — always exactly two entries
    //    Now includes the new 'direction' property
    // ────────────────────────────────────────────────
    const item1: ItemInfoEntry = {
      object: obj1,
      isDynamic: isObj1Dyn,
      isFillRec:
        obj1.typename === "PathItem" &&
        Utils.isRectangleShape(obj1 as PathItem),
      direction: obj1Direction as keyof typeof DirectionMarkers | "", // "" if no direction
    };
    itemsInfo.items.push(item1);

    const item2: ItemInfoEntry = {
      object: obj2,
      isDynamic: isObj2Dyn,
      isFillRec:
        obj2.typename === "PathItem" &&
        Utils.isRectangleShape(obj2 as PathItem),
      direction: obj2Direction as keyof typeof DirectionMarkers | "",
    };
    itemsInfo.items.push(item2);

    return itemsInfo;
  }

  private processNeckAreaItem(params: ProcessItemParams) {
    const { jftItem, itemType, sizeChar } = params;

    // const { height, width } = sizeInfo[order as keyof typeof sizeInfo];

    const { fixedSize } = jftItem.info;

    const qty =
      this.data[sizeChar].SUMMARY.SLEEVE.LONG +
      this.data[sizeChar].SUMMARY.SLEEVE.SHORT;

    const quantity = fixedSize ? this.totalQTY : qty;

    const finalSizeChar = fixedSize ? "L" : sizeChar;

    const sizeInfo = CONFIG.SIZES_DETAILS[finalSizeChar].NECK_AREA;
    const dimension = sizeInfo[itemType as keyof typeof sizeInfo];

    const gridLayoutGen = new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar: finalSizeChar,
      jftItem,
    });
  }
}
