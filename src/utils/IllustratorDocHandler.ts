/**
 * @fileoverview A reusable TypeScript class for managing Adobe Illustrator documents in ExtendScript.
 */

/**
 * Represents a document manager in Adobe Illustrator.
 */
class IllustratorDocument {
    private doc: Document | null = null;
    private title: string;

    /**
     * Creates a new Illustrator document.
     *
     * @param {string} title - The title of the document.
     */
    constructor(title: string = "JFT-Rapid") {
        this.title = title;
    }

    /**
     * Creates a new document with the given title.
     * @param {PageItem[] | null} [items=null] - Optional array of PageItem objects to copy into the new document.
     * @returns  {Document}
     */
    create(items: PageItem[] | null = null): Document {
        const startPreset = app.startupPresetsList[0];
        const presetSettings = new DocumentPreset() as typeof DocumentPreset;
        presetSettings.width = 1*72;
        presetSettings.height = 1*72;
        presetSettings.title = this.title;
        presetSettings.units = RulerUnits.Inches;
        presetSettings.colorMode = DocumentColorSpace.CMYK;
        const docObj = this.doc = app.documents.addDocument(startPreset, presetSettings);

        if (items && items.length > 0) {
            this.copyItemsToCenter(items);
        }

        return docObj;
    }

    /**
     * Saves the current document as an EPS file.
     * @param {string} filePath - The full file path to save the EPS file.
     * @param {string} [fileName] - Optional new file name (without extension).
     */
    save(filePath: string, fileName?: string): void {
        if (!this.doc) {
            return;
        }

        let savePath = filePath;

        if (fileName) {
            const file = new File(filePath);
            savePath = file.path + "/" + fileName + ".eps"; // Use provided file name
        }

        const epsOptions = new EPSSaveOptions() as typeof EPSSaveOptions;
        epsOptions.compatibility = Compatibility.ILLUSTRATOR24;
        epsOptions.preview = EPSPreview.None;
        epsOptions.cmykPostScript = true;
        epsOptions.embedAllFonts = true;
        epsOptions.includeDocumentThumbnails = false;
        epsOptions.embedLinkedFiles = true;

        this.doc.saveAs(new File(savePath), epsOptions);
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

    /**
     * Copies given PageItems to the center of the new document's artboard.
     * @param {PageItem[]} items - The items to copy.
     * @private
     */
    private copyItemsToCenter(items: PageItem[]): void {
        if (!this.doc) {
            return;
        }

        const duplicatedItems: PageItem[] = [];
        for (let i = 0; i < items.length; i++) {
            duplicatedItems.push(items[i].duplicate(this.doc) as PageItem);
        }

        alignPageItemsToArtboard(duplicatedItems, this.doc);
    }
}