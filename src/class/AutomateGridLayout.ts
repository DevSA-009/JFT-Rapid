/**
 * Automates the creation and layout of grid-based documents in Adobe Illustrator.
 * 
 * This class handles the process of taking selected page items and arranging them
 * in a grid layout across one or more documents. It supports different modes (A, B),
 * orientations (L-shape, Portrait, Landscape), and handles various sizing and positioning
 * requirements for apparel design layouts.
 * 
 * @example
 * ```typescript
 * const gridLayout = new AutomateGridLayout({
 *   mode: "FB",
 *   quantity: 12,
 * });
 * ```
 */

class AutomateGridLayout {
    private mode: Mode;
    private quantity: number;
    private bodyItems: BodyItems;
    private docItems: PageItem[] | null = null;
    private dimension: DimensionObject;
    private gridLayoutInfo: LayoutInfo;
    private targetSizeChr: ApparelSize;
    private lShapeQuantityOdd: boolean = false;
    private recommendedOrientation: LayoutShapeConstants;
    private filesSeqIndex: number;
    private itemIdx: number = 1; // that is next body item serial
    private process: "01" | "10" = "01";

    /**
     * Creates a new AutomateGridLayout instance and initiates the grid layout process.
     * 
     * Initializes all necessary properties, captures the current document selection,
     * calculates grid layout information, and processes the documents automatically.
     * 
     * @param params - Configuration object containing layout parameters
     * @param params.mode - Layout operation mode ("A" or "B")
     * @param params.quantity - Number of items to process in the grid
     * @param params.dimension - Target dimensions for the layout
     * @param params.targetSizeChr - Target apparel size character
     * @param params.filesSeqIndex - Sequential index for file naming
     */
    constructor(params: AutomateGridLayoutConst) {
        this.quantity = params.quantity;
        this.mode = params.mode;
        this.setMainDocSelection();
        this.bodyItems = Organizer.getBodyItems(this.docItems!);
        this.dimension = params.dimension;
        this.filesSeqIndex = params.filesSeqIndex;
        this.targetSizeChr = params.targetSizeChr;

        this.gridLayoutInfo = new GridLayoutInfo({
            dimension: this.dimension,
            mode: this.mode,
            quantity: this.quantity
        }).getLayoutInfo();
        this.recommendedOrientation = this.gridLayoutInfo.orientation;

        this.initEvenQuanityForLShape();

        this.processDocuments();
    };

    /**
     * Captures and stores the current document selection while clearing the active selection.
     * 
     * Retrieves all page items from the active layer and converts them to an array,
     * then clears the current selection to prevent interference with subsequent operations.
     * 
     * @private
     * @throws {Error} If no items are selected in Illustrator
     */
    private setMainDocSelection() {
        this.docItems = Organizer.pageItemsToArray(app.activeDocument.activeLayer.pageItems);
        app.activeDocument.selection = null;
    };

    /**
     * Creates a new Illustrator document with specified items.
     * 
     * Instantiates a new document using the IllustratorDocument class and populates
     * it with the provided items or falls back to the stored document items.
     * 
     * @private
     * @param params - Optional configuration for document creation
     * @param params.items - Items to include in the new document (defaults to stored selection)
     * @param params.title - Document title for identification (default: "JFT-Rapid")
     * @returns Object containing the created document and its handler instance
     */
    private documentCreator(params?: DocumentCreatorParams): IllustratorDocumentResult {
        const items = params?.items || this.docItems;
        const title = params?.title || "JFT-Rapid";
        const ilstDocHandler = new IllustratorDocument(title);
        const doc = ilstDocHandler.create(items);
        return {
            doc,
            ilstDocHandler
        };
    };

    /**
     * Initializes body items for the current document with specified layout configuration.
     * 
     * Creates an ItemsInitiater instance to process body items based on the current mode,
     * orientation, dimension, and target size parameters. This prepares the items for
     * grid layout processing.
     * 
     * @private
     * @param doc - The Illustrator document to process
     * @returns The initiated group item ready for layout processing
     */
    private initiateBody(doc: Document): GroupItem {
        const pageItems = Organizer.pageItemsToArray(doc.activeLayer.pageItems);
        const bodyItems = Organizer.getBodyItems(pageItems);

        const itemsInitiater = new ItemsInitiater({
            bodyItems,
            mode: this.mode,
            orientation: this.recommendedOrientation,
            dimension: this.dimension,
            targetSizeChr: this.targetSizeChr
        });

        return itemsInitiater.initiatedItem();
    };

