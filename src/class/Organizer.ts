class Organizer {
    private data: DataListConatiner;
    private targetSizeChr: MensSize | BabySize;
    private orgMode: Mode;
    private doc: Document;
    private sizeContainer;

    constructor(arg: OrganizerParams) {
        const { dataString, targetSizeChr, mode, doc = app.activeDocument, sizeConatiner = "JFT" } = arg;
        this.data = JSONSA.parse(dataString) as DataListConatiner;
        this.targetSizeChr = targetSizeChr;
        this.orgMode = mode;
        this.sizeContainer = sizeConatiner;
        this.doc = doc;
    };

    private run() {
        for (const size in this.data) {
            const sizeChr = size as MensSize | BabySize;
            const listArr = this.data[sizeChr];
            const body = Organizer.getBody(this.doc);
            const tempDocHandler = Organizer.tempDocumentHandler({
                items:body,
                mode:this.orgMode,
                cb:Organizer.selectBodyCB as TempDocumentHandlerParams["cb"]
            });
            Organizer.orgInit({
                doc: tempDocHandler.doc,
                mode: this.orgMode,
                quantity: listArr.length,
                sizeConatiner: this.sizeContainer,
                targetSizeChr: this.targetSizeChr
            })
        }
    };

    static orgInit(arg: OrganizeInitParams) {
        const { doc, mode, quantity, sizeConatiner = "JFT", targetSizeChr } = arg;
        const selection = doc.selection as Selection;

        if (quantity < 2) {
            alertDialogSA("minimum length 2 required");
            return;
        };

        const sizeCategory = SIZE_CONTAINER[sizeConatiner as keyof typeof SIZE_CONTAINER];

        const isBaby = isBabySize(targetSizeChr, sizeCategory["BABY"]);

        const targetDim = getDimensionGenderCategory(sizeCategory, targetSizeChr, isBaby);

        let body = Organizer.getBody(doc);

        // *** basic organization start ***

        // center front and back horizontally and vertically center
        alignItems(body[0], body[1], "C");

        // resizing
        resizeSelection(selection, targetDim.width, targetDim.height);

        // *** basic organization end ***

        const groupManager = new GroupManager(body);

        let itemForDimForRowInfo = body[1];

        if(mode === "FB") {
            groupManager.group();
            itemForDimForRowInfo = groupManager.tempGroup as PageItem;
        }

        const dimForRowInfo = Organizer.getDimensionBasedOnMode(itemForDimForRowInfo);

        groupManager.ungroup();

        // get row info 
        const { recommendedIn90, rowIn0, rowIn90 } = getRowInfo(dimForRowInfo, quantity);

        // required doc for fit row
        const rowLength = recommendedIn90 ? Math.ceil(quantity / rowIn90.x) : Math.ceil(quantity / rowIn0.x);

        const {docNeed,perDocRow} = Organizer.calculateDocRowDistribution({
            dim: dimForRowInfo,
            rowLength,
            to90:recommendedIn90
        });

        let organizeBodyXYPrm: OrgBodyItemDir = {
            items:body,
            remaining:rowIn90.remaining,
            startIndex:1,
            fitIn: rowIn90.x,
            doc:doc,
            is90: true,
            quantity,
            docRow:0
        };

        if (recommendedIn90) {
            rotateItems(body,-90);
        } else {
            organizeBodyXYPrm.is90 = false;
            organizeBodyXYPrm.fitIn = rowIn0.x;
            organizeBodyXYPrm.remaining= rowIn0.remaining;
        }

        for (let index = 1; index <= docNeed; index++) {
            organizeBodyXYPrm.docRow = perDocRow;
            const startIndex = (index - 1) * perDocRow + 1;
            organizeBodyXYPrm.startIndex = startIndex;
            Organizer.organizeBodyXY(organizeBodyXYPrm);
            if(index < docNeed) {
                const nestDocManager = Organizer.tempDocumentHandler({
                    items: body,
                    mode,
                    cb: Organizer.selectBodyCB as TempDocumentHandlerParams["cb"]
                });
                organizeBodyXYPrm.doc = nestDocManager.doc;
                // remove root selected items 
                body[0].remove();
                body[1].remove();
                body = Organizer.getBody(nestDocManager.doc);
                organizeBodyXYPrm.items = body;
            } else {
                body[0].remove();
                body[1].remove();
            }


        }
    };

    static organizeBodyXY(arg: OrgBodyItemDir) {
        const { items, quantity, fitIn, is90, startIndex, remaining, doc, docRow } = arg;

        // the items that will be organize as grid layout
        const [fBody, bBody] = items;

        let lastItem: PageItem = bBody;
        let currentRowFirstItem = lastItem;

        const absulateQuatity = roundUpToDivisible(quantity, fitIn);

        for (let i = startIndex; i <= absulateQuatity; i++) {
            logMessage(i.toString())
            let newItem: PageItem;
            if (i > quantity && remaining > 0) {
                newItem = fBody.duplicate();
                moveItemAfter({ base: lastItem, moving: newItem, position: "R", gap: 0.1 * 72 });
                alignItems(currentRowFirstItem, newItem, "B");
            } else {
                newItem = lastItem.duplicate();
                if (i !== startIndex) {
                    moveItemAfter({ base: lastItem, moving: newItem, position: "R", gap: 0.1 * 72 });
                }
            }
            newItem.name = i.toString();

            lastItem = newItem;

            lastItem.zOrder(ZOrderMethod.BRINGTOFRONT);

            if (i === docRow * fitIn) {
                break;
            }

            if (i % fitIn === 0 && i !== absulateQuatity) {
                const tempItem = lastItem.duplicate();
                tempItem.name = (i + 1).toString()
                alignItems(currentRowFirstItem, tempItem, "L");
                moveItemAfter({
                    base: currentRowFirstItem,
                    moving: tempItem,
                    position: "B",
                    gap: 0.1 * 72
                });
                if (is90) {
                    rotateItems(lastItem, -180);
                }
                currentRowFirstItem = tempItem;
                lastItem = tempItem;
                i++
            }

            if (is90 && !(i % fitIn)) {
                rotateItems(lastItem, -180);
            }
        }

        // remove root selected items 
        // fBody.remove();
        // bBody.remove();

        doc.selection = null;

        const actlayerItems = doc.activeLayer.pageItems;

        const itemsArray = [];

        for (let i = 0; i < actlayerItems.length; i++) {
            itemsArray.push(actlayerItems[i]);
        }

        doc.selection = itemsArray;

        alignPageItemsToArtboard(doc.selection, doc);

        doc.selection = null;
    };

    static selectBodyCB (doc:Document) {
        selectItemsInDoc({
            doc: doc,
            items: Organizer.getBody(doc)
        });
    } 

    static getBody(doc: Document,selection:Selection | null = null) {
        const container = selection || doc.activeLayer.pageItems;
        const fBody = findElement(container, (item) => item.name === "FRONT");
        const bBody = findElement(container, (item) => item.name === "BACK");
        if (!fBody || !bBody) {
            throw new Error(`Can't find ${!fBody ? "FRONT" : "BACK"}`);
        }
        return [fBody, bBody ]
    };

    static getDimensionBasedOnMode(items: PageItem): DimensionObject {
        return getWHDimension(getSelectionBounds(items));
    };

    /**
     * Calculates how many pages are needed to fit all rows and how many rows fit per page
     * based on item dimensions and row length.
     * 
     * @static
     * @param {CalculateDocRowDistributionParams} params - The parameters for the calculation
     * @param {Dimension} params.dim - The dimensions of a single item (in inches)
     * @param {number} params.rowLength - The number of items in the row
     * @param {boolean} [params.rotate90=true] - Whether to rotate the dimensions 90 degrees (swaps width and height)
     * @returns {CalculateDocRowDistributionReturn} An object containing:
     *   - pagesNeeded: The total number of pages needed to fit all rows
     *   - rowsPerPage: How many rows fit in a single page
     */
    static calculateDocRowDistribution(params: CalculateDocRowDistributionParams): CalculateDocRowDistributionReturn {
        const CANVAS_MAX_Y = 207 * 72;
        const { dim, rowLength, to90 = true } = params;
        const finalDim: DimensionObject = to90 ? { width: dim.height * 72, height: dim.width * 72 } : { width: dim.width * 72, height: dim.height * 72 };
        const totalHeight = finalDim.height * rowLength;
        const docNeed = Math.ceil(totalHeight / CANVAS_MAX_Y);
        const perDocMaxHeight = Math.ceil(totalHeight / docNeed);
        const perDocRow = Math.ceil(perDocMaxHeight / finalDim.height);
        return { docNeed, perDocRow };
    };

    static tempDocumentHandler(params:TempDocumentHandlerParams) {

        const {mode,items,cb = null} = params;
        
        const ilstDocManager = new IllustratorDocument();
        const tempDoc = ilstDocManager.create(items);

        if(cb) {
            cb(tempDoc);
        }

        if(tempDoc.selection) {

            const selection = tempDoc.selection as Selection;

            const artboardManager = new ArtboardManager(tempDoc);
            // align front and back
            Organizer.alignBasedOnMode(mode, selection);

            // postioning items to horizontally and vertically center based artboard
            alignPageItemsToArtboard(selection, doc, "TC");
            artboardManager.resize(5 * 72, 5 * 72);
        }
        return { doc: tempDoc, ilstDocManager };
    };

    static alignBasedOnMode(mode: Mode, items: Selection) {
        switch (mode) {
            case "B":
                moveItemAfter({
                    base: items[0],
                    moving: items[1],
                    position: "R"
                });
                break;
            case "FB":
                moveItemAfter({
                    base: items[1],
                    moving: items[0],
                    position: "T"
                });
                break;
        }
    };

}