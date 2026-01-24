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
   * Calculates the visible bounding box of selected items in Adobe Illustrator.
   *
   * @param object - Object items in Illustrator.
   * @returns An object containing the `left`, `top`, `right`, and `bottom` bounds of the selection.
   */
  static getObjectBounds = (object: Selection | PageItem): BoundsObject => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    /**
     * Processes an Illustrator item and updates bounding box values.
     * @param item - The Illustrator item (PathItem, GroupItem, TextFrame, etc.).
     */
    const processItem = (item: PageItem): void => {
      if (item.typename === PageItemType.GroupItem) {
        if (item.clipped) {
          // Find the clipping path within the clipped group
          for (let i = 0; i < item.pageItems.length; i++) {
            const child = item.pageItems[i];
            if (
              child.clipping ||
              child.typename === PageItemType.CompoundPathItem
            ) {
              updateBounds(child.geometricBounds);
              break; // Stop iterating within this GroupItem
            }
          }
        } else {
          // Recursively process child items for un-clipped groups
          for (let i = 0; i < item.pageItems.length; i++) {
            processItem(item.pageItems[i]);
          }
        }
      } else {
        // Process individual objects (TextFrame, PathItem, etc.)
        updateBounds(item.geometricBounds);
      }
    };

    /**
     * Updates the min and max bounds based on the item's geometric bounds.
     * @param bounds - The geometric bounds of the item ([left, top, right, bottom]).
     */
    const updateBounds = (bounds: number[]): void => {
      const [left, top, right, bottom] = bounds;
      minX = Math.min(minX, left);
      minY = Math.min(minY, bottom);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, top);
    };

    if (isArray(object)) {
      // Process each selected item using a for loop
      for (let i = 0; i < object.length; i++) {
        processItem((object as Selection)[i]);
      }
    } else {
      processItem(object as PageItem);
    }

    const bounds = { left: minX, top: maxY, right: maxX, bottom: minY };

    for (const key in bounds) {
      if (bounds.hasOwnProperty(key)) {
        // Check if the property belongs to bounds
        const value = bounds[key as keyof typeof bounds];
        if (value === Infinity) {
          throw Error("Wrong Bounds");
        }
      }
    }

    return bounds;
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
