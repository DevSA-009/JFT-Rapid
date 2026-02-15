class ProcessOrderGenarator {
  private readonly jerseyType: ProcessOrderGenaratorParams["jerstyType"];
  private readonly rib: ProcessOrderGenaratorParams["rib"];
  private readonly sleeve: ProcessOrderGenaratorParams["sleeve"];
  private readonly pant: ProcessOrderGenaratorParams["pant"];
  private workflow: string[] = [];
  constructor(params: ProcessOrderGenaratorParams) {
    this.jerseyType = params.jerstyType;
    this.rib = params.rib;
    this.sleeve = params.sleeve;
    this.pant = params.pant;
    this.initOrder();
  }

  /**
   * initiate workflow order
   */
  private initOrder() {
    // push neck area items
    if (this.jerseyType === JerseyType.POLO) {
      this.workflow.push(SearchingKeywords.PLACKET, SearchingKeywords.COLLAR);
    } else {
      this.workflow.push(SearchingKeywords.NECK);
    }

    // push rib apply items
    if (this.rib.type !== RIBType.NO) {
      ES6_SA.arrayForEach(this.rib.apply, (slv) => {
        const key = `${slv}_SLV_RIB` as keyof typeof SearchingKeywords;
        this.workflow.push(SearchingKeywords[key]);
      });
    }

    // push sleeve items
    ES6_SA.arrayForEach(this.sleeve, (slv) => {
      const key = `${slv}_SLV` as keyof typeof SearchingKeywords;
      this.workflow.push(SearchingKeywords[key]);
    });

    // push body
    this.workflow.push(SearchingKeywords.BODY);

    // push sleeve items
    ES6_SA.arrayForEach(this.pant, (slv) => {
      const key = `${slv}_PANT` as keyof typeof SearchingKeywords;
      this.workflow.push(SearchingKeywords[key]);
    });
  }
}

interface ProcessOrderGenaratorParams {
  readonly jerstyType: keyof typeof JerseyType;
  sleeve: SleeveType[];
  rib: {
    readonly type: keyof typeof RIBType;
    readonly apply: SleeveType[];
  };
  pant: SleeveType[];
}
