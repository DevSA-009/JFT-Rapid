/**
 * Manages creation, population, saving, and cleanup of Adobe Illustrator documents.
 *
 * Simplifies common ExtendScript workflows:
 * - Fixed 207×207 inch CMYK document creation
 * - Optional artwork duplication with configurable alignment
 * - Saving to EPS, TIFF, or AI with optimized preset settings
 * - Safe document closing
 */
class IllustratorDocument {
  private doc: Document | null = null;
  private title: string;
  private threadEngine: ThreadEngine;
  private itemsPastePosition: AlignPosition | "NONE";

  /**
   * Creates a new IllustratorDocument instance.
   *
   * @param params - Configuration parameters for document creation and alignment behavior
   */
  constructor(params: IllustratorDocumentParams) {
    const { pastePosition = "C", title = "JFT-Rapid" } = params;

    this.title = title;
    this.threadEngine = params.threadEngine;
    this.itemsPastePosition = pastePosition;
  }

  /**
   * Creates a new 207×207 inch CMYK Illustrator document.
   *
   * @remarks
   * - Uses the first available startup preset as base
   * - Always creates document in Inches / CMYK color space
   * - Optionally duplicates and aligns provided page items
   *
   * @param objects - Optional array of `PageItem`s to duplicate into the new document
   * @param focus - Whether to activate the new document (default: `true`)
   * @returns The newly created `Document` object
   */
  create(objects: PageItem[] | null = null, focus: boolean = true): Document {
    const doc = app.activeDocument;
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

    if (!focus) {
      doc.activate();
    }

    if (objects && objects.length > 0) {
      this.copyItemsTo(objects);
    }

    Organizer.docAllObjectsSelectionHandler({ doc: this.doc, type: false });

    return docObj;
  }

  /**
   * Saves the document in the requested format.
   *
   * @remarks
   * Supported formats: EPS, TIFF, AI
   * If no `fileName` is provided, uses the document's current name (without extension).
   *
   * @param options - Saving configuration
   * @throws {Error} When an unsupported format is requested
   *
   * @example
   * ```ts
   * docHandler.save({
   *   filePath: "/Volumes/Output",
   *   fileName: "final-poster",
   *   format: "TIFF"
   * });
   * ```
   */
  save(options: DocumentSaveOptions): void {
    if (!this.doc) {
      return;
    }

    const { filePath, fileName, format = "EPS" } = options;

    const finalFileName = fileName || this.doc.name.replace(/\.\w+$/, "");
    const file = new File(filePath);
    const savePath = file.fsName + "/" + finalFileName;

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
   * Saves the document as EPS with Illustrator 2024 compatibility and embedded fonts.
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
   * Exports the document as 72 dpi CMYK TIFF.
   * @private
   */
  private saveAsTIFF(savePath: string): void {
    const tiffOptions = new ExportOptionsTIFF() as typeof ExportOptionsTIFF;
    tiffOptions.antiAliasing = AntiAliasingMethod.None;
    tiffOptions.embedICCProfile = true;
    tiffOptions.imageColorSpace = ImageColorSpace.CMYK;
    tiffOptions.lZWCompression = false;
    tiffOptions.resolution = 72;

    this.doc!.exportFile(new File(savePath), ExportType.TIFF, tiffOptions);
  }

  /**
   * Saves the document in native .ai format with PDF compatibility.
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
   * Closes the managed document without saving changes and clears the internal reference.
   */
  close(): void {
    if (this.doc) {
      this.doc.close(SaveOptions.DONOTSAVECHANGES);
      this.doc = null;
    }
  }

  /**
   * Duplicates provided page items into the document and aligns them using the configured thread engine and position.
   * @private
   */
  private copyItemsTo(objects: PageItem[]): void {
    if (!this.doc) {
      return;
    }

    const duplicatedItems: PageItem[] = [];
    for (let i = objects.length; i >= 1; i--) {
      duplicatedItems.unshift(objects[i - 1].duplicate(this.doc) as PageItem);
    }

    if (this.threadEngine === "action") app.redraw();

    if (this.itemsPastePosition !== "NONE") {
      AlignmentHandler.alignPageItemsToArtboard({
        doc: this.doc,
        objects: duplicatedItems,
        engine: this.threadEngine,
        position: this.itemsPastePosition,
      });
    }

    if (this.threadEngine === "action") app.redraw();
  }
}

/** Supported output formats for the save() method */
type SaveFormat = "EPS" | "TIFF" | "AI";

/**
 * Configuration parameters for `IllustratorDocument` constructor.
 */
interface IllustratorDocumentParams {
  /** Name assigned to newly created documents */
  title?: string;
  /** Execution engine used for aligning items (`"action"` recommended for complex objects) */
  threadEngine: ThreadEngine;
  /** Alignment position for pasted items on the artboard */
  pastePosition?: AlignPosition | "NONE";
}

/**
 * Options for the `save()` method.
 */
interface DocumentSaveOptions {
  /** Folder path where the file will be saved */
  filePath: string;
  /** Optional filename without extension */
  fileName?: string;
  /** Output format — defaults to `"EPS"` */
  format?: SaveFormat;
}
