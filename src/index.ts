//@include './scriptUI/orgInfoDialog.js';
//@include './scriptUI/alertUI.js';
//@include './polyfill/json2.js';

const FRONT = "FRONT";
const BACK = "BACK";
const PAPER_MAX_SIZE = 63.25;

const NO_MAX_SIZE = {
    FRONT: 3,
    BACK: 11
};

const ITEMS_GAP_SIZE = 0.10;

const JFT_SIZE = {
    MENS: {
        S: {
            width: 19.5,
            height: 28
        },
        M: {
            width: 19.5,
            height: 29
        },
        L: {
            width: 20.5,
            height: 30
        },
        XL: {
            width: 21.5,
            height: 31
        },
        "2XL": {
            width: 22.5,
            height: 31.5
        },
    },
    BABY: {
        "2": {
            width: 12.5,
            height: 16
        },
        "4": {
            width: 13,
            height: 17.5
        },
        "6": {
            width: 13.5,
            height: 19
        },
        "8": {
            width: 14.5,
            height: 20.5
        },
        "10": {
            width: 15.5,
            height: 22
        },
        "12": {
            width: 16.5,
            height: 23.5
        },
        "14": {
            width: 17.5,
            height: 25
        },
        "16": {
            width: 18.5,
            height: 26.5
        },
    }
};

const ALIASES = {
    SZ_TK: 0,
    NO: 1,
    NAME: 2
};


/**
 * Finds an element in an array based on a callback function.
 * 
 * @param {any[]} array - The array to search through.
 * @param {findElementCb} cb - The callback function used to test each element.
 * The callback should return a truthy value to indicate that the element matches.
 * @returns {any | null} - The first element that satisfies the callback function or null if none found.
 */
const findElement = (array: any[], cb: findElementCb): any | null => {
    for (let index = 0; index < array.length; index++) {
        let element = array[index];
        if (cb(element, index)) {
            return element;
        }
    }
    return null;
}

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
 * Calculates the visible bounding box of selected items in Adobe Illustrator.
 * 
 * @param selection - Array of selected items in Illustrator.
 * @returns An object containing the `left`, `top`, `right`, and `bottom` bounds of the selection.
 */
const getSelectionBounds = (selection: any[]): { left: number; top: number; right: number; bottom: number } | null => {
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

    return { left: minX, top: maxY, right: maxX, bottom: minY };
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
const alignItems = (baseGroupItem: GroupItem | PageItem, movingGroupItem: GroupItem, position: AlignPosition): void => {
    const baseBounds = getBodyGeoMetrics(baseGroupItem as GroupItem);

    // Get geometric bounds for the moving item
    const movingBounds = getBodyGeoMetrics(movingGroupItem as GroupItem);

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
    moveItem(movingGroupItem, deltaX, deltaY);
}

/**
 * Validates a selected object in the document to ensure it is a valid grouped item with a "BODY" element.
 * 
 * @param {GroupItem} selection - The object to validate, typically a selected item from the document.
 * @returns {boolean} - Returns true if the selection is valid, false otherwise.
 * @throws {Error} - Throws an error if the selection does not meet the expected criteria.
 */
const validateSelection = (selection: GroupItem): boolean => {
    let status = false;
    try {
        if (!selection) {
            alertDialogSA("select object");
        } else if (selection.typename !== "GroupItem") {
            alertDialogSA("selected object is not grouped");
        } else if (!findElement(selection.pageItems, function (element) {
            return element.name === "BODY";
        })) {
            alertDialogSA("body not exist");
        } else {
            status = true;
        }
    } catch (error) {
        alertDialogSA("items sequence wrong");
    }
    return status;
}

/**
 * Validates that a "BODY" item exists in a group and checks if it is clipped.
 * 
 * @param {GroupItem} groupItem - The GroupItem object to validate.
 * @returns {boolean} - Returns true if the BODY item is clipped, false otherwise.
 * @throws {Error} - Throws an error if there is an issue validating the clip mask.
 */
const validateBodyItem = (groupItem: GroupItem): boolean => {
    let status = false;
    try {
        let body = findElement(groupItem.pageItems, function (element) {
            return element.name === "BODY";
        });
        if (body.clipped && findElement(body.pageItems, function (element) {
            return element.name === "BODY_PATH";
        })) {
            status = true;
        } else {
            alertDialogSA("invalid body clip path");
        }
    } catch (error) {
        alertDialogSA("validate body item error");
    }
    return status;
}

/**
 * Retrieves the "BODY_PATH" item within a group.
 * 
 * @param {GroupItem} groupItem - The GroupItem object to retrieve body.
 * @returns {GroupItem | PathItem} - The "BODY_PATH" item.
 */
const getBody = (groupItem: GroupItem): GroupItem | PathItem => {
    const body = findElement(groupItem.pageItems, function (element) {
        return element.name === "BODY";
    });
    const bodyPath = findElement(body.pageItems, function (element) {
        return element.name === "BODY_PATH";
    });

    return bodyPath;
}

/**
 * Retrieves the geometric bounds of the "BODY_PATH" item within a group.
 * 
 * @param {GroupItem} groupItem - The GroupItem object to retrieve geometric bounds for.
 * @returns {[] | number[]} - The geometric bounds of the "BODY_PATH" item.
 */
const getBodyGeoMetrics = (groupItem: GroupItem): [] | number[] => {
    return getBody(groupItem).geometricBounds;
}

/**
 * Calculates the width and height of a body in inches based on its geometric bounds.
 * The function retrieves the bounding box of a `GroupItem`, then converts the width and height 
 * from points to inches (1 inch = 72 points).
 *
 * @param {GroupItem} groupItem - The group item whose body dimensions are to be calculated.
 * @returns {{bodyW: number, bodyH: number}} - An object containing the width (`bodyW`) and height (`bodyH`) of the body in inches.
 */
const getBodyWHDimension = (groupItem: GroupItem): { bodyW: number; bodyH: number; } => {
    const bounds = getBodyGeoMetrics(groupItem);
    const bodyW = (bounds[2] - bounds[0]) / 72;
    const bodyH = (bounds[1] - bounds[3]) / 72;
    return { bodyW, bodyH };
}

/**
 * Computes the total height required to fit a given quantity of items in both 0-degree and 90-degree orientations.
 * It determines how many items fit per row, calculates the total height, and decides whether a 90-degree layout is preferable.
 *
 * @param {GroupItem} groupItem - The item group used for layout calculations, including width and height.
 * @param {number} quantity - The total number of items to be arranged.
 * @returns {RowInfoReturn} - An object containing layout details for both orientations and a recommended orientation.
 */
const getRowInfo = (groupItem: GroupItem, quantity: number): RowInfoReturn => {
    const {bodyW,bodyH} = getBodyWHDimension(groupItem);

    // Determine how many items fit per row in both orientations
    const fitCount0 = Math.max(1, Math.floor(PAPER_MAX_SIZE / (bodyW + ITEMS_GAP_SIZE)));
    const fitCount90 = Math.max(1, Math.floor(PAPER_MAX_SIZE / (bodyH + ITEMS_GAP_SIZE)));

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
    const totalHeight0 = rowsIn0 * bodyH;
    const totalHeight90 = rowsIn90 * bodyW;

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
 * @param {GroupItem} groupItem 
 * @param {number} x 
 * @param {number} y 
 */
const moveItem = (groupItem: GroupItem, x: number, y: number) => {
    groupItem.translate(x, y)
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

/**
 * Rotate a item by degrees
 * @param {GroupItem | PageItem} groupItem
 * @param {90 | -90 | 180 | 0 | -180} deg
 */
const rotateItem = (groupItem: GroupItem | PageItem, deg: RotateDegrees) => {
    const body = getBody(groupItem as GroupItem); // Get the actual object body

    // Get original bounds
    const originalBounds = body.geometricBounds; // [x1, y1, x2, y2]
    const originalCenterX = (originalBounds[0] + originalBounds[2]) / 2;
    const originalCenterY = (originalBounds[1] + originalBounds[3]) / 2;

    // Rotate the object
    groupItem.rotate(deg);

    // Get new bounds after rotation
    const newBounds = body.geometricBounds;
    const newCenterX = (newBounds[0] + newBounds[2]) / 2;
    const newCenterY = (newBounds[1] + newBounds[3]) / 2;

    // Calculate the translation needed to keep it centered
    const deltaX = originalCenterX - newCenterX;
    const deltaY = originalCenterY - newCenterY;

    // Move object back to original center position
    groupItem.translate(deltaX, deltaY);
};

/**
 * Resizes a given GroupItem or PathItem to the specified width and height.
 * 
 * @param {GroupItem | PathItem} groupItem - The Illustrator item to resize.
 * @param {number} width - The target width in inches.
 * @param {number} height - The target height in inches.
 * @returns {void}
 */
const changeSize = (groupItem: GroupItem | PathItem, width: number, height: number): void => {
    // Get the bounding box of the item
    const [left, top, right, bottom]: number[] = getBodyGeoMetrics(groupItem as GroupItem);

    // Convert the bounding box width and height from points to inches
    const bsWidth: number = (right - left) / 72;
    const bsHeight: number = (top - bottom) / 72;

    // Calculate scaling factors as percentages
    const nxtWidthScaleFactor: number = (width / bsWidth) * 100;
    const nxtHeightScaleFactor: number = (height / bsHeight) * 100;

    // Apply resizing
    groupItem.resize(nxtWidthScaleFactor, nxtHeightScaleFactor);
};

/**
 * Fixes, rotates, and aligns an item.
 * @param arg - The parameters.
 * @returns The modified item.
 */
const fixOrganizeRotateAlign = (arg: FixOrganizeRotateAlignParams):GroupItem => {
    const {baseItem,lastItem,to90} = arg;
    const dupGroupItem = baseItem.duplicate() as GroupItem;
    if(to90) {
        rotateItem(dupGroupItem,-90);
    }
    alignItems(lastItem,dupGroupItem,"B");
    alignItems(lastItem,dupGroupItem,"L");
    const {bodyH} = getBodyWHDimension(dupGroupItem);
    const deltaY = (bodyH)+(ITEMS_GAP_SIZE);
    moveItem(dupGroupItem,0,-deltaY*72);
    return dupGroupItem
}

/**
 * Duplicates an item and moves it to the specified position.
 * @param {OrgBodyItem} arg - The item and positioning information 
 * @returns {GroupItem | PageItem} - The duplicated item
 */
const organizeBody = (arg:OrgBodyItem):GroupItem | PageItem => {
    const {item,x,y} = arg;
    const duplicated = item.duplicate() as GroupItem;
    moveItem(duplicated,x,y);
    return duplicated;
}

/**
 * Organizes items in a grid layout.
 * @param {OrganizeInitParams} arg - The parameters for organizing items.
 * @returns {void} - Array of created items
 */
const organizeBodyXY = (arg: OrgBodyItemDir): void => {
    const { baseItem, quantity, fitIn, to90 } = arg;
    const tempBase = baseItem.duplicate() as GroupItem;
    const als = tempBase.name;
    baseItem.name = als + 1;
    const { bodyW: w, bodyH: h } = getBodyWHDimension(tempBase);
    let row = 0;
    let col = 0;

    if (to90) {
        rotateItem(tempBase, -90);
    }

    for (let index = 1; index <= quantity; index++) {

        const x = (col) * (to90 ? h : w);
        const y = -(row) * (to90 ? w : h);
        const xWithGap = x ? x + (ITEMS_GAP_SIZE*col) : x;
        const yWithGap = y ? y - (ITEMS_GAP_SIZE*row) : y;
        const duplicated = organizeBody({ item: tempBase, x: xWithGap*72, y: yWithGap*72 }) as GroupItem;
        duplicated.name = als + index;

        if (col >= fitIn - 1) {
            col = 0; // Reset column when it reaches the fitIn limit
            row += 1; // Move to the next row
        } else {
            col += 1;
        }
    }

    tempBase.remove();
}

/**
 * Initializes the organization of template items in a grid.
 * @param {OrganizeInitParams} param - The parameters for initialization.
 */

const organizeInit = ({ doc, quantity, targetSizeChr}:OrganizeInitParams): void => {
    if(quantity < 2) {
        alertDialogSA("minimum length 2 required");
        return;
    }
    const groupItem = doc.selection[0] as GroupItem;
    const gender: keyof typeof JFT_SIZE = JFT_SIZE.MENS[targetSizeChr as MensSize] ? "MENS" : "BABY";
    const targetSizeWH = JFT_SIZE[gender][targetSizeChr as keyof typeof JFT_SIZE[typeof gender]] as typeof JFT_SIZE.MENS.S;
    changeSize(groupItem, targetSizeWH.width, targetSizeWH.height);
    const {recommendedIn90,rowIn0,rowIn90} = getRowInfo(groupItem,quantity);
    let organizeBodyXYPrm:OrgBodyItemDir = {
        baseItem:groupItem,
        fitIn:rowIn90.fitIn,
        to90:true,
        quantity
    };

    const actLyrItems = doc.activeLayer.pageItems;
    let lastRowFirstItem:GroupItem | null = null;
    
    if(recommendedIn90) {
        const fitQuantity = quantity - rowIn90.remaining;
        organizeBodyXYPrm.quantity = fitQuantity;
        organizeBodyXY(organizeBodyXYPrm);
        lastRowFirstItem = actLyrItems[fitQuantity - rowIn90.fitIn] as GroupItem;
    } else {
        const fitQuantity = quantity - rowIn0.remaining;
        organizeBodyXYPrm.fitIn = rowIn0.fitIn;
        organizeBodyXYPrm.quantity = fitQuantity;
        organizeBodyXYPrm.to90 = false;
        organizeBodyXY(organizeBodyXYPrm);
        lastRowFirstItem = actLyrItems[fitQuantity - rowIn0.fitIn] as GroupItem;
    }

    if (rowIn0.remaining || rowIn90.remaining) {
        const remingRowInfo = getRowInfo(groupItem, recommendedIn90 ? rowIn90.remaining : rowIn0.remaining);

        const to90 = remingRowInfo.recommendedIn90;

        lastRowFirstItem = fixOrganizeRotateAlign({ baseItem: groupItem, lastItem: lastRowFirstItem, to90});

        organizeBodyXYPrm = { ...organizeBodyXYPrm, baseItem: lastRowFirstItem, to90: !to90, quantity: recommendedIn90 ? rowIn90.remaining : rowIn0.remaining };

        if (remingRowInfo.recommendedIn90) {
            organizeBodyXYPrm.fitIn = remingRowInfo.rowIn90.fitIn;
        } else {
            organizeBodyXYPrm.to90 = to90;
            organizeBodyXYPrm.fitIn = remingRowInfo.rowIn0.fitIn;
        }
        organizeBodyXY(organizeBodyXYPrm);

        if(lastRowFirstItem) {
            lastRowFirstItem.remove();
        }
    }
    groupItem.remove();

}

/**
 * Runs the main process of the script, validating the selection and the body clip.
 * 
 * @returns {void} - This function does not return a value.
 * @throws {Error} - Throws an error if the initial document or selection is invalid.
 */
const run = (cb:RunFunctionParams): void => {
    try {
        const doc = app.activeDocument;
        const selection1 = doc.selection[0] as GroupItem;
        const selSts = validateSelection(selection1);
        if (selSts && validateBodyItem(selection1)) {
            if(typeof cb === "function") {
                cb(doc);
            }
        }
    } catch (error) {
        alertDialogSA("initiate error");
    }
}

orgDialogRoot();
// run(null);