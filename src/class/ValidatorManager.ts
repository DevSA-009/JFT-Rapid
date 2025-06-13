class ValidatorManager {

    private static errorThrow (msg:string) {
        throw new Error(msg);
    }

    static checkdocument () {
        if(!app.documents.length) {
            this.errorThrow("No document opened!")
        }
    };

    static checkSizeTkn (item:GroupItem) {
        const sizeTextFrame = findElement(item.pageItems, (item) => item.typename === PageItemType.TextFrame && item.name === SearchingKeywords.SIZE_TKN);

        if(!sizeTextFrame) {
            this.errorThrow(`Size token not found in ${item.name}`)
        }
    };

    static checkBodyItems (doc:Document) {
        const [front, back] = Organizer.getBodyItems(Organizer.pageItemsToArray(doc.activeLayer.pageItems));

        if(!front || !back) {
            this.errorThrow(`can't found body items`);
        };

        this.checkSizeTkn(front as GroupItem);
        this.checkSizeTkn(back as GroupItem);
    };
}

interface OrientationCheckParams {
    rows:number;
    dimention:DimensionObject;
}