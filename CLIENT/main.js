/* 1) Create an instance of CSInterface. */
const csInterface = new CSInterface();

/**
 *
 * @param {string} id
 * @returns HTMLElement
 */
const selectElementById = (id) => {
  return document.getElementById(id);
};

// ---------- patch Automate NANO Button --------- \\
const autoNANOBtn = selectElementById("autoNANO");
autoNANOBtn.onclick = () => {
  csInterface.evalScript("automateInfoDialog()");
};

// ---------- patch Grid Layout Button --------- \\
const gridLayoutBtn = selectElementById("gridLayout");

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
const resetObjectsNameBtn = selectElementById("resetObjectsName");
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

resetObjectsNameBtn.onclick = () => {
  csInterface.evalScript("Organizer.resetObjectsName()");
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
const markRightBtn = selectElementById(`markRight`);
const markCollarBtn = selectElementById(`markCollar`);
const markNeckBtn = selectElementById(`markNeck`);
const markBodyBtn = selectElementById(`markBody`);
const markPlacketBtn = selectElementById(`markPlacket`);
const markShortSlvBtn = selectElementById(`markSSLV`);
const markLongSlvBtn = selectElementById(`markLSLV`);
const markShortRIBBtn = selectElementById(`markSRIB`);
const markLongRIBBtn = selectElementById(`markLRIB`);
const markShortPantBtn = selectElementById(`markSPant`);
const markLongPantBtn = selectElementById(`markLPant`);
const markNameBtn = selectElementById(`markName`);
const markNumberBtn = selectElementById(`markNumber`);
const markDynamicBtn = selectElementById(`markDynamic`);
const markPairBtn = selectElementById(`markPair`);

markFrontBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('FRONT')");
};
markBackBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('BACK')");
};

markLeftBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('LEFT')");
};
markRightBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('RIGHT')");
};

markNameBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('NAME',false)");
};
markNumberBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('NUMBER',false)");
};
markDynamicBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('DYN')");
};
markPairBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('PAIR')");
};

markCollarBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('CLR_FSZ')");
};
markNeckBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('NCK_FSZ')");
};
markBodyBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('BODY')");
};
markPlacketBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('PLK_FSZ')");
};
markShortSlvBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('S_SLV')");
};
markLongSlvBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('L_SLV')");
};
markShortRIBBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('S_SLV_RIB_FSZ')");
};
markLongRIBBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('L_SLV_RIB_FSZ')");
};
markShortPantBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('S_PANT_FSZ')");
};
markLongPantBtn.onclick = () => {
  csInterface.evalScript("Organizer.objectMarkByName('L_PANT_FSZ')");
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
