/* 1) Create an instance of CSInterface. */
var csInterface = new CSInterface();

/**
 * 
 * @param {string} id 
 * @returns HTMLElement
 */
const selectElementById = (id) => {
    return document.getElementById(id);
}

// ---------- patch Automate NANO Button --------- \\
const autoNANOBtn = selectElementById("autoNANOBtn");
autoNANOBtn.onclick = () => {
    csInterface.evalScript("automateInfoDialog()")
}

// ---------- patch Grid Layout Button --------- \\
const gridLayoutBtn = selectElementById("gridLayoutBtn");

gridLayoutBtn.onclick = () => {
    csInterface.evalScript("gridMenualInfoDialog()");
}

// ---------- patch Initiate Pant Button Layout Button --------- \\
const pantInitBtn = selectElementById("pantInit");

pantInitBtn.onclick = () => {
    csInterface.evalScript("initiatePant()");
}

// ---------- patch Tweak Buttons --------- \\
const selectClipPathBtn = selectElementById("selectClipPath");
const checkOpacityMaskBtn = selectElementById("checkOpacityMask");
const $2SetFSlv = selectElementById("2SetFSlv");

// ---------- patch Object Key Handler Button --------- \\
const makeObjKeyBtn = selectElementById("makeObjectKey");
const destroyObjKeyBtn = selectElementById("destroyObjectKey");

selectClipPathBtn.onclick = () => {
    csInterface.evalScript("Organizer.selectTopClippingPath()");
}

checkOpacityMaskBtn.onclick = () => {
    csInterface.evalScript("Organizer.checkisOpacityMask()");
}

$2SetFSlv.onclick = () => {
    csInterface.evalScript("Organizer.fSlv2SetInit()");
}

makeObjKeyBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectKeyHandler(true)");
}

destroyObjKeyBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectKeyHandler(false)");
}

// ---------- patch Move After Button --------- \\
const moveAfterLBtn = selectElementById(`moveAfterL`);
const moveAfterTBtn = selectElementById(`moveAfterT`);
const moveAfterRBtn = selectElementById(`moveAfterR`);
const moveAfterBBtn = selectElementById(`moveAfterB`);

moveAfterLBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI('L')");
}
moveAfterTBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI('T')");
}
moveAfterRBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI('R')");
}
moveAfterBBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI('B')");
}

// ---------- patch Mark Buttons --------- \\
const markFrontBtn = selectElementById(`markFront`);
const markBackBtn = selectElementById(`markBack`);
const markNABtn = selectElementById(`markNA`);
const markNOBtn = selectElementById(`markNO`);
const markGKBtn = selectElementById(`markGK`);
const markPantFrontRBtn = selectElementById(`markPantFrontR`);
const markPantFrontLBtn = selectElementById(`markPantFrontL`);
const markPantBackRBtn = selectElementById(`markPantBackR`);
const markPantBackLBtn = selectElementById(`markPantBackL`);
const markOpacityMask = selectElementById(`markOpacityMask`);
const markOpacityMaskInvert = selectElementById(`markOpacityMaskInvert`);

markFrontBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('FRONT')");
}
markBackBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('BACK')");
}
markNABtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('NAME')");
}
markNOBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('NO')");
}
markGKBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('GK')");
}
markPantFrontRBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('PANT_F_R')");
}
markPantFrontLBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('PANT_F_L')");
}
markPantBackRBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('PANT_B_R')");
}
markPantBackLBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('PANT_B_L')");
}
markOpacityMask.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('OM-SA')");
}
markOpacityMaskInvert.onclick = () => {
    csInterface.evalScript("Organizer.objectMarkByName('OMI-SA')");
}

/**
 * 
 * @param {HTMLElement} htmlElement 
 * @param {...string} className 
 */
const removeClass = (htmlElement, ...className) => {
    htmlElement.classList.remove(...className)
};
/**
 * 
 * @param {HTMLElement} htmlElement 
 * @param {...string} className 
 */
const addClass = (htmlElement, ...className) => {
    htmlElement.classList.add(...className)
};

const adbIlstBtnActCls = "adb-ilst-btn--active";