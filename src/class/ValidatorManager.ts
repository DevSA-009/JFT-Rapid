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
  }

  /**
   * Validates that a document is currently open in the application.
   * @throws If no documents are open.
   */
  static checkdocument() {
    if (!app.documents.length) {
      this.errorThrow("No document opened!");
    }
  }

  /**
   * Checks if a GroupItem contains a text frame with a `SIZE_TKN` name.
   * @param item - The group item to inspect.
   * @throws If the required `SIZE_TKN` text frame is not found.
   */
  static checkSizeTkn(item: GroupItem) {
    const sizeTextFrame = ES6_SA.arrayFind(
      item.pageItems,
      (item) =>
        item.typename === PageItemType.TextFrame &&
        item.name === SearchingKeywords.SIZE_TKN,
    );

    if (!sizeTextFrame) {
      this.errorThrow(`Size token not found in ${item.name}`);
    }
  }
}

interface OrientationCheckParams {
  rows: number;
  dimention: DimensionObject;
}
