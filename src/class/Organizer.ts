/**
 * A class that handles organizing and arranging items in an Illustrator document
 * based on size, quantity, and layout mode.
 */
class Organizer {
    private data: DataListContainer;
    private targetSizeChr: MensSize | BabySize;
    private orgMode: Mode;
    private doc: Document;
    private sizeContainer: string;

    /**
     * Constructs an Organizer instance with the provided parameters.
     * @param {OrganizerParams} arg - Configuration parameters for the organizer
     * @property {string} arg.dataString - JSON string containing size data
     * @property {MensSize|BabySize} arg.targetSizeChr - Target size character
     * @property {Mode} arg.mode - Organization mode (B, FB, etc.)
     * @property {Document} [arg.doc=app.activeDocument] - Target Illustrator document
     * @property {string} [arg.sizeContainer="JFT"] - Size container identifier
     */
    constructor(arg: OrganizerParams) {
        const {
            dataString,
            targetSizeChr,
            mode,
            doc = app.activeDocument,
            sizeContainer = "JFT",
        } = arg;
        this.data = JSONSA.parse(dataString) as DataListContainer;
        this.targetSizeChr = targetSizeChr;
        this.orgMode = mode;
        this.sizeContainer = sizeContainer;
        this.doc = doc;
    }

    /**
     * Main organization method that processes all sizes in the data container.
     * Creates temporary documents and organizes items according to the specified mode.
     */
    public organize(): void {
        for (const size in this.data) {
            const sizeChr = size as MensSize | BabySize;
            const listArr = this.data[sizeChr];
            const body = Organizer.getBody(this.doc);

            const tempDocHandler = Organizer.createTempDocument({
                items: body,
                mode: this.orgMode,
                cb: Organizer.selectBodyCB as TempDocumentHandlerParams["cb"],
            });

            Organizer.initializeOrganization({
                doc: tempDocHandler.doc,
                mode: this.orgMode,
                quantity: listArr.length,
                sizeContainer: this.sizeContainer,
                targetSizeChr: this.targetSizeChr,
            });
        }
    }

    /**
     * Retrieves the front and back body items from a document or selection.
     * @static
     * @param {Document} doc - The Illustrator document to search in
     * @param {Selection|null} [selection=null] - Optional selection to search within
     * @returns {[PageItem, PageItem]} Tuple containing front and back body items
     * @throws {Error} If either FRONT or BACK items cannot be found
     */
    static getBody(
        doc: Document,
        selection: Selection | null = null
    ): [PageItem, PageItem] {
        const container = selection || doc.activeLayer.pageItems;
        const frontBody = findElement(container, (item) => item.name === "FRONT");
        const backBody = findElement(container, (item) => item.name === "BACK");

        if (!frontBody || !backBody) {
            throw new Error(`Can't find ${!frontBody ? "FRONT" : "BACK"}`);
        }

        return [frontBody, backBody];
    }

    /**
     * Callback function that selects body items in a document.
     * @static
     * @param {Document} doc - The document where selection should occur
     */
    static selectBodyCB(doc: Document): void {
        selectItemsInDoc({
            doc: doc,
            items: Organizer.getBody(doc),
        });
    }

    /**
     * Calculates the dimensions of a page item.
     * @static
     * @param {PageItem} item - The Illustrator page item to measure
     * @returns {DimensionObject} Object containing width and height in points
     */
    static getDimensionForItem(item: PageItem): DimensionObject {
        return getWHDimension(getSelectionBounds(item));
    }

    /**
     * Creates a temporary document for organizing operations.
     * @static
     * @param {TempDocumentHandlerParams} params - Parameters for temp document creation
     * @property {Mode} params.mode - Organization mode
     * @property {Selection} params.items - Items to include in the temp document
     * @property {Function} [params.cb=null] - Optional callback to execute on the new document
     */
    static createTempDocument(params: TempDocumentHandlerParams) {
        const { mode, items, cb = null } = params;

        const illustratorDocManager = new IllustratorDocument();
        const tempDoc = illustratorDocManager.create(items);

        if (cb) {
            cb(tempDoc);
        }

        if (tempDoc.selection) {
            const selection = tempDoc.selection as Selection;
            const artboardManager = new ArtboardManager(tempDoc);

            // Align front and back
            Organizer.alignItemsByMode(mode, selection);

            // Position items to horizontally and vertically center based on artboard
            alignPageItemsToArtboard(selection, tempDoc, "TC");
            artboardManager.resize(5 * 72, 5 * 72);
        }

        return { doc: tempDoc, docManager: illustratorDocManager };
    }
    /**
     * Aligns items according to the specified organization mode.
     * @static
     * @param {Mode} mode - The organization mode (B, FB, etc.)
     * @param {Selection} items - The items to align
     */
    static alignItemsByMode(mode: Mode, items: Selection): void {
        switch (mode) {
            case "B":
                moveItemAfter({
                    base: items[0],
                    moving: items[1],
                    position: "R",
                });
                break;
            case "FB":
                moveItemAfter({
                    base: items[1],
                    moving: items[0],
                    position: "T",
                });
                break;
            // Add case for "PANT" if needed
        }
    }

    /**
     * Calculates document distribution for rows based on dimensions and quantity.
     * @static
     * @param {CalculateDocRowDistributionParams} params - Calculation parameters
     * @property {DimensionObject} params.dim - Item dimensions
     * @property {number} params.rowLength - Number of items per row
     * @property {boolean} [params.to90=true] - Whether to consider 90° rotation
     * @returns {CalculateDocRowDistributionReturn} Object containing document needs and rows per doc
     */
    static calculateDocRowDistribution(
        params: CalculateDocRowDistributionParams
    ): CalculateDocRowDistributionReturn {
        const CANVAS_MAX_HEIGHT = 207 * 72; // Convert inches to points
        const { dim, rowLength, to90 = true } = params;

        // Apply dimension transformation if rotated 90 degrees
        const finalDim: DimensionObject = to90
            ? { width: dim.height * 72, height: dim.width * 72 }
            : { width: dim.width * 72, height: dim.height * 72 };

        const totalHeight = finalDim.height * rowLength;
        const docsNeeded = Math.ceil(totalHeight / CANVAS_MAX_HEIGHT);
        const maxHeightPerDoc = Math.ceil(totalHeight / docsNeeded);
        const rowsPerDoc = Math.ceil(maxHeightPerDoc / finalDim.height);

        return { docNeed: docsNeeded, perDocRow: rowsPerDoc };
    }
    /**
     * Initializes the organization process with the given parameters.
     * @static
     * @param {OrganizeInitParams} arg - Organization parameters
     * @property {Document} arg.doc - Target document
     * @property {Mode} arg.mode - Organization mode
     * @property {number} arg.quantity - Number of items to organize
     * @property {string} [arg.sizeContainer="JFT"] - Size container identifier
     * @property {MensSize|BabySize} arg.targetSizeChr - Target size character
     */
    static initializeOrganization(arg: OrganizeInitParams): void {
        const { doc, mode, quantity, sizeContainer = "JFT", targetSizeChr } = arg;
        const selection = doc.selection as Selection;

        if (quantity < 2) {
            alertDialogSA("Minimum length 2 required");
            return;
        }

        const sizeCategory =
            SIZE_CONTAINER[sizeContainer as keyof typeof SIZE_CONTAINER];
        const isBaby = isBabySize(targetSizeChr, sizeCategory["BABY"]);
        const targetDim = getDimensionGenderCategory(
            sizeCategory,
            targetSizeChr,
            isBaby
        );

        let body = Organizer.getBody(doc);

        // Basic organization - center front and back horizontally and vertically
        alignItems(body[0], body[1], "C");

        // Resize items to target dimensions
        resizeSelection(selection, targetDim.width, targetDim.height);

        const groupManager = new GroupManager(body);
        let itemForDimensionCalculation = body[1];

        if (mode === "FB") {
            groupManager.group();
            itemForDimensionCalculation = groupManager.tempGroup as PageItem;
        }

        const itemDimensions = Organizer.getDimensionForItem(
            itemForDimensionCalculation
        );
        groupManager.ungroup();

        // Get row information
        const { recommendedIn90, rowIn0, rowIn90 } = getRowInfo(
            itemDimensions,
            quantity
        );

        // Calculate required docs for fitting rows
        const useRotation = recommendedIn90;
        const rowsPerDirection = useRotation ? rowIn90 : rowIn0;
        const rowLength = Math.ceil(quantity / rowsPerDirection.x);

        const { docNeed, perDocRow } = Organizer.calculateDocRowDistribution({
            dim: itemDimensions,
            rowLength,
            to90: useRotation,
        });

        // If recommended orientation is 90 degrees, rotate items
        if (useRotation) {
            rotateItems(body, -90);
        }

        // Initialize parameters for organizing layout
        const organizeParams: OrgBodyItemDir = {
            items: body,
            remaining: useRotation ? rowIn90.remaining : rowIn0.remaining,
            startIndex: 1,
            fitIn: useRotation ? rowIn90.x : rowIn0.x,
            doc: doc,
            is90: useRotation,
            quantity,
            docRow: 0,
        };

        // Process and organize items across multiple documents if needed
        Organizer.processMultipleDocuments(organizeParams, docNeed, perDocRow);
    }

    /**
    * Handles organization across multiple documents when content exceeds single document capacity.
    * @static
    * @param {OrgBodyItemDir} params - Organization parameters
    * @param {number} docNeed - Total number of documents required
    * @param {number} rowsPerDoc - Number of rows per document
    */
    static processMultipleDocuments(params: OrgBodyItemDir, docNeed: number, rowsPerDoc: number): void {
        let { items, doc, quantity } = params;

        // Calculate where the "remaining" items start (after regular quantity)
        const remainingStartIndex = quantity + 1;

        for (let index = 1; index <= docNeed; index++) {
            // Update parameters for current document
            params.docRow = rowsPerDoc;
            const startIndex = (index - 1) * rowsPerDoc * params.fitIn + 1;
            params.startIndex = startIndex;

            // Organize items in the current document with explicit remaining item index
            Organizer.organizeItemsInGrid({
                ...params,
                remainingStartIndex: remainingStartIndex
            });

            // If not the last document, create a new temp document
            if (index < docNeed) {
                const [frontBody, backBody] = items;

                const newDocHandler = Organizer.createTempDocument({
                    items: items,
                    mode: params.orgMode || "FB", // Use the original mode if available
                    cb: Organizer.selectBodyCB as TempDocumentHandlerParams["cb"]
                });

                frontBody.remove();
                backBody.remove();

                doc = newDocHandler.doc;
                items = Organizer.getBody(doc);

                // Update params for next iteration
                params.doc = doc;
                params.items = items;
            } else {
                // Remove original items when done with all documents
                items[0].remove();
                items[1].remove();
            }
        }
    }

