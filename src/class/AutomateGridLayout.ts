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
    private bodyItems: BodyItems | null = null;
    private docItems: PageItem[] | null = null;
    private dimension: DimensionObject;
    private gridLayoutInfo: LayoutInfo;
    private targetSizeChr: ApparelSize;
    private lShapeQuantityOdd: boolean = false;
    private recommendedOrientation: LayoutShapeConstants;
    private filesSeqIndex: number;
    private itemIdx: number = 0;
    private process: Process;
    private data: null | Person[] = null;
    private folderPath: string;
    private rootBodyDimenstion: DimensionObject | null = null; //dimension before initiating body items.

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
        this.folderPath = params.folderPath;

        this.process = params.process;
        this.data = params.data;
        this.dimension = params.dimension;

        if (this.mode !== "PANT") {
            this.bodyItems = Organizer.getBodyItems(this.docItems!);
            this.rootBodyDimenstion = getWHDimension(getSelectionBounds(this.bodyItems[1]));
        } else {
            const pant = Organizer.getPant();
            const [F_L] = Organizer.getPantItems(pant.pageItems);
            this.rootBodyDimenstion = getWHDimension(getSelectionBounds(F_L));
            this.dimension = this.rootBodyDimenstion;
        }

        this.filesSeqIndex = params.filesSeqIndex;
        this.targetSizeChr = params.targetSizeChr;

        this.gridLayoutInfo = new GridLayoutInfo({
            dimension: this.dimension,
            mode: this.mode,
            quantity: this.quantity,
            process: this.process
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

        item.name = this.getItemIndex(0);

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
            this.filesSeqIndex++;
        }

        for (let i = 1; i <= docsNeeded; i++) {

            const fileIndex = (this.filesSeqIndex + i) < 10 ? `0${this.filesSeqIndex + i}` : (this.filesSeqIndex + i).toString();

            const isLastDoc = i === docsNeeded;

            const title = `${fileIndex}-${this.recommendedOrientation === "L" ? "FB-L" : this.mode}${this.mode !== "PANT" ? `-${this.targetSizeChr}` : ``}`;

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

            if (this.recommendedOrientation !== "L") {
                this.alignCenterDocsItems(docsIns.doc);
            }

            this.makeOpacityMask(docsIns.doc);

            if (this.process === "10") {
                docsIns.ilstDocHandler.save(this.folderPath);
                docsIns.ilstDocHandler.close();
            }
        };

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
    private getItemIndex(idx?: number): string {
        const index = idx ?? this.itemIdx;
        const indexStr = index < 10 ? `0${index}` : `${index}`;
        return `${this.recommendedOrientation === "L" ? "FB-L" : this.mode}-${indexStr}`
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
            const lShapeGroup = item.pageItems[0];
            lShapeGroup.remove();
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

            if (this.quantity % 2) {
                this.lShapeQuantityOdd = true
            }
        }
    };

    /**
     * Applies dynamic nano text content and sizing to specific `TextFrame` items inside a given group,
     * based on predefined keyword names and the current layout orientation.
     * 
     * It searches for text frames whose names match `CONFIG.sKeywords` inside specific nested group items.
     * Matching text frames are updated with content from the first entry in `this.data` and resized
     * using `fitNanoSize()` according to the current orientation and group name.
     * 
     * Scanning strategy:
     * - If `mode` is "FB" or `recommendedOrientation` is "L", it scans both front and back groups.
     * - Otherwise, only the back group is scanned.
     * 
     * @param item - The top-level GroupItem that contains the front and/or back groups.
     */
    private applyNano(item: GroupItem): void {
        const nanoObj = this.data![0];

        /**
         * Helper function to extract and apply nano data to text frames within a group.
         *
         * @param group - The GroupItem to scan for matching text frames.
         */
        const extractNanoItems = (group: GroupItem): void => {

            // Determine whether to adjust width or height
            const isWide = !(this.recommendedOrientation === "H" || (this.recommendedOrientation === "L" && group.name === SearchingKeywords.BACK));

            for (let i = 0; i < group.pageItems.length; i++) {
                const child = group.pageItems[i];

                if (
                    child.typename === PageItemType.TextFrame
                    &&
                    nanoObj[child.name] !== undefined
                ) {
                    const textFrame = child as TextFrame;

                    const ininTfBound = getWHDimension({
                        left: child.geometricBounds[0],
                        top: child.geometricBounds[1],
                        right: child.geometricBounds[2],
                        bottom: child.geometricBounds[3],
                    });

                    const initTextDimension = {
                        width: isWide ? ininTfBound.width / 72 : ininTfBound.height / 72,
                        height: isWide ? ininTfBound.height / 72 : ininTfBound.width / 72
                    };
                    // Update text content from nano object
                    textFrame.contents = nanoObj[textFrame.name];

                    const modifiedTfBound = getWHDimension({
                        left: child.geometricBounds[0],
                        top: child.geometricBounds[1],
                        right: child.geometricBounds[2],
                        bottom: child.geometricBounds[3],
                    });

                    const modifiedTextDimension = {
                        width: isWide ? modifiedTfBound.width / 72 : modifiedTfBound.height / 72,
                        height: isWide ? modifiedTfBound.height / 72 : modifiedTfBound.width / 72
                    };

                    if (modifiedTextDimension.width > (initTextDimension.width)) {
                        // Apply resizing
                        this.fitNanoSize({
                            isWide,
                            textFrame,
                            initTextDimension,
                            modifiedTextDimension
                        });
                    }

                    if (CONFIG.outlineNANO) {
                        textFrame.createOutline();
                    }
                }
            }
        };

        if (this.mode === "PANT") {
            extractNanoItems(item);
        } else if (this.mode === "FB" || this.recommendedOrientation === "L") {
            const front = item.pageItems[0] as GroupItem;
            const back = item.pageItems[1] as GroupItem;

            extractNanoItems(front);
            extractNanoItems(back);
        } else {
            const back = item.pageItems[0] as GroupItem;
            extractNanoItems(back);
        }

        this.data!.shift();
    };

    /**
     * Resizes a `TextFrame` to fit the calculated nano size based on the given item type and current orientation.
     * 
     * The width (or height) is calculated using a base size and a dynamic gap value derived from the current
     * document's width. The result is scaled by 72 (Illustrator points per inch).
     * 
     * If `isWide` is true, the text frame's width is adjusted; otherwise, the height is adjusted.
     *
     * @param {FitNanoParams} params - The parameters used to fit the nano size.
     */
    private fitNanoSize = (params: FitNanoParams) => {

        const distance = this.dimension.width / this.rootBodyDimenstion!.width;

        const fitWidth = params.initTextDimension.width * (distance * 1.15);

        const tf = params.textFrame;

        const scaleFactor = fitWidth / params.modifiedTextDimension.width;
        if (params.isWide) {
            tf.resize(scaleFactor * 100, 100); // Scale X, keep Y
        } else {
            tf.resize(100, scaleFactor * 100,); // Scale X, keep Y
        }
    };

    private writeDataInBody(item: GroupItem) {

        if (this.process === "01" && !this.data) {
            return
        }

        if (this.recommendedOrientation === "L") {
            this.applyNano(item.pageItems[1] as GroupItem);
            if (this.data!.length) {
                this.applyNano(item.pageItems[0] as GroupItem);
            }
        } else {
            this.applyNano(item);
        }
    };

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

        /*
        rows = 3
        cols = 3
        mode = FB
        */

        // Extract parameters from the input object for easier access
        const { rows, cols, isLastDoc, initItem } = params;

        const referenceItem = initItem;

        // Calculate gap distance in points (72 points = 1 inch) for item spacing
        const gap = CONFIG.Items_Gap * 72;

        let prevItem: PageItem = referenceItem;

        // Track the first item of current column for vertical alignment
        let curColFirstRow = prevItem;

        // Main loop: iterate through each column of the grid
        for (let col = 1; col <= cols; col++) {

            if (this.itemIdx >= this.quantity) {
                referenceItem.remove();
                break
            }

            for (let row = 1; row <= rows; row++) {

                const copyItem = referenceItem.duplicate(referenceItem.parent, ElementPlacement.PLACEATEND);

                this.itemIdx++;

                if (this.recommendedOrientation === "L") {
                    this.itemIdx++;
                }

                copyItem.name = this.getItemIndex();


                if (row === 1) {
                    prevItem = copyItem;
                    curColFirstRow = copyItem;
                } else {
                    moveItemAfter({
                        base: prevItem,
                        moving: copyItem,
                        gap,
                        position: "R"
                    })

                    prevItem = copyItem;


                }

                this.writeDataInBody(prevItem as GroupItem);

                if (this.itemIdx >= this.quantity) {
                    break
                }
            }

            if (this.itemIdx >= this.quantity) {
                referenceItem.remove();
                break
            }

            prevItem = curColFirstRow;

            if (col === cols) {
                referenceItem.remove();
            } else {
                moveItemAfter({
                    base: prevItem,
                    moving: referenceItem,
                    gap,
                    position: "B"
                })
            }

        };

        if (isLastDoc) {
            this.removeSingleItemFromLShape(prevItem);
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

        const docsIns = this.documentCreator({ title, items: this.bodyItems! });

        const initiateItem = this.initiateBody(docsIns.doc);

        const [front, back] = arrayFrom(initiateItem.pageItems);

        back.remove();

        Organizer.smallArtboard(docsIns.doc);

        alignPageItemsToArtboard(front, docsIns.doc);

        this.makeOpacityMask(docsIns.doc);

        if (this.process === "10") {
            docsIns.ilstDocHandler.save(this.folderPath);
            docsIns.ilstDocHandler.close();
        }
    };

    /**
     * Align vertically & horizontally center the document page items
     * @param {Document} doc - Document Instance
     */
    private alignCenterDocsItems(doc: Document) {
        const pagesItems = arrayFrom(doc.activeLayer.pageItems);
        this.flipBackToX(pagesItems);
        alignPageItemsToArtboard(pagesItems, doc);
    };

    /**
     * Applies an opacity mask to the current active layer of a given document.
     * 
     * This method searches for page items with names matching `OpacityMask` or `OpacityMaskInvert`,
     * ungroups them if necessary, and then applies the associated action via `doScript`.
     * 
     * The masking logic is defined externally (in the Illustrator action set "JFT-Rapid"), and
     * this method acts as a controller to automate that process for relevant page items.
     * 
     * The method is only executed if the global `CONFIG.opacityMask` flag is enabled.
     *
     * @private
     * @param doc - The target Illustrator `Document` whose active layer will be searched for mask items.
     * @throws {Error} If no opacity mask items are found in the active layer.
     */
    private makeOpacityMask(doc: Document) {
        // Exit early if opacity masking is disabled via configuration
        if (!CONFIG.opacityMask) {
            return
        }
        // Get all page items from the active layer of the provided document
        const pageItems = doc.activeLayer.pageItems;

        // Call Organizer's method to find and apply the mask logic to those page items
        Organizer.makeOpacityMask(pageItems);
    }

    /**
     * Flips items back to the correct orientation based on their position (row index),
     * only when the mode is "B" and the recommended orientation is "H".
     * Items at even-numbered positions (2, 4, 6, ...) are rotated 180 degrees.
     *
     * @param {PageItem[]} items - The list of items to potentially rotate.
     * @returns {void}
     */
    private flipBackToX(items: PageItem[]): void {

        if (this.mode === "B" && this.recommendedOrientation === "H") {
            for (let i = 1; i <= items.length; i++) {
                const item = items[i - 1];

                if (i % 2 === 0) {
                    rotateItems(item, 180);
                }

            }
        }
    };

}

interface AutomateGridLayoutConst {
    mode: Mode;
    quantity: number;
    dimension: DimensionObject;
    targetSizeChr: ApparelSize;
    filesSeqIndex: number;
    process: Process;
    data: null | Person[];
    folderPath: string;
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

interface FitNanoParams {
    textFrame: TextFrame;
    isWide: boolean;
    initTextDimension: DimensionObject;
    modifiedTextDimension: DimensionObject;
}