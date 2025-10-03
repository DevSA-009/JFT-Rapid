/**
 * A utility class for organizing and arranging items in an Adobe Illustrator document.
 * Provides static methods for artboard manipulation and item alignment.
 */
class Organizer {

    /**
     * Verifies that there is an active document and a valid selection.
     *
     * @returns {SelectionVerifyChainReturn} An object containing the active document and selection if valid; otherwise.
     */
    static selectionVerifyChain(): SelectionVerifyChainReturn {
        const doc = app.activeDocument;
        if (!doc) {
            throw new Error("No open document found.");
        }

        const selection: Selection | undefined = doc.selection;

        if (!selection || !selection.length) {
            throw new Error("Please select objects.");
        }

        return { selection, doc }
    };

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
        const sizeCategory = CONFIG.Persist_Config.sizes[sizeContainer as keyof typeof CONFIG.Persist_Config.sizes];
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
    static getPantItems(container: PageItem[]): PantItems {
        const pageItems = container;

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
        const [F_L] = Organizer.getPantItems((item as GroupItem).pageItems);

        if (!F_L) {
            throw new Error(`PANT Front MISSING`);
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
     * @param {boolean} dispatch - A boolean flag indicating whether to set (`true`) or remove (`false`) the `key` property on the selected object.
     *
     * @throws Will show an alert dialog with an error message if:
     * - No document is open.
     * - No object is selected.
     * - More than one object is selected.
     */
    static objectKeyHandler(dispatch: boolean): void {
        try {

            const { selection } = this.selectionVerifyChain();

            if (selection.length > 1) {
                throw new Error("Multiple key objects are not supported.");
            }

            const item = selection[0];

            if (dispatch) {
                item.key = true;
            } else {
                delete item.key
            }
            app.beep();
        } catch (error: any) {
            alertDialogSA(error.message)
        }
    };

    /**
     * select all clipped path from selection
     */
    static selectTopClippingPath() {
        try {
            const { doc, selection } = this.selectionVerifyChain();
            const clippingPathObjects: PageItem[] = [];

            for (let i = 0; i < selection.length; i++) {
                const item = selection[i];
                const topClippingPath = getTopClippingPath(item);
                if (topClippingPath) {
                    clippingPathObjects.push(topClippingPath);
                }
            }

            if (clippingPathObjects.length) {
                doc.selection = null;
                doc.selection = clippingPathObjects;
            } else {
                alertDialogSA(`No clipping path found!`)
            }

        } catch (error: any) {
            alertDialogSA(error.message);
        }
    };

    /**
     * check the objects are opacity mask existing by moving and rotateting
     */
    static checkisOpacityMask() {
        try {

            const { selection } = this.selectionVerifyChain();

            const groupManager = new GroupManager(selection);

            groupManager.group();

            const gorupItem = groupManager.tempGroup;

            if (!gorupItem) {
                throw new Error(`Can't grouping`);
            }

            rotateItems(gorupItem, -90);

            moveItemToCanvas(gorupItem, "T");
            moveItemToCanvas(gorupItem, "L");

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
     * @param { MoveAfterItemUiDirection } direction - The direction to move the non-key object relative to the key object (e.g. `"before"` or `"after"`).
     *
     * @throws Will show an alert dialog if any of the above errors occur.
     */
    static moveAfterItemUI(direction: MoveAfterItemUiDirection) {
        try {

            const { selection } = this.selectionVerifyChain();

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

    /**
     * Initializes the preparation of a sleeve set using two selected Illustrator objects.
     *
     * ### Workflow Summary:
     * 1. Verifies exactly 2 objects are selected.
     * 2. Duplicates both and ensures they are the same dimensions.
     * 3. Rotates, aligns, and arranges them into a 1-set sleeve layout.
     * 4. Duplicates the 1-set to make a 2-set layout.
     * 5. Validates if final layout fits within maximum paper size.
     * 6. Resizes if necessary and removes the original selection.
     *
     * @throws {Error} If:
     * - Selection count is not 2.
     * - Duplicated items do not have equal dimensions.
     * - Sleeve set exceeds the allowed paper size.
     */
    static fSlv2SetInit() {
        try {
            const { selection } = this.selectionVerifyChain();

            // Validate exactly two objects are selected
            if (selection.length !== 2) {
                throw new Error("You must select exactly two objects.");
            }

            const [obj1, obj2] = selection;

            // Duplicate both objects
            const dupObj1 = obj1.duplicate(obj1.parent);
            const dupObj2 = obj2.duplicate(obj2.parent);

            // Get dimensions of duplicated objects
            const dupObj1Dim = getWHDimension(getSelectionBounds(dupObj1));
            const dupObj2Dim = getWHDimension(getSelectionBounds(dupObj2));

            // Check if duplicated objects have the same dimensions
            if (!(dupObj1Dim.width === dupObj2Dim.width && dupObj1Dim.height === dupObj2Dim.height)) {
                dupObj1.remove();
                dupObj2.remove();
                throw new Error("Both objects must have equal dimensions.");
            }

            // Define initial translation values (in points)
            const firstXTrans = -2.2 * 72;
            const secondXTrans = 0.4 * 72;

            // Create a group manager instance for both duplicated items
            const illsGrpManager = new GroupManager([dupObj1, dupObj2]);

            // Align duplicated items to center (both horizontal and vertical)
            alignItems(dupObj1, dupObj2, "C");

            // Move second object to the right of the first
            moveItemAfter({
                base: dupObj1,
                moving: dupObj2,
                position: "R"
            });

            // Rotate the second object by 180 degrees
            rotateItems(dupObj2, 180);

            // Move the second object left by 2.2 inches
            dupObj2.translate(firstXTrans, 0);

            // Rotate both objects by -7.5 degrees
            rotateItems([dupObj1, dupObj2], -7.5);

            // Align both again to vertical center
            alignItems(dupObj1, dupObj2, "CY");

            // Move the second object slightly right (0.4 inches)
            dupObj2.translate(secondXTrans, 0);

            // Group the arranged sleeve set
            illsGrpManager.group();

            // Get the grouped set
            const tempGroup = illsGrpManager.tempGroup!;

            // Get dimensions of the grouped sleeve set
            const groupedItemDim = getWHDimension(getSelectionBounds(tempGroup));

            // Calculate half of the max allowed paper size
            const halfOfPaperSize = Math.ceil(CONFIG.PAPER_MAX_SIZE / 2);

            // If the 1-set width exceeds half the paper size, abort
            if (groupedItemDim.width >= halfOfPaperSize) {
                tempGroup.remove();
                throw new Error(`Sleeve width exceeds half of the allowed paper size (${CONFIG.PAPER_MAX_SIZE}").`);
            }

            // Duplicate the group to make a 2-set layout
            const dupGroupedItem = tempGroup.duplicate(obj1);

            // Place the duplicated group to the right of the original
            moveItemAfter({
                base: tempGroup,
                moving: dupGroupedItem,
                position: "R"
            });

            // Get combined dimension of both sleeve sets
            const finalDim = getWHDimension(getSelectionBounds([tempGroup, dupGroupedItem]));

            // Resize if the combined width exceeds the paper limit
            if (finalDim.width > CONFIG.PAPER_MAX_SIZE) {
                resizeSelection([tempGroup, dupGroupedItem], CONFIG.PAPER_MAX_SIZE);
            }

            // Clean up original selected objects
            obj1.remove();
            obj2.remove();

        } catch (error: any) {
            // Show error message via custom alert
            alertDialogSA(error.message);
        }
    };

    /**
     * Assigns a custom name (mark) to all selected Illustrator objects.
     *
     * This method is useful for tagging or identifying specific elements
     * within a document by applying a shared name to the currently selected items.
     *
     * ### Workflow:
     * 1. Verifies that a document is open and there is a valid selection.
     * 2. Iterates over the selected items.
     * 3. Sets the `.name` property of each item to the provided `mark` string.
     *
     * @param {string} mark - The name or identifier to assign to each selected object.
     *
     * @throws Will throw an error if:
     * - No document is open.
     * - No items are selected.
     */
    static objectMarkByName(mark: string) {
        const selectionVerifyChain = this.selectionVerifyChain();
        const selection = selectionVerifyChain.selection;

        for (const element of selection) {
            element.name = mark;
        }
    };

    /**
     * Returns the previous and next sibling items of a given page item,
     * as well as its index within the parent container's pageItems array.
     *
     * @param item - The PageItem (e.g., GroupItem, PathItem) to find siblings for.
     * @returns An object containing:
     *  - `prevItem`: the previous sibling (or `null` if first)
     *  - `nextItem`: the next sibling (or `null` if last)
     *  - `itemIndex`: the index of the current item in its parent’s pageItems
     *
     * @throws Error if the item is not found in its parent’s pageItems collection.
     */
    static getSiblingItems(item: PageItem): GetSiblingItemsReturn {
        // Get the parent container (Layer, GroupItem, or Document) of the given item
        const parent = item.parent as Layer | GroupItem | Document;

        // Get all page items under the parent — includes all types (GroupItem, PathItem, etc.)
        const siblings = parent.pageItems;

        // Initialize index to -1 (not found)
        let index = -1;

        // Loop through siblings to find the index of the current item
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] === item) {
                index = i;
                break; // Exit the loop once the item is found
            }
        }

        // If the item wasn't found, throw an error
        if (index === -1) {
            throw new Error("Item not found in parent's pageItems.");
        }

        // Get the previous item, or null if this is the first item
        const prevItem = index > 0 ? siblings[index - 1] : null;

        // Get the next item, or null if this is the last item
        const nextItem = index < siblings.length - 1 ? siblings[index + 1] : null;

        // Return the previous and next siblings, and the current item index
        return { prevItem, nextItem, itemIndex: index };
    };

    /**
     * Ungroups a given GroupItem by moving all its child items out into the parent container,
     * preserving their stacking order relative to the group's position in the parent.
     *
     * This method determines the correct `ElementPlacement` by checking sibling items:
     * - If there is a previous sibling, new items are placed **after** it.
     * - If there is no previous sibling but a next sibling exists, items are placed **at the beginning**.
     * - If neither exist, items are placed **inside** the parent (default to beginning).
     *
     * @param groupItem - The GroupItem to ungroup.
     * 
     * @throws Error if the item is not a valid GroupItem or has no children.
     */
    static unGroupItem(groupItem: GroupItem): void {
        // Validate that the item is a GroupItem and has child items
        if (groupItem.typename !== PageItemType.GroupItem || !groupItem.pageItems.length) {
            throw new Error("Item is not a Group object or is empty.");
        }

        // Get previous and next sibling items (used to determine insertion point)
        const { nextItem, prevItem } = this.getSiblingItems(groupItem);

        // Default to placing items in the same parent as the group
        let parent = groupItem.parent;

        // Default placement is at the beginning
        let place = ElementPlacement.PLACEATBEGINNING;

        // If there's a previous item, place ungrouped items after it
        if (prevItem) {
            place = ElementPlacement.PLACEAFTER;
            parent = prevItem; // Place after this item
        }

        // If there's no previous item but a next item exists,
        // keep placement at beginning (before the next item)
        if (!prevItem && nextItem) {
            place = ElementPlacement.PLACEATBEGINNING;
            // parent remains the original parent
        }

        // Move each child of the group to the determined parent/position
        // Iterate in reverse to preserve stacking order
        for (let index = groupItem.pageItems.length - 1; index >= 0; index--) {
            const item = groupItem.pageItems[index];
            item.move(parent, place);
        }

        // Optionally remove the now-empty group
        // groupItem.remove(); // Uncomment if you want to delete the group after ungrouping
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

interface GetBodyDimenstionParams {
    sizeContainer: string;
    targetSizeChr: ApparelSize;
}

type MoveAfterItemUiDirection = "L" | "R" | "T" | "B";

interface SelectionVerifyChainReturn {
    selection: Selection;
    doc: Document
}

type GetSiblingItemsReturn = {
    prevItem: PageItem | null;
    nextItem: PageItem | null;
    itemIndex: number;
};
