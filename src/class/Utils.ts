class Utils {
	/**
	 * Swaps the width and height values of a dimension object.
	 *
	 * @param dims - An object containing width and height values
	 * @returns A new Dimensions object with width and height swapped
	 *
	 * @example
	 * ```ts
	 * DimensionUtils.swapDimensions({ width: 800, height: 600 });
	 * // => { width: 600, height: 800 }
	 * ```
	 */
	static swapDimensions(dims: DimensionObject): DimensionObject {
		return {
			width: dims.height,
			height: dims.width,
		};
	}

	/**
	 * Converts a numeric value between length units.
	 * Defaults from 'pt' to 'inch'.
	 * @param params - Object containing value, optional from/to units
	 * @returns Converted numeric value
	 */
	static convertLength(params: ConvertParams): number {
		const { value, from = "pt", to = "inch" } = params;

		// Conversion factors to inches
		var toInches: Record<LengthUnit, number> = {
			inch: 1,
			mm: 1 / 25.4,
			cm: 1 / 2.54,
			pt: 1 / 72,
		};

		// Convert from "from" unit to inches
		const valueInInches = value * toInches[from];

		// Convert inches to "to" unit
		return valueInInches / toInches[to];
	}

	/**
	 * Slices a string or array from the end based on the specified slice value.
	 *
	 * @param originalVal - The input string or array to be sliced.
	 * @param sliceValue - The number of elements to remove from the end.
	 * @returns The sliced value.
	 * @throws {Error} Throws an error if sliceValue is negative.
	 */
	static endSlice = (
		originalVal: string | unknown[],
		sliceValue: number,
	): string | unknown[] => {
		if (sliceValue < 0) {
			throw new Error("sliceValue must be non-negative");
		}
		return originalVal.slice(0, originalVal.length - sliceValue);
	};

	/**
	 * Calculates the total size of repeated items with gaps applied
	 * only between items (no trailing gap).
	 *
	 * Formula:
	 *   (itemSize * count) + (gap * (count - 1))
	 *
	 * @param params - Calculation parameters
	 * @returns Total size including gaps
	 */
	static calculateTotalWithGap(params: CalculateTotalWithGapParams): number {
		const { value, count, gap } = params;
		if (count <= 0) return 0;
		if (count === 1) return value;
		return value * count + gap * (count - 1);
	}

	/**
	 * Determines whether a given number is odd.
	 *
	 * @param value - The number to evaluate.
	 * @returns `true` if the number is odd, otherwise `false`.
	 */
	static isOdd(value: number) {
		return !!(value % 2);
	}

	/**
	 * Converts a string between ASCII and hexadecimal representation.
	 *
	 * Supported HEX input formats (when `toHex === false`):
	 * - `"0x414243"`
	 * - `"41 42 43"`
	 * - `"414243"`
	 *
	 * @param str - The input string to convert.
	 * @param toHex - If `true` (default), converts ASCII to hex.
	 *                If `false`, converts hex to ASCII.
	 * @returns The converted string.
	 *
	 * @example
	 * ```ts
	 * hexString("ABC");                // "414243"
	 * hexString("0x414243", false);    // "ABC"
	 * hexString("41 42 43", false);    // "ABC"
	 * hexString("414243", false);      // "ABC"
	 * ```
	 */
	static hexString(str: string, toHex: boolean = true): string {
		let result = "";
		let i: number;

		if (toHex) {
			// ASCII → HEX
			for (i = 0; i < str.length; i++) {
				let hex = str.charCodeAt(i).toString(16);

				// Ensure 2-digit hex
				if (hex.length < 2) {
					hex = "0" + hex;
				}

				result += hex;
			}
		} else {
			// Normalize HEX input:
			// 1. Remove 0x / 0X prefix
			// 2. Remove spaces
			let hexString = str.replace(/^0x/i, "").replace(/\s+/g, "").toLowerCase();

			// HEX → ASCII
			for (i = 0; i < hexString.length; i += 2) {
				const byteStr = hexString.substr(i, 2);
				result += String.fromCharCode(parseInt(byteStr, 16));
			}
		}

		return result;
	}

	/**
	 * Inverts the sign of a Y-coordinate value to compensate for differences in Y-axis direction
	 * between coordinate systems.
	 *
	 * In Adobe Illustrator's **default coordinate system** used in the UI, the origin (0,0) is at the **top-left** corner of the artboard,
	 * and **positive Y values point downward**.
	 *
	 * Some legacy code, extendscript engine, or bottom-up oriented systems treat positive Y as
	 * upward. This helper function helps bridge that difference by flipping the sign:
	 * - positive → negative (moves "down" in top-down system → "up" in bottom-up)
	 * - negative → positive
	 *
	 * @param value - The Y-coordinate (or Y delta) to invert
	 * @returns The sign-inverted value
	 *
	 * @remarks
	 * Use this primarily when translating positions or deltas between:
	 * - "script" extendscript / legacy - bottom-up Y systems
	 * - "action" Illustrator's native (UI) top-down Y systems
	 */
	static reverseCenterY(value: number) {
		return value > 0 ? -value : Math.abs(value);
	}

	/**
	 * Aligns one or more PageItems to the active artboard using various alignment positions.
	 * Supports single items and selections (temporarily groups multiple items if needed).
	 *
	 * Handles coordinate system differences between ExtendScript ("script") and Action Manager ("action").
	 *
	 * @param params - Alignment parameters
	 * @param params.items - Single PageItem or Selection of items to align
	 * @param params.doc - The Illustrator document containing the items and artboard
	 * @param params.position - Alignment position relative to the artboard (default: "C")
	 * @param params.engine - Engine/coordinate system being used ("script" or "action") — affects Y-axis direction
	 *
	 * **Supported position values:**
	 * - `"C"`   – center of artboard (default)
	 * - `"L"`   – left edge
	 * - `"R"`   – right edge
	 * - `"T"`   – top edge
	 * - `"B"`   – bottom edge
	 * - `"TC"`  – top center
	 * - `"BC"`  – bottom center
	 * - `"LC"`  – left center
	 * - `"RC"`  – right center
	 * - `"CX"`  – center horizontally only
	 * - `"CY"`  – center vertically only
	 * ```
	 */
	static getCenterXY(params: GetCenterXY) {
		const { engine = "script" } = params;

		const { bottom, left, right, top } = params.bounds;

		// Calculate current center X position
		const centerX = (left + right) / 2;

		// Calculate current center Y position
		let centerY = (top + bottom) / 2;

		if (engine === "action") {
			// Apply Y-axis inversion logic for Illustrator coordinate system
			// If Y is positive, make it negative; if negative, make it positive
			centerY = this.reverseCenterY(centerY);
		}

		return { centerX, centerY };
	}

	/**
	 * Positions one or more PageItems in the active artboard by aligning their center to specified edges or center points.
	 * Handles both single item and multiple by temporarily grouping when needed.
	 *
	 * @param {Selection|PageItem} items - The item(s) to position. Can be a single PageItem or a Selection collection.
	 * @param {Document} doc - The Illustrator document containing the artboard.
	 * @param {AlignPosition} [position="C"] - The alignment position
	 */
	static alignPageItemsToArtboard = (
		params: AlignPageItemsToArtboard,
	): void => {
		const { doc, position = "C", engine = "script" } = params;

		let items = params.items;

		const artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
		const [abLeft, abTop, abRight, abBottom] = artboard.artboardRect;

		const {
			top: itemTop,
			left: itemLeft,
			bottom: itemBottom,
			right: itemRight,
		} = getSelectionBounds(items); // [top, left, bottom, right]

		const isItems = isArray(items);

		const groupManger = new GroupManager(
			isItems ? (items as Selection) : ([items] as Selection),
		);
		const { prev } = getAdjacentPageItems(items as Selection);
		if (isItems) {
			groupManger.group(prev);
			items = groupManger.tempGroup as PageItem;
		}

		const { centerX, centerY } = this.getCenterXY({
			bounds: {
				left: itemLeft,
				right: itemRight,
				bottom: itemBottom,
				top: itemTop,
			},
			engine: "script",
		});

		let targetX: number = centerX;
		let targetY: number = centerY;

		switch (position) {
			case "L":
				targetX = abLeft - (itemLeft - centerX);
				break;
			case "R":
				targetX = abRight - (itemRight - centerX);
				break;
			case "T":
				targetY = abTop - (itemTop - centerY); // 🔹 FIXED
				break;
			case "B":
				targetY = abBottom - (itemBottom - centerY);
				break;
			case "TC":
				targetX = (abLeft + abRight) / 2;
				targetY = abTop - (itemTop - centerY);
				break;
			case "BC":
				targetX = (abLeft + abRight) / 2;
				targetY = abBottom - (itemBottom - centerY);
				break;
			case "LC":
				targetX = abLeft - (itemLeft - centerX);
				targetY = (abTop + abBottom) / 2;
				break;
			case "RC":
				targetX = abRight - (itemRight - centerX);
				targetY = (abTop + abBottom) / 2;
				break;
			case "CX":
				targetX = (abLeft + abRight) / 2;
				break;
			case "CY":
				targetY = (abTop + abBottom) / 2;
				break;
			case "C":
				targetX = (abLeft + abRight) / 2;
				targetY = (abTop + abBottom) / 2;
				break;
		}

		// Compute translation distance
		const deltaX = targetX - centerX;
		let deltaY = targetY - centerY;

		if (engine === "action") {
			deltaY = this.reverseCenterY(deltaY);
			const transActHandler = new TransActionHandler({
				doc,
			});
			transActHandler.move({ item: items as PageItem, x: deltaX, y: deltaY });
			transActHandler.removeAll();
		} else {
			// Move the item
			(items as PageItem).translate(deltaX, deltaY);
		}

		if (isItems) {
			groupManger.ungroup(prev);
		}
	};
}

interface ConvertParams {
	value: number;
	from?: LengthUnit; // default = "pt"
	to?: LengthUnit; // default = "inch"
}

interface GetCenterXY {
	bounds: BoundsObject;
	engine?: ThreadEngine;
}

interface AlignPageItemsToArtboard {
	items: Selection | PageItem;
	doc: Document;
	position?: AlignPosition;
	engine?: ThreadEngine;
}

/**
 * Parameters for calculating total size with gaps between items.
 */
interface CalculateTotalWithGapParams {
	/** Base value */
	value: number;

	/** Number of counts */
	count: number;

	/** Gap between consecutive items */
	gap: number;
}