    /**
     * Organizes items in a grid pattern within a document.
     * @static
     * @param {OrgBodyItemDir} arg - Grid organization parameters
     * @property {Selection} arg.items - Items to organize
     * @property {number} arg.quantity - Total quantity of items
     * @property {number} arg.fitIn - Number of items that fit in a row
     * @property {boolean} arg.is90 - Whether items are rotated 90°
     * @property {number} arg.startIndex - Starting index for item numbering
     * @property {number} arg.remaining - Number of remaining items to handle
     * @property {Document} arg.doc - Target document
     * @property {number} arg.docRow - Current document row count
     * @property {number} [arg.remainingStartIndex] - Starting index for remaining items
     */
    static organizeItemsInGrid(arg: OrgBodyItemDir): void {
        const {
            items,
            quantity,
            fitIn,
            is90,
            startIndex,
            remaining,
            doc,
            docRow,
            remainingStartIndex = quantity + 1  // Default to position after last regular item
        } = arg;

        const [frontBody, backBody] = items;

        let lastItem: PageItem = backBody;
        let currentRowFirstItem = lastItem;

        // Round up quantity to be divisible by the number that fits in a row
        const absoluteQuantity = roundUpToDivisible(quantity, fitIn);

        // Maximum item index for this document
        const maxItemIndexForDoc = Math.min(absoluteQuantity, startIndex + (docRow * fitIn) - 1);

        for (let i = startIndex; i <= maxItemIndexForDoc; i++) {
            logMessage(`Processing item #${i}`);

            let newItem: PageItem;

            // Handle remaining items (after quantity) differently by using frontBody
            if (i >= remainingStartIndex && remaining > 0) {
                // For remaining items, duplicate the front body instead
                newItem = frontBody.duplicate();
                moveItemAfter({
                    base: lastItem,
                    moving: newItem,
                    position: "R",
                    gap: 0.1 * 72
                });
                alignItems(currentRowFirstItem, newItem, "B");
            } else {
                // For regular items, continue the pattern by duplicating the last item
                newItem = lastItem.duplicate();
                if (i !== startIndex) {
                    moveItemAfter({
                        base: lastItem,
                        moving: newItem,
                        position: "R",
                        gap: 0.1 * 72
                    });
                }
            }

            // Name the item with its index
            newItem.name = i.toString();
            lastItem = newItem;
            lastItem.zOrder(ZOrderMethod.BRINGTOFRONT);

            // Check if this is the end of a row (but not the very last item)
            if (i % fitIn === 0 && i !== maxItemIndexForDoc) {
                // Create first item of the new row
                const nextRowFirstItem = lastItem.duplicate();
                nextRowFirstItem.name = (i + 1).toString();

                // Align with the first item of the current row
                alignItems(currentRowFirstItem, nextRowFirstItem, "L");

                // Move below the current row
                moveItemAfter({
                    base: currentRowFirstItem,
                    moving: nextRowFirstItem,
                    position: "B",
                    gap: 0.1 * 72
                });

                // Rotate if needed for alternating pattern
                if (is90) {
                    rotateItems(lastItem, -180);
                }

                // Update tracking variables
                currentRowFirstItem = nextRowFirstItem;
                lastItem = nextRowFirstItem;
                i++;
            }

            // Rotate items in alternating pattern if needed
            if (is90 && i % fitIn === 0) {
                rotateItems(lastItem, -180);
            }
        }

        // Clear selection and prepare to align all items to artboard
        doc.selection = null;

        // Select all items in the active layer
        const activeLayerItems = doc.activeLayer.pageItems;
        const itemsToSelect = [];

        for (let i = 0; i < activeLayerItems.length; i++) {
            itemsToSelect.push(activeLayerItems[i]);
        }

        // Select all items and align them to the artboard
        doc.selection = itemsToSelect;
        alignPageItemsToArtboard(doc.selection, doc);
        doc.selection = null;
    }
}

// ========== Type Definitions ==========

interface OrganizerParams {
    dataString: string;
    mode: Mode;
    targetSizeChr: MensSize | BabySize;
    doc?: Document;
    sizeContainer?: string;
}

interface OrganizeInitParams {
    doc: Document;
    quantity: number;
    mode: Mode;
    sizeContainer?: string;
    targetSizeChr: MensSize | BabySize;
}

interface OrgBodyItemDir {
    items: Selection;
    quantity: number;
    remaining: number;
    doc: Document;
    docRow: number;
    fitIn: number;
    startIndex: number;
    is90: boolean;
    orgMode?: Mode;           // Added to pass mode information
    remainingStartIndex?: number; // Added to track where remaining items start
}

interface CalculateDocRowDistributionParams {
    dim: DimensionObject;
    rowLength: number;
    to90?: boolean;
}

interface CalculateDocRowDistributionReturn {
    docNeed: number;
    perDocRow: number;
}
interface TempDocumentHandlerParams {
    items: Selection;
    mode: Mode;
    cb?: <T = unknown>(doc: Document) => T;
}