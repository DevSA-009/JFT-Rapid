const FILL_REC_STRIP_HEIGHT_INCH = 20;
interface GridLayoutGeneratorParams {
  sizeChar: ApparelSize;
  quantity: number;
  dimension: DimensionObject;
  jftItem: JFTItem;
  orientation: StackOrientation;
  data: AutomateData["details"]["L"]["DATA"] | null;
}
type GridLayoutPassParams = Record<"rows" | "cols", number> & {
  reqDocs: RequiredDocReturn;
};
type DynamicGridLayoutPassParams = GridLayoutPassParams & {
  direction?: DirectionMarkers;
  dynamicItem: PageItem;
};
type CreateGridParams = Omit<GridLayoutPassParams, "reqDocs"> & {
  maxCol: number;
  doc: Document;
  item: PageItem;
};
interface LayoutPassTracker {
  type: "main" | "rem";
  placedQty: number;
  targetQty: number;
  stack: StackType;
  rows: number;
  cols: number;
}

type ResolveMixedEntriesResult = {
  staticEntry: ItemInfoEntry;
  dynamicEntry: ItemInfoEntry;
} | null;

class GridLayoutGenerator {
  private readonly sizeChar: GridLayoutGeneratorParams["sizeChar"];
  private readonly dimension: DimensionObject;
  private readonly jftItem: JFTItem;
  private readonly itemGap: number = CONFIG.ITEMS_GAP;
  private stackOrientation: StackOrientation;
  private readonly outputFolderPath: string = app.activeDocument.path.fsName;
  private quantity: GridLayoutGeneratorParams["quantity"];
  private artworkItems: PageItem[];
  private isSingleItem: boolean = false;
  private isPaired: boolean;
  private countType: CountType;
  private composedReferenceItem: GroupItem | null = null;
  private stackRecommendation: RecommendedStacksResult | null = null;
  private outputFileIndex: number = Math.max(
    1,
    Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1),
  );
  private layoutPassTracker: LayoutPassTracker = {
    type: "main",
    placedQty: 0,
    targetQty: 0,
    stack: "HH",
    rows: 0,
    cols: 0,
  };
  private data: AutomateData["details"]["L"]["DATA"] | null;
  // Build once at the start of each pass — in buildPassTracker or begin()
  private textProcessor: TextFrameProcessor | null = null;
  constructor(params: GridLayoutGeneratorParams) {
    this.sizeChar = params.sizeChar;
    this.quantity = params.quantity;
    this.jftItem = params.jftItem;
    this.dimension = params.dimension;
    this.stackOrientation = params.orientation ?? CONFIG.ORIENTATION;
    this.data = params.data ? [...params.data] : null;
    this.countType = this.jftItem.info.countType;
    this.isPaired = this.jftItem.info.pair;
    this.artworkItems = this.duplicateSourceItems();
    this.cleanWhiteFillItem();
    if (!this.artworkItems.length) return;
    if (this.artworkItems.length === 1) this.isSingleItem = true;
    this.specialValidation();
    if (this.shouldUseFillRecPath()) {
      this.runFillRecPath();
      return;
    }
    this.stackRecommendation = this.calculateStackRecommendation();
    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.mainStack,
    );
    this.layoutPassTracker = this.buildPassTracker("main");
    this.begin("main");
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;
    if (this.stackRecommendation.hasRemainder) {
      this.runRemainderPass();
    }
  }
  private runRemainderPass(): void {
    this.artworkItems = this.duplicateSourceItems();
    this.isPaired = true;
    this.countType = CountType.SET;
    this.cleanWhiteFillItem();
    this.stackRecommendation = this.calculateStackRecommendation();
    this.composedReferenceItem = this.buildComposedReference(
      this.stackRecommendation.remainderStack,
    );
    this.layoutPassTracker = this.buildPassTracker("rem");
    this.begin("rem");
    this.composedReferenceItem!.remove();
    this.composedReferenceItem = null;
  }
  private shouldUseFillRecPath(): boolean {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];
    if (!this.jftItem.info.fixedSize) return false;
    if (this.isSingleItem) return e1.isFillRec;
    if (!this.isPaired) {
      return e1.isFillRec || e2.isFillRec;
    }
    return e1.isFillRec && e2.isFillRec;
  }
  private runFillRecPath(): void {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];
    if (this.isSingleItem) {
      this.saveFillRecStrips(this.artworkItems[0], false);
      return;
    }
    const isMixed = e1.isDynamic !== e2.isDynamic;
    if (!this.isPaired && isMixed) {
      const staticEntry = e1.isDynamic ? e2 : e1;
      const dynamicEntry = e1.isDynamic ? e1 : e2;
      const staticItem = this.artworkItems[staticEntry === e1 ? 0 : 1];
      const dynamicItem = this.artworkItems[dynamicEntry === e1 ? 0 : 1];
      if (staticEntry.isFillRec) {
        this.saveFillRecStrips(staticItem, false);
        staticEntry.object.remove();
      }
      const savedPaired = this.isPaired;
      const savedCountType = this.countType;
      this.isPaired = false;
      this.countType = CountType.PCS;
      this.stackRecommendation = this.calculateStackRecommendation();
      this.composedReferenceItem = this.buildComposedReference(
        this.stackRecommendation.mainStack,
      );
      this.layoutPassTracker = this.buildPassTracker("main");
      const savedArtwork = this.artworkItems;
      this.artworkItems = [dynamicItem];
      this.begin("main");
      this.artworkItems = savedArtwork;
      this.composedReferenceItem!.remove();
      this.composedReferenceItem = null;
      if (this.stackRecommendation.hasRemainder) this.runRemainderPass();
      this.isPaired = savedPaired;
      this.countType = savedCountType;
      return;
    }
    const sameColor = this.haveSameFillColor(
      this.artworkItems[0],
      this.artworkItems[1],
    );
    if (sameColor) {
      this.saveFillRecStrips(this.artworkItems[0], true);
    } else {
      this.saveFillRecStrips(this.artworkItems[0], false);
      this.saveFillRecStrips(this.artworkItems[1], false);
    }
    ES6_SA.arrayForEach(this.artworkItems, (item) => item.remove());
  }
  private saveFillRecStrips(sourceItem: PageItem, pair: boolean): void {
    const targetWidthPt = Utils.convertLength({
      value: CONFIG.PAPER_MAX_SIZE,
      from: "inch",
      to: "pt",
    });
    const fitRow = GridCalculator.getRowFitCount({
      stackWidth: this.dimension.width,
      gap: 0,
    });
    const qty = !pair ? this.quantity : this.quantity * 2;
    const cols = Math.ceil(qty / fitRow);
    const height = this.dimension.height * cols;
    const { baseHeight, divider } = Utils.getBestDividerAndHeight(height);
    Utils.resizeObject(
      sourceItem,
      targetWidthPt,
      Utils.convertLength({ from: "inch", to: "pt", value: baseHeight }),
    );
    const qtyName = divider > 1 ? `-${divider} ${CountType.CMD}` : "";
    const docTitle = `${this.padZero(this.outputFileIndex)}-${this.jftItem.order}${qtyName}`;
    const docHandler = new IllustratorDocument(docTitle);
    const newDoc = docHandler.create([sourceItem]);
    this.alignAllItemsCenter(newDoc);
    docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
    docHandler.close();
    this.outputFileIndex++;
  }
  private fillWidthStrip(params: {
    doc: Document;
    item: PageItem;
    fitRow: number;
  }): void {
    const { item, fitRow } = params;
    const gapPt = Utils.convertLength({
      value: this.itemGap,
      from: "inch",
      to: "pt",
    });
    let current = item;
    for (let i = 1; i < fitRow; i++) {
      const next = current.duplicate();
      AlignmentHandler.moveObjectAfter({
        base: current,
        moving: next,
        position: "R",
        gap: gapPt,
        engine: CONFIG.THREAD_ENGINE,
      });
      current = next;
    }
    item.remove();
  }
  private duplicateSourceItems(): PageItem[] {
    return [
      this.jftItem.items[0].object.duplicate(),
      this.jftItem.items[1].object.duplicate() || null,
    ] as PageItem[];
  }
  private buildPassTracker(passType: "main" | "rem"): LayoutPassTracker {
    const rec = this.stackRecommendation!;
    const isMainPass = passType === "main";
    return {
      type: passType,
      placedQty: 0,
      targetQty: isMainPass
        ? rec.mainQuantityOccupied
        : rec.remainderQuantityOccupied,
      stack: isMainPass ? rec.mainStack : rec.remainderStack,
      rows: isMainPass ? rec.mainFitRow : rec.remainderFitRow,
      cols: isMainPass ? rec.mainCols : rec.remainderCols,
    };
  }
  private calculateStackRecommendation(): RecommendedStacksResult {
    return GridCalculator.getRecommendedStacks({
      gap: this.itemGap,
      maxColsInDoc: CONFIG.PER_DOC,
      quantity: this.quantity,
      size: this.dimension,
      pair: this.isPaired,
      pairGap: this.itemGap,
      heightPreference: "Less",
      stackOrientation: this.stackOrientation,
    });
  }
  private buildComposedReference(stackType: StackType): GroupItem {
    return new ItemsInitiater({
      dimension: this.dimension,
      items: this.artworkItems,
      fixedSize: this.jftItem.info.fixedSize,
      sizeChar: this.sizeChar,
      stack: stackType,
      gap: this.itemGap,
      pairable: this.isPaired,
    }).getItem();
  }
  private specialValidation(): void {
    const order = this.jftItem.order;
    const isSingleSidedOrder = order === PairObjectMarkers.NECK;
    if (isSingleSidedOrder && this.artworkItems.length > 1) {
      this.artworkItems.splice(1, 1);
      this.isPaired = false;
      this.countType = CountType.PCS;
    }
    if (
      !this.isPaired &&
      !this.isSingleItem &&
      !isSingleSidedOrder &&
      this.quantity <= 3
    ) {
      this.isPaired = true;
      this.countType = CountType.SET;
    }
  }
  private cleanWhiteFillItem(): void {
    ES6_SA.arrayForEach(this.artworkItems, (item, idx) => {
      if (
        item &&
        item.typename === PageItemType.PathItem &&
        Utils.isWhiteFill(item as PathItem)
      ) {
        this.artworkItems.splice(idx, 1);
        this.isPaired = false;
        this.countType = CountType.PCS;
        item.remove();
      }
    });
  }
  private haveSameFillColor(itemA: PageItem, itemB: PageItem): boolean {
    if (
      itemA.typename !== PageItemType.PathItem ||
      itemB.typename !== PageItemType.PathItem
    )
      return false;
    const fillA = (itemA as PathItem).fillColor;
    const fillB = (itemB as PathItem).fillColor;
    if (fillA.typename !== "CMYKColor" || fillB.typename !== "CMYKColor")
      return false;
    const a = fillA as CMYKColor;
    const b = fillB as CMYKColor;
    return (
      a.cyan === b.cyan &&
      a.magenta === b.magenta &&
      a.yellow === b.yellow &&
      a.black === b.black
    );
  }
  private padZero(value: number): string {
    if (!value) return "";
    return value < 10 ? `0${value}` : value.toString();
  }
  private isDocumentDynamic(): boolean {
    const e1 = this.jftItem.items[0];
    if (this.isSingleItem && e1.isDynamic) return true;
    return e1.isDynamic || this.jftItem.items[1].isDynamic;
  }
  private buildDocName(
    direction: DirectionMarkers | null = null,
    forceStatic: boolean = false,
  ): string {
    const { rows, cols, targetQty } = this.layoutPassTracker;
    const sizeSegment = this.jftItem.info.fixedSize ? "" : this.sizeChar;
    const isDocDynamic = this.isDocumentDynamic();
    let quantitySegment = `-${targetQty.toString()}`;
    let countTypeSegment = ` ${this.countType}` as string;
    if (isDocDynamic && !forceStatic) {
      quantitySegment = "";
      countTypeSegment = "";
    } else if (rows === 1 && cols === 1) {
      quantitySegment = "";
      countTypeSegment = "";
    } else if (targetQty === 1 && cols === 1) {
      quantitySegment = "";
      countTypeSegment = "";
    } else if (rows === 1 && cols > 1) {
      quantitySegment = `-${cols.toString()}`;
      countTypeSegment = ` ${CountType.CMD}`;
    }
    const fileOrderSegment = this.isPaired
      ? `${this.jftItem.order}`
      : `${this.jftItem.order}${direction ? `-${direction}` : ""}`;
    const sizeJoin = sizeSegment ? `-${sizeSegment}` : "";
    return `${fileOrderSegment}${sizeJoin}${quantitySegment}${countTypeSegment}`;
  }
  // ─── Private: Per-item text mutation ─────────────────────────────────────

  /**
   * Injects dynamic text into every relevant text frame inside `placedItem`
   * and applies post-injection corrections.
   *
   * ### Sub-item index tracking (F2 VRH axis)
   * The loop counter `i` over sub-groups is passed as `subItemIndex` to
   * `adjustTextFrameFontSize` so the correct axis (width vs height) is used
   * for each VRH sub-item.
   *
   * ### Data-queue consumption (F5)
   * After processing all frames in one placed item, the queue is advanced by
   * `resolveDataConsumeCount()` shifts:
   * - VRH + `pair=false` → 4 shifts
   * - VRH + `pair=true`  → 2 shifts
   * - All other stacks   → 1 shift
   *
   * @param placedItem - Top-level GroupItem in its final grid position.
   * @private
   */

  private createGrid(params: CreateGridParams): void {
    const { maxCol, rows, doc, item: referenceItem } = params;
    const gapPt = Utils.convertLength({
      value: this.itemGap,
      from: "inch",
      to: "pt",
    });
    const applyAltRotation =
      (this.layoutPassTracker.stack === "RHH" ||
        this.layoutPassTracker.stack === "RVV") &&
      !this.isPaired &&
      !this.isSingleItem;
    let placementIndex = 0;
    const placedItems: PageItem[] = [];
    let currentItem = referenceItem.duplicate();
    let columnFirstItem = currentItem;
    placedItems.push(currentItem);
    this.incrementPlacedQty();
    if (applyAltRotation)
      this.applyAlternatingRotation(currentItem, placementIndex);
    placementIndex++;
    this.textProcessor!.process(currentItem);
    for (let col = 1; col <= maxCol; col++) {
      if (this.isPassComplete()) break;
      for (let row = 1; row < rows; row++) {
        if (this.isPassComplete()) break;
        const nextItem = currentItem.duplicate();
        placedItems.push(nextItem);
        this.incrementPlacedQty();
        AlignmentHandler.moveObjectAfter({
          base: currentItem,
          moving: nextItem,
          position: "R",
          gap: gapPt,
          engine: CONFIG.THREAD_ENGINE,
        });
        if (applyAltRotation)
          this.applyAlternatingRotation(nextItem, placementIndex);
        placementIndex++;
        this.textProcessor!.process(nextItem);
        currentItem = nextItem;
      }
      if (this.isPassComplete()) break;
      if (col !== maxCol) {
        const newColFirst = referenceItem.duplicate();
        AlignmentHandler.moveObjectAfter({
          base: columnFirstItem,
          moving: newColFirst,
          position: "B",
          gap: gapPt,
          engine: CONFIG.THREAD_ENGINE,
        });
        columnFirstItem = newColFirst;
        currentItem = newColFirst;
        placedItems.push(newColFirst);
        this.incrementPlacedQty();
        if (applyAltRotation)
          this.applyAlternatingRotation(newColFirst, placementIndex);
        placementIndex++;
        this.textProcessor!.process(newColFirst);
      }
    }
    if (referenceItem.parent === doc) referenceItem.remove();
    if (placedItems.length)
      this.alignAllItemsCenter(doc, placedItems as Selection);
  }
  private applyAlternatingRotation(
    item: PageItem,
    placementIndex: number,
  ): void {
    item.rotate(placementIndex % 2 === 0 ? 180 : -180);
  }
  private incrementPlacedQty(): void {
    this.layoutPassTracker.placedQty++;
    if (this.layoutPassTracker.stack === "VRH") {
      this.layoutPassTracker.placedQty++;
    }
  }
  private isPassComplete(): boolean {
    return this.layoutPassTracker.placedQty >= this.layoutPassTracker.targetQty;
  }
  private processDynamicPass(params: DynamicGridLayoutPassParams): void {
    const { cols, reqDocs, rows, dynamicItem, direction = null } = params;
    const isDynamic = this.isDocumentDynamic();
    for (let docNum = 1; docNum <= reqDocs.docsNeeded; docNum++) {
      const docTitle = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction)}`;
      const docHandler = new IllustratorDocument(docTitle);
      const newDoc = docHandler.create([dynamicItem]);
      const seedItem = newDoc.activeLayer.pageItems[0] as PageItem;
      if (isDynamic) {
        this.createGrid({
          cols,
          doc: newDoc,
          maxCol: reqDocs.colsPerDoc,
          item: seedItem,
          rows,
        });
        seedItem.remove();
      }
      this.alignAllItemsCenter(newDoc);
      docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
      docHandler.close();
      this.outputFileIndex++;
      if (!isDynamic) break;
    }
  }
  private saveStaticDocument(
    staticItem: PageItem,
    direction: DirectionMarkers,
  ): void {
    const docName = `${this.padZero(this.outputFileIndex)}-${this.buildDocName(direction, true)}`;
    const docHandler = new IllustratorDocument(docName);
    const staticDoc = docHandler.create([staticItem]);
    this.alignAllItemsCenter(staticDoc);
    docHandler.save({ filePath: this.outputFolderPath, format: "EPS" });
    docHandler.close();
    staticItem.remove();
    this.outputFileIndex++;
  }
  private resolveMixedEntries(): ResolveMixedEntriesResult {
    const e1 = this.jftItem.items[0];
    const e2 = this.jftItem.items[1];
    if (e1.isDynamic === e2.isDynamic) return null;
    return {
      staticEntry: e1.isDynamic ? e2 : e1,
      dynamicEntry: e1.isDynamic ? e1 : e2,
    };
  }
  private processDocumentAndLayout(params: GridLayoutPassParams): void {
    const { cols, reqDocs, rows } = params;
    const isVrhStack = this.layoutPassTracker.stack === "VRH";
    if (!this.isPaired && !this.isSingleItem) {
      const mixedEntries = this.resolveMixedEntries();
      if (mixedEntries) {
        const { staticEntry, dynamicEntry } = mixedEntries;
        if (!isVrhStack) {
          const staticItem = ES6_SA.arrayFind(
            this.composedReferenceItem!.pageItems,
            (itm) => itm.name === staticEntry.object.name,
          );
          const dynamicItem = ES6_SA.arrayFind(
            this.composedReferenceItem!.pageItems,
            (itm) => itm.name === dynamicEntry.object.name,
          );
          if (!staticItem || !dynamicItem) {
            throw new Error(
              "Could not locate static or dynamic item in composed reference group.",
            );
          }
          this.saveStaticDocument(
            staticItem,
            staticEntry.direction as DirectionMarkers,
          );
          this.processDynamicPass({
            cols,
            reqDocs,
            rows,
            dynamicItem,
            direction: dynamicEntry.direction as DirectionMarkers,
          });
          return;
        }
        this.composedReferenceItem!.remove();
        this.composedReferenceItem = null;
        this.artworkItems = [staticEntry.object.duplicate()];
        const staticVrh = this.buildComposedReference("VRH");
        this.saveStaticDocument(
          staticVrh,
          staticEntry.direction as DirectionMarkers,
        );
        this.artworkItems = [dynamicEntry.object.duplicate()];
        const dynamicVrh = this.buildComposedReference("VRH");
        this.composedReferenceItem = dynamicVrh;
        this.processDynamicPass({
          cols,
          reqDocs,
          rows,
          dynamicItem: dynamicVrh,
          direction: dynamicEntry.direction as DirectionMarkers,
        });
        return;
      }
    }
    this.processDynamicPass({
      cols,
      reqDocs,
      rows,
      dynamicItem: this.composedReferenceItem!,
    });
  }
  private begin(passType: "main" | "rem"): void {
    const rec = this.stackRecommendation!;
    // Rebuild processor for this pass — stack/isPaired may have changed
    this.textProcessor = new TextFrameProcessor({
      stack: this.layoutPassTracker.stack,
      isPaired: this.isPaired,
      isMixedDynamic: !this.resolveMixedEntries(),
      data: this.data,
    });
    const passParams: GridLayoutPassParams =
      passType === "main"
        ? {
            reqDocs: rec.requiredDocs,
            rows: rec.mainFitRow,
            cols: rec.mainCols,
          }
        : {
            reqDocs: rec.remainderRequiredDocs,
            rows: rec.remainderFitRow,
            cols: rec.remainderCols,
          };
    this.processDocumentAndLayout(passParams);
  }
  private alignAllItemsCenter(
    doc: Document,
    items?: Selection | PageItem[],
  ): void {
    const targets: PageItem[] =
      (items as PageItem[]) ??
      Organizer.pageItemsToArray(doc.activeLayer.pageItems);
    if (!targets.length) return;
    AlignmentHandler.alignPageItemsToArtboard({
      doc,
      objects: targets as Selection,
      position: "C",
      engine: CONFIG.THREAD_ENGINE,
    });
    Organizer.smallArtboard(doc);
  }
}
