/* 1) Create an instance of CSInterface. */
var csInterface = new CSInterface();

/**
 *
 * @param {string} id
 * @returns HTMLElement
 */
const selectElementById = (id) => {
  return document.getElementById(id);
};

// ---------- patch Automate NANO Button --------- \\
const autoNANOBtn = selectElementById("autoNANOBtn");
autoNANOBtn.onclick = () => {
  csInterface.evalScript("automateInfoDialog()");
};

// ---------- patch Grid Layout Button --------- \\
const gridLayoutBtn = selectElementById("gridLayoutBtn");

gridLayoutBtn.onclick = () => {
  csInterface.evalScript("gridMenualInfoDialog()");
};

// ---------- patch Tweak Buttons --------- \\
const addStrokeOutlineBtn = selectElementById("addStrokeOutline");
const checkOpacityMaskBtn = selectElementById("checkOpacityMask");
const repairDocBtn = selectElementById("repairDocument");
const $2SetFSlvBtn = selectElementById("2SetFSlv");
const arrangeObjectsBeforeBtn = selectElementById("arrangeObjectsBefore");
const tiffObjectsBtn = selectElementById("tiffObjects");
const selectSametagNamesObjectsBtn = selectElementById(
  "selectSametagNamesObjects",
);

// ---------- patch Object Key Handler Button --------- \\
const makeObjKeyBtn = selectElementById("makeObjectKey");
const destroyObjKeyBtn = selectElementById("destroyObjectKey");

addStrokeOutlineBtn.onclick = () => {
  csInterface.evalScript("Organizer.applyStrokeOnClipPath()");
};

repairDocBtn.onclick = () => {
  csInterface.evalScript("Organizer.repairDocumentError()");
};

checkOpacityMaskBtn.onclick = () => {
  csInterface.evalScript("Organizer.checkisOpacityMask()");
};

$2SetFSlvBtn.onclick = () => {
  csInterface.evalScript("Organizer.fSlv2SetInit()");
};

arrangeObjectsBeforeBtn.onclick = () => {
  csInterface.evalScript("Organizer.arrangeObjectsBefore()");
};

tiffObjectsBtn.onclick = () => {
  csInterface.evalScript("Organizer.replaceSelectionWithEmbeddedTiffCopies()");
};

selectSametagNamesObjectsBtn.onclick = () => {
  csInterface.evalScript("Organizer.selectObjectsByNamesUI()");
};

makeObjKeyBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectKeyHandler(true)");
};

destroyObjKeyBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectKeyHandler(false)");
};

// ---------- patch Mark Buttons --------- \\
const markFrontBtn = selectElementById(`markFront`);
const markBackBtn = selectElementById(`markBack`);
const markLeftBtn = selectElementById(`markLeft`);
const markRightbtn = selectElementById(`markRight`);

markFrontBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('FRONT')");
};
markBackBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('BACK')");
};

/**
 *
 * @param {HTMLElement} htmlElement
 * @param {...string} className
 */
const removeClass = (htmlElement, ...className) => {
  htmlElement.classList.remove(...className);
};
/**
 *
 * @param {HTMLElement} htmlElement
 * @param {...string} className
 */
const addClass = (htmlElement, ...className) => {
  htmlElement.classList.add(...className);
};

const adbIlstBtnActCls = "adb-ilst-btn--active";
