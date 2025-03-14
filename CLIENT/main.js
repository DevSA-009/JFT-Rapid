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


const babyBtn = selectElementById("babyButton");
const mensBtn = selectElementById("mensButton");
const orgColRow = selectElementById("orgColRow");

/**
 * 
 * @param {HTMLElement} htmlElement 
 * @param {...string} className 
 */
const removeClass = (htmlElement,...className) => {
    htmlElement.classList.remove(...className)
};
/**
 * 
 * @param {HTMLElement} htmlElement 
 * @param {...string} className 
 */
const addClass = (htmlElement,...className) => {
    htmlElement.classList.add(...className)
};

const adbIlstBtnActCls = "adb-ilst-btn--active";

// JavaScript to control button actions
babyBtn.onclick = function () {
    removeClass(mensBtn, adbIlstBtnActCls);
    addClass(babyBtn,adbIlstBtnActCls);
    showBabyChildButtons();
};

mensBtn.onclick = function () {
    removeClass(babyBtn, adbIlstBtnActCls);
    addClass(mensBtn, adbIlstBtnActCls);
    showMensChildButtons();
};

orgColRow.onclick = testExtendScript;

// Function to show Baby child buttons
function showBabyChildButtons() {
    const babyItems = [4, 6, 10, 12, 14, 16];
    const childButtonsContainer = document.getElementById("childButtonsContainer");
    childButtonsContainer.innerHTML = ''; // Clear any previous child buttons

    // Create child buttons for Baby items
    babyItems.forEach(function (item) {
        const button = document.createElement('button');
        button.textContent = `${item}`;
        button.classList.add('adb-ilst-btn');
        childButtonsContainer.appendChild(button);
    });
}

// Function to show Mens child buttons
function showMensChildButtons() {
    const mensSizes = ["S", "M", "L", "XL", "2XL", "3XL"];
    const childButtonsContainer = document.getElementById("childButtonsContainer");
    childButtonsContainer.innerHTML = ''; // Clear any previous child buttons

    // Create child buttons for Mens sizes
    mensSizes.forEach(function (size) {
        const button = document.createElement('button');
        button.textContent = `${size}`;
        button.classList.add('adb-ilst-btn');
        childButtonsContainer.appendChild(button);
    });
}

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
function testExtendScript() {
    csInterface.evalScript("run(orgDialogRoot)");
}