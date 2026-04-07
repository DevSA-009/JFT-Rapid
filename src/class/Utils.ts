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

    if (Array.isArray(object)) {
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
    const isSelectionArr = Array.isArray(object);

    const firstItem = isSelectionArr
      ? (object as Selection)[0]
      : (object as PageItem);
    const lastItem = isSelectionArr
      ? (object as Selection)[(object as Selection).length - 1]
      : firstItem;

    const parent = firstItem.parent as PageItem | Layer;
    let siblings: PageItem[];

    if (parent.typename === PageItemType.Layer) {
      siblings = Organizer.pageItemsToArray((parent as Layer).pageItems);
    } else if (parent.typename === PageItemType.GroupItem) {
      siblings = Organizer.pageItemsToArray((parent as GroupItem).pageItems);
    } else {
      throw new Error("Unsupported parent type: " + parent.typename);
    }

    const firstIndex = siblings.indexOf(firstItem);
    const lastIndex = siblings.indexOf(lastItem);

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
    const sizeTextFrame = Organizer.pageItemsToArray(item.pageItems).find(
      (item) =>
        item.typename === PageItemType.TextFrame && item.name === SIZE_TKN,
    );
    if (sizeTextFrame) {
      (sizeTextFrame as TextFrame).contents =
        `size-${targetSizeChr}`.toUpperCase();
      const targetWidth = this.convertLength({
        from: "inch",
        to: "pt",
        value: 0.85,
      });
      const { height, width } = this.getDimension(
        this.getObjectBounds(sizeTextFrame),
      );
      if (height > targetWidth || width > targetWidth) {
        this.resizeObject(sizeTextFrame, targetWidth);
      }

      (sizeTextFrame as TextFrame).createOutline();
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

    if (Array.isArray(selection) && selection.length > 1) {
      const bounds = this.getObjectBounds(selection) as BoundsObject;
      const { width, height } = this.getDimension(bounds);

      const tempGroup = GroupManager.group(selection as Selection);

      // Calculate scaling factors for both width and height
      const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
      const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;

      tempGroup.resize(scaleX, scaleY);

      GroupManager.ungroup(tempGroup);
    } else {
      const targetItem = Array.isArray(selection)
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
   * Rotates one or more PageItems by the given angle (degrees) while preserving
   * their original geometric center position.
   *
   * Why this method exists:
   * Illustrator's native `PageItem.rotate(deg)` rotates around the **top-left corner**
   * by default, which shifts the visual center of the object(s).
   * This utility compensates for that shift by:
   * 1. Capturing the original center
   * 2. Rotating
   * 3. Calculating the new center
   * 4. Translating back to restore original center
   *
   * Behavior notes:
   * - If multiple items are passed → they are temporarily grouped, rotated together,
   *   then ungrouped to preserve relative positions.
   * - Single item → rotated directly (no temporary group created).
   * - Works correctly with rotated/compound/masked artwork as long as `getObjectBounds`
   *   returns accurate geometric bounds.
   *
   * @param items - One or more PageItems (or Selection array) to rotate
   * @param deg    - Rotation angle in degrees. Common values: 90, -90, 180, -180, 0.
   *                 Any number is accepted (e.g. 45, -22.5).
   */
  static rotateItems(items: Selection, deg: RotateDegrees | number): void {
    // Early return if nothing to process (defensive)
    if (!items || items.length === 0) return;

    let target: PageItem | GroupItem = items[0];
    let wasTemporaryGroupCreated = false;

    // If more than one item → group them so they rotate as a single rigid unit
    if (items.length > 1) {
      target = GroupManager.group(items);
      wasTemporaryGroupCreated = true;
    }

    // ────────────────────────────────────────────────
    // 1. Capture geometric center BEFORE rotation
    // ────────────────────────────────────────────────
    const originalBounds = this.getObjectBounds(target);
    const originalCenterX = (originalBounds.left + originalBounds.right) / 2;
    const originalCenterY = (originalBounds.top + originalBounds.bottom) / 2;

    // ────────────────────────────────────────────────
    // 2. Apply rotation (Illustrator rotates around top-left by default)
    // ────────────────────────────────────────────────
    target.rotate(deg);

    // ────────────────────────────────────────────────
    // 3. Get new bounds and calculate new center AFTER rotation
    // ────────────────────────────────────────────────
    const newBounds = this.getObjectBounds(target);
    const newCenterX = (newBounds.left + newBounds.right) / 2;
    const newCenterY = (newBounds.top + newBounds.bottom) / 2;

    // ────────────────────────────────────────────────
    // 4. Compute how much we need to translate to restore original center
    // ────────────────────────────────────────────────
    const deltaX = originalCenterX - newCenterX;
    const deltaY = originalCenterY - newCenterY;

    // ────────────────────────────────────────────────
    // 5. Translate back to keep visual center unchanged
    // ────────────────────────────────────────────────
    target.translate(deltaX, deltaY);

    // ────────────────────────────────────────────────
    // 6. Clean up: ungroup if we created a temporary group
    // ────────────────────────────────────────────────
    if (wasTemporaryGroupCreated) {
      GroupManager.ungroup(target as GroupItem);
    }
  }

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

    if (!supportedTypes.includes(object.typename as PageItemType)) {
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
    if (!Array.isArray(color) || color.length !== 4) {
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
   * Determines if the given PathItem is a **strict rectangle shape**.
   *
   * A valid rectangle must satisfy **all** of these rules:
   * - Is closed
   * - Has exactly 4 path points
   * - All segments are horizontal or vertical (axis-aligned)
   * - All corners have no Bezier handles (straight corners only — not rounded or edited)
   * - Small floating-point tolerance is allowed for manual drawing / import errors
   *
   * @remarks
   * - This detects **axis-aligned** rectangles only.
   * - Rounded rectangles return `false` (because of Bezier handles).
   * - Rotated rectangles return `false` (diagonal segments).
   *
   * @param path - The PathItem to test (e.g. from selection[0] if it's a single path)
   * @returns `true` only if it matches a perfect / near-perfect rectangle shape
   */
  static isRectangleShape(path: PathItem): boolean {
    if (!path.closed) return false;
    if (path.pathPoints.length !== 4) return false;

    const points = path.pathPoints;
    const TOLERANCE = 0.35; // pt tolerance for "almost horizontal/vertical"

    // Check 1: All segments must be horizontal or vertical
    for (let i = 0; i < 4; i++) {
      const p1 = points[i].anchor;
      const p2 = points[(i + 1) % 4].anchor;

      const dx = Math.abs(p2[0] - p1[0]);
      const dy = Math.abs(p2[1] - p1[1]);

      // If both dx and dy are significant → diagonal → not rectangle
      if (dx > TOLERANCE && dy > TOLERANCE) {
        return false;
      }
    }

    // Check 2: No Bezier handles (straight corners only)
    for (let i = 0; i < 4; i++) {
      const pt = points[i];

      // leftDirection and rightDirection must match anchor exactly
      if (
        pt.leftDirection[0] !== pt.anchor[0] ||
        pt.leftDirection[1] !== pt.anchor[1] ||
        pt.rightDirection[0] !== pt.anchor[0] ||
        pt.rightDirection[1] !== pt.anchor[1]
      ) {
        return false; // has curve handles → rounded / modified
      }
    }

    if (this.isWhiteFill(path)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the fill color of the given PathItem is **white** (or equivalent to white).
   *
   * Returns `true` if:
   * - The path is filled
   * - Fill color is RGB(255,255,255), CMYK(0,0,0,0), or Gray(0)
   *
   * Returns `false` if:
   * - Not filled
   * - Fill is NoColor
   * - Any other color (Spot, Gradient, Pattern, non-white values)
   *
   * @param path - The PathItem to check
   * @returns `true` if filled with white, `false` otherwise
   */
  static isWhiteFill(path: PathItem): boolean {
    if (!path.filled) {
      return false;
    }

    const fillColor = path.fillColor;

    if (fillColor.typename === "NoColor") {
      return false;
    }

    let isWhite = false;

    switch (fillColor.typename) {
      case "RGBColor": {
        const rgb = fillColor as RGBColor;
        isWhite = rgb.red === 255 && rgb.green === 255 && rgb.blue === 255;
        break;
      }

      case "CMYKColor": {
        const cmyk = fillColor as CMYKColor;
        isWhite =
          cmyk.cyan === 0 &&
          cmyk.magenta === 0 &&
          cmyk.yellow === 0 &&
          cmyk.black === 0;
        break;
      }

      case "GrayColor": {
        const gray = fillColor as GrayColor;
        isWhite = gray.gray === 0; // 0 = white in Gray mode
        break;
      }

      // Spot, Lab, Gradient, Pattern → treat as non-white
      default:
        isWhite = false;
    }

    return isWhite;
  }

  /**
   * Finds the key in a string-mapped object whose value equals the input.
   *
   * @template T - A record with string literal values
   * @param enumObj - The source object (enum or `as const`)
   * @param value - A value that should exist in `enumObj`
   * @returns The corresponding key, or `undefined` if no match is found
   */
  static getKeyFromEnumValue<
    T extends Record<string, string>,
    V extends T[keyof T],
  >(
    enumObj: T,
    value: V,
  ):
    | Extract<keyof T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>
    | undefined {
    for (const [k, v] of Object.entries(enumObj)) {
      if (v === value) return k as any; // type assertion needed due to current TS limitations
    }
    return undefined;
  }

  /**
   * Checks whether the current thread engine is set to "action" mode
   *
   * @returns `true` if CONFIG.THREAD_ENGINE === "action", `false` otherwise
   */
  static isActionThreadEngine() {
    return CONFIG.THREAD_ENGINE === "action";
  }

  /**
   * Finds the best way to arrange `value` items into a grid where the number of rows (baseHeight)
   * is at most `maxBaseHeight` (default 20), preferring the **smallest possible number of columns** (divider).
   *
   * Behavior:
   * 1. First tries to find an **exact** factorization: `value = divider × baseHeight` with `baseHeight ≤ maxBaseHeight`
   *    → among valid exact matches, chooses the one with **smallest divider**
   * 2. If no exact match exists → searches for the smallest number `n ≥ value` (up to `value × (1 + maxOvershoot)`)
   *    that **does** have a nice factorization with height ≤ maxBaseHeight
   * 3. Among all candidates, prefers:
   *    - smallest overshoot (closest to original value)
   *    - then smallest divider (fewest columns)
   *    - then tallest possible baseHeight (when divider is equal)
   * 4. Ultimate fallback: `divider: 1, baseHeight: value` (single column, possibly very tall)
   *
   * @param value - Total number of items to arrange (cards, images, posts, etc.)
   * @param maxBaseHeight - Maximum allowed rows/height of the grid (default: 20)
   * @param maxOvershoot - Maximum allowed relative overshoot when rounding up
   *                       (e.g. 0.25 = allow up to +25% extra items) (default: 0.25)
   * @returns Object containing:
   *   - `divider`:      number of columns (smallest preferred)
   *   - `baseHeight`:   number of rows (≤ maxBaseHeight when possible)
   *   - `usedValue`:    the number of slots actually used (≥ value, usually value or slightly more)
   *
   * @example
   * ```ts
   * getBestDividerAndHeight(61)
   * // Possible result: { divider: 4, baseHeight: 16, usedValue: 64 }  // 4×16 = 64
   *
   * getBestDividerAndHeight(61, 20, 0.1)
   * // Might prefer: { divider: 5, baseHeight: 12, usedValue: 60 }    // slight undershoot not allowed here
   *
   * getBestDividerAndHeight(23)
   * // Common nice result: { divider: 2, baseHeight: 12, usedValue: 24 }
   *
   * getBestDividerAndHeight(120)
   * // → { divider: 6, baseHeight: 20, usedValue: 120 }  (or better like 8×15, 10×12, etc.)
   * ```
   */
  static getBestDividerAndHeight(
    value: number,
    maxBaseHeight: number = 20,
    maxOvershoot: number = 0.25,
  ): {
    divider: number;
    baseHeight: number;
    usedValue: number;
  } {
    // Early return for small collections — single column
    if (value <= maxBaseHeight) {
      return { divider: 1, baseHeight: value, usedValue: value };
    }

    // We'll keep track of the best candidate found so far
    let best: {
      divider: number;
      baseHeight: number;
      score: number; // lower = better
      usedValue: number;
    } | null = null;

    // ────────────────────────────────────────────────
    // Step 1: Try exact factorization first (highest priority)
    // ────────────────────────────────────────────────
    for (let d = 1; d * d <= value; d++) {
      if (value % d === 0) {
        const h = value / d;
        if (h <= maxBaseHeight) {
          const score = d; // primary sort: smallest number of columns
          if (
            !best ||
            score < best.score ||
            (score === best.score && h > best.baseHeight)
          ) {
            best = { divider: d, baseHeight: h, score, usedValue: value };
          }
        }
      }
    }

    // If we found a perfect exact match → return early
    if (best) {
      return {
        divider: best.divider,
        baseHeight: best.baseHeight,
        usedValue: best.usedValue,
      };
    }

    // ────────────────────────────────────────────────
    // Step 2: No good exact match → look for nearby numbers (slight overshoot)
    // ────────────────────────────────────────────────
    const maxValue = Math.ceil(value * (1 + maxOvershoot));

    for (let n = value; n <= maxValue; n++) {
      for (let d = 1; d * d <= n; d++) {
        if (n % d === 0) {
          // Candidate: d columns, h rows
          const h = n / d;
          if (h <= maxBaseHeight) {
            const overshoot = (n - value) / value;
            // Score: first minimize overshoot, then minimize columns
            const score = overshoot * 1000 + d;

            if (
              !best ||
              score < best.score ||
              (score === best.score && h > best.baseHeight)
            ) {
              best = { divider: d, baseHeight: h, score, usedValue: n };
            }
          }

          // Candidate: n/d columns, d rows (the flipped pair)
          const d2 = n / d;
          if (d2 !== d) {
            const h2 = d;
            if (h2 <= maxBaseHeight) {
              const overshoot = (n - value) / value;
              const score = overshoot * 1000 + d2;

              if (
                !best ||
                score < best.score ||
                (score === best.score && h2 > best.baseHeight)
              ) {
                best = { divider: d2, baseHeight: h2, score, usedValue: n };
              }
            }
          }
        }
      }
    }

    // ────────────────────────────────────────────────
    // Step 3: Ultimate fallback (single tall column)
    // ────────────────────────────────────────────────
    if (!best) {
      return { divider: 1, baseHeight: value, usedValue: value };
    }

    return {
      divider: best.divider,
      baseHeight: best.baseHeight,
      usedValue: best.usedValue,
    };
  }

  /**
   * Text frame arch wrap 50% bend
   * @param textFrame
   */
  static applyArcTextWarp(textFrame: TextFrame): void {
    app.executeMenuCommand("deselectall");
    textFrame.selected = true;
    app.executeMenuCommand("Make Text Wrap");
    app.executeMenuCommand("expandStyle");
  }

  /**
   * Checks whether an object has no own enumerable properties.
   *
   * @param obj - The object to inspect
   * @returns True if the object has no own enumerable properties, otherwise false
   *
   * @example
   * isEmptyObject({}); // true
   * isEmptyObject({ a: 1 }); // false
   */
  static isEmptyObject(obj: object): boolean {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Sort sizes in ascending or descending order.
   *
   * @param sizes - Array of sizes
   * @param order - "asc" (default) or "desc"
   * @returns New sorted array
   *
   * @example
   * sortSizes(["M","XS","XL"]);
   * // ["XS","M","XL"]
   *
   * sortSizes(["M","XS","XL"], "desc");
   * // ["XL","M","XS"]
   */
  static sortSizes(
    sizes: ApparelSize[],
    order: "asc" | "desc" = "asc",
  ): ApparelSize[] {
    return [...sizes].sort((a, b) =>
      order === "asc"
        ? SIZE_ORDER_MAP[a] - SIZE_ORDER_MAP[b]
        : SIZE_ORDER_MAP[b] - SIZE_ORDER_MAP[a],
    );
  }

  /**
   * Filters `details` to only the sizes that have **meaningful work** to do.
   *
   * A size is considered active when `SUMMARY.BODY > 0`.
   * Sizes with all-zero counts are excluded up-front so no pipeline stage
   * ever receives an empty size and wastes a cache lookup.
   *
   * @param detailsData - Full `AutomateData.details` map to filter.
   * @returns Ascending-sorted array of active {@link ApparelSize} values.
   */
  static getActiveDataSizes(
    detailsData: AutomateData["details"],
  ): ApparelSize[] {
    const active: ApparelSize[] = [];
    const allSizes = Object.keys(detailsData) as ApparelSize[];

    for (let i = 0; i < allSizes.length; i++) {
      const sizeChar = allSizes[i];
      const entry = detailsData[sizeChar];

      // DATA rows present → definitely active
      if (entry.SUMMARY.BODY > 0) {
        active.push(sizeChar);
      }
    }
    return Utils.sortSizes(active);
  }

  /**
   * Creates a deep copy of a value (ES3-compatible).
   *
   * Recursively copies plain objects and arrays so that
   * nested references are not shared with the original.
   *
   * ⚠️ Limitations (due to ES3 constraints):
   * - No support for circular references
   * - Functions are copied by reference (not cloned)
   * - Does not support Map, Set, or special class instances
   * - Dates are copied as Date objects
   *
   * @template T - The type of the input value
   * @param value - The value to deep copy
   * @returns A deep copy of the input value
   *
   * @example
   * ```ts
   * var obj = { a: 1, b: { c: 2 } };
   * var copy = deepCopy(obj);
   *
   * copy.b.c = 10;
   * console.log(obj.b.c); // 2
   * ```
   */
  static deepCopy<T>(value: T): T {
    // Handle null or primitive types
    if (value === null || typeof value !== "object") {
      return value;
    }

    // Handle Date
    if (value instanceof Date) {
      return new Date(value.getTime()) as any;
    }

    // Handle Array
    if (value instanceof Array) {
      var arr: any[] = [];
      for (var i = 0; i < value.length; i++) {
        arr[i] = this.deepCopy(value[i]);
      }
      return arr as any;
    }

    // Handle Object
    var result: any = {};
    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = this.deepCopy((value as any)[key]);
      }
    }

    return result;
  }

  /**
   * Rotates one or more `PageItem`s by `deg` degrees using the correct engine.
   *
   * - **Action engine** (`THREAD_ENGINE === "action"`) — delegates to
   *   {@link TransActionHandler.rotate} so masked/compound-path objects
   *   behave predictably.
   * - **Script engine** — delegates to {@link Utils.rotateItems} which calls
   *   the native ExtendScript `rotate()` method on each object.
   *
   * @param deg   - Rotation angle in degrees (positive = counter-clockwise).
   * @param objects - One or more PageItems to rotate.
   */
  static smartRotate(deg: number, objects: PageItem[]): void {
    if (Utils.isActionThreadEngine()) {
      // Use action-based rotation for reliable behaviour on complex objects
      const transAct = new TransActionHandler();
      transAct.rotate({ deg, objects: objects });
      transAct.removeAll();
    } else {
      // Script-engine path — native rotate() on each object
      Utils.rotateItems(objects as Selection, deg);
    }
  }

  /**
   * Translates one or more `PageItem`s by `(x, y)` points using the correct engine.
   *
   * - **Action engine** — delegates to {@link TransActionHandler} so the
   *   transformation is applied consistently even on masked or grouped objects.
   * - **Script engine** — calls `translate(x, y)` on every item in the array
   *   so all objects move by the same delta (fixes the previous single-item bug).
   *
   * @param x     - Horizontal delta in points (positive = right).
   * @param y     - Vertical delta in points (positive = up in ExtendScript coords).
   * @param objects - One or more PageItems to translate.
   */
  static smartMove(
    x: number,
    y: number,
    objects: PageItem[],
    useAbsolute = false,
  ): void {
    if (Utils.isActionThreadEngine()) {
      // Action engine handles grouped/masked objects correctly
      const transAct = new TransActionHandler();
      transAct.move({ x, y, objects: objects, useAbsolute });
      transAct.removeAll();
    } else {
      // Check if multiple objects need to be grouped
      const needsGrouping = objects.length > 1;
      let tempGroup: GroupItem | null = null;
      let targetObject: PageItem;

      if (needsGrouping) {
        // Group multiple objects before transformation
        tempGroup = GroupManager.group(objects);
        targetObject = tempGroup;
      } else {
        // Use single object directly
        targetObject = objects[0];
      }

      // Get current bounds of the target object
      const bounds = Utils.getObjectBounds(targetObject);

      // Initialize final coordinates
      let finalX = x;
      let finalY = y;

      // Calculate final position based on mode
      if (useAbsolute) {
        // Get center XY value based on engine type
        const { centerX, centerY } = Utils.getCenterXY({
          bounds,
        });

        // Add delta to current position
        finalX -= centerX;
        finalY -= centerY;
      }

      targetObject.translate(finalX, finalY);

      // Ungroup if objects were grouped
      if (needsGrouping && tempGroup) {
        GroupManager.ungroup(tempGroup);
      }
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
