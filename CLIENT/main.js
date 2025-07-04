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

// ---------- patch Object Key Handler Button --------- \\
const makeObjKeyBtn = selectElementById("makeObjectKey");
const destroyObjKeyBtn = selectElementById("destroyObjectKey");

makeObjKeyBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectKeyHandler({dispatch:true})");
}

destroyObjKeyBtn.onclick = () => {
    csInterface.evalScript("Organizer.objectKeyHandler({dispatch:false})");
}

// ---------- patch Move After Button --------- \\
const moveAfterLBtn = selectElementById(`moveAfterL`);
const moveAfterTBtn = selectElementById(`moveAfterT`);
const moveAfterRBtn = selectElementById(`moveAfterR`);
const moveAfterBBtn = selectElementById(`moveAfterB`);

moveAfterLBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI({direction:'L'})");
}
moveAfterTBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI({direction:'T'})");
}
moveAfterRBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI({direction:'R'})");
}
moveAfterBBtn.onclick = () => {
    csInterface.evalScript("Organizer.moveAfterItemUI({direction:'B'})");
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