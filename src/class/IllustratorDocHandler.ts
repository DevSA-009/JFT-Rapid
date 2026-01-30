/**
 * Manages creation, population, saving, and cleanup of Adobe Illustrator documents.
 *
 * @remarks
 * This class is designed to simplify common document workflows in Illustrator ExtendScript:
 * - creating consistently sized documents
 * - optionally copying existing artwork into the new document
 * - saving in EPS, TIFF, or AI formats with predefined settings
 * - safe document cleanup
 */
class IllustratorDocument {
	private doc: Document | null = null;
	private title: string;

	/**
	 * Creates a new document manager instance.
	 *
	 * @param title - Name to assign to newly created documents (default: "JFT-Rapid")
	 */
	constructor(title: string = "JFT-Rapid") {
		this.title = title;
	}

	/**
	 * Creates a new Illustrator document using a fixed 207×207 inch CMYK artboard.
	 *
	 * @remarks
	 * - Uses the first available startup preset as base
	 * - Always creates document in Inches / CMYK color space
	 * - Optionally copies provided page items and centers them on the artboard
	 *
	 * @param objects - Optional array of `PageItem`s to duplicate into the center of the new document
	 * @returns The newly created `Document` object
	 */
	create(objects: PageItem[] | null = null): Document {
		const startPreset = app.startupPresetsList[0];
		const presetSettings = new DocumentPreset() as typeof DocumentPreset;
		presetSettings.width = Utils.convertLength({
			value: 207,
			from: "inch",
			to: "pt",
		});
		presetSettings.height = Utils.convertLength({
			value: 207,
			from: "inch",
			to: "pt",
		});
		presetSettings.title = this.title;
		presetSettings.units = RulerUnits.Inches;
		presetSettings.colorMode = DocumentColorSpace.CMYK;
		const docObj = (this.doc = app.documents.addDocument(
			startPreset,
			presetSettings,
		));

		if (objects && objects.length > 0) {
			this.copyItemsToCenter(objects);
		}

		docObj.selection = null;

		return docObj;
	}

	/**
	 * Saves the current document in the requested format.
	 *
	 * @remarks
	 * Supported formats: EPS, TIFF, AI
	 * If no `fileName` is provided, uses the document's current name (without extension).
	 *
	 * @param options - Saving configuration
	 * @param options.filePath - Folder path where the file should be saved
	 * @param options.fileName - Optional custom filename (without extension)
	 * @param options.format - Output format (`"EPS" | "TIFF" | "AI"`) — defaults to `"EPS"`
	 * @throws {Error} When an unsupported format is requested
	 *
	 * @example
	 * ```ts
	 * docHandler.save({ filePath: "/Volumes/Output", fileName: "final-poster", format: "TIFF" });
	 * ```
	 */
	save(options: DocumentSaveOptions): void {
		if (!this.doc) {
			return;
		}

		const { filePath, fileName, format = "EPS" } = options;

		// Determine the file name to use
		const finalFileName = fileName || this.doc.name.replace(/\.\w+$/, "");

		// Construct the full save path
		const file = new File(filePath);
		const savePath = file.fsName + "/" + finalFileName;

		// Save based on the specified format
		switch (format) {
			case "EPS":
				this.saveAsEPS(savePath);
				break;
			case "TIFF":
				this.saveAsTIFF(savePath);
				break;
			case "AI":
				this.saveAsAI(savePath);
				break;
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	}

	/**
	 * Saves document in EPS format with Illustrator 2024 compatibility and embedded fonts.
	 *
	 * @param savePath - Full filesystem path including filename and `.eps` extension
	 * @private
	 */
	private saveAsEPS(savePath: string): void {
		const epsOptions = new EPSSaveOptions() as typeof EPSSaveOptions;
		epsOptions.compatibility = Compatibility.ILLUSTRATOR24;
		epsOptions.preview = EPSPreview.None;
		epsOptions.cmykPostScript = true;
		epsOptions.embedAllFonts = true;
		epsOptions.includeDocumentThumbnails = false;
		epsOptions.embedLinkedFiles = true;

		this.doc!.saveAs(new File(savePath), epsOptions);
	}

	/**
	 * Exports document as 72 dpi CMYK TIFF with anti-aliasing.
	 *
	 * @param savePath - Full filesystem path including filename and `.tif` / `.tiff` extension
	 * @private
	 */
	private saveAsTIFF(savePath: string): void {
		const tiffOptions = new ExportOptionsTIFF() as typeof ExportOptionsTIFF;
		tiffOptions.antiAliasing = AntiAliasingMethod.TYPEOPTIMIZED;
		tiffOptions.embedICCProfile = true;
		tiffOptions.imageColorSpace = ImageColorSpace.CMYK;
		tiffOptions.lZWCompression = false;
		tiffOptions.resolution = 72;
		this.doc!.exportFile(new File(savePath), ExportType.TIFF, tiffOptions);
	}

	/**
	 * Saves document in native Adobe Illustrator (.ai) format with PDF compatibility.
	 *
	 * @param savePath - Full filesystem path including filename and `.ai` extension
	 * @private
	 */
	private saveAsAI(savePath: string): void {
		const aiOptions =
			new IllustratorSaveOptions() as typeof IllustratorSaveOptions;
		aiOptions.compatibility = Compatibility.ILLUSTRATOR24;
		aiOptions.compressed = true;
		aiOptions.embedICCProfile = true;
		aiOptions.embedLinkedFiles = true;
		aiOptions.pdfCompatible = true;

		this.doc!.saveAs(new File(savePath), aiOptions);
	}

	/**
	 * Closes the managed document without saving any changes and clears the internal reference.
	 */
	close(): void {
		if (this.doc) {
			this.doc.close(SaveOptions.DONOTSAVECHANGES);
			this.doc = null;
		}
	}

	/**
	 * Duplicates the provided page items into the current document and centers them on the artboard.
	 *
	 * @param objects - Array of page items to copy
	 * @private
	 */
	private copyItemsToCenter(objects: PageItem[]): void {
		if (!this.doc) {
			return;
		}

		const duplicatedItems: PageItem[] = [];
		for (let i = objects.length; i >= 1; i--) {
			duplicatedItems.unshift(objects[i - 1].duplicate(this.doc) as PageItem);
		}

		AlignmentHandler.alignPageItemsToArtboard({
			doc: this.doc,
			objects: duplicatedItems,
			engine: "action",
		});
	}
}

/**
 * Supported file formats for saving/exporting Illustrator documents.
 */
type SaveFormat = "EPS" | "TIFF" | "AI";

/**
 * Configuration object for the `save()` method.
 */
interface DocumentSaveOptions {
	/** Folder path where the file should be saved */
	filePath: string;
	/** Optional base filename (extension is added automatically) */
	fileName?: string;
	/** Desired output format — defaults to `"EPS"` */
	format?: SaveFormat;
}
