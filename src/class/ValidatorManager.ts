/**
 * Utility class for validating document structure and presence of required items
 * in an Adobe Illustrator scripting environment.
 */
class ValidatorManager {

    /**
     * Throws an error with the provided message.
     * @param msg - The message for the error.
     * @throws Will always throw an Error with the specified message.
     * @private
     */
    private static errorThrow(msg: string) {
        throw new Error(msg);
    };

    /**
     * Validates that a document is currently open in the application.
     * @throws If no documents are open.
     */
    static checkdocument() {
        if (!app.documents.length) {
            this.errorThrow("No document opened!")
        }
    };

    /**
     * Checks if a GroupItem contains a text frame with a `SIZE_TKN` name.
     * @param item - The group item to inspect.
     * @throws If the required `SIZE_TKN` text frame is not found.
     */
    static checkSizeTkn(item: GroupItem) {
        const sizeTextFrame = findElement(item.pageItems, (item) => item.typename === PageItemType.TextFrame && item.name === SearchingKeywords.SIZE_TKN);

        if (!sizeTextFrame) {
            this.errorThrow(`Size token not found in ${item.name}`)
        }
    };

    /**
     * Validates that both front and back body items exist in the document's active layer,
     * and that they both include size tokens.
     * @param doc - The document to validate.
     * @throws If front or back items are missing or size tokens are not found.
     */
    static checkBodyItems(doc: Document) {
        const [front, back] = Organizer.getBodyItems(Organizer.pageItemsToArray(doc.activeLayer.pageItems));

        if (!front || !back) {
            this.errorThrow(`can't found body items`);
        };

        this.checkSizeTkn(front as GroupItem);
        this.checkSizeTkn(back as GroupItem);
    };
}

interface OrientationCheckParams {
    rows: number;
    dimention: DimensionObject;
}