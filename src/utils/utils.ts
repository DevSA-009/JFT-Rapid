/**
 * Get the previous, current, and next PageItem around a selection,
 * while supporting GroupItem or Layer parents.
 * If there's no valid previous PageItem, `prev` will be `null`.
 */
const getAdjacentPageItems = (selection: Selection | PageItem): PrevNextItems => {
    const isSelectionArr = isArray(selection);

    const firstItem = isSelectionArr ? (selection as Selection)[0] : (selection as PageItem);
    const lastItem = isSelectionArr ? (selection as Selection)[(selection as Selection).length - 1] : firstItem;

    const parent = firstItem.parent as PageItem | Layer;
    let siblings: PageItems;

    if (parent.typename === PageItemType.Layer) {
        siblings = (parent as Layer).pageItems;
    } else if (parent.typename === PageItemType.GroupItem) {
        siblings = (parent as GroupItem).pageItems;
    } else {
        throw new Error("Unsupported parent type: " + parent.typename);
    }

    const firstIndex = indexOf(siblings, firstItem);
    const lastIndex = indexOf(siblings, lastItem);

    const prev = firstIndex > 0 ? siblings[firstIndex - 1] : null;
    const next = lastIndex < siblings.length - 1 ? siblings[lastIndex + 1] : null;

    return {
        prev,
        current: firstItem,
        next
    };
};

/**
 * Displays an alert dialog with a given message using ScriptUI.
 * 
 * @param {string} message - The message to display in the alert dialog.
 */
const showAlertDialog = (message: string) => {
    const dialog = new Window('dialog', 'Alert');
    dialog.add('statictext', undefined, message);
    const okButton = dialog.add('button', undefined, 'OK');

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
const logMessage = (message: string) => {
    $.writeln(message);  // This will log the message to the JavaScript Console
};

/**
 * Positions one or more PageItems in the active artboard by aligning their center to specified edges or center points.
 * Handles both single item and multiple by temporarily grouping when needed.
 * 
 * @param {Selection|PageItem} items - The item(s) to position. Can be a single PageItem or a Selection collection.
 * @param {Document} doc - The Illustrator document containing the artboard.
 * @param {AlignPosition} [position="C"] - The alignment position
 */
const alignPageItemsToArtboard = (items: Selection | PageItem, doc: Document, position: AlignPosition = "C"): void => {

    const artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    const [abLeft, abTop, abRight, abBottom] = artboard.artboardRect;

    const { top: itemTop, left: itemLeft, bottom: itemBottom, right: itemRight } = getSelectionBounds(items); // [top, left, bottom, right]

    const isItems = isArray(items);

    const groupManger = new GroupManager(isItems ? items as Selection : ([items] as Selection));
    const { prev } = getAdjacentPageItems(items as Selection);
    if (isItems) {
        groupManger.group(prev);
        items = groupManger.tempGroup as PageItem;
    }

    // Calculate current item center
    const itemCenterX = (itemLeft + itemRight) / 2;
    const itemCenterY = (itemTop + itemBottom) / 2;

    let targetX: number = itemCenterX;
    let targetY: number = itemCenterY;

    switch (position) {
        case "L":
            targetX = abLeft - (itemLeft - itemCenterX);
            break;
        case "R":
            targetX = abRight - (itemRight - itemCenterX);
            break;
        case "T":
            targetY = abTop - (itemTop - itemCenterY); // 🔹 FIXED
            break;
        case "B":
            targetY = abBottom - (itemBottom - itemCenterY);
            break;
        case "TC":
            targetX = (abLeft + abRight) / 2;
            targetY = abTop - (itemTop - itemCenterY);
            break;
        case "BC":
            targetX = (abLeft + abRight) / 2;
            targetY = abBottom - (itemBottom - itemCenterY);
            break;
        case "LC":
            targetX = abLeft - (itemLeft - itemCenterX);
            targetY = (abTop + abBottom) / 2;
            break;
        case "RC":
            targetX = abRight - (itemRight - itemCenterX);
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
    const deltaX = targetX - itemCenterX;
    const deltaY = targetY - itemCenterY;

    // Move the item
    (items as PageItem).translate(deltaX, deltaY);

    if (isItems) {
        groupManger.ungroup(prev);
    }
};

/**
 * Moves a selected item to a specific position on the Illustrator canvas.
 * 
 * @param {PageItem} item - The selected object in Illustrator.
 * @param {AlignPosition} position - The desired position:
 *  - `"L"`  (Left)  
 *  - `"R"`  (Right)  
 *  - `"T"`  (Top)  
 *  - `"B"`  (Bottom)  
 *  - `"LC"` (Left-Center)  
 *  - `"RC"` (Right-Center)  
 *  - `"TC"` (Top-Center)  
 *  - `"BC"` (Bottom-Center)  
 *  - `"C"`  (Center both horizontally and vertically)  
 */
const moveItemToCanvas = (
    item: PageItem,
    position: AlignPosition = "C"
): void => {
    // Illustrator's max canvas size is 16383 x 16383 points
    const canvasSize = 16383;
    const canvasHalf = canvasSize / 2;

    // Get item bounds using getSelectionBounds
    const bounds = getSelectionBounds(item);
    const itemWidth = bounds.right - bounds.left;
    const itemHeight = bounds.top - bounds.bottom;

    // Default movement offsets (no movement)
    let moveX = 0;
    let moveY = 0;

    // Calculate target positions based on alignment choice
    switch (position) {
        case "L": // Left edge
            moveX = -canvasHalf - bounds.left;
            break;
        case "R": // Right edge
            moveX = canvasHalf - bounds.right;
            break;
        case "T": // Top edge
            moveY = canvasHalf - bounds.top;
            break;
        case "B": // Bottom edge
            moveY = -canvasHalf - bounds.bottom;
            break;
        case "LC": // Left-Center
            moveX = -canvasHalf - bounds.left;
            moveY = -bounds.top + itemHeight / 2;
            break;
        case "RC": // Right-Center
            moveX = canvasHalf - bounds.right;
            moveY = -bounds.top + itemHeight / 2;
            break;
        case "TC": // Top-Center
            moveX = -bounds.left + itemWidth / 2;
            moveY = canvasHalf - bounds.top;
            break;
        case "BC": // Bottom-Center
            moveX = -bounds.left + itemWidth / 2;
            moveY = -canvasHalf - bounds.bottom;
            break;
        case "C": // Fully Centered
            moveX = -bounds.left + itemWidth / 2;
            moveY = -bounds.top + itemHeight / 2;
            break;
    }

    // Apply movement
    item.translate(moveX, moveY);
};

/**
 * Calculates the visible bounding box of selected items in Adobe Illustrator.
 * 
 * @param selection - Array of selected items in Illustrator.
 * @returns An object containing the `left`, `top`, `right`, and `bottom` bounds of the selection.
 */
const getSelectionBounds = (selection: Selection | PageItem): BoundsObject => {

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

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
                    if (child.clipping) {
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

    if (isArray(selection)) {
        // Process each selected item using a for loop
        for (let i = 0; i < selection.length; i++) {
            processItem((selection as Selection)[i]);
        }
    } else {
        processItem(selection as PageItem);
    }

    const bounds = { left: minX, top: maxY, right: maxX, bottom: minY };

    for (const key in bounds) {
        if (bounds.hasOwnProperty(key)) { // Check if the property belongs to bounds
            const value = bounds[key as keyof typeof bounds];
            if (value === Infinity) {
                throw Error("Wrong Bounds");
            }
        }
    }

    return bounds;
};

/**
 * Resizes the selected objects to a target width and height (in INCH) while maintaining their proportions.
 * 
 * @param selection - Array of selected items in Illustrator.
 * @param targetWidth - The desired total width for the selection in INCH.
 * @param targetHeight - The desired total height for the selection in INCH.
 */
const resizeSelection = (selection: Selection | PageItem, targetWidth: number = 0, targetHeight: number = 0): void => {
    if (!selection || selection.length === 0) {
        alert("No selection found!");
        return;
    }

    if (isArray(selection) && selection.length > 1) {
        const bounds = getSelectionBounds(selection) as BoundsObject;
        const { width, height } = getWHDimension(bounds);
        const { prev } = getAdjacentPageItems(selection);
        const groupManger = new GroupManager(selection as Selection);

        groupManger.group(prev);

        const tempGroup = groupManger.tempGroup as GroupItem;

        // Calculate scaling factors for both width and height
        const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
        const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;

        tempGroup.resize(scaleX, scaleY);

        groupManger.ungroup(prev);
    } else {
        const targetItem = isArray(selection) ? (selection as Selection)[0] : selection as PageItem;
        const topMostItem = getSelectionBounds(targetItem);
        const { left, bottom, right, top } = topMostItem;
        const { width, height } = getWHDimension({ left, right, top, bottom });
        // Calculate scaling factors for both width and height
        const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
        const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;
        targetItem.resize(scaleX, scaleY)
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
const getTopClippingPath = (item: PageItem): PageItem | null => {

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
const rotateItems = (items: Selection | PageItem, deg: RotateDegrees) => {

    let groupManager: GroupManager | null = null;

    let item = items;

    if (isArray(items)) {
        groupManager = new GroupManager(items as Selection);
        const { prev } = getAdjacentPageItems(items);
        groupManager.group(prev)
        item = groupManager.tempGroup!;
    }

    // Get original bounds
    const { left, top, right, bottom } = getSelectionBounds(item);
    const originalCenterX = (left + right) / 2;
    const originalCenterY = (top + bottom) / 2;

    // Rotate the object
    (item as PageItem).rotate(deg);

    // Get new bounds after rotation
    const newBounds = getSelectionBounds(item);
    const newCenterX = (newBounds.left + newBounds.right) / 2;
    const newCenterY = (newBounds.top + newBounds.bottom) / 2;

    // Calculate the translation needed to keep it centered
    const deltaX = originalCenterX - newCenterX;
    const deltaY = originalCenterY - newCenterY;

    // Move object back to original center position
    (item as PageItem).translate(deltaX, deltaY);

    if (groupManager) {
        groupManager.ungroup();
    }
};

/**
 * Checks if a given size belongs to the "BABY" category.
 * 
 * This function checks if a size exists within the `babySizeObj` object, which
 * contains sizes specifically for the "BABY" category.
 *
 * @param {MensSize | BabySize} sizeChr - The size to check. This can be either a size from the "MENS" or "BABY" category.
 * @param {BabySizeCategory} babySizeObj - The "BABY" category object that contains size keys and corresponding dimensions.
 * @returns {boolean} Returns `true` if the size exists in the "BABY" category, otherwise `false`.
 */
const isBabySize = (sizeChr: MensSize | BabySize, babySizeObj: BabySizeCategory): boolean => {
    try {
        return sizeChr in babySizeObj;
    } catch {
        return false
    }
};

/**
 * Returns the dimension object for a given size and size category.
 *
 * @param sizeCategory - The size category object which contains both BABY and MENS size mappings.
 * @param size - The size key to lookup. Can be either a BabySize or MensSize.
 * @param isBaby - A boolean flag indicating whether the size is for a baby.
 * 
 * @returns The corresponding DimensionObject for the given size.
 */
const getDimensionGenderCategory = (sizeCategory: SizeCategory, size: MensSize | BabySize, isBaby: boolean
): DimensionObject => {
    if (isBaby) {
        return (sizeCategory.BABY as BabySizeCategory)[size as BabySize];
    } else {
        return (sizeCategory.MENS as MensSizeCategory)[size as MensSize];
    }
};

/**
 * Moves a `PageItem` relative to a `Selection` based on the specified position.
 * 
 * @param {MoveItemAfterParams} arg - The parameters for the movement.
 * @param {Selection} arg.selection - The reference selection to move the item relative to.
 * @param {PageItem} arg.moving - The item that needs to be moved.
 * @param {"T" | "B" | "L" | "R"} arg.position - The position where the item should be placed.
 */
const moveItemAfter = (arg: MoveItemAfterParams) => {
    const { base, moving, position, gap = 0 } = arg;
    // Get bounding boxes of the selection and moving item
    const baseBounds = getSelectionBounds(base); // [left, top, right, bottom]
    const movingBounds = getSelectionBounds(moving); // [left, top, right, bottom]

    if (!baseBounds) {
        throw new Error("Base Bounds Empty")
    }

    let dx = 0, dy = 0;

    // Calculate movement based on position
    switch (position) {
        case "T": // Move above
            dy = baseBounds.top - movingBounds.bottom + gap;
            break;
        case "B": // Move below
            dy = baseBounds.bottom - movingBounds.top - gap;
            break;
        case "L": // Move left
            dx = baseBounds.left - movingBounds.right - gap;
            break;
        case "R": // Move right
            dx = baseBounds.right - movingBounds.left + gap;
            break;
    }

    // Apply translation to the moving item
    translateXY(moving, dx, dy);
};

/**
 * Aligns a moving group item relative to a base group item with optional rotation handling.
 * 
 * @function
 * @param {GroupItem | PageItem} baseGroupItem - The reference item that we're aligning to.
 * @param {GroupItem} movingGroupItem - The item that will be moved for alignment.
 * @param {AlignPosition} position - The alignment position 
 * @returns {void}
 * @throws {Error} - May throw an error if the position is invalid or if item manipulation fails.
 */
const alignItems = (baseGroupItem: PageItem, movingGroupItem: PageItem, position: AlignPosition): void => {
    const baseBounds = getSelectionBounds(baseGroupItem);

    // Get geometric bounds for the moving item
    const movingBounds = getSelectionBounds(movingGroupItem);

    // Calculate dimensions and centers
    const baseLeft = baseBounds.left;
    const baseTop = baseBounds.top;
    const baseRight = baseBounds.right;
    const baseBottom = baseBounds.bottom;

    const moveLeft = movingBounds.left;
    const moveTop = movingBounds.top;
    const moveRight = movingBounds.right;
    const moveBottom = movingBounds.bottom;

    // Calculate centers
    const baseCenterX = (baseLeft + baseRight) / 2;
    const baseCenterY = (baseTop + baseBottom) / 2;
    const moveCenterX = (moveLeft + moveRight) / 2;
    const moveCenterY = (moveTop + moveBottom) / 2;

    // Calculate required movement
    let deltaX = 0;
    let deltaY = 0;

    // Determine alignment based on position parameter
    switch (position.toUpperCase()) {
        case "L": // Left align
            deltaX = baseLeft - moveLeft;
            break;
        case "R": // Right align
            deltaX = baseRight - moveRight;
            break;
        case "T": // Top align
            deltaY = baseTop - moveTop;
            break;
        case "B": // Bottom align
            deltaY = baseBottom - moveBottom;
            break;
        case "LC": // Left and vertically centered
            deltaX = baseLeft - moveLeft;
            deltaY = baseCenterY - moveCenterY;
            break;
        case "RC": // Right and vertically centered
            deltaX = baseRight - moveRight;
            deltaY = baseCenterY - moveCenterY;
            break;
        case "TC": // Top and horizontally centered
            deltaX = baseCenterX - moveCenterX;
            deltaY = baseTop - moveTop;
            break;
        case "BC": // Bottom and horizontally centered
            deltaX = baseCenterX - moveCenterX;
            deltaY = baseBottom - moveBottom;
            break;
        case "C": // Center in both directions
            deltaX = baseCenterX - moveCenterX;
            deltaY = baseCenterY - moveCenterY;
            break;
        default:
            throw new Error("Invalid position parameter: " + position +
                ". Use L, R, B, T, LC, RC, TC, BC, or C.");
    }

    // Move the group item
    translateXY(movingGroupItem, deltaX, deltaY);
};

/**
 * Calculates the width and height of a bounding box in inches based on its geometric bounds.
 * The function receives the bounds of an object and converts the width and height 
 * from points to inches (1 inch = 72 points).
 *
 * @param {BoundsObject} bounds - The bounding box dimensions containing `left`, `top`, `right`, and `bottom` properties.
 * @returns {DimensionObject} - An object containing the width (`width`) and height (`height`) of the bounding box in inches.
 */
const getWHDimension = (bounds: BoundsObject): DimensionObject => {
    const { left, top, right, bottom } = bounds;
    const width = (right - left) / 72;
    const height = (top - bottom) / 72;
    return { width, height };
};

/**
 * translate item by x&y value
 * @param {PageItem} item 
 * @param {number} x 
 * @param {number} y 
 */
const translateXY = (item: PageItem, x: number, y: number) => {
    item.translate(x, y)
};

/**
 * Selects page items in Illustrator if they belong to the specified document.
 * Optionally clears the current selection if `clear` is true.
 *
 * @param {SelectItemsInDocParams} params
 * @param {Document} params.doc - The target Illustrator document.
 * @param {PageItem[]} params.items - Array of Illustrator PageItems to check and select.
 * @param {boolean} [params.clear=true] - Whether to clear the existing selection before selecting new items.
 */
const selectItemsInDoc = ({ doc, items, clear = true }: SelectItemsInDocParams): void => {
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
            logMessage(`${item.name} not in ${doc.name} document`);
            items.splice(i, 1);
        }

    }
    return doc.selection;
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
 * @throws {Error} - Throws an alert dialog if the size token text frame is not found.
 */
const renameSizeTKN = (item: GroupItem, targetSizeChr: ApparelSize): void => {
    const sizeTextFrame = findElement(item.pageItems, (item) => item.typename === PageItemType.TextFrame && item.name === SearchingKeywords.SIZE_TKN);
    if (sizeTextFrame) {
        (sizeTextFrame as TextFrame).contents = `size-${targetSizeChr}`.toUpperCase();
    } else {
        alertDialogSA(`Size token not found in ${item.name}`);
    }
};