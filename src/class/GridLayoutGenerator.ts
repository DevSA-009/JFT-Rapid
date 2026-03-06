interface GridLayoutGeneratorParams {
  sizeChar: ApparelSize;
  quantity: number;
  dimension: DimensionObject;
  jftItem: JFTItem;
}

type ProcessDocAndLayout = Record<"rows" | "cols", number> & {
  reqDocs: RequiredDocReturn;
};
type ProcessDocAndLayoutDync = ProcessDocAndLayout & {
  direction?: DirectionMarkers;
  dynamicItem: PageItem;
};

/**
 * Parameters for creating a grid layout inside a document.
 */
type CreateGrid = Omit<ProcessDocAndLayout, "reqDocs"> & {
  maxCol: number;
  doc: Document;
  item: PageItem;
};

interface TempStackInfo {
  type: "main" | "rem";
  tempQty: number;
  targetqQty: number;
  stack: StackType;
  rows: number;
  cols: number;
}

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
  private fileIndex = Math.max(
    1,
    Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1),
  );
  private initiatedItem: GroupItem | null = null;
  private singleItem = false;
  private readonly folderPath = app.activeDocument.path.fsName;
  private tempStackInfo: TempStackInfo = {
    targetqQty: 0,
    tempQty: 0,
    type: "main",
    stack: "HH",
    rows: 0,
    cols: 0,
  };

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

    this.tempStackInfo = {
      type: "main",
      targetqQty: this.recommendStackInfo.mainQuantityOccupied,
      tempQty: 0,
      stack: this.recommendStackInfo.mainStack,
      rows: this.recommendStackInfo.mainFitRow,
      cols: this.recommendStackInfo.mainCols,
    };
    this.begin("main");

    this.initiatedItem!.remove();

    if (this.recommendStackInfo.hasRemainder) {
      this.items = [
        this.jftItem.items[0].object.duplicate(),
        this.jftItem.items[1].object.duplicate() || null,
      ];

      this.pair = true;
      this.countType = CountType.SET;

      this.cleanWhiteFillItem();

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

      this.initiatedItem = new ItemsInitiater({
        dimension: this.dimension,
        items: this.items,
        fixedSize: this.jftItem.info.fixedSize,
        sizeChar: this.sizeChar,
        stack: this.recommendStackInfo.remainderStack,
        gap: this.gap,
      }).getItem();

      this.tempStackInfo = {
        type: "rem",
        targetqQty: this.recommendStackInfo.remainderQuantityOccupied,
        tempQty: 0,
        stack: this.recommendStackInfo.remainderStack,
        rows: this.recommendStackInfo.remainderFitRow,
        cols: this.recommendStackInfo.remainderCols,
      };

      this.begin("rem");

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
    ES6_SA.arrayForEach(this.items, (item, idx) => {
      if (
        item &&
        item.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item as PathItem)
      ) {
        this.items.splice(idx, 1);
        this.pair = false;
        this.countType = CountType.PCS;
        item.remove();
      }
    });
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

  private createDocName(
    direction: DirectionMarkers | null = null,
    forceNonDync = false,
  ): string {
    const sizeChar = this.jftItem.info.fixedSize ? "" : this.sizeChar;

    let qty = `-${this.tempStackInfo.targetqQty.toString()}`;

    const isDocDyn = this.isDocDyn();

    let countType = ` ${this.countType}`;

    let fileOrder = `${this.jftItem.order}`;

    const size = `-${sizeChar}`;

    if (this.tempStackInfo.rows === 1 && this.tempStackInfo.cols !== 1) {
      qty = `-${this.tempStackInfo.cols.toString()}`;
      countType = ` ${CountType.CMD}`;
    }

    if (
      (!forceNonDync && isDocDyn) ||
      (this.tempStackInfo.rows === 1 && this.tempStackInfo.cols === 1) ||
      (this.singleItem && this.tempStackInfo.cols === 1)
    ) {
      qty = "";
      countType = "" as CountType.CMD;
    }

    if (!this.pair) {
      fileOrder = `${this.jftItem.order}${direction ? `-${direction}` : ""}`;
    }

    return `${fileOrder}${size}${qty}${countType}`;
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

  /**
   * Creates a grid of duplicated items inside the target document.
   * Duplicates are placed column-by-column, row-by-row using AlignmentHandler.
   * Text frames are modified **after** each duplication (except the very last item in row).
   * The original reference copy is removed at the end.
   *
   * @param params - Grid configuration and reference item
   */
  private createGrid(params: CreateGrid) {
    const { maxCol, rows, doc, item: reference } = params;

    // Number of items to place in this document (limited by maxCol)
    const itemsPerDoc = maxCol;

    const placedItems: PageItem[] = [];

    const gapInPoints = Utils.convertLength({
      value: this.gap,
      from: "inch",
      to: "pt",
    });

    // Start with first duplicate (will become the top-left item)
    let prevItem = reference.duplicate();
    let prevRowFirstItem = prevItem;

    placedItems.push(prevItem);

    this.tempStackInfo.tempQty++;
    if (this.tempStackInfo.stack === "VRH") {
      this.tempStackInfo.tempQty++;
    }

    // ────────────────────────────────────────────────
    // Main grid loop — column by column
    // ────────────────────────────────────────────────
    for (let col = 1; col <= itemsPerDoc; col++) {
      if (this.tempStackInfo.tempQty >= this.tempStackInfo.targetqQty) {
        this.modifyTextFramesInItem(prevItem);
        break;
      }
      for (let row = 1; row <= rows; row++) {
        if (this.tempStackInfo.tempQty === this.tempStackInfo.targetqQty) {
          break;
        }

        // Last item in the row — modify text but don't duplicate further in this column
        if (row === rows) {
          this.modifyTextFramesInItem(prevItem);
          continue;
        }

        // Duplicate current item → place it to the right
        const curItem = prevItem.duplicate();
        placedItems.push(curItem);
        this.tempStackInfo.tempQty++;
        if (this.tempStackInfo.stack === "VRH") {
          this.tempStackInfo.tempQty++;
        }

        AlignmentHandler.moveObjectAfter({
          base: prevItem,
          moving: curItem,
          position: "R",
          gap: gapInPoints,
          engine: CONFIG.THREAD_ENGINE,
        });

        // Modify text frames of the **just placed** item
        this.modifyTextFramesInItem(curItem);

        // Prepare for next iteration
        prevItem = curItem;
      }

      // After finishing a column — if not last column, start new column below first item of previous row

      if (this.tempStackInfo.tempQty === this.tempStackInfo.targetqQty) {
        this.modifyTextFramesInItem(prevItem);
        break;
      }

      if (col !== itemsPerDoc) {
        prevItem = reference.duplicate();
        AlignmentHandler.moveObjectAfter({
          base: prevRowFirstItem,
          moving: prevItem,
          position: "B",
          gap: gapInPoints,
          engine: CONFIG.THREAD_ENGINE,
        });
        prevRowFirstItem = prevItem;
        placedItems.push(prevItem);
        this.tempStackInfo.tempQty++;
        if (this.tempStackInfo.stack === "VRH") {
          this.tempStackInfo.tempQty++;
        }
      }
    }

    // ────────────────────────────────────────────────
    // Cleanup phase
    // ────────────────────────────────────────────────
    // Remove the original reference item that was duplicated into this document
    if (reference.parent === doc) {
      reference.remove();
    }

    // Optional final alignment / grouping of the entire grid
    if (placedItems.length) {
      this.alignAllItemsCenter(doc, placedItems as Selection);
    }
  }

  /**
   * Handles dynamic-only content across one or more documents.
   * Each document gets its own grid built from the provided dynamic item.
   *
   * @param param - Layout parameters (rows, cols, required docs info)
   * @param dynamicItem - The source item to duplicate from
   */
  private processDynamicPart(param: ProcessDocAndLayoutDync) {
    const { cols, reqDocs, rows, dynamicItem, direction = null } = param;

    for (let docNum = 1; docNum <= reqDocs.docsNeeded; docNum++) {
      const docTitle = `${this.padZero(this.fileIndex)}-${this.createDocName(direction)}`;
      const docHandler = new IllustratorDocument(docTitle);

      // Create fresh document and place single copy of dynamic item
      const docIns = docHandler.create([dynamicItem]);
      const placed = docIns.activeLayer.pageItems[0] as PageItem;

      const isDocDync = this.isDocDyn();

      if (isDocDync) {
        this.createGrid({
          cols,
          doc: docIns,
          maxCol: reqDocs.colsPerDoc,
          item: placed,
          rows,
        });
      }

      if (isDocDync) {
        placed.remove();
      }

      docHandler.save({ filePath: this.folderPath, format: "EPS" });
      docHandler.close();
      this.fileIndex++;

      if (!isDocDync) {
        break;
      }
    }
  }

  /**
   * Centers all given items (or all items in active layer) to the artboard.
   *
   * @param doc - Target document
   * @param items - Optional specific items to align (falls back to all in active layer)
   */
  private alignAllItemsCenter(doc: Document, items?: Selection | PageItem[]) {
    const objects =
      items ?? Organizer.pageItemsToArray(doc.activeLayer.pageItems);

    if (!objects.length) return;

    AlignmentHandler.alignPageItemsToArtboard({
      doc,
      objects: objects as Selection,
      position: "C", // Center
      engine: CONFIG.THREAD_ENGINE,
    });

    Organizer.smallArtboard(doc);
  }

  /**
   * Main entry point for processing layout in one or more documents.
   * Handles special case (one static + one dynamic item when pair=false)
   * and delegates normal/dynamic cases to processDynamicPart.
   *
   * @param param - Layout parameters (rows, cols, required docs)
   */
  private processDocAndLayout(param: ProcessDocAndLayout) {
    const { cols, reqDocs, rows } = param;

    // ────────────────────────────────────────────────
    // Special case: non-paired item with exactly one dynamic part
    // ────────────────────────────────────────────────
    if (!this.pair && !this.singleItem && this.tempStackInfo.stack !== "VRH") {
      const item1 = this.jftItem.items[0];
      const item2 = this.jftItem.items[1];

      if (item1.isDynamic !== item2.isDynamic) {
        // Determine static and dynamic
        const staticEntry = item1.isDynamic ? item2 : item1;
        const dynamicEntry = item1.isDynamic ? item1 : item2;

        const staticItem = ES6_SA.arrayFind(
          this.initiatedItem!.pageItems,
          (itm) => itm.name === staticEntry.object.name,
        );

        const dynamicItem = ES6_SA.arrayFind(
          this.initiatedItem!.pageItems,
          (itm) => itm.name === dynamicEntry.object.name,
        );

        if (!staticItem || !dynamicItem) {
          throw new Error(
            "Could not locate static or dynamic item in initiated group",
          );
        }

        // ── Static part → single document ───────────────────────────────
        const staticDocName = `${this.padZero(this.fileIndex)}-${this.createDocName(staticEntry.direction as DirectionMarkers, true)}`;
        const staticDocHandler = new IllustratorDocument(staticDocName);
        const staticDoc = staticDocHandler.create([staticItem]);

        this.alignAllItemsCenter(staticDoc);

        staticDocHandler.save({ filePath: this.folderPath, format: "EPS" });
        staticDocHandler.close();

        staticItem.remove();
        this.fileIndex++;

        // ── Dynamic part → normal multi-document flow ───────────────────
        this.processDynamicPart({
          cols,
          reqDocs,
          rows,
          dynamicItem,
          direction: dynamicEntry.direction as DirectionMarkers,
        });

        return; // Exit — special case fully handled
      }
    } else if (
      !this.pair &&
      !this.singleItem &&
      this.tempStackInfo.stack === "VRH"
    ) {
      this.initiatedItem!.remove();

      const item1 = this.jftItem.items[0];
      const item2 = this.jftItem.items[1];

      if (item1.isDynamic !== item2.isDynamic) {
        // Determine static and dynamic
        const staticEntry = item1.isDynamic ? item2 : item1;
        const dynamicEntry = item1.isDynamic ? item1 : item2;

        this.initiatedItem = new ItemsInitiater({
          dimension: this.dimension,
          items: [staticEntry.object.duplicate()],
          fixedSize: this.jftItem.info.fixedSize,
          sizeChar: this.sizeChar,
          stack: "VRH",
          gap: this.gap,
        }).getItem();

        // ── Static part → single document ───────────────────────────────
        const staticDocName = `${this.padZero(this.fileIndex)}-${this.createDocName(staticEntry.direction as DirectionMarkers, true)}`;
        const staticDocHandler = new IllustratorDocument(staticDocName);
        const staticDoc = staticDocHandler.create([this.initiatedItem]);

        this.alignAllItemsCenter(staticDoc);

        staticDocHandler.save({ filePath: this.folderPath, format: "EPS" });
        staticDocHandler.close();

        this.initiatedItem.remove();
        this.fileIndex++;

        this.initiatedItem = new ItemsInitiater({
          dimension: this.dimension,
          items: [dynamicEntry.object.duplicate()],
          fixedSize: this.jftItem.info.fixedSize,
          sizeChar: this.sizeChar,
          stack: "VRH",
          gap: this.gap,
        }).getItem();

        // ── Dynamic part → normal multi-document flow ───────────────────
        this.processDynamicPart({
          cols,
          reqDocs,
          rows,
          dynamicItem: this.initiatedItem,
          direction: dynamicEntry.direction as DirectionMarkers,
        });

        return; // Exit — special case fully handled
      }
    }

    // ────────────────────────────────────────────────
    // Normal flow (paired, both dynamic, single item, etc.)
    // ────────────────────────────────────────────────
    this.processDynamicPart({
      cols,
      reqDocs,
      rows,
      dynamicItem: this.initiatedItem!,
    });
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
    this.initiatedItem;
  }
}
