/**
 * Parameters required to generate a processing order for garment decoration workflow
 */
interface ProcessOrderGeneratorParams {
  /** Type of jersey (determines neck/collar/placket requirements) */
  readonly jerseyType: keyof typeof JerseyType;

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
}

/**
 * Generates ordered list of processing steps (search keywords) for garment production
 * based on jersey type, sleeve variations, rib configuration and pant types.
 *
 * Used to determine the sequence in which named items should be searched/processed
 * in an Adobe Illustrator document (typically for apparel decoration workflows).
 */
class ProcessOrderGenerator {
  private readonly jerseyType: ProcessOrderGeneratorParams["jerseyType"];
  private readonly rib: ProcessOrderGeneratorParams["rib"];
  private readonly sleeve: ProcessOrderGeneratorParams["sleeve"];
  private readonly pant: ProcessOrderGeneratorParams["pant"];

  /** Ordered list of search keywords that define the processing sequence */
  private workflow: string[] = [];

  /**
   * Creates a new process order generator instance
   * @param params - Configuration object defining the garment specifications
   */
  constructor(params: ProcessOrderGeneratorParams) {
    this.jerseyType = params.jerseyType;
    this.rib = params.rib;
    this.sleeve = params.sleeve;
    this.pant = params.pant;

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
      this.workflow.push(SearchingKeywords.PLACKET, SearchingKeywords.COLLAR);
    } else {
      this.workflow.push(SearchingKeywords.NECK);
    }

    // 2. Rib apply items (only if rib type is not "NO")
    if (this.rib.type !== RIBType.NO) {
      ES6_SA.arrayForEach(this.rib.apply, (slv) => {
        const key = `${slv}_SLV_RIB` as keyof typeof SearchingKeywords;
        // Only add if the keyword actually exists in the enum
        if (key in SearchingKeywords) {
          this.workflow.push(SearchingKeywords[key]);
        }
      });
    }

    // 3. Sleeve items
    ES6_SA.arrayForEach(this.sleeve, (slv) => {
      const key = `${slv}_SLV` as keyof typeof SearchingKeywords;
      if (key in SearchingKeywords) {
        this.workflow.push(SearchingKeywords[key]);
      }
    });

    // 4. Main body
    this.workflow.push(SearchingKeywords.BODY);

    // 5. Pant items
    ES6_SA.arrayForEach(this.pant, (slv) => {
      const key = `${slv}_PANT` as keyof typeof SearchingKeywords;
      if (key in SearchingKeywords) {
        this.workflow.push(SearchingKeywords[key]);
      }
    });
  }

  /**
   * Finds a named page item in the active layer of the active Illustrator document
   *
   * @param name - The exact name of the page item to find
   * @returns Object containing status and the found item (or undefined)
   */
  private findItem(name: string): {
    status: boolean;
    item: PageItem | undefined;
  } {
    const pageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    const item = ES6_SA.arrayFind(pageItems, (item) =>
      ES6_SA.stringIncludes(item.name, `_${name}_`),
    );

    return { status: !!item, item };
  }

  /**
   * (WIP) Iterates through the workflow sequence and gathers information
   * about each required item.
   *
   * Currently incomplete — intended to prepare or validate items
   * before actual processing.
   *
   * @private
   */
  private seqItemsInfo(): void {}

  /**
   * Returns the generated processing workflow sequence
   */
  public getWorkflow(): readonly string[] {
    return this.workflow;
  }
}
