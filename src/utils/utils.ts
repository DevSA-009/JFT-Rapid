/**
 * Finds an element in an array based on a callback function.
 * 
 * @param {Selection} array - The array to search through.
 * @param {findElementCb} cb - The callback function used to test each element.
 * The callback should return a truthy value to indicate that the element matches.
 * @returns {any | null} - The first element that satisfies the callback function or null if none found.
 */
const findElement = <T> (array: T[], cb: findElementCb<T>): T | null => {
    for (let index = 0; index < array.length; index++) {
        let element = array[index];
        if (cb(element, index)) {
            return element;
        }
    }
    return null;
}

/**
 * Get the previous and next items relative to the selected page item.
 *
 * @param {Selection} selection - The selected page items.
 * @returns {PrevNextItems} The previous, current, and next page items.
 */
const getAdjacentPageItems = (selection: Selection): PrevNextItems => {
    const parent: PageItems = ((selection[0] as PageItem).parent as PageItem | Layer).pageItems;

    const currentIdx = indexOf(parent, selection[0]);

    // Safely get the previous and next items based on the current index
    const prev = currentIdx > 0 ? parent[currentIdx - 1] : null;  // Check if prev exists
    const next = currentIdx < parent.length - 1 ? parent[currentIdx + 1] : null;  // Check if next exists

    return { prev, current: parent[currentIdx], next }
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
 * Formats a number to a specified number of decimal places.
 * 
 * @param {number} value - The number to format.
 * @param {number} [precision=4] - The number of decimal places to round to (default is 4).
 * @returns {number} The formatted number rounded to the given precision.
 */
const formatNumber = (value: number, precision: number = 4): number => {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Returns the top-most visible item from a GroupItem, checking for clipping or nested GroupItems.
 * 
 * If the PageItem is clipped, it will return the first clipped PageItem.
 * If the PageItem is not clipped, it will recursively check for child GroupItems and return the top-most visible child.
 * 
 * @param {GroupItem} groupItem - The GroupItem to check for the top-most visible objects.
 * @returns {GroupItem | PageItem} - The top-most visible GroupItem or PageItem.
 */
const getTopMostVisibleItem = (groupItem: PageItem): GroupItem | PageItem => {
    if (groupItem.typename === "GroupItem") {
        if (groupItem.clipped) {
            // Find and return the first clipping path if it's available, then stop processing further
            for (let i = 0; i < groupItem.pageItems.length; i++) {
                if (groupItem.pageItems[i].clipping) {
                    return groupItem.pageItems[i]; // Return the clipped PageItem
                }
            }
            return groupItem; // Return the GroupItem if no clipping path is found
        } else {
            // Recursively check each child GroupItem if the parent is not clipped
            for (let i = 0; i < groupItem.pageItems.length; i++) {
                const child = groupItem.pageItems[i];
                if (child.typename === "GroupItem") {
                    // Recursively process child GroupItems
                    const topMostChild = getTopMostVisibleItem(child);
                    if (topMostChild) {
                        return topMostChild; // Return the top-most visible child GroupItem or PageItem
                    }
                }
            }
            return groupItem; // Return the parent GroupItem if no child GroupItem was found
        }
    } else {
        // If the item is not a GroupItem, return it directly (e.g., TextFrames, PathItems, etc.)
        return groupItem;
    }
};

/**
 * Calculates the visible bounding box of selected items in Adobe Illustrator.
 * 
 * @param selection - Array of selected items in Illustrator.
 * @returns An object containing the `left`, `top`, `right`, and `bottom` bounds of the selection.
 */
const getSelectionBounds = (selection: Selection): BoundsObject | null => {
    if (!selection || selection.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    /**
     * Processes an Illustrator item and updates bounding box values.
     * @param item - The Illustrator item (PathItem, GroupItem, TextFrame, etc.).
     */
    const processItem = (item: any): void => {
        if (item.typename === "GroupItem") {
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

    // Process each selected item using a for loop
    for (let i = 0; i < selection.length; i++) {
        processItem(selection[i]);
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
 * Resizes the selected objects to a target width and height (in points) while maintaining their proportions.
 * 
 * @param selection - Array of selected items in Illustrator.
 * @param targetWidth - The desired total width for the selection in points.
 * @param targetHeight - The desired total height for the selection in points.
 */
const resizeSelection = (selection: Selection, targetWidth: number = 0, targetHeight: number = 0): void => {
    if (!selection || selection.length === 0) {
        alert("No selection found!");
        return;
    }

    if (selection.length > 1) {
        const bounds = getSelectionBounds(selection) as BoundsObject;
        const { width, height } = getWHDimension(bounds);
        const { prev } = getAdjacentPageItems(selection);
        const groupManger = new GroupManager(selection);

        groupManger.group(prev);

        const tempGroup = groupManger.tempGroup as GroupItem;

        // Calculate scaling factors for both width and height
        const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
        const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;

        tempGroup.resize(scaleX, scaleY);

        groupManger.ungroup(prev);
    } else {
        const topMostItem = getTopMostVisibleItem(selection[0]);
        const [left, top, right, bottom] = topMostItem.geometricBounds;
        const { width, height } = getWHDimension({ left, right, top, bottom });
        // Calculate scaling factors for both width and height
        const scaleX = targetWidth ? (targetWidth / width) * 100 : 100;
        const scaleY = targetHeight ? (targetHeight / height) * 100 : 100;
        topMostItem.resize(scaleX, scaleY)
    }
};

/**
 * Finds the final (topmost) clipping path in a given group.
 * 
 * @param {GroupItem} groupItem - The Illustrator group item.
 * @returns {PathItem | null} - The final clipping path, or null if not found.
 */
const getFinalClippingPath = (groupItem: GroupItem): PathItem | null => {
    if (!groupItem || groupItem.pageItems.length === 0) return null;

    let clipPaths: PathItem[] = [];

    const findClippingPaths = (item: PageItem): void => {
        if (item.typename === "GroupItem") {
            let group = item as GroupItem;
            for (let i = 0; i < group.pageItems.length; i++) {
                findClippingPaths(group.pageItems[i]);
            }
        } else if (item.typename === "PathItem" && (item as PathItem).clipping) {
            clipPaths.push(item as PathItem);
        }
    }

    findClippingPaths(groupItem);

    return clipPaths.length > 0 ? clipPaths[clipPaths.length - 1] : null;
}

/**
 * Gets the true visible bounds of a masked group by ignoring hidden areas.
 * 
 * @param {GroupItem} groupItem - The Illustrator group item.
 * @returns {number[] | null} - The visible bounds [left, top, right, bottom], or null if no mask found.
 */
const getMaskedBounds = (groupItem: GroupItem): number[] | null => {
    let finalClipPath = getFinalClippingPath(groupItem);
    if (!finalClipPath) return null;

    let bounds = finalClipPath.geometricBounds.slice(); // Start with clipping path bounds

    for (let i = 0; i < groupItem.pageItems.length; i++) {
        let item = groupItem.pageItems[i];
        if (item !== finalClipPath) { // Ignore the mask itself
            let itemBounds = item.geometricBounds;

            // Adjust the bounds based on visible objects inside the mask
            bounds[0] = Math.min(bounds[0], itemBounds[0]); // Left
            bounds[1] = Math.max(bounds[1], itemBounds[1]); // Top
            bounds[2] = Math.max(bounds[2], itemBounds[2]); // Right
            bounds[3] = Math.min(bounds[3], itemBounds[3]); // Bottom
        }
    }

    return bounds;
}

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
const alignItems = (baseGroupItem:PageItem, movingGroupItem: PageItem, position: AlignPosition): void => {
    const baseBounds = getTopMostVisibleItem(baseGroupItem).geometricBounds;

    // Get geometric bounds for the moving item
    const movingBounds = getTopMostVisibleItem(movingGroupItem).geometricBounds;

    // Calculate dimensions and centers
    const baseLeft = baseBounds[0];
    const baseTop = baseBounds[1];
    const baseRight = baseBounds[2];
    const baseBottom = baseBounds[3];

    const moveLeft = movingBounds[0];
    const moveTop = movingBounds[1];
    const moveRight = movingBounds[2];
    const moveBottom = movingBounds[3];

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
}

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
 * Computes the total height required to fit a given quantity of items in both 0-degree and 90-degree orientations.
 * It determines how many items fit per row, calculates the total height, and decides whether a 90-degree layout is preferable.
 *
 * @param {Selection} selections - The item group used for layout calculations, including width and height.
 * @param {number} quantity - The total number of items to be arranged.
 * @returns {RowInfoReturn} - An object containing layout details for both orientations and a recommended orientation.
 */
const getRowInfo = (selections:Selection, quantity: number): RowInfoReturn => {

    const bounds = getSelectionBounds(selections) as BoundsObject;

    const { width, height } = getWHDimension(bounds);

    // Determine how many items fit per row in both orientations
    const fitCount0 = Math.max(1, Math.floor(PAPER_MAX_SIZE / (width + ITEMS_GAP_SIZE)));
    const fitCount90 = Math.max(1, Math.floor(PAPER_MAX_SIZE / (height + ITEMS_GAP_SIZE)));

    // Calculate the number of full rows needed
    const rowsIn0 = Math.max(1, Math.floor(quantity / fitCount0));
    const rowsIn90 = Math.max(1, Math.floor(quantity / fitCount90));

    // Calculate remaining items that do not fit in a full row
    let remaining0 = quantity % fitCount0;
    let remaining90 = quantity % fitCount90;

    // Ensure that if only one item fits per row, the remaining count is adjusted
    if (fitCount0 === 1) remaining0 = quantity - 1;
    if (fitCount90 === 1) remaining90 = quantity - 1;

    // Calculate total height for both orientations
    const totalHeight0 = rowsIn0 * height;
    const totalHeight90 = rowsIn90 * width;

    // Determine if 90-degree orientation is preferable
    const recommendedIn90 = totalHeight90 <= totalHeight0;

    return {
        rowIn0: { fitIn: fitCount0, height: totalHeight0, remaining: remaining0 },
        rowIn90: { fitIn: fitCount90, height: totalHeight90, remaining: remaining90 },
        recommendedIn90
    };
}

/**
 * translate item by x&y value
 * @param {PageItem} item 
 * @param {number} x 
 * @param {number} y 
 */
const translateXY = (item: PageItem, x: number, y: number) => {
    item.translate(x, y)
}

/**
 * Slices a string or array from the end based on the specified slice value.
 *
 * @param originalVal - The input string or array to be sliced.
 * @param sliceValue - The number of elements to remove from the end.
 * @returns The sliced value.
 * @throws {Error} Throws an error if sliceValue is negative.
 */
const endSlice = (
    originalVal: string | unknown[],
    sliceValue: number,
): string | unknown[] => {
    if (sliceValue < 0) {
        throw new Error("sliceValue must be non-negative");
    }
    return originalVal.slice(0, originalVal.length - sliceValue);
};