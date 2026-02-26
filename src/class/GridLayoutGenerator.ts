interface GridLayoutGeneratorParams {
  sizeChar: ApparelSize;
  quantity: number;
  dimension: DimensionObject;
  jftItem: JFTItem;
}

class GridLayoutGenerator {
  private readonly sizeChar: GridLayoutGeneratorParams["sizeChar"];
  private quantity: GridLayoutGeneratorParams["quantity"];
  private countType: CountType;
  private readonly orientation = CONFIG.ORIENTATION;
  private readonly dimension: DimensionObject;
  private pair: boolean;
  private readonly gap = Utils.convertLength({
    value: CONFIG.ITEMS_GAP,
    from: "inch",
    to: "pt",
  });
  private readonly jftItem: JFTItem;
  private items: PageItem[];
  private recommendStackInfo: RecommendedStacksResult;
  private fileIndex = Math.abs(
    Organizer.getDirectoryFileInfo().nexFileIndex - 1,
  );

  constructor(params: GridLayoutGeneratorParams) {
    this.sizeChar = params.sizeChar;
    this.quantity = params.quantity;
    this.jftItem = params.jftItem;
    this.countType = this.jftItem.info.countType;
    this.pair = this.jftItem.info.pair;
    this.items = [
      this.jftItem.items[0].object,
      this.jftItem.items[1].object || null,
    ];
    this.dimension = params.dimension;
    this.recommendStackInfo = GridCalculator.getRecommendedStacks({
      gap: this.gap,
      maxColsInDoc: CONFIG.PER_DOC,
      quantity: this.quantity,
      size: this.dimension,
      pair: this.pair,
      pairGap: this.gap,
      heightPreference: "Less",
      stackOrientation: this.orientation,
    });

    this.cleanWhiteFillItem();

    if (!this.items.length) return;

    this.begin();
  }

  private cleanWhiteFillItem() {
    ES6_SA.arrayForEach(this.jftItem.items, (item, idx) => {
      if (
        item &&
        item.object.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item.object as PathItem)
      ) {
        this.items.splice(idx, 1);
        this.quantity = this.quantity / 2;
      }
    });
  }

  private countTypeRevalid() {
    const { mainStack } = this.recommendStackInfo;

    if (mainStack === "VRH") {
      this.countType = CountType.CMD;
    }
  }

  private createDocName() {
    const fileIndexWithPrefix =
      this.fileIndex < 10 ? `0${this.fileIndex}` : this.fileIndex.toString();

    const sizeChar = this.jftItem.info.fixedSize ? "" : this.sizeChar;

    let qty = this.quantity;

    if (!this.jftItem.info.pair) {
    }

    const name = `${fileIndexWithPrefix}-${this.jftItem.order}-${sizeChar}-`;
  }

  private createDoc() {
    const docName = "";
    const docHandler = new IllustratorDocument();
  }

  private begin() {
    this.countTypeRevalid();
    const item1 = this.jftItem.items[0];
    const item2 = this.jftItem.items[1] || null;
  }
}
