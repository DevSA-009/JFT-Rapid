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
    private itemIdx: number = 1; // that is next body item serial
    private process: Process;
    private data: null | Person[] = null;
    private folderPath: string;
    private rootBodyDimenstion: DimensionObject | null = null; //dimension before initiating body items.
    private reachedEnd: boolean = false;
    private initTextFramesDimension: { [groupName: string]: { [childName: string]: any } } = {};

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

        if (this.mode !== "PANT") {
            this.bodyItems = Organizer.getBodyItems(this.docItems!);
            this.rootBodyDimenstion = getWHDimension(getSelectionBounds(this.bodyItems[0]))
        }
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

            if (this.process === "10") {
                docsIns.ilstDocHandler.save(this.folderPath);
                docsIns.ilstDocHandler.close();
            }

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

            this.itemIdx = 2;

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
            for (let i = 0; i < group.pageItems.length; i++) {
                const child = group.pageItems[i];

                if (
                    arrayIncludes(CONFIG.sKeywords, child.name) &&
                    child.typename === PageItemType.TextFrame
                ) {
                    const textFrame = child as TextFrame;

                    let initTextDimension = { width: textFrame.width / 72, height: textFrame.height / 72 };

                    if (!(this.initTextFramesDimension[group.name]?.[textFrame.name])) {
                        // Ensure the group exists
                        if (!this.initTextFramesDimension[group.name]) {
                            this.initTextFramesDimension[group.name] = {};
                        }

                        // Now it's safe to assign
                        this.initTextFramesDimension[group.name][textFrame.name] = initTextDimension;
                    }
                    initTextDimension = this.initTextFramesDimension[group.name][textFrame.name];


                    // Update text content from nano object
                    textFrame.contents = nanoObj[textFrame.name];

                    const modifiedTextDimension = { width: textFrame.width / 72, height: textFrame.height / 72 };

                    // Determine whether to adjust width or height
                    const isWide = !(this.recommendedOrientation === "H" || (this.recommendedOrientation === "L" && group.name === SearchingKeywords.BACK));

                    if (
                        (isWide && modifiedTextDimension.width > initTextDimension.width)
                        ||
                        (!isWide && modifiedTextDimension.height > initTextDimension.height)
                    ) {
                        // Apply resizing
                        this.fitNanoSize({
                            item: textFrame.name as keyof typeof NANOBaseSize,
                            isWide,
                            textFrame,
                            initTextDimension
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

        // Get width from initiated item
        const initWide = params.isWide ? params.initTextDimension.width : params.initTextDimension.height;

        const distance = this.dimension.width / this.rootBodyDimenstion!.width;

        const fitWidth = initWide + distance;

        const scaleFactor = fitWidth * 72;

        const tf = params.textFrame;

        // Calculate current dimensions
        const originalWidth = tf.width;
        const originalHeight = tf.height;

        if (params.isWide) {
            const horizontalScale = scaleFactor / originalWidth;
            tf.resize(horizontalScale * 100, 100); // Scale X, keep Y
        } else {
            const verticalScale = scaleFactor / originalHeight;
            tf.resize(100, verticalScale * 100); // Keep X, scale Y
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
        // Extract parameters from the input object for easier access
        const { rows, cols, isLastDoc, initItem } = params;

        // Calculate gap distance in points (72 points = 1 inch) for item spacing
        const gap = CONFIG.Items_Gap * 72;

        // Track the previous item created for positioning reference
        let prevBody: PageItem = initItem;

        // Track the first item of current column for vertical alignment
        let curColFirstRow = initItem;

        // Flag to ensure initial item data is processed only once
        let processedInitialItem = false;

        // Main loop: iterate through each column of the grid
        for (let col = 1; col <= cols; col++) {

            // COLUMN INITIALIZATION: Handle the first row of each column
            if (col === 1 && !processedInitialItem) {
                // FIRST COLUMN, FIRST ROW: Process the pre-existing initial item
                // Apply data (names, text, etc.) to the initial item that was passed in
                this.writeDataInBody(prevBody as GroupItem);

                // Mark that we've processed the initial item to prevent double-processing
                processedInitialItem = true;

            } else if (col > 1) {
                // SUBSEQUENT COLUMNS: Create first item of new column

                // Check if we've reached our quantity limit before creating more items
                if (this.itemIdx > this.quantity) {
                    // Set end flag and exit the column loop
                    this.reachedEnd = true;
                    break;
                }

                // Create a duplicate of the previous item for the new column
                const copiedBody = prevBody.duplicate(
                    prevBody.parent,
                    ElementPlacement.PLACEATEND
                );

                // Assign a sequential name to the new item based on current index
                copiedBody.name = this.getItemIndex();

                // Position the new item: align left with first column, move down by gap
                alignItems(curColFirstRow, copiedBody, "L");
                moveItemAfter({
                    base: prevBody,
                    moving: copiedBody,
                    position: "B",
                    gap,
                });

                // Apply data content to the newly created and positioned item
                this.writeDataInBody(copiedBody as GroupItem);

                // Update tracking variables for next iteration
                prevBody = copiedBody;
                curColFirstRow = prevBody; // This becomes the reference for this column

                // Increment item counter(s) based on layout orientation
                if (this.recommendedOrientation === "L") {
                    this.itemIdx++; // Extra increment for L-shape layout
                }
                this.itemIdx++; // Standard increment for all layouts
            }

            // ROW PROCESSING: Fill remaining rows in current column (rows 2, 3, 4, etc.)
            for (let row = 2; row <= rows; row++) {

                // Check quantity limit before creating each new item
                if (this.itemIdx > this.quantity) {
                    // Mark end state and break out of row loop
                    this.reachedEnd = true;
                    break;
                }

                // Create duplicate item for current row position
                const copiedBody = prevBody.duplicate(
                    prevBody.parent,
                    ElementPlacement.PLACEATEND
                );

                // Generate and assign sequential name to new item
                copiedBody.name = this.getItemIndex();

                // Position item to the right of previous item with specified gap
                moveItemAfter({
                    base: prevBody,
                    moving: copiedBody,
                    position: "R",
                    gap,
                });

                // Apply data content to the newly positioned item
                this.writeDataInBody(copiedBody as GroupItem);

                // Update reference to newly created item for next iteration
                prevBody = copiedBody;

                // Update item counter(s) based on orientation requirements
                if (this.recommendedOrientation === "L") {
                    this.itemIdx++; // L-shape requires extra indexing
                }
                this.itemIdx++; // Standard increment for item tracking
            }

            // Exit column loop early if we've reached the quantity limit
            if (this.reachedEnd) {
                break;
            }
        }

        // POST-PROCESSING: Handle special cases for the final document
        if (isLastDoc && this.recommendedOrientation === "L") {
            // Remove specific items from L-shape layout when it's the last document
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

        const docsIns = this.documentCreator({ title, items: this.bodyItems! });

        const initiateItem = this.initiateBody(docsIns.doc);

        const [front, back] = arrayFrom(initiateItem.pageItems);

        back.remove();

        Organizer.smallArtboard(docsIns.doc);

        alignPageItemsToArtboard(front, docsIns.doc);

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
    item: keyof typeof NANOBaseSize;
    isWide: boolean;
    initTextDimension: DimensionObject;
}