/**
 * @fileoverview A reusable TypeScript class for managing Adobe Illustrator documents in ExtendScript.
 */

/**
 * Represents a document manager in Adobe Illustrator.
 */
class IllustratorDocument {
    private doc: Document | null = null;
    private fileName: string = "";

    /**
     * Creates a new Illustrator document.
     * If `items` are provided, they will be copied to the center of the new document's artboard.
     *
     * @param {string} fileName - The name of the document.
     */
    constructor(fileName: string = "jftrapidtemp") {
        this.fileName = fileName;
    }

    /**
     * Creates a new document and optionally copies items to the center.
     * @param {PageItem[] | null} [items=null] - Optional array of PageItem objects to copy into the new document.
     */
    create(items: PageItem[] | null = null) {
        const startPreset = app.startupPresetsList[0];
        const presetSettings = new DocumentPreset() as typeof DocumentPreset;
        presetSettings.width = 1;
        presetSettings.height = 1;
        presetSettings.title = this.fileName;
        presetSettings.units = RulerUnits.Inches;
        presetSettings.colorMode = DocumentColorSpace.CMYK;
        this.doc = app.documents.addDocument(startPreset,presetSettings);

        if (items && items.length > 0) {
            this.copyItemsToCenter(items);
        }
    };

    /**
     * Copies given PageItems to the center of the new document's artboard.
     * @param {PageItem[]} items - The items to copy.
     * @private
     */
    private copyItemsToCenter(items: PageItem[]): void {
        if (!this.doc) {
            return;
        }

        const newArtboard = this.doc.artboards[0].artboardRect;

        // Calculate center of the new document
        const centerX = (newArtboard[0] + newArtboard[2]) / 2;
        const centerY = (newArtboard[1] + newArtboard[3]) / 2;

        // Duplicate items manually without using .map()
        const duplicatedItems: PageItem[] = [];
        for (let i = 0; i < items.length; i++) {
            duplicatedItems.push(items[i].duplicate(this.doc) as PageItem);
        }

        // Compute the bounding box of the duplicated items
        const bounds = this.getBoundingBox(duplicatedItems);
        const itemCenterX = (bounds.left + bounds.right) / 2;
        const itemCenterY = (bounds.top + bounds.bottom) / 2;

        // Adjust position manually without using .forEach()
        for (let i = 0; i < duplicatedItems.length; i++) {
            duplicatedItems[i].left += centerX - itemCenterX;
            duplicatedItems[i].top += centerY - itemCenterY;
        }
    }

    /**
     * Calculates the bounding box of an array of PageItems.
     * @param {PageItem[]} items - The items to measure.
     * @returns {{ left: number; right: number; top: number; bottom: number }} - The bounding box dimensions.
     * @private
     */
    private getBoundingBox(items: PageItem[]): { left: number; right: number; top: number; bottom: number } {
        let left = Infinity;
        let right = -Infinity;
        let top = -Infinity;
        let bottom = Infinity;

        for (let i = 0; i < items.length; i++) {
            const bounds = items[i].visibleBounds;
            if (bounds) {
                if (bounds[0] < left) left = bounds[0];
                if (bounds[1] > top) top = bounds[1];
                if (bounds[2] > right) right = bounds[2];
                if (bounds[3] < bottom) bottom = bounds[3];
            }
        }

        return { left, right, top, bottom };
    }

    /**
     * Saves the current document as an EPS file.
     * @param {string} filePath - The full file path to save the EPS file.
     */
    save(filePath: string): void {
        if (!this.doc) {
            return;
        }

        const epsOptions = new EPSSaveOptions() as typeof EPSSaveOptions;
        epsOptions.compatibility = Compatibility.ILLUSTRATOR24;
        epsOptions.preview = EPSPreview.None;
        epsOptions.cmykPostScript = true;
        epsOptions.embedAllFonts = true;
        epsOptions.includeDocumentThumbnails = false;
        epsOptions.embedLinkedFiles = true;
        const file = new File(filePath);
        this.doc.saveAs(file, epsOptions);
    }

    /**
     * Closes the current document without saving.
     */
    close(): void {
        if (this.doc) {
            this.doc.close(SaveOptions.DONOTSAVECHANGES);
            this.doc = null;
        }
    }
}
