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