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

    if (ES6_SA.isArray(object)) {
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

  /**
   * Selects page items in Illustrator if they belong to the specified document.
   * Optionally clears the current selection if `clear` is true.
   *
   * @param {SelectObjectInDocParams} params
   * @param {Document} params.doc - The target Illustrator document.
   * @param {PageItem[]} params.items - Array of Illustrator PageItems to check and select.
   * @param {boolean} [params.clear=true] - Whether to clear the existing selection before selecting new items.
   */
  static selectObjectsInDoc = ({
    doc,
    items,
    clear = true,
  }: SelectItemsInDocParams): void => {
    const isInDocument = (item: PageItem): boolean => {
      // Recursive function to check if the item belongs to the document
      let parent = item.layer.parent as Document | PageItem;
      while (parent) {
        if (parent === doc) {
          return true;
        }
        parent = parent.parent as Document | PageItem;
      }
      return false;
    };

    // If clear is true, reset the selection
    if (clear) {
      doc.selection = null;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Check if the item belongs to the correct document
      if (isInDocument(item)) {
        item.selected = true;
      } else {
        // logMessage(`${item.name} not in ${doc.name} document`);
        items.splice(i, 1);
      }
    }
    return doc.selection;
  };

  /**
   * Get the previous, current, and next PageItem around a selection,
   * while supporting GroupItem or Layer parents.
   * If there's no valid previous PageItem, `prev` will be `null`.
   */
  static getAdjacentPageObjects = (
    object: Selection | PageItem,
  ): PrevNextObjects => {
    const isSelectionArr = ES6_SA.isArray(object);

    const firstItem = isSelectionArr
      ? (object as Selection)[0]
      : (object as PageItem);
    const lastItem = isSelectionArr
      ? (object as Selection)[(object as Selection).length - 1]
      : firstItem;

    const parent = firstItem.parent as PageItem | Layer;
    let siblings: PageItems;

    if (parent.typename === PageItemType.Layer) {
      siblings = (parent as Layer).pageItems;
    } else if (parent.typename === PageItemType.GroupItem) {
      siblings = (parent as GroupItem).pageItems;
    } else {
      throw new Error("Unsupported parent type: " + parent.typename);
    }

    const firstIndex = ES6_SA.arrayIndexOf(siblings, firstItem);
    const lastIndex = ES6_SA.arrayIndexOf(siblings, lastItem);

    const prev = firstIndex > 0 ? siblings[firstIndex - 1] : null;
    const next =
      lastIndex < siblings.length - 1 ? siblings[lastIndex + 1] : null;

    return {
      prev,
      current: firstItem,
      next,
    };
  };

  /**
   * Displays an alert dialog with a given message using ScriptUI.
   *
   * @param {string} message - The message to display in the alert dialog.
   */
  static showAlertDialog = (message: string) => {
    const dialog = new Window("dialog", "Alert");
    dialog.add("statictext", undefined, message);
    const okButton = dialog.add("button", undefined, "OK");

    okButton.onClick = () => {
      dialog.close();
    };

    dialog.show();
  };

  /**
   * Logs a message to the JavaScript Console.
   *
   * @param {string} message - The message to log to the console.
   */
  static logMessage = (message: string) => {
    $.writeln(message); // This will log the message to the JavaScript Console
  };

  /**
   * Renames the size token for a given group item by updating the contents of a text frame
   * with the specified target size. If no matching text frame is found, an alert is displayed.
   *
   * @param {GroupItem} item - The group item that contains the page items.
   * @param {ApparelSize} targetSizeChr - The target apparel size to be set in the size token.
   *
   * @returns {void} - This function does not return any value.
   *
   * @throws {Error} - Throws an error if the size token text frame is not found.
   */
  static renameSizeTKN = (
    item: GroupItem,
    targetSizeChr: ApparelSize,
  ): void => {
    const sizeTextFrame = ES6_SA.arrayFind(
      item.pageItems,
      (item) =>
        item.typename === PageItemType.TextFrame &&
        item.name === SIZE_TKN,
    );
    if (sizeTextFrame) {
      (sizeTextFrame as TextFrame).contents =
        `size-${targetSizeChr}`.toUpperCase();
    } else {
      throw new Error(`Size token not found in ${item.name}`);
    }
  };

  /**
   * Resizes the selected objects to a target width and height (in POINT) while maintaining their proportions.
   *
   * @param selection - Array of selected items in Illustrator.
   * @param targetWidth - The desired total width for the selection in POINT.
   * @param targetHeight - The desired total height for the selection in POINT.
   */
  static resizeObject = (
    selection: Selection | PageItem,
    targetWidth: number = 0,
    targetHeight: number = 0,
  ): void => {
    if (!selection || selection.length === 0) {
      alert("No selection found!");
      return;
    }

    if (ES6_SA.isArray(selection) && selection.length > 1) {
      const bounds = this.getObjectBounds(selection) as BoundsObject;
      const { width, height } = this.getDimension(bounds);

      const tempGroup = GroupManager.group(selection as Selection);

      // Calculate scaling factors for both width and height
      const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
      const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;

      tempGroup.resize(scaleX, scaleY);

      GroupManager.ungroup(tempGroup);
    } else {
      const targetItem = ES6_SA.isArray(selection)
        ? (selection as Selection)[0]
        : (selection as PageItem);
      const topMostItem = this.getObjectBounds(targetItem);
      const { left, bottom, right, top } = topMostItem;
      const { width, height } = this.getDimension({ left, right, top, bottom });
      // Calculate scaling factors for both width and height
      const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
      const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;
      targetItem.resize(scaleX, scaleY);
    }
  };

  /**
   * Finds and returns the largest object by area within a given PageItem hierarchy.
   * Handles both individual objects and groups, including clipped groups where it
   * specifically looks for clipping paths.
   *
   * @param item - The root PageItem to search within (can be GroupItem, PathItem, TextFrame, etc.)
   * @returns The PageItem with the largest area, or null if no valid objects are found
   *
   * @example
   * ```typescript
   * // Find largest object in a selection
   * const selection = app.activeDocument.selection[0];
   * const largestObject = getFinalClippingPath(selection);
   *
   * if (largestObject) {
   *   alert(`Largest object area: ${largestObject.width * largestObject.height}`);
   * }
   * ```
   *
   * @remarks
   * - For clipped groups, only examines clipping paths
   * - For unclipped groups, recursively searches all child items
   * - Compares objects by total area (width × height)
   * - Uses geometric bounds for size calculations
   *
   * @since 1.0.0
   */
  static getTopClippingPath = (item: PageItem): PageItem | null => {
    let largestObject: PageItem | null = null;
    let largestArea: number = 0;

    /**
     * Processes an Illustrator item and finds the largest object by area.
     * @param item - The Illustrator item (PathItem, GroupItem, TextFrame, etc.).
     */
    const processItem = (item: PageItem): void => {
      if (item.typename === PageItemType.GroupItem) {
        if (item.clipped) {
          // Find the clipping path within the clipped group
          for (let i = 0; i < item.pageItems.length; i++) {
            const child = item.pageItems[i];
            if (child.clipping) {
              checkIfLargest(child);
              break; // Stop iterating within this GroupItem
            }
          }
        } else {
          // Recursively process child items for un-clipped groups
          for (let i = 0; i < item.pageItems.length; i++) {
            processItem(item.pageItems[i]);
          }
        }
      }
    };

    /**
     * Checks if the current item is larger than the previously found largest item.
     * @param item - The item to check.
     */
    const checkIfLargest = (item: PageItem): void => {
      const bounds = item.geometricBounds;
      const [left, top, right, bottom] = bounds;

      // Calculate width and height
      const width = Math.abs(right - left);
      const height = Math.abs(top - bottom);
      const area = width * height;

      // Update largest object if this one is bigger
      if (area > largestArea) {
        largestArea = area;
        largestObject = item;
      }
    };

    processItem(item);

    return largestObject;
  };

  /**
   * Rotate a items by degrees
   * @param {Selection | PageItem} items
   * @param {90 | -90 | 180 | 0 | -180} deg
   */
  static rotateItems = (
    items: Selection | PageItem,
    deg: RotateDegrees | number,
  ) => {
    let groupManager: GroupManager | null = null;

    let item = items;

    if (ES6_SA.isArray(items)) {
      item = GroupManager.group(items as Selection);
    }

    // Get original bounds
    const { left, top, right, bottom } = this.getObjectBounds(item);
    const originalCenterX = (left + right) / 2;
    const originalCenterY = (top + bottom) / 2;

    // Rotate the object
    (item as PageItem).rotate(deg);

    // Get new bounds after rotation
    const newBounds = this.getObjectBounds(item);
    const newCenterX = (newBounds.left + newBounds.right) / 2;
    const newCenterY = (newBounds.top + newBounds.bottom) / 2;

    // Calculate the translation needed to keep it centered
    const deltaX = originalCenterX - newCenterX;
    const deltaY = originalCenterY - newCenterY;

    // Move object back to original center position
    (item as PageItem).translate(deltaX, deltaY);

    if (groupManager) {
      GroupManager.ungroup(item as GroupItem);
    }
  };

  /**
   * get object width and height value in `POINT` Unit
   *
   * @param bounds
   * @returns {DimensionObject}
   */
  static getDimension = (bounds: BoundsObject): DimensionObject => {
    const { left, top, right, bottom } = bounds;
    const width = parseFloat((right - left).toFixed(4));
    const height = parseFloat((top - bottom).toFixed(4));
    return { width, height };
  };

  /**
   * Applies a CMYK color to the fill and/or stroke of valid Illustrator page items.
   * Supports single items only (PathItem, CompoundPathItem, TextFrame).
   *
   * @param params - Configuration object for the color change operation
   * @throws {Error} If the object is not a supported type or CMYK values are invalid
   */
  static setCMYKColor(params: SetCMYKColorParams): void {
    const { object, color, target = "fill", onlyIfExists = false } = params;

    // ────────────────────────────────────────────────
    // 1. Validate input object type
    // ────────────────────────────────────────────────
    const supportedTypes = [
      PageItemType.PathItem,
      PageItemType.CompoundPathItem,
      PageItemType.TextFrame,
    ];

    if (!ES6_SA.arrayIncludes(supportedTypes, object.typename)) {
      throw new Error(
        `Object type "${object.typename}" is not valid for applying color. `,
      );
    }

    // ────────────────────────────────────────────────
    // 2. Handle null color → means "remove color" / set to none
    // ────────────────────────────────────────────────
    if (color === null) {
      if (target === "fill" || target === "both") {
        if (!onlyIfExists || object.filled) {
          object.filled = false;
        }
      }
      if (target === "stroke" || target === "both") {
        if (!onlyIfExists || object.stroked) {
          object.stroked = false;
        }
      }
      return;
    }

    // ────────────────────────────────────────────────
    // 3. Validate CMYK array
    // ────────────────────────────────────────────────
    if (!ES6_SA.isArray(color) || color.length !== 4) {
      throw new Error(
        "CMYK color must be an array of exactly 4 numbers [C, M, Y, K]",
      );
    }

    const [cyan, magenta, yellow, black] = color;

    if (
      typeof cyan !== "number" ||
      cyan < 0 ||
      cyan > 100 ||
      typeof magenta !== "number" ||
      magenta < 0 ||
      magenta > 100 ||
      typeof yellow !== "number" ||
      yellow < 0 ||
      yellow > 100 ||
      typeof black !== "number" ||
      black < 0 ||
      black > 100
    ) {
      throw new Error(
        "Each CMYK component must be a number between 0 and 100 inclusive.",
      );
    }

    // ────────────────────────────────────────────────
    // 4. Create Illustrator CMYKColor object
    // ────────────────────────────────────────────────
    const cmykColor = new CMYKColor();
    cmykColor.cyan = cyan;
    cmykColor.magenta = magenta;
    cmykColor.yellow = yellow;
    cmykColor.black = black;

    // ────────────────────────────────────────────────
    // 5. Apply color(s) according to target
    // ────────────────────────────────────────────────
    if (target === "fill" || target === "both") {
      if (!onlyIfExists || object.filled) {
        object.filled = true;
        object.fillColor = cmykColor;
      }
    }

    if (target === "stroke" || target === "both") {
      if (!onlyIfExists || object.stroked) {
        object.stroked = true;
        object.strokeColor = cmykColor;
      }
    }
  }

  /**
   * get globally declared TransActHandler instance
   *
   * @returns {TransActionHandler | null} - error occur or not declared return null
   */
  static getGlobalTransActHandler(): TransActionHandler | null {
    try {
      return globalTransActHandler || null;
    } catch (error) {
      return null;
    }
  }
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

interface SelectObjectInDocParams {
  doc: Document;
  items: Selection;
  clear?: boolean;
}

type PrevNextObjects = {
  prev: PageItem | GroupItem | null;
  current: PageItem;
  next: PageItem | null;
};

interface SetCMYKColorParams {
  /**
   * The Illustrator item to apply color to.
   * Only PathItem, CompoundPathItem and TextFrame are supported.
   */
  object: PathItem | TextFrame | CompoundPathItem;

  /**
   * CMYK color components in range [0–100]
   * Format: `[cyan, magenta, yellow, black]`
   * Pass `null` to remove color (set to "None")
   */
  color: [number, number, number, number] | null;

  /**
   * Which property/properties to modify
   * - "fill"   → only fill
   * - "stroke" → only stroke
   * - "both"   → fill and stroke
   * @default "fill"
   */
  target?: "fill" | "stroke" | "both";

  /**
   * If `true`, only apply color if the corresponding property (fill/stroke)
   * is already active. If `false`, force-enable the property.
   * @default false
   */
  onlyIfExists?: boolean;
}