    /**
     * Aligns the initiated body item to the top-center of the artboard and performs mode-specific processing.
     * 
     * Positions the group item at the top-center of the artboard, then applies mode-specific
     * and adjusts artboard size after alignment.
     * 
     * @private
     * @param item - The group item to align and process
     * @param doc - The target Illustrator document
     */
    private alignTopInitBody(item: GroupItem, doc: Document): void {

        alignPageItemsToArtboard(item, doc, "TC");

        if (this.mode === "B" && this.recommendedOrientation !== "L") {
            const front = item.pageItems[0];
            front.remove();
        }

        item.name = this.getItemIndex();

        if (this.recommendedOrientation === "L") {
            this.itemIdx++;
        }

        this.itemIdx++;

        Organizer.smallArtboard(doc);
    };

    /**
     * Main processing method that creates and populates all required documents with grid layouts.
     * 
     * Handles the complete document processing workflow including quantity adjustments for
     * L-shape layouts, document creation, item initialization, alignment, and grid layout
     * application. Creates multiple documents as needed based on the calculated grid requirements.
     * 
     * @private
     */
    private processDocuments() {

        let initiatedPant: null | GroupItem;

        if (this.mode === "PANT") {
            initiatedPant = Organizer.getPant();
        }

        if (this.lShapeQuantityOdd) {
            this.quantity++
        }

        const { docsNeeded, colsPerDoc } = this.gridLayoutInfo.requiredDocuments;

        if (this.mode === "B" && this.recommendedOrientation !== "L") {
            this.createFrontDoc();
            this.filesSeqIndex++
        }

        for (let i = 1; i <= docsNeeded; i++) {

            const fileIndex = (this.filesSeqIndex + i) < 10 ? `0${this.filesSeqIndex + i}` : (this.filesSeqIndex + i).toString();

            const isLastDoc = i === docsNeeded;

            const title = `${fileIndex}-${this.mode}${this.mode !== "PANT" ? `-${this.targetSizeChr}` : ``}`;

            const itemForNewDoc = this.mode === "PANT" ? [initiatedPant!] : this.bodyItems as Selection;

            const docsIns = this.documentCreator({ title, items: itemForNewDoc });

            const initiatedItem = this.mode === "PANT" ? Organizer.getPant(docsIns.doc) : this.initiateBody(docsIns.doc);

            this.alignTopInitBody(initiatedItem, docsIns.doc);

            this.processGridLayout({
                cols: colsPerDoc,
                doc: docsIns.doc,
                initItem: initiatedItem,
                rows: this.gridLayoutInfo.rows,
                isLastDoc
            });

            this.alignCenterDocsItems(docsIns.doc);
        }

        if (this.lShapeQuantityOdd) {
            this.quantity--
        }
    };

    /**
     * Generates a formatted index string for item naming.
     * 
     * Creates a standardized naming convention for items using the current mode
     * and item index, with zero-padding for single-digit numbers.
     * 
     * @private
     * @returns Formatted index string in the format "{mode}-{paddedIndex}"
     */
    private getItemIndex(): string {
        const indexStr = this.itemIdx < 10 ? `0${this.itemIdx}` : `${this.itemIdx}`;
        return `${this.mode}-${indexStr}`
    };

    /**
     * Removes specific items from L-shape layout when quantity is odd.
     * 
     * For L-shape orientations with odd quantities, removes the front and back
     * items (indices 2 and 3) from the specified page item to maintain proper
     * layout balance.
     * 
     * @private
     * @param item - The page item containing items to potentially remove
     */
    private removeSingleItemFromLShape(item: PageItem) {

        if (this.lShapeQuantityOdd) {
            const front = item.pageItems[0];
            const back = item.pageItems[1];
            front.remove();
            back.remove();
        }
    };

    /**
     * Initializes settings for L-shape layout with even/odd quantity handling.
     * 
     * Sets the starting item index to 2 for L-shape orientations and determines
     * if the quantity is odd, setting the appropriate flag for special handling
     * during the layout process.
     * 
     * @private
     */
    private initEvenQuanityForLShape() {

        if (this.recommendedOrientation === "L") {

            this.itemIdx = 2;

            if (this.quantity % 2) {
                this.lShapeQuantityOdd = true
            }
        }
    };

    private writeDataInBody(data: any) { };

    /**
     * Creates and arranges items in a grid layout pattern within the specified document.
     * 
     * Implements the core grid layout algorithm by duplicating and positioning items
     * in rows and columns. Handles gap spacing, item naming, L-shape specific processing,
     * and ensures proper alignment and positioning throughout the grid creation process.
     * 
     * @private
     * @param params - Grid layout configuration parameters
     * @param params.rows - Number of rows in the grid
     * @param params.cols - Number of columns in the grid
     * @param params.doc - Target document for the grid layout
     * @param params.initItem - Initial item to use as the grid template
     */
    private processGridLayout(params: ProcessGridLayoutParams) {
        const { rows, cols, doc, isLastDoc, initItem } = params;

        const gap = CONFIG.Items_Gap * 72;

        let prevBody: PageItem = initItem;

        let curColFirstRow = initItem;

        for (let col = 1; col <= cols; col++) {
            for (let row = 1; row < rows; row++) {
                if (this.itemIdx > this.quantity) {
                    this.writeDataInBody(prevBody);
                    break;
                }

                const copiedBody = prevBody.duplicate(
                    prevBody.parent,
                    ElementPlacement.PLACEATEND
                );

                copiedBody.name = this.getItemIndex();

                moveItemAfter({
                    base: prevBody,
                    moving: copiedBody,
                    position: "R",
                    gap,
                });

                this.writeDataInBody(prevBody);

                prevBody = copiedBody;

                if (this.recommendedOrientation === "L") {
                    this.itemIdx++;
                }

                this.itemIdx++;
            }

            if (cols > 1 && col < cols) {
                if (this.itemIdx > this.quantity) {
                    this.writeDataInBody(prevBody);
                    break;
                }

                const copiedBody = prevBody.duplicate(
                    prevBody.parent,
                    ElementPlacement.PLACEATEND
                );

                copiedBody.name = this.getItemIndex();

                alignItems(curColFirstRow, copiedBody, "L");

                moveItemAfter({
                    base: prevBody,
                    moving: copiedBody,
                    position: "B",
                    gap,
                });

                this.writeDataInBody(prevBody);

                prevBody = copiedBody;

                curColFirstRow = prevBody;

                if (this.recommendedOrientation === "L") {
                    this.itemIdx++;
                }

                this.itemIdx++;
            }
        }

        if (isLastDoc) {
            this.removeSingleItemFromLShape(prevBody);
        }
    };

    /**
     * Creates and initializes a front document for a file sequence.
     * 
     * This method generates a new document title based on the current file index, size, and quantity.
     * It creates a document extracts the front body, removes the back body,
     * and aligns the front item to the artboard XY center.
     * 
     * @remarks
     * - The file index is formatted with a leading zero if less than 10.
     * - Only the front side of the document is kept; the back side is removed.
     * - The remaining front item is aligned to the artboard XY center.
     * 
     * @private
     */
    private createFrontDoc() {

        const fileIndex = (this.filesSeqIndex + 1) < 10 ? `0${this.filesSeqIndex + 1}` : (this.filesSeqIndex + 1).toString();

        const title = `${fileIndex}-F-${this.targetSizeChr}-${this.quantity} PCS`;

        const docsIns = this.documentCreator({ title, items: this.bodyItems });

        const initiateItem = this.initiateBody(docsIns.doc);

        const [front, back] = arrayFrom(initiateItem.pageItems);

        back.remove();

        Organizer.smallArtboard(docsIns.doc);

        alignPageItemsToArtboard(front, docsIns.doc);
    };

    /**
     * Align vertically & horizontally center the document page items
     * @param {Document} doc - Document Instance
     */
    private alignCenterDocsItems(doc: Document) {
        const pagesItems = arrayFrom(doc.activeLayer.pageItems);
        alignPageItemsToArtboard(pagesItems, doc);
    };

}

interface AutomateGridLayoutConst {
    mode: Mode;
    quantity: number;
    dimension: DimensionObject;
    targetSizeChr: ApparelSize;
    filesSeqIndex: number;
}

interface DocumentCreatorParams {
    items?: Selection,
    title?: string
}

/**
 * Configuration parameters for AutomateGridLayout constructor
 */
interface AutomateGridLayoutConst {
    /** Layout operation mode */
    mode: Mode;
    /** Number of items to process */
    quantity: number;
}

/**
 * Parameters for document creation
 */
interface DocumentCreatorParams {
    /** Optional items to include in document */
    items?: PageItem[];
    /** Optional document title */
    title?: string;
}

/**
 * Result from document creation methods
 */
interface IllustratorDocumentResult {
    /** Created Illustrator document */
    doc: Document;
    /** Handler instance for the document */
    ilstDocHandler: IllustratorDocument;
}

interface ProcessGridLayoutParams {
    readonly doc: Document;
    readonly initItem: PageItem;
    readonly cols: number;
    readonly rows: number;
    readonly isLastDoc: boolean;
}