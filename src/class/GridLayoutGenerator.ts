interface GridLayoutGeneratorParams {
  sizeChar: ApparelSize;
  quantity: number;
  dimension: DimensionObject;
  jftItem: JFTItem;
}

type ProcessDocAndLayout = Record<"rows" | "cols", number> & {
  reqDocs: RequiredDocReturn;
};

type CreateGrid = Omit<ProcessDocAndLayout, "reqDocs"> & {
  maxCol: number;
  doc: Document;
  item: PageItem;
};

class GridLayoutGenerator {
  private readonly sizeChar: GridLayoutGeneratorParams["sizeChar"];
  private quantity: GridLayoutGeneratorParams["quantity"];
  private countType: CountType;
  private readonly orientation = CONFIG.ORIENTATION;
  private readonly dimension: DimensionObject;
  private pair: boolean;
  private readonly gap = CONFIG.ITEMS_GAP;
  private readonly jftItem: JFTItem;
  private items: PageItem[];
  private recommendStackInfo: RecommendedStacksResult | null = null;
  private fileIndex = Math.abs(
    Organizer.getDirectoryFileInfo().nexFileIndex - 1,
  );
  private initiatedItem: GroupItem | null = null;
  private singleItem = false;
  private readonly folderPath = app.activeDocument.path.fsName;

  constructor(params: GridLayoutGeneratorParams) {
    this.sizeChar = params.sizeChar;
    this.quantity = params.quantity;
    this.jftItem = params.jftItem;
    this.countType = this.jftItem.info.countType;
    this.pair = this.jftItem.info.pair;
    this.items = [
      this.jftItem.items[0].object.duplicate(),
      this.jftItem.items[1].object.duplicate() || null,
    ];
    this.dimension = params.dimension;

    this.cleanWhiteFillItem();

    if (!this.items.length) return;

    if (this.items.length === 1) {
      this.singleItem = true;
    }

    this.specialValidation();

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

    /*
    if (this.quantity < 3 && this.items.length > 1 && this.recommendStackInfo.mainFitRow > 1) {
      this.pair = true;
    }
    */

    this.initiatedItem = new ItemsInitiater({
      dimension: this.dimension,
      items: this.items,
      fixedSize: this.jftItem.info.fixedSize,
      sizeChar: this.sizeChar,
      stack: this.recommendStackInfo.mainStack,
      gap: this.gap,
    }).getItem();

    this.begin("main");

    if (this.recommendStackInfo.hasRemainder) {
      this.initiatedItem!.remove();
      this.initiatedItem = new ItemsInitiater({
        dimension: this.dimension,
        items: this.items,
        fixedSize: this.jftItem.info.fixedSize,
        sizeChar: this.sizeChar,
        stack: this.recommendStackInfo.remainderStack,
        gap: this.gap,
      }).getItem();

      this.begin("rem");
    } else {
      this.initiatedItem!.remove();
    }
  }

  private specialValidation() {
    if (
      this.jftItem.order === PairObjectMarkers.NECK &&
      this.items.length > 1
    ) {
      this.items.splice(1, 1);
      this.pair = false;
      this.countType = CountType.PCS;
    }
  }

