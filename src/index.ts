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
        2: {
            width: 12.5,
            height: 16
        },
        4: {
            width: 13,
            height: 17.5
        },
        6: {
            width: 13.5,
            height: 19
        },
        8: {
            width: 14.5,
            height: 20.5
        },
        10: {
            width: 15.5,
            height: 22
        },
        12: {
            width: 16.5,
            height: 23.5
        },
        14: {
            width: 17.5,
            height: 25
        },
        16: {
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
 * Calculates the total height required to fit items in both 0-degree and 90-degree orientations.
 * It determines how many items fit in each row, calculates the total height for the given quantity of items, 
 * and checks whether the layout should be recommended in 90-degree orientation based on total height.
 * The function also accounts for any remaining items that do not completely fit into the rows.
 * 
 * @function
 * @param {GroupItem} groupItem - The item group for which the layout is calculated, including its geometric properties.
 * @param {number} quantity - The total number of items that need to be fitted into the layout.
 * @returns {RowInfoReturn} An object containing the following:
 *  - `rowIn0`: Details of the rows in 0-degree orientation, including:
 *    - `fitIn`: Number of items that fit in a single row.
 *    - `height`: Total height needed to fit all items.
 *    - `remaining`: Number of remaining items that don't fit in complete rows.
 *  - `rowIn90`: Details of the rows in 90-degree orientation, including:
 *  - `recommendedIn90`: A boolean indicating if the 90-degree orientation should be used based on a comparison of total heights.
 */
const getRowInfo = (groupItem: GroupItem, quantity: number): RowInfoReturn => {
    const {bodyW,bodyH} = getBodyWHDimension(groupItem);
    const fitCount0 = parseInt((PAPER_MAX_SIZE / (bodyW + ITEMS_GAP_SIZE)).toString()); // Number of items that fit in 0 degrees
    const fitCount90 = parseInt((PAPER_MAX_SIZE / (bodyH + ITEMS_GAP_SIZE)).toString()); // Number of items that fit in 90 degrees

    const returnObj = {
        rowIn0:{
            fitIn:fitCount0,
            height:0,
            remaing:0
        },
        rowIn90:{
            fitIn:fitCount90,
            height:0,
            remaing:0
        },
        recommendedIn90:false
    };

    const rowsIn0 = parseInt((quantity / fitCount0).toString()) || 1; // Rows of items in 0 degrees
    const rowsIn90 = parseInt((quantity / fitCount90).toString()) || 1; // Rows of items in 90 degrees

    if(quantity <= fitCount0 || quantity <= fitCount90) {

        const totalH0 = bodyH*quantity;
        const totalH90 = bodyW*quantity;
        // now check recommendedIn90
        if(totalH90 <= totalH0) {
            returnObj.recommendedIn90 = true;
            returnObj.rowIn90 = {...returnObj.rowIn90,height:totalH90};
        } else {
            returnObj.rowIn0 = { ...returnObj.rowIn0, height: totalH0 };
        }
    } else {
        // when quantity greater than fitCount0 or fitCount90
        let remaining0 = parseInt((quantity % fitCount0).toString()); // Remaining items for 0 degrees
        let remaining90 = parseInt((quantity % fitCount90).toString()); // Remaining items for 90 degrees

        // check reasign if fitItem 1;
        {
            if(fitCount0 === 1) {
                remaining0 = quantity - 1;
            }
            if(fitCount90 === 1) {
                remaining90 = quantity - 1;
            }
        }

        const heightWithoutRemaining0 = rowsIn0 * bodyH; // Total height without remaining items in 0 degrees
        const heightWithoutRemaining90 = rowsIn90 * bodyW; // Total height without remaining items in 90 degrees

        let totalHeight0 = heightWithoutRemaining0;
        let totalHeight90 = heightWithoutRemaining90;

        if (remaining0 > 0) {
            const extraHeight0 = Math.ceil(remaining0 / fitCount90) * bodyW; // Extra height for remaining items in 0 degrees
            totalHeight0 += extraHeight0;
        }

        if (remaining90 > 0) {
            const extraHeight90 = Math.ceil(remaining90 / fitCount90) * bodyW; // Extra height for remaining items in 90 degrees
            totalHeight90 += extraHeight90;
        }

        returnObj.rowIn0 = {...returnObj.rowIn0,height:totalHeight0,remaing:remaining0};
        returnObj.rowIn90 = {...returnObj.rowIn90,height:totalHeight90,remaing:remaining90};
        returnObj.recommendedIn90 = totalHeight90 <= totalHeight0;
    }


    return returnObj;
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
const rotateItem = (groupItem: GroupItem | PageItem, deg: 90 | -90 | 180 | 0 | -180) => {
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
 * 
 * @param {GroupItem | PathItem} groupItem 
 * @param {number} width 
 * @param {number} height 
 */
const changeSize = (groupItem: GroupItem | PathItem, width: number, height: number) => {
    const [left,top,right,bottom] = getBodyGeoMetrics(groupItem as GroupItem);
    const bsWidth = (right - left)/72;
    const bsHeight = (top - bottom)/72;
    const nxtWidthScaleFactor = (width/bsWidth)*100;
    const nxtHeightScaleFactor = (height/bsHeight)*100;
    groupItem.resize(nxtWidthScaleFactor,nxtHeightScaleFactor);
}

const fixOrganizeRotateAlign = (baseItem:GroupItem,movingItem:GroupItem):void => {
    rotateItem(movingItem,-90);
    alignItems(baseItem,movingItem,"L");
    const body1 = getBodyGeoMetrics(baseItem);
    const body2 = getBodyGeoMetrics(movingItem);
    const deltaY = (body1[3]-body2[1])-(ITEMS_GAP_SIZE*72);
    moveItem(movingItem,0,deltaY)
}

/**
 * Duplicates an item and moves it to the specified position.
 * 
 * @function
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
 * Organizes items in a horizontal grid layout based on the provided parameters.
 * 
 * @function
 * @param {OrgBodyItemDir} arg - The parameters for organizing items horizontally
 * @returns {void} - Array of created items
 */
const organizeBodyXY = (arg: OrgBodyItemDir): void => {
    const { baseItem, quantity, colInfo, bodyDim,  is90 } = arg;
    const als = baseItem.name;
    const {fitIn,remaing,height} = colInfo;
    baseItem.name = als + 1;
    const { w, h } = bodyDim;
    let row = 0;
    let col = 0;

    if (is90) {
        rotateItem(baseItem, -90);
    }

    for (let index = 1; index <= quantity; index++) {

        const x = (col) * (is90 ? h : w);
        const y = -(row) * (is90 ? w : h);
        const duplicated = organizeBody({ item: baseItem, x: x, y: y }) as GroupItem;
        duplicated.name = als + index;

        if (col >= fitIn - 1) {
            col = 0; // Reset column when it reaches the fitIn limit
            row += 1; // Move to the next row
        } else {
            col += 1;
        }
    }
}

/**
 * Initializes and organizes the duplication and positioning of template items in a grid pattern.
 * Takes the selected group item, rotates it, and creates duplicates positioned in a grid layout
 * according to the calculated parameters.
 * 
 * @function
 * @param {Document} doc - The active Adobe Illustrator document.
 * @returns {void} - This function does not return a value.
 * @throws {Error} - May throw an error if item manipulation fails.
 */

const organizeInit = (doc: Document,quantity:number): void => {
    const groupItem = doc.selection[0] as GroupItem;
    const bodyPath = getBody(groupItem);
    const {bodyW,bodyH} = getBodyWHDimension(groupItem)
    const bodyDim = {w:bodyW,h:bodyH};
    let lastItem:GroupItem | PageItem;
    changeSize(bodyPath, JFT_SIZE.MENS.M.width, JFT_SIZE.MENS.M.height);
    const {recommendedIn90,rowIn0,rowIn90} = getRowInfo(groupItem,quantity);

    const organizeBodyXYPrm:OrgBodyItemDir = {
        baseItem:groupItem,
        bodyDim,
        bodyPath,
        colInfo:rowIn90,
        is90:true,
        quantity
    };

    if(recommendedIn90) {
        organizeBodyXY(organizeBodyXYPrm);
    } else {
        organizeBodyXYPrm.colInfo = rowIn0;
        organizeBodyXYPrm.is90 = false;
        organizeBodyXYPrm.quantity = rowIn0.remaing;
        organizeBodyXY(organizeBodyXYPrm);
    }

    groupItem.remove();

}

/**
 * Runs the main process of the script, validating the selection and the body clip.
 * 
 * @returns {void} - This function does not return a value.
 * @throws {Error} - Throws an error if the initial document or selection is invalid.
 */
const run = (cb:Function): void => {
    try {
        const doc = app.activeDocument;
        const selection1 = doc.selection[0] as GroupItem;
        const selSts = validateSelection(selection1);
        if (selSts && validateBodyItem(selection1)) {
            cb(doc);
            // getRowInfo(selection1, 2);
        }
    } catch (error) {
        alertDialogSA("initiate error");
    }
}

orgDialogRoot();