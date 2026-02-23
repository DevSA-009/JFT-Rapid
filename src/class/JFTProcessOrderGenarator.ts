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
}

interface ItemsInfo {
  pair: boolean;
  countType: CountType;
  items: ItemInfoEntry[];
  fixedSize: boolean;
}

interface FindItems {
  order: string;
  info: Omit<ItemsInfo, "items">;
  items: ItemInfoEntry[];
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

  /** Ordered list of search keywords that define the processing sequence */
  private workflow: string[] = [];

  /**
   * Creates a new process order generator instance
   * @param params - Configuration object defining the garment specifications
   */
  constructor(params: JFTProcessOrderGeneratorParams) {
    this.jerseyType = params.type;
    this.rib = params.rib;
    this.sleeve = params.sleeve;
    this.pant = params.pant;
    this.totalQTY = params.total;

    this.initOrder();
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
  private initOrder(): void {
    // 1. Neck area items
    if (this.jerseyType === JerseyType.POLO) {
      this.workflow.push(PairObjectMarkers.PLACKET, PairObjectMarkers.COLLAR);
    } else {
      this.workflow.push(PairObjectMarkers.NECK);
    }

    // 2. Rib apply items (only if rib type is not "NO")
    if (this.rib.type !== RIBType.NO) {
      ES6_SA.arrayForEach(this.rib.apply, (slv) => {
        const key = `${slv}_SLV_RIB` as keyof typeof PairObjectMarkers;
        // Only add if the keyword actually exists in the enum
        if (key in PairObjectMarkers) {
          this.workflow.push(PairObjectMarkers[key]);
        }
      });
    }

    // 3. Sleeve items
    ES6_SA.arrayForEach(this.sleeve, (slv) => {
      const key = `${slv}_SLV` as keyof typeof PairObjectMarkers;
      if (key in PairObjectMarkers) {
        this.workflow.push(PairObjectMarkers[key]);
      }
    });

    // 4. Main body
    this.workflow.push(PairObjectMarkers.BODY);

    // 5. Pant items
    ES6_SA.arrayForEach(this.pant, (slv) => {
      const key = `${slv}_PANT` as keyof typeof PairObjectMarkers;
      if (key in PairObjectMarkers) {
        this.workflow.push(PairObjectMarkers[key]);
      }
    });
  }

  /**
   * find JFT items & info from active document & layer pageitems
   *
   * @returns {FindItems[]} array of items object that contain order type and items
   */
  public jftItems(): FindItems[] {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    const collected = ES6_SA.arrayMap(this.workflow, (order) => {
      let matches = ES6_SA.arrayFilter(pageItems, (item) => {
        return ES6_SA.stringIncludes(item.name, `_${order}_`) && !item.locked;
      });

      const count = matches.length;
      const maxAllowed = order === PairObjectMarkers.NECK ? 1 : 2;

      if (count > maxAllowed) {
        matches = matches.slice(0, maxAllowed);
      }

      const finalItems = !!count ? matches : null;

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
    });

    const cleanCollec = ES6_SA.arrayFilter(collected, (item) => !!item);

    return cleanCollec.length ? (cleanCollec as FindItems[]) : [];
  }

  /**
   * Extracts information from the given pair of PageItems.
   *
   * @param objects - An array of two PageItems. The first item is the object to process,
   *   and the second item is the object to pair it with (if applicable).
   * @returns An object containing information about the pair:
   *   - pair: A boolean indicating whether the items are a pair.
   *   - countType: An enumeration indicating the type of count to perform on the pair.
   *   - items: An array of objects containing the PageItem and a boolean indicating whether it is dynamic.
   */
  private itemInfo(objects: PageItem[]) {
    const strInc = ES6_SA.stringIncludes;

    const itemsInfo: ItemsInfo = {
      pair: false,
      countType: CountType.PCS,
      items: [],
      fixedSize: false,
    };

    const obj1 = objects[0];

    const isObj1Dyn = strInc(obj1.name, `_${BasicMarkers.DYNAMIC}_`);

    const isObj1Pair = strInc(obj1.name, `_${BasicMarkers.PAIR}_`);

    const isObj1Fsz = strInc(obj1.name, `_${BasicMarkers.FIXED_SIZE}_`);

    const obj2 = objects[1] || null;

    const isObj2Dyn = obj2
      ? strInc(obj2.name, `_${BasicMarkers.DYNAMIC}_`)
      : false;

    const isObj2Pair = obj2
      ? strInc(obj2.name, `_${BasicMarkers.PAIR}_`)
      : false;

    const isObj2Fsz = strInc(obj2.name, `_${BasicMarkers.FIXED_SIZE}_`);

    // detarmine if the items are a pair
    if ((isObj1Pair && obj2) || isObj2Pair || (isObj1Dyn && isObj2Dyn)) {
      itemsInfo.pair = true;
      itemsInfo.countType = CountType.SET;
    }

    // determine if the items are fixed size
    if (isObj1Fsz || isObj2Fsz) {
      itemsInfo.fixedSize = true;
    }

    const items1 = {
      object: obj1,
      isDynamic: isObj1Dyn,
      isFillRec: false,
    };

    if (obj1.typename === PageItemType.PathItem) {
      items1.isFillRec = Utils.isRectangleShape(obj1 as PathItem);
    }

    itemsInfo.items.push(items1);

    if (obj2) {
      const items2 = {
        object: obj2,
        isDynamic: isObj2Dyn,
        isFillRec: false,
      };

      if (obj2.typename === PageItemType.PathItem) {
        items2.isFillRec = Utils.isRectangleShape(obj2 as PathItem);
      }
      itemsInfo.items.push(items2);
    }

    return itemsInfo;
  }

  /**
   * Returns the generated processing workflow sequence
   */
  public getWorkflow(): readonly string[] {
    return this.workflow;
  }
}