  private cleanWhiteFillItem() {
    ES6_SA.arrayForEach(this.jftItem.items, (item, idx) => {
      if (
        item &&
        item.object.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item.object as PathItem)
      ) {
        this.items.splice(idx, 1);
        this.pair = false;
        this.countType = CountType.PCS;
      }
    });
  }

  private countTypeRevalid() {
    const { mainStack } = this.recommendStackInfo!;

    if (mainStack === "VRH") {
      this.countType = CountType.CMD;
    }
  }

  private padZero(number: number) {
    return !number ? "" : number < 10 ? `0${number}` : number.toString();
  }

  private isDocDyn() {
    const item1 = this.jftItem.items[0];

    if (this.singleItem && item1.isDynamic) return true;

    const item2 = this.jftItem.items[1];

    if (item1.isDynamic || item2.isDynamic) return true;

    return false;
  }

  private createDocName(direction: DirectionMarkers | "" = ""): string {
    const sizeChar = this.jftItem.info.fixedSize ? "" : this.sizeChar;

    let qty = `-${this.quantity.toString()}`;

    const isDocDyn = this.isDocDyn();

    let countType = ` ${this.countType}`;

    let fileOrder = `${this.jftItem.order}-`;

    if (isDocDyn) {
      qty = "";
      countType = "" as CountType.CMD;
    }

    if (!this.pair) {
      fileOrder = `${fileOrder}${direction ? `-${direction}` : ""}-`;
    }
    return `${fileOrder}${sizeChar}${qty}${countType}`;
  }

  private createGrid(params: CreateGrid & { item: GroupItem | PageItem }) {
    const { cols, maxCol, rows, doc, item } = params;

    // Use initiatedItem as fallback if no explicit item passed
    const reference = item;

    // How many items we actually want to place in *this* document
    const itemsPerDoc = maxCol;

    const placedItems: PageItem[] = []; // track all duplicates we create here

    const { moveObjectAfter } = AlignmentHandler;

    let prevItem = reference.duplicate();
    let prevRowFirstItem = prevItem;

    placedItems.push(prevItem);

    // Main duplication + positioning loop
    for (let col = 1; col <= itemsPerDoc; col++) {
      for (let row = 1; row <= rows; row++) {
        if (row === rows) {
          this.modifyTextFramesInItem(prevItem);
          continue;
        }

        const curItem = prevItem.duplicate();
        placedItems.push(curItem);
        prevItem = curItem;
        moveObjectAfter({
          base: prevItem,
          moving: curItem,
          gap: Utils.convertLength({ value: this.gap, from: "inch", to: "pt" }),
          position: "R",
          engine: CONFIG.THREAD_ENGINE,
        });
        this.modifyTextFramesInItem(prevItem);
        prevItem = curItem;
      }
      if (col !== itemsPerDoc) {
        prevItem = reference.duplicate();
        moveObjectAfter({
          base: prevRowFirstItem,
          moving: prevItem,
          gap: Utils.convertLength({ value: this.gap, from: "inch", to: "pt" }),
          position: "B",
          engine: CONFIG.THREAD_ENGINE,
        });
        prevRowFirstItem = prevItem;
      }
    }

    // ────────────────────────────────────────────────
    // Cleanup: remove the original reference copy
    // (we don't want it staying in the final document)
    // ────────────────────────────────────────────────
    // It was duplicated into this doc → safe to remove
    reference.remove();

    // Optional: group all placed items (if your workflow expects one big group)
    // if (placedItems.length > 1) {
    //   GroupManager.group(placedItems as Selection);
    // }
  }

  /**
   * Called once per newly duplicated item — right after duplication
   * Modify SIZE_TKN, numbers, names, visibility etc. here
   *
   * @param singleItem The freshly duplicated group / item (not the reference)
   */
  private modifyTextFramesInItem(singleItem: PageItem) {
    // ── intentionally empty for now ──
    // Future implementation examples:
    //
    // const sizeTkn = ES6_SA.arrayFind(
    //   singleItem.pageItems,
    //   it => it.typename === "TextFrame" && it.name === SIZE_TKN
    // ) as TextFrame | null;
    //
    // if (sizeTkn) {
    //   sizeTkn.contents = this.sizeChar;
    // }
    //
    // ... also dynamic number, player name, visibility of back/front, etc.
  }

  private processDynamicPart(
    param: ProcessDocAndLayout,
    dynamicItem: PageItem,
  ) {
    const { cols, reqDocs, rows } = param;

    for (let doc = 1; doc <= reqDocs.docsNeeded; doc++) {
      const docTitle = `${this.padZero(this.fileIndex)}-${this.createDocName()}`;
      const docHandler = new IllustratorDocument(docTitle);

      // Only duplicate/place the dynamic item
      const docIns = docHandler.create([dynamicItem]);
      const placed = docIns.activeLayer.pageItems[0];

      this.createGrid({
        cols,
        doc: docIns,
        maxCol: reqDocs.colsPerDoc,
        item: placed,
        rows,
      });

      docHandler.save({ filePath: this.folderPath, format: "EPS" });
      this.fileIndex++;

      if (!this.isDocDyn()) break;
    }
  }

  private alignAllItemsCenter(doc: Document) {
    // Place only once — centered or at fixed position
    // (you probably want to adjust position logic here)
    AlignmentHandler.alignPageItemsToArtboard({
      doc: doc,
      objects: Organizer.pageItemsToArray(doc.activeLayer.pageItems),
      engine: CONFIG.THREAD_ENGINE,
    });
  }

  private processDocAndLayout(param: ProcessDocAndLayout) {
    const { cols, reqDocs, rows } = param;
    const z = this;

    // ────────────────────────────────────────────────
    //  Special case: pair=false + exactly one dynamic item
    // ────────────────────────────────────────────────
    if (!this.pair && !this.singleItem) {
      const item1 = this.jftItem.items[0];
      const item2 = this.jftItem.items[1];

      const oneIsDynamic = item1.isDynamic !== item2.isDynamic;
      const hasStaticItem = !item1.isDynamic || !item2.isDynamic;

      if (oneIsDynamic && hasStaticItem) {
        // Identify which is static / which is dynamic
        const staticItem = item1.isDynamic
          ? ES6_SA.arrayFind(
              this.initiatedItem!.pageItems,
              (itm) => itm.name === item2.object.name,
            )
          : ES6_SA.arrayFind(
              this.initiatedItem!.pageItems,
              (itm) => itm.name === item1.object.name,
            );
        const dynamicItem = item1.isDynamic
          ? ES6_SA.arrayFind(
              this.initiatedItem!.pageItems,
              (itm) => itm.name === item1.object.name,
            )
          : ES6_SA.arrayFind(
              this.initiatedItem!.pageItems,
              (itm) => itm.name === item2.object.name,
            );

        // ── 1. Handle STATIC item → always only 1 document ───────
        const staticDocName = `${this.padZero(this.fileIndex)}-${this.createDocName()}`;
        const staticDocHandler = new IllustratorDocument(staticDocName);
        const staticDoc = staticDocHandler.create([staticItem!]);

        this.alignAllItemsCenter(staticDoc);

        staticDocHandler.save({ filePath: this.folderPath, format: "EPS" });
        staticDocHandler.close(); // optional — depends if you want to keep open
        staticItem!.remove();

        // Important: increment file index so dynamic docs continue numbering
        this.fileIndex++;

        // ── 2. Now handle DYNAMIC item normally (may need multiple docs) ──
        // Reuse the original reqDocs / rows / cols logic, but only for dynamic
        const dynamicReqInfo: ProcessDocAndLayout = {
          rows,
          cols,
          reqDocs, // ← still use the full quantity-based calculation
        };

        this.processDynamicPart(dynamicReqInfo, dynamicItem!);

        return; // ← exit early — we handled both parts
      }
    }

    this.processDynamicPart({ cols, reqDocs, rows }, this.initiatedItem!);

    // ────────────────────────────────────────────────
    // Normal flow (both dynamic, both static, paired, single, etc.)
    // ────────────────────────────────────────────────
    // for (let doc = 1; doc <= reqDocs.docsNeeded; doc++) {
    //   const isLastDoc = doc === reqDocs.docsNeeded;

    //   let docTitle = `${this.padZero(this.fileIndex)}-${this.createDocName()}`;

    //   // Optional: last doc can have special name / reduced cols if you want
    //   // if (isLastDoc && this.recommendStackInfo?.hasRemainder) { ... }

    //   const docHandler = new IllustratorDocument(docTitle);
    //   const docIns = docHandler.create([this.initiatedItem!]);

    //   this.createGrid({
    //     cols,
    //     doc: docIns,
    //     maxCol: reqDocs.colsPerDoc,
    //     rows,
    //     item: this.initiatedItem!,
    //   });

    //   docHandler.save({ filePath: this.folderPath, format: "EPS" });

    //   this.fileIndex++;

    //   // If not dynamic document → usually only one doc needed
    //   if (!this.isDocDyn()) {
    //     break;
    //   }
    // }
  }

  private begin(layout: "main" | "rem") {
    const {
      mainCols,
      mainFitRow,
      requiredDocs,
      remainderFitRow,
      remainderCols,
      remainderRequiredDocs,
    } = this.recommendStackInfo!;

    const reqInfo: ProcessDocAndLayout =
      layout === "main"
        ? { reqDocs: requiredDocs, rows: mainFitRow, cols: mainCols }
        : {
            reqDocs: remainderRequiredDocs,
            rows: remainderFitRow,
            cols: remainderCols,
          };

    this.processDocAndLayout(reqInfo);
  }
}
