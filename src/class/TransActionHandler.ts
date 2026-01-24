/**
 * Handler class for performing precise geometric transformations (move, rotate, resize)
 * on selected objects in Adobe Illustrator using dynamically generated Action Sets (.aia files).
 *
 * @remarks
 * Internally uses Illustrator's Transform Panel actions executed via `app.doScript()`.
 * Creates temporary .aia files only when a particular transformation with given parameters
 * hasn't been loaded yet.
 *
 * Especially useful when the standard ExtendScript transformation methods fail or behave
 * incorrectly on opacity masked items, clipping masks, compound paths or other complex artwork.
 *
 * @example
 * ```typescript
 * const handler = new TransActionHandler({ doc: app.activeDocument });
 * const item = app.activeDocument.selection[0];
 *
 * // Move item 100pt right, 50pt down
 * handler.move({ x: 100, y: 50, item });
 *
 * // Rotate 90 degrees
 * handler.rotate({ deg: 90, item });
 *
 * // Resize to 500x300 points
 * handler.resize({ width: 500, height: 300, item });
 *
 * // Clean up all loaded actions
 * handler.removeAll();
 * ```
 */
class TransActionHandler {

	/** Cache of currently loaded action set names */
	private currentSets: CurrentSets = {};

	/**
	 * Predefined reference point templates used to change the transformation origin.
	 * @private
	 */
	private readonly templateRefPoints = [
		"/version 3",
		"/name [ 5",
		"5365742031",
		"]",
		"/isOpen 1",
		"/actionCount 1",
		"/action-1 {",
		"/name [ 8",
		"416374696f6e2033",
		"]",
		"/keyIndex 0",
		"/colorIndex 0",
		"/isOpen 1",
		"/eventCount 1",
		"/event-1 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 0",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 24",
		"536574205265666572656e636520506f696e7420546f3a20",
		"]",
		"/value 8",
		"}",
		"/parameter-2 {",
		"/key 1919247984",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 8",
		"546f70204c656674",
		"]",
		"/value 0",
		"}",
		"}",
		"}",
	];

	/**
	 * Template for absolute move to specific center coordinates (X and Y separately).
	 *
	 * Uses two Transform Panel events:
	 * - Move reference in X to: ... pt
	 * - Move reference in Y to: ... pt
	 *
	 * @private
	 */
	private readonly templateMove = [
		"/version 3",
		"/name [ 5",
		"5365742031",
		"]",
		"/isOpen 1",
		"/actionCount 1",
		"/action-1 {",
		"/name [ 8",
		"416374696f6e2032",
		"]",
		"/keyIndex 0",
		"/colorIndex 0",
		"/isOpen 0",
		"/eventCount 2",
		"/event-1 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 1",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 23",
		"4d6f7665207265666572656e636520696e205820746f3a",
		"]",
		"/value 0",
		"}",
		"/parameter-2 {",
		"/key 1986096245",
		"/showInPalette -1",
		"/type (unit real)",
		"/value 360.0",
		"/unit 592476268",
		"}",
		"}",
		"/event-2 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 1",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 23",
		"4d6f7665207265666572656e636520696e205920746f3a",
		"]",
		"/value 1",
		"}",
		"/parameter-2 {",
		"/key 1986096245",
		"/showInPalette -1",
		"/type (unit real)",
		"/value 576.0",
		"/unit 592476268",
		"}",
		"}",
		"}",
	];

	/**
	 * Template for rotation around center by given angle (degrees).
	 *
	 * Uses one Transform Panel event:
	 * - Rotate: ... degrees
	 *
	 * @private
	 */
	private readonly templateRotate = [
		"/version 3",
		"/name [ 5",
		"5365742031",
		"]",
		"/isOpen 1",
		"/actionCount 1",
		"/action-1 {",
		"/name [ 8",
		"416374696f6e2031",
		"]",
		"/keyIndex 0",
		"/colorIndex 0",
		"/isOpen 1",
		"/eventCount 1",
		"/event-1 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 1",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 7",
		"526f746174653a",
		"]",
		"/value 5",
		"}",
		"/parameter-2 {",
		"/key 1986096245",
		"/showInPalette -1",
		"/type (unit real)",
		"/value 90.0",
		"/unit 591490663",
		"}",
		"}",
		"}",
	];

	/**
	 * Template for absolute resize to exact width and height values.
	 *
	 * Uses two Transform Panel events:
	 * - Scale width to: ... pt
	 * - Scale height to: ... pt
	 *
	 * @private
	 */
	private readonly templateResize = [
		"/version 3",
		"/name [ 5",
		"5365742032",
		"]",
		"/isOpen 1",
		"/actionCount 1",
		"/action-1 {",
		"/name [ 8",
		"416374696f6e2033",
		"]",
		"/keyIndex 0",
		"/colorIndex 0",
		"/isOpen 1",
		"/eventCount 2",
		"/event-1 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 1",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 15",
		"5363616c6520776964746820746f3a",
		"]",
		"/value 2",
		"}",
		"/parameter-2 {",
		"/key 1986096245",
		"/showInPalette -1",
		"/type (unit real)",
		"/value 1548.0",
		"/unit 592476268",
		"}",
		"}",
		"/event-2 {",
		"/useRulersIn1stQuadrant 0",
		"/internalName (ai_plugin_transformPalette)",
		"/localizedName [ 15",
		"5472616e73666f726d2050616e656c",
		"]",
		"/isOpen 1",
		"/isOn 1",
		"/hasDialog 0",
		"/parameterCount 2",
		"/parameter-1 {",
		"/key 1954115685",
		"/showInPalette -1",
		"/type (enumerated)",
		"/name [ 16",
		"5363616c652068656967687420746f3a",
		"]",
		"/value 3",
		"}",
		"/parameter-2 {",
		"/key 1986096245",
		"/showInPalette -1",
		"/type (unit real)",
		"/value 2232.0",
		"/unit 592476268",
		"}",
		"}",
		"}",
	];

	/**
	 * Creates a new TransActionHandler instance also change transformation reference point in `CENTER`.
	 *
	 * @param params - Configuration object
	 * @param params.doc - The Illustrator document to operate on
	 */
	constructor() {
		this.changeRefPoint("CENTER");
	}
	/**
	 * Changes the active reference point (pivot) for subsequent transformations.
	 *
	 * @param ref - The reference point to set (e.g. "CENTER", "TOPLEFT", "BOTTOMRIGHT")
	 *
	 * @remarks
	 * Internally generates and loads a small action set that sets the Transform Panel's
	 * reference point. The change persists until Illustrator is restarted or another
	 * reference point is set.
	 *
	 * Most common values:
	 * - `"CENTER"`     – transformations around geometric center (default)
	 * - `"TOPLEFT"`    – top-left corner
	 * - `"BOTTOMRIGHT"`– bottom-right corner
	 * - `"MIDDLELEFT"` – middle of left edge
	 *
	 */
	private changeRefPoint(ref: keyof typeof ReferencePoints) {
		// Generate unique set name based on delta values
		const setName = `Trans_Change_Ref_In_${ref}`;

		// Check if this action set is already loaded
		if (this.currentSets[setName]) {
			// Execute cached action
			app.doScript(setName, setName);
			return;
		}

		// Convert set name to hexadecimal for .aia format
		const hexName = Utils.hexString(setName);

		// Clone template to avoid mutation
		const template = [...this.templateRefPoints];

		// Calculate hex byte length for .aia name field
		const hexByteLength = hexName.length / 2;

		// Update set name in template (line 1-2)
		template[1] = `/name [ ${hexByteLength}`;
		template[2] = hexName;

		// Update action name in template (line 7-8)
		template[7] = `/name [ ${hexByteLength}`;
		template[8] = hexName;

		// update reference point value
		template[37] = `/name [ ${ReferencePoints[ref].name.length / 2}`;
		template[38] = ReferencePoints[ref].name;
		template[40] = `/value ${ReferencePoints[ref].value}`;

		// Load and execute the action set
		this.loadActionSet(setName, template);
		app.doScript(setName, setName);
		app.unloadAction(setName, "");
		this.currentSets = {};
	}

	/**
	 * Creates a temporary .aia (Adobe Illustrator Action) file in the system temp folder.
	 *
	 * @param params - File creation parameters
	 * @param params.content - Full text content of the .aia file
	 * @param params.setName - Used in the temporary filename for uniqueness
	 * @returns The created File object
	 *
	 * @private
	 */
	private createAiaFile({ content, setName }: CreateAiaFile): File {
		// Get system temporary folder location
		const tempPathLocation = Folder.temp;

		// Construct unique temp file path with setName identifier
		const tempFile = `${tempPathLocation.fsName}/Transformation_DevSA_${setName}.aia`;
		const aiaFile = new File(tempFile);

		// Write content to file
		aiaFile.open("w");
		aiaFile.write(content);
		aiaFile.close();

		return aiaFile;
	}

	/**
	 * Temporarily selects or deselects the item before/after script execution.
	 *
	 * @param item - The PageItem to select/deselect
	 * @param type - `true` to select, `false` to deselect all
	 *
	 * @private
	 */
	private selectionHandler(item: PageItem, type: boolean): void {
		if (!type) {
			// Deselect all items in the document
			app.executeMenuCommand("deselectall");
		} else {
			// Select the specified item
			item.selected = type;
		}
	}

	/**
	 * Loads the action set from template if it hasn't been loaded yet.
	 * Caches the loaded set name to avoid redundant loading.
	 *
	 * @param setName - Unique identifier for this action set
	 * @param template - Array of strings representing the .aia file content
	 *
	 * @private
	 */
	private loadActionSet(setName: string, template: string[]): void {
		// Create temporary .aia file from template
		const file = this.createAiaFile({
			content: template.join("\n"),
			setName,
		});

		// Load the action into Illustrator
		app.loadAction(file);

		// Cache this set name to prevent reloading
		this.currentSets[setName] = true;

		// Clean up temporary file
		file.remove();
	}

	/**
	 * Moves the item by the given delta (relative to current center point) or to absolute coordinates.
	 *
	 * @param params - Move parameters
	 * @param params.x - Horizontal delta in points (positive = right) or absolute X coordinate if useAbsolute is true
	 * @param params.y - Vertical delta in points (positive = down in AI coordinate system) or absolute Y coordinate if useAbsolute is true
	 * @param params.item - The PageItem to move
	 * @param params.useAbsolute - If true, x and y are treated as absolute coordinates; if false (default), they are relative deltas
	 *
	 * @remarks
	 * When useAbsolute is false (default):
	 * - Calculates current item center position
	 * - Applies Y-axis inversion logic (positive Y becomes negative, negative Y becomes positive)
	 * - Adds delta values to current position
	 *
	 * When useAbsolute is true:
	 * - Uses x and y values directly as absolute coordinates
	 *
	 * @example
	 * ```typescript
	 * // Relative move: 100pt right, 50pt down
	 * handler.move({ x: 100, y: 50, item: myItem });
	 *
	 * // Absolute positioning
	 * handler.move({ x: 500, y: 300, item: myItem, useAbsolute: true });
	 * ```
	 */
	move({ x, y, item, useAbsolute = false }: Move): void {
		// Generate unique set name based on delta values
		const setName = `Trans_Move_${x.toFixed(4)}x${y.toFixed(4)}`;

		// Select the item before transformation
		this.selectionHandler(item, true);

		// Check if this action set is already loaded
		if (this.currentSets[setName]) {
			// Execute cached action
			app.doScript(setName, setName);
			this.selectionHandler(item, false);
			return;
		}

		// Convert set name to hexadecimal for .aia format
		const hexName = Utils.hexString(setName);

		// Clone template to avoid mutation
		const template = [...this.templateMove];

		// Calculate hex byte length for .aia name field
		const hexByteLength = hexName.length / 2;

		// Update set name in template (line 1-2)
		template[1] = `/name [ ${hexByteLength}`;
		template[2] = hexName;

		// Update action name in template (line 7-8)
		template[7] = `/name [ ${hexByteLength}`;
		template[8] = hexName;

		// Get current bounds of the item
		const bounds = Utils.getObjectBounds(item);

		// Initialize final coordinates
		let finalX = x;
		let finalY = y;

		// Calculate final position based on mode
		if (!useAbsolute) {
			// get center XY value based on engine type
			const { centerX, centerY } = Utils.getCenterXY({
				bounds,
				engine: "action",
			});

			// Add delta to current position
			finalX += centerX;
			finalY += centerY;
		}

		// Update X coordinate value in template (line 37: event-1 parameter-2)
		template[37] = `/value ${finalX.toFixed(4)}`;

		// Update Y coordinate value in template (line 64: event-2 parameter-2)
		template[64] = `/value ${finalY.toFixed(4)}`;

		// Load and execute the action set
		this.loadActionSet(setName, template);
		app.doScript(setName, setName);

		// Deselect after transformation
		this.selectionHandler(item, false);
	}

	/**
	 * Resizes the item to exact width × height (absolute size in points).
	 *
	 * @param params - Resize parameters
	 * @param params.width - Target width in points
	 * @param params.height - Target height in points
	 * @param params.item - The PageItem to resize
	 *
	 * @remarks
	 * Uses Transform Panel's "Scale width to" and "Scale height to" actions.
	 * This is an absolute resize, not a percentage scale.
	 *
	 * @example
	 * ```typescript
	 * // Resize to 500pt × 300pt
	 * handler.resize({ width: 500, height: 300, item: myItem });
	 * ```
	 */
	resize({ height, width, item }: Resize): void {
		// Generate unique set name with rounded dimensions
		const setName = `Trans_Resize_${width.toFixed(4)}x${height.toFixed(4)}`;

		// Select the item before transformation
		this.selectionHandler(item, true);

		// Check if this action set is already loaded
		if (this.currentSets[setName]) {
			// Execute cached action
			app.doScript(setName, setName);
			this.selectionHandler(item, false);
			return;
		}

		// Convert set name to hexadecimal for .aia format
		const hexName = Utils.hexString(setName);

		// Clone template to avoid mutation
		const template = [...this.templateResize];

		// Calculate hex byte length for .aia name field
		const hexByteLength = hexName.length / 2;

		// Update set name in template (line 1-2)
		template[1] = `/name [ ${hexByteLength}`;
		template[2] = hexName;

		// Update action name in template (line 7-8)
		template[7] = `/name [ ${hexByteLength}`;
		template[8] = hexName;

		// Update width value in template (line 37: event-1 parameter-2)
		template[37] = `/value ${width.toFixed(4)}`;

		// Update height value in template (line 64: event-2 parameter-2)
		template[64] = `/value ${height.toFixed(4)}`;

		// Load and execute the action set
		this.loadActionSet(setName, template);
		app.doScript(setName, setName);

		// Deselect after transformation
		this.selectionHandler(item, false);
	}

	/**
	 * Rotates the item by the given angle in degrees around its center point.
	 *
	 * @param params - Rotation parameters
	 * @param params.deg - Rotation angle in degrees (positive = counter-clockwise)
	 * @param params.item - The PageItem to rotate
	 *
	 * @remarks
	 * Uses Transform Panel's "Rotate" action.
	 * Rotation is performed around the item's center point.
	 *
	 * @example
	 * ```typescript
	 * // Rotate 90 degrees counter-clockwise
	 * handler.rotate({ deg: 90, item: myItem });
	 *
	 * // Rotate 45 degrees clockwise
	 * handler.rotate({ deg: -45, item: myItem });
	 * ```
	 */
	rotate({ deg, item }: Rotate): void {
		// Generate unique set name based on rotation angle
		const setName = `Trans_Rotate_${deg.toFixed(4)}`;

		// Select the item before transformation
		this.selectionHandler(item, true);

		// Check if this action set is already loaded
		if (this.currentSets[setName]) {
			// Execute cached action
			app.doScript(setName, setName);
			this.selectionHandler(item, false);
			return;
		}

		// Convert set name to hexadecimal for .aia format
		const hexName = Utils.hexString(setName);

		// Clone template to avoid mutation
		const template = [...this.templateRotate];

		// Calculate hex byte length for .aia name field
		const hexByteLength = hexName.length / 2;

		// Update set name in template (line 1-2)
		template[1] = `/name [ ${hexByteLength}`;
		template[2] = hexName;

		// Update action name in template (line 7-8)
		template[7] = `/name [ ${hexByteLength}`;
		template[8] = hexName;

		// Update rotation angle value in template (line 37: event-1 parameter-2)
		template[37] = `/value ${deg.toFixed(4)}`;

		// Load and execute the action set
		this.loadActionSet(setName, template);
		app.doScript(setName, setName);

		// Deselect after transformation
		this.selectionHandler(item, false);
	}

	/**
	 * Unloads all action sets previously created by this instance.
	 *
	 * @remarks
	 * Call this method when finished with transformations to clean up
	 * Illustrator's action palette and free memory.
	 *
	 * @example
	 * ```typescript
	 * const handler = new TransActionHandler({ doc: app.activeDocument });
	 * // ... perform transformations ...
	 * handler.removeAll(); // Clean up
	 * ```
	 */
	removeAll(): void {
		// Iterate through all cached action set names
		for (const setName in this.currentSets) {
			// Unload each action set from Illustrator
			app.unloadAction(setName, "");
		}

		// Clear the cache
		this.currentSets = {};
	}
}

/**
 * Configuration parameters for TransActionHandler constructor.
 */
interface TransActionHandlerParams {
	/** The Illustrator document to operate on */
	doc: Document;
}

/**
 * Cache object tracking loaded action sets by name.
 */
interface CurrentSets {
	/** Action set name as key, true if loaded */
	[key: string]: boolean;
}

/**
 * Parameters for the move operation.
 */
interface Move {
	/** The PageItem to move */
	item: PageItem;

	/** Horizontal delta in points (positive = right) or absolute X if useAbsolute is true */
	x: number;

	/** Vertical delta in points (positive = down) or absolute Y if useAbsolute is true */
	y: number;

	/** If true, x and y are absolute coordinates; if false (default), they are relative deltas */
	useAbsolute?: boolean;
}

/**
 * Parameters for the resize operation.
 */
interface Resize {
	/** The PageItem to resize */
	item: PageItem;

	/** Target width in points */
	width: number;

	/** Target height in points */
	height: number;
}

/**
 * Parameters for the rotate operation.
 */
interface Rotate {
	/** The PageItem to rotate */
	item: PageItem;

	/** Rotation angle in degrees (90, -90, 180, 0, or -180) */
	deg: RotateDegrees;
}

/**
 * Parameters for creating an .aia file.
 */
interface CreateAiaFile {
	/** Unique identifier used in the temporary filename */
	setName: string;

	/** Full text content of the .aia file */
	content: string;
}
