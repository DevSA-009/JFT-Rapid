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
        var items = doc.pageItems;
        var selectedItems = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // Skip hidden items (default behavior)
            if (item.hidden) continue;

            // Skip locked items unless explicitly included
            if (item.locked) continue;

            selectedItems.push(item);
        }

        doc.selection = selectedItems;
        return selectedItems;
    };
}

type ArtboardScaler = {
    doc: Document;
    width: number;
    height: number;
};