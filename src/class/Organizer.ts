/**
 * A utility class for organizing and arranging items in an Adobe Illustrator document.
 * Provides static methods for artboard manipulation and item alignment.
 */
class Organizer {
    /**
     * Resizes an artboard in the document based on specified dimensions (in inches).
     * Converts inches to points (1 inch = 72 points) for internal processing.
     * 
     * @param {ArtboardScaler} params - Configuration object containing:
     *   @param {Document} params.doc - The Illustrator document containing the artboard
     *   @param {number} params.width - The desired width in inches
     *   @param {number} params.height - The desired height in inches
     */
    static artboardScaler(params: ArtboardScaler): void {
        const artboardManager = new ArtboardManager(params.doc);
        artboardManager.resize(params.width * 72, params.height * 72);
    };

    /**
     * Resizes the active artboard to a small default size (1x1 inches).
     * Convenience wrapper around artboardScaler with preset dimensions.
     * 
     * @param {Document} doc - The Illustrator document to modify
     */
    static smallArtboard(doc: Document): void {
        this.artboardScaler({
            doc,
            width: 1,
            height: 1
        });
    };

    /**
     * Aligns all items in the active layer to the artboard boundaries.
     * 
     * The operation:
     * 1. Clears any existing selection
     * 2. Selects all page items in the active layer
     * 3. Aligns them to the artboard using default alignment
     * 4. Clears the selection when complete
     */
    static alignItemsToBoardC(doc: Document): void {
        doc.selection = null;
        const activeLayerItems = doc.activeLayer.pageItems;
        const itemsToSelect = arrayFrom(activeLayerItems);
        doc.selection = itemsToSelect;
        alignPageItemsToArtboard(doc.selection, doc);
        doc.selection = null;
    };

    /**
     * Selects all visible & unlocked items in an Illustrator document
     * @param {Document} doc - The Illustrator document to process
     * @returns {Selection} Array of selected items
     */
    static selectAllItems(doc: Document): PageItem[] {
        const items = doc.pageItems;
        const selectedItems = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Skip hidden items (default behavior)
            if (item.hidden) continue;

            // Skip locked items unless explicitly included
            if (item.locked) continue;

            selectedItems.push(item);
        }

        doc.selection = selectedItems;
        return selectedItems;
    };

    /**
     * Converts an Illustrator PageItems collection to a standard array
     * @param {PageItems} pageItems - The Illustrator PageItems collection to convert
     * @returns {PageItem[]} Array containing all items from the collection
     */
    static pageItemsToArray(pageItems: PageItems): PageItem[] {
        const selectedItems = [];

        for (let i = 0; i < pageItems.length; i++) {
            const item = pageItems[i];

            selectedItems.push(item);
        }

        return selectedItems;
    };

    /**
     * Retrieves the front and back body items from a document or selection.
     * @param {Selection|null} [items=null] - Optional selection to search within
     * @returns {[PageItem, PageItem]} Tuple containing front and back body items
     * @throws {Error} If either FRONT or BACK items cannot be found
     */
    static getBodyItems(items: Selection): [PageItem, PageItem] {
        const frontBody = findElement(items, (item) => item.name === SearchingKeywords.FRONT);
        const backBody = findElement(items, (item) => item.name === SearchingKeywords.BACK);

        if (!frontBody || !backBody) {
            throw new Error(`Can't found ${!frontBody ? "FRONT" : "BACK"}`);
        }

        return [frontBody, backBody];
    };

    /**
     * find actual dimension from size container using size chr
     * @param {GetBodyDimenstionParams} params
     * @returns {DimensionObject} - return exact dimension
     */
    static getBodyDimenstion(params: GetBodyDimenstionParams): DimensionObject {
        const { sizeContainer, targetSizeChr } = params;
        const sizeCategory =
            CONFIG.Size_Container[sizeContainer as keyof typeof CONFIG.Size_Container];
        const isBaby = isBabySize(targetSizeChr, sizeCategory["BABY"]);
        return getDimensionGenderCategory(
            sizeCategory,
            targetSizeChr,
            isBaby
        );
    };

    /**
     * Gets the current document's directory and counts files in that directory
     * @param {Document} [doc=app.activeDocument] - The Illustrator document to check
     * @returns {GetDirectoryFileInfoReturn}
     * @throws {Error} If no document is open or document isn't saved
     */
    static getDirectoryFileInfo(doc: Document = app.activeDocument): GetDirectoryFileInfoReturn {

        if (!app.documents.length) {
            throw new Error("No document is open!");
        }

        const docPath = doc.fullName;

        if (!docPath) {
            throw new Error("Document must be saved first to determine its location.");
        }

        const folder = docPath.parent;
        const items = folder.getFiles();
        let fileCount = 0;
        let folderCount = 0;

        for (let i = 0; i < items.length; i++) {
            if (items[i] instanceof Folder) {
                folderCount++;
            } else if (items[i] instanceof File) {
                fileCount++;
            }
        }

        return {
            files: fileCount,
            folder: folderCount,
            nexFileIndex: fileCount
        };
    };

    /**
     * Retrieves pant-related items from the document's active layer.
     * 
     * This method looks for the following items by their names:
     * - F_L
     * - F_R
     * - B_L
     * - B_R
     * 
     * If any of these are missing, it throws an Error with a list of missing item names.
     * 
     * @param {Document} doc - The document from which to retrieve pant items.
     * @returns {PantItems} An array of pant-related items tuple.
     * @throws {Error} If any pant items are missing.
     */
    static getPantItems(doc: Document): PantItems {
        const pageItems = arrayFrom(doc.activeLayer.pageItems);

        const F_L = findElement(pageItems, item => item.name === SearchingKeywordsForPant.PANT_F_L);
        const F_R = findElement(pageItems, item => item.name === SearchingKeywordsForPant.PANT_F_R);
        const B_L = findElement(pageItems, item => item.name === SearchingKeywordsForPant.PANT_B_L);
        const B_R = findElement(pageItems, item => item.name === SearchingKeywordsForPant.PANT_B_R);

        const missing = [];

        if (!F_L) missing.push(SearchingKeywordsForPant.PANT_F_L);
        if (!F_R) missing.push(SearchingKeywordsForPant.PANT_F_R);
        if (!B_L) missing.push(SearchingKeywordsForPant.PANT_B_L);
        if (!B_R) missing.push(SearchingKeywordsForPant.PANT_B_R);

        if (missing.length > 0) {
            throw new Error(`Can't find pant items: missing [${missing.join(", ")}].`);
        }

        return [F_L as PageItem, F_R as PageItem, B_L as PageItem, B_R as PageItem];
    };

    /**
     * 
     * @param {Document} doc - document. default is active document
     * @returns {GroupItem}
     * 
     * @throws {Error} If either PANT cannot be found
     */
    static getPant(doc: Document = app.activeDocument): GroupItem {
        const item = findElement(arrayFrom(doc.activeLayer.pageItems), item => item.name === "PANT");

        if (!item) {
            throw new Error(`Can't find PANT`);
        }

        return item as GroupItem;
    };

    /**
     * Handles the key object selection logic.
     *
     * This static method checks the current document and selection, and either sets or removes
     * a custom `key` property on the selected item based on the `dispatch` flag.
     *
     * ### Error Cases:
     * - No document open
     * - No selection
     * - Multiple items selected
     *
     * @param {KeyObjectHandlerParams} params - An object containing handler parameters.
     * @param params.doc - The Illustrator document to operate on (defaults to `app.activeDocument`).
     * @param params.dispatch - A boolean flag indicating whether to set (`true`) or remove (`false`) the `key` property on the selected object.
     *
     * @throws Will show an alert dialog with an error message if:
     * - No document is open.
     * - No object is selected.
     * - More than one object is selected.
     */
    static objectKeyHandler(params: KeyObjectHandlerParams): void {
        try {
            const { doc = app.activeDocument, dispatch } = params;

            const selection: Selection | undefined = doc.selection;

            if (!doc) {
                throw new Error("No opended document found");
            }

            if (!selection || !selection.length) {
                throw new Error("Select a object");
            }

            if (selection.length > 1) {
                throw new Error("Multiple key objects are not supported.");
            }

            const item = selection[0];

            if (dispatch) {
                item.key = true;
            } else {
                delete item.key
            }
        } catch (error: any) {
            alertDialogSA(error.message)
        }
    };

    /**
     * Moves one selected object relative to a "key" object in the specified direction within the active document.
     *
     * Requires exactly two selected objects: one marked as the key object (`item.key === true`)
     * and one to be moved. The method will reposition the non-key object based on the `direction` parameter.
     *
     * ### Error Cases:
     * - No document is open.
     * - Fewer than two or more than two objects selected.
     * - Key object not found in selection.
     * - Move target object not found.
     *
     * @param {MoveAfterItemUIParams} params - An object containing move parameters.
     * @param params.direction - The direction to move the non-key object relative to the key object (e.g. `"before"` or `"after"`).
     * @param params.doc - The Illustrator document (defaults to `app.activeDocument`).
     *
     * @throws Will show an alert dialog if any of the above errors occur.
     */
    static moveAfterItemUI(params: MoveAfterItemUIParams) {
        try {
            const { direction, doc = app.activeDocument } = params;

            if (!doc) {
                throw new Error("No open document found.");
            }

            const selection: Selection | undefined = doc.selection;

            if (!selection || !selection.length) {
                throw new Error("Please select two objects.");
            }

            if (selection.length < 2) {
                throw new Error("Two objects must be selected.");
            }

            if (selection.length > 2) {
                throw new Error("Only two objects can be selected.");
            }

            const keyItem = findElement(selection, (item) => item.key);

            if (!keyItem) {
                throw new Error("Key object not found in selection.");
            }

            const moveItem = findElement(selection, (item) => !item.key);

            if (!moveItem) {
                throw new Error("Object to move not found.");
            }

            moveItemAfter({
                base: keyItem,
                moving: moveItem,
                position: direction,

            });


        } catch (error: any) {
            alertDialogSA(error.message)
        }
    };

}

interface GetDirectoryFileInfoReturn {
    folder: number;
    files: number;
    nexFileIndex: number;
}

type ArtboardScaler = {
    doc: Document;
    width: number;
    height: number;
};

interface KeyObjectHandlerParams {
    dispatch: boolean,
    doc?: Document
}

interface GetBodyDimenstionParams {
    sizeContainer: string;
    targetSizeChr: ApparelSize;
}

interface MoveAfterItemUIParams {
    direction: "L" | "R" | "T" | "B";
    doc?: Document;
}