const FRONT = "FRONT";
const BACK = "BACK";
const PAPER_MAX_SIZE = 63.25;

const NO_MAX_SIZE = {
    FRONT: 3,
    BACK: 11
};

// let rootSelection:GroupItem | null;

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
        XXL: {
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

const currentData = {
    cr_size: {
        w: 20.5,
        h: 30
    },
    nx_size: {
        w: 19.5,
        h: 29
    },
    // playerdata: [
    //     { "name": "A", "no": 1 },
    //     { "name": "B", "no": 2 },
    //     { "name": "C", "no": 3 },
    //     { "name": "D", "no": 4 },
    //     { "name": "E", "no": 5 },
    //     { "name": "F", "no": 6 },
    //     { "name": "G", "no": 7 },
    //     { "name": "H", "no": 8 },
    //     { "name": "I", "no": 9 },
    //     { "name": "J", "no": 10 }
    // ]
    playerdata:[1,2,3,4,5,6,7,8,9,10,11,12,13,14]
}


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
            alert("select object");
        } else if (selection.typename !== "GroupItem") {
            alert("selected object is not grouped");
        } else if (!findElement(selection.pageItems, function (element) {
            return element.name === "BODY";
        })) {
            alert("body not exist");
        } else {
            status = true;
        }
    } catch (error) {
        alert("items sequence wrong");
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
            alert("invalid body clip path");
        }
    } catch (error) {
        alert("validate body item error");
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
 * Calculates the total height required to fit items in both 0-degree and 90-degree orientations.
 * It determines the number of items that can fit in a row, calculates the number of rows needed,
 * and considers any remaining items that do not fit within complete rows.
 * 
 * @function
 * @param {GroupItem} groupItem - The item group for which the height is calculated.
 * @param {number} quantity - quantity.
 * @returns {TotalHeightReturn} An object containing row details for both orientations and a recommendation flag.
 */
const getTotalHeight = (groupItem: GroupItem, quantity: number): TotalHeightReturn => {
    const bounds = getBodyGeoMetrics(groupItem);
    const bodyW = (bounds[2] - bounds[0]) / 72;
    const bodyH = (bounds[1] - bounds[3]) / 72;
    const fitCount0 = parseInt((PAPER_MAX_SIZE / (bodyW + ITEMS_GAP_SIZE)).toString()); // Number of items that fit in 0 degrees
    const fitCount90 = parseInt((PAPER_MAX_SIZE / (bodyH + ITEMS_GAP_SIZE)).toString()); // Number of items that fit in 90 degrees

    const rowsIn0 = parseInt((quantity / fitCount0).toString()) || 1; // Rows of items in 0 degrees
    const rowsIn90 = parseInt((quantity / fitCount90).toString()) || 1; // Rows of items in 90 degrees

    if (quantity <= 2) {
        if (fitCount90 < 2 && fitCount0 < 2) {
            return {
                rowIn0: {
                    totalHeight: bodyH * quantity,
                    remainingItems: quantity - 1,
                    fitIn: fitCount0
                },
                rowIn90: {
                    totalHeight: bodyW * quantity,
                    remainingItems: quantity - 1,
                    fitIn: fitCount90
                },
                recommendedIn90: bodyW < bodyH
            };
        } else if (fitCount90 < 2) {
            return {
                rowIn0: {
                    totalHeight: bodyH,
                    remainingItems: 0,
                    fitIn: fitCount0
                },
                rowIn90: {
                    totalHeight: bodyW * quantity,
                    remainingItems: quantity - 1,
                    fitIn: fitCount90
                },
                recommendedIn90: false
            };
        } else {
            return {
                rowIn0: {
                    totalHeight: bodyH,
                    remainingItems: 0,
                    fitIn: fitCount0
                },
                rowIn90: {
                    totalHeight: bodyW,
                    remainingItems: 0,
                    fitIn: fitCount90
                },
                recommendedIn90: true
            };
        }
    }

    const remainingItems0 = parseInt((quantity % fitCount0).toString()); // Remaining items for 0 degrees
    const remainingItems90 = parseInt((quantity % fitCount90).toString()); // Remaining items for 90 degrees

    const heightWithoutRemaining0 = rowsIn0 * bodyH; // Total height without remaining items in 0 degrees
    const heightWithoutRemaining90 = rowsIn90 * bodyW; // Total height without remaining items in 90 degrees

    let totalHeight0 = heightWithoutRemaining0;
    let totalHeight90 = heightWithoutRemaining90;

    if (remainingItems0 > 0) {
        const extraHeight0 = Math.ceil(remainingItems0 / fitCount90) * bodyW; // Extra height for remaining items in 0 degrees
        totalHeight0 += extraHeight0;
    }

    if (remainingItems90 > 0) {
        const extraHeight90 = Math.ceil(remainingItems90 / fitCount90) * currentData.nx_size.w; // Extra height for remaining items in 90 degrees
        totalHeight90 += extraHeight90;
    }

    return {
        rowIn0: {
            totalHeight: totalHeight0,
            remainingItems: remainingItems0,
            fitIn: fitCount0
        },
        rowIn90: {
            totalHeight: totalHeight90,
            remainingItems: remainingItems90,
            fitIn: fitCount90
        },
        recommendedIn90: totalHeight90 <= totalHeight0
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
    groupItem.width = width * 72;
    groupItem.height = height * 72;
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
    const { baseItem, playerLength, colInfo, bodyDim, bodyPath, is90 } = arg;
    const als = baseItem.name;
    const playerdata = endSlice(currentData.playerdata,playerLength);
    const {fitIn,remainingItems,totalHeight} = colInfo;
    baseItem.name = als + 1;
    const { w, h } = bodyDim;
    let row = 0;
    let col = 0;

    if (is90) {
        rotateItem(baseItem, -90);
    }

    for (let index = 1; index <= playerdata.length; index++) {

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

const organizeInit = (doc: Document): void => {
    const groupItem = doc.selection[0] as GroupItem;
    const playerdata = currentData.playerdata;
    const bodyPath = getBody(groupItem);
    const bounds = getBodyGeoMetrics(groupItem);
    const bodyW = (currentData.nx_size.w + ITEMS_GAP_SIZE) * 72;
    const bodyH = (currentData.nx_size.h + ITEMS_GAP_SIZE) * 72;
    const bodyDim = {w:bodyW,h:bodyH};
    let lastItem:GroupItem | PageItem;
    const actLyrItms1 = doc.activeLayer.pageItems;
    changeSize(bodyPath, JFT_SIZE.MENS.M.width, JFT_SIZE.MENS.M.height);
    const {recommendedIn90,rowIn0,rowIn90} = getTotalHeight(groupItem, playerdata.length);
    if(recommendedIn90) {
        organizeBodyXY({ baseItem: groupItem, bodyPath, bodyDim, colInfo: rowIn90, playerLength: playerdata.length, is90: true });
        const actLyrItms2 = doc.activeLayer.pageItems;
        const lastRowFirstItemIndex = actLyrItms2.length - rowIn90.fitIn - 1;
    } else {
        organizeBodyXY({ baseItem: groupItem, bodyPath, bodyDim, colInfo: rowIn0, playerLength: rowIn0.remainingItems, is90: false });

        const actLyrItms = doc.activeLayer.pageItems;
        const lastRowFirstItemIndex = actLyrItms.length - rowIn0.fitIn - 1;
        lastItem = actLyrItms[lastRowFirstItemIndex];
        if(rowIn0.remainingItems) {
            const remaingTotalH = getTotalHeight(groupItem,rowIn0.remainingItems);
            const actLyrItms = doc.activeLayer.pageItems;
            const lastRowFirstItemIndex = actLyrItms.length - rowIn90.fitIn - 1;
            if(remaingTotalH.recommendedIn90) {
                const lastRowFirstItem = actLyrItms[lastRowFirstItemIndex];
            }
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
const run = (): void => {
    try {
        const doc = app.activeDocument;
        alert(`Hello ${doc.name}`);
        const selection1 = doc.selection[0] as GroupItem;
        const selection2 = doc.selection[1] as GroupItem;
        const selSts = validateSelection(selection1);
        if (selSts && validateBodyItem(selection1)) {
            organizeInit(doc);
        }
    } catch (error) {
        alert("initiate error");
    }
}

run();