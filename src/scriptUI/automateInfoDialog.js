/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":31,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":"dialogRoot","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"Automate NO/NA","preferredSize":[0,0],"margins":16,"orientation":"column","spacing":0,"alignChildren":["center","center"]}},"item-2":{"id":2,"type":"Panel","parentId":23,"style":{"enabled":true,"varName":"orgBody","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Basic","preferredSize":[200,250],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-3":{"id":3,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"orientationGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":"center"}},"item-4":{"id":4,"type":"StaticText","parentId":3,"style":{"enabled":true,"varName":"orgOrientation","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Orientation:","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-5":{"id":5,"type":"DropDownList","parentId":3,"style":{"enabled":true,"varName":"orientations","text":"DropDownList","listItems":"Auto, Vertical, Horizontal","preferredSize":[70,10],"alignment":"center","selection":0,"helpTip":null}},"item-9":{"id":9,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"perDocGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-10":{"id":10,"type":"StaticText","parentId":9,"style":{"enabled":true,"varName":"perDoc","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Per Doc Row","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-11":{"id":11,"type":"EditText","parentId":9,"style":{"enabled":true,"varName":"perDocField","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"0","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}},"item-15":{"id":15,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"itemsGap","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-16":{"id":16,"type":"StaticText","parentId":15,"style":{"enabled":true,"varName":"itemsGap","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Items Gap","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-17":{"id":17,"type":"EditText","parentId":15,"style":{"enabled":true,"varName":"itemsGapField","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"0.1","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}},"item-18":{"id":18,"type":"Panel","parentId":23,"style":{"enabled":true,"varName":"requiredPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Data","preferredSize":[200,250],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-23":{"id":23,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"panelContGrp","preferredSize":[0,0],"margins":[0,0,10,0],"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-24":{"id":24,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"enterBtnGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-25":{"id":25,"type":"Button","parentId":24,"style":{"enabled":true,"varName":"enterBn","text":"Start","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"Start Action"}},"item-29":{"id":29,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"nanoDataGrp","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-30":{"id":30,"type":"StaticText","parentId":29,"style":{"enabled":true,"varName":"nanoData","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"NA/NO Data","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"the data that will apply!"}},"item-31":{"id":31,"type":"EditText","parentId":29,"style":{"enabled":true,"varName":"nanoDataField","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"","justify":"center","preferredSize":[127,50],"alignment":null,"helpTip":"data should be json format"}},"item-32":{"id":32,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"kidsInVOrientGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-35":{"id":35,"type":"Checkbox","parentId":32,"style":{"enabled":true,"varName":"kidsInVCheckBox","text":"KidsInV","preferredSize":[0,0],"alignment":null,"helpTip":"kids size should be V orientation","checked":true}},"item-36":{"id":36,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"sizeContGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":"center"}},"item-37":{"id":37,"type":"StaticText","parentId":36,"style":{"enabled":true,"varName":"sizeContainer","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Size Container","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-38":{"id":38,"type":"DropDownList","parentId":36,"style":{"enabled":true,"varName":"sizeContainerList","text":"DropDownList","listItems":"A,B,C","preferredSize":[70,10],"alignment":"center","selection":0,"helpTip":null}},"item-39":{"id":39,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"outlineNANOGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-40":{"id":40,"type":"Checkbox","parentId":39,"style":{"enabled":true,"varName":"outlineNANOCheckBox","text":"Outline NANO","preferredSize":[0,0],"alignment":null,"helpTip":"NANO text convert to shape","checked":false}},"item-41":{"id":41,"type":"Group","parentId":18,"style":{"enabled":false,"varName":"opacityMaskGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-42":{"id":42,"type":"Checkbox","parentId":41,"style":{"enabled":true,"varName":"opacityMaskCheckBox","text":"Opacity Mask","preferredSize":[0,0],"alignment":null,"helpTip":"handle properly transform opacity mask item","checked":false}},"item-43":{"id":43,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"paperWidthGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-44":{"id":44,"type":"StaticText","parentId":43,"style":{"enabled":true,"varName":"paperWidthTextField","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Paper Max Width","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"paper max width in inch"}},"item-45":{"id":45,"type":"EditText","parentId":43,"style":{"enabled":true,"varName":"paperWidthInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"63.3","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}}},"order":[0,23,2,43,44,45,3,4,5,9,10,11,15,16,17,18,29,30,31,36,37,38,32,35,39,40,41,42,24,25],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

// DIALOGROOT
// ==========
const automateInfoDialog = () => {
  try {
    // DIALOGROOT
    // ==========
    const dialogRoot = new Window("dialog");
    dialogRoot.text = "Automate NO/NA";
    dialogRoot.orientation = "column";
    dialogRoot.alignChildren = ["center", "center"];
    dialogRoot.spacing = 0;
    dialogRoot.margins = 16;

    // PANELCONTGRP
    // ============
    const panelContGrp = dialogRoot.add("group", undefined, {
      name: "panelContGrp",
    });
    panelContGrp.orientation = "row";
    panelContGrp.alignChildren = ["center", "center"];
    panelContGrp.spacing = 10;
    panelContGrp.margins = [0, 0, 0, 10];

    // ORGBODY
    // =======
    const orgBody = panelContGrp.add("panel", undefined, undefined, {
      name: "orgBody",
    });
    orgBody.text = "Basic";
    orgBody.preferredSize.width = 200;
    orgBody.preferredSize.height = 250;
    orgBody.orientation = "column";
    orgBody.alignChildren = ["center", "top"];
    orgBody.spacing = 10;
    orgBody.margins = 10;

    // PAPERWIDTHGRP
    // =============
    const paperWidthGrp = orgBody.add("group", undefined, {
      name: "paperWidthGrp",
    });
    paperWidthGrp.preferredSize.width = 100;
    paperWidthGrp.orientation = "column";
    paperWidthGrp.alignChildren = ["center", "center"];
    paperWidthGrp.spacing = 5;
    paperWidthGrp.margins = 0;

    const paperWidthTextField = paperWidthGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "paperWidthTextField" },
    );
    paperWidthTextField.helpTip = "paper max width in inch";
    paperWidthTextField.text = "Paper Max Width";
    paperWidthTextField.justify = "center";

    const paperWidthInput = paperWidthGrp.add(
      'edittext {justify: "center", properties: {name: "paperWidthInput"}}',
    );
    const paperMaxWidth = CONFIG.Persist_Config.config.paperMaxWidth;
    paperWidthInput.text = paperMaxWidth || 63.25;
    paperWidthInput.preferredSize.width = 70;

    // ORIENTATIONGRP
    // ==============
    const orientationGrp = orgBody.add("group", undefined, {
      name: "orientationGrp",
    });
    orientationGrp.preferredSize.width = 100;
    orientationGrp.orientation = "column";
    orientationGrp.alignChildren = ["center", "center"];
    orientationGrp.spacing = 5;
    orientationGrp.margins = 0;
    orientationGrp.alignment = ["center", "top"];

    const orgOrientation = orientationGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "orgOrientation" },
    );
    orgOrientation.text = "Orientation:";
    orgOrientation.justify = "center";

    const orientations = orientationGrp.add(
      "dropdownlist",
      undefined,
      undefined,
      { name: "orientations", items: orientations_array },
    );
    orientations.selection = 0;
    orientations.preferredSize.width = 70;
    orientations.preferredSize.height = 10;
    orientations.alignment = ["center", "center"];

    // PERDOCGRP
    // =========
    const perDocGrp = orgBody.add("group", undefined, { name: "perDocGrp" });
    perDocGrp.preferredSize.width = 100;
    perDocGrp.orientation = "column";
    perDocGrp.alignChildren = ["center", "center"];
    perDocGrp.spacing = 5;
    perDocGrp.margins = 0;

    const perDoc = perDocGrp.add("statictext", undefined, undefined, {
      name: "perDoc",
    });
    perDoc.text = "Per Doc Row";
    perDoc.justify = "center";

    const perDocField = perDocGrp.add(
      'edittext {justify: "center", properties: {name: "perDocField"}}',
    );
    perDocField.text = "0";
    perDocField.preferredSize.width = 70;

    // ITEMSGAP
    // ========
    const itemsGap = orgBody.add("group", undefined, { name: "itemsGap" });
    itemsGap.preferredSize.width = 100;
    itemsGap.orientation = "column";
    itemsGap.alignChildren = ["center", "center"];
    itemsGap.spacing = 5;
    itemsGap.margins = 0;

    const itemsGap1 = itemsGap.add("statictext", undefined, undefined, {
      name: "itemsGap1",
    });
    itemsGap1.text = "Items Gap";
    itemsGap1.justify = "center";

    const itemsGapField = itemsGap.add(
      'edittext {justify: "center", properties: {name: "itemsGapField"}}',
    );
    itemsGapField.text = "0.1";
    itemsGapField.preferredSize.width = 70;

    // REQUIREDPANEL
    // =============
    const requiredPanel = panelContGrp.add("panel", undefined, undefined, {
      name: "requiredPanel",
    });
    requiredPanel.text = "Data";
    requiredPanel.preferredSize.width = 200;
    requiredPanel.preferredSize.height = 250;
    requiredPanel.orientation = "column";
    requiredPanel.alignChildren = ["center", "top"];
    requiredPanel.spacing = 10;
    requiredPanel.margins = 10;

    // NANODATAGRP
    // ===========
    const nanoDataGrp = requiredPanel.add("group", undefined, {
      name: "nanoDataGrp",
    });
    nanoDataGrp.orientation = "column";
    nanoDataGrp.alignChildren = ["center", "center"];
    nanoDataGrp.spacing = 5;
    nanoDataGrp.margins = 0;

    const nanoData = nanoDataGrp.add("statictext", undefined, undefined, {
      name: "nanoData",
    });
    nanoData.helpTip = "the data that will apply!";
    nanoData.text = "NA/NO Data";
    nanoData.justify = "center";

    const nanoDataField = nanoDataGrp.add(
      'edittext {justify: "center", properties: {name: "nanoDataField"}}',
    );
    nanoDataField.helpTip = "data should be json format";
    nanoDataField.preferredSize.width = 127;
    nanoDataField.preferredSize.height = 50;

    // SIZECONTGRP
    // ===========
    const sizeContGrp = requiredPanel.add("group", undefined, {
      name: "sizeContGrp",
    });
    sizeContGrp.preferredSize.width = 100;
    sizeContGrp.orientation = "column";
    sizeContGrp.alignChildren = ["center", "center"];
    sizeContGrp.spacing = 5;
    sizeContGrp.margins = 0;
    sizeContGrp.alignment = ["center", "top"];

    const sizeContainer = sizeContGrp.add("statictext", undefined, undefined, {
      name: "sizeContainer",
    });
    sizeContainer.text = "Size Container";
    sizeContainer.justify = "center";

    const sizeContainerList = sizeContGrp.add(
      "dropdownlist",
      undefined,
      undefined,
      { name: "sizeContainerList", items: sizeContainerList_array },
    );
    sizeContainerList.selection = 0;
    sizeContainerList.preferredSize.width = 70;
    sizeContainerList.preferredSize.height = 10;
    sizeContainerList.alignment = ["center", "center"];

    // KIDSINVORIENTGRP
    // ================
    const kidsInVOrientGrp = requiredPanel.add("group", undefined, {
      name: "kidsInVOrientGrp",
    });
    kidsInVOrientGrp.orientation = "row";
    kidsInVOrientGrp.alignChildren = ["left", "center"];
    kidsInVOrientGrp.spacing = 10;
    kidsInVOrientGrp.margins = 0;

    const kidsInVCheckBox = kidsInVOrientGrp.add(
      "checkbox",
      undefined,
      undefined,
      { name: "kidsInVCheckBox" },
    );
    kidsInVCheckBox.helpTip = "kids size should be V orientation";
    kidsInVCheckBox.text = "KidsInV";
    kidsInVCheckBox.value = true;

    // OUTLINENANOGRP
    // ==============
    const outlineNANOGrp = requiredPanel.add("group", undefined, {
      name: "outlineNANOGrp",
    });
    outlineNANOGrp.orientation = "row";
    outlineNANOGrp.alignChildren = ["left", "center"];
    outlineNANOGrp.spacing = 10;
    outlineNANOGrp.margins = 0;

    const outlineNANOCheckBox = outlineNANOGrp.add(
      "checkbox",
      undefined,
      undefined,
      { name: "outlineNANOCheckBox" },
    );
    outlineNANOCheckBox.helpTip = "NANO text convert to shape";
    outlineNANOCheckBox.text = "Outline NANO";

    // OPACITYMASKGRP
    // ==============
    const opacityMaskGrp = requiredPanel.add("group", undefined, {
      name: "opacityMaskGrp",
    });
    opacityMaskGrp.enabled = false;
    opacityMaskGrp.orientation = "row";
    opacityMaskGrp.alignChildren = ["left", "center"];
    opacityMaskGrp.spacing = 10;
    opacityMaskGrp.margins = 0;

    const opacityMaskCheckBox = opacityMaskGrp.add(
      "checkbox",
      undefined,
      undefined,
      { name: "opacityMaskCheckBox" },
    );
    opacityMaskCheckBox.helpTip = "handle properly transform opacity mask item";
    opacityMaskCheckBox.text = "Opacity Mask";

    // ENTERBTNGRP
    // ===========
    const enterBtnGrp = dialogRoot.add("group", undefined, {
      name: "enterBtnGrp",
    });
    enterBtnGrp.orientation = "row";
    enterBtnGrp.alignChildren = ["left", "center"];
    enterBtnGrp.spacing = 10;
    enterBtnGrp.margins = 0;

    const enterBn = enterBtnGrp.add("button", undefined, undefined, {
      name: "enterBn",
    });
    enterBn.helpTip = "Start Action";
    enterBn.text = "Start";

    // ITEM REFERENCE LIST ( Info: http://jongware.mit.edu/Sui/index_1.html )
    dialogRoot.items = {
      dialogRoot: dialogRoot, // dialog
      panelContGrp: panelContGrp, // group
      orgBody: orgBody, // panel
      paperWidthGrp: paperWidthGrp, // group
      paperWidthTextField: paperWidthTextField, // statictext
      paperWidthInput: paperWidthInput, // edittext
      orientationGrp: orientationGrp, // group
      orgOrientation: orgOrientation, // statictext
      orientations: orientations, // dropdownlist
      perDocGrp: perDocGrp, // group
      perDoc: perDoc, // statictext
      perDocField: perDocField, // edittext
      itemsGap: itemsGap, // group
      itemsGap1: itemsGap1, // statictext
      itemsGapField: itemsGapField, // edittext
      requiredPanel: requiredPanel, // panel
      nanoDataGrp: nanoDataGrp, // group
      nanoData: nanoData, // statictext
      nanoDataField: nanoDataField, // edittext
      sizeContGrp: sizeContGrp, // group
      sizeContainer: sizeContainer, // statictext
      sizeContainerList: sizeContainerList, // dropdownlist
      kidsInVOrientGrp: kidsInVOrientGrp, // group
      kidsInVCheckBox: kidsInVCheckBox, // checkbox
      outlineNANOGrp: outlineNANOGrp, // group
      outlineNANOCheckBox: outlineNANOCheckBox, // checkbox
      opacityMaskGrp: opacityMaskGrp, // group
      opacityMaskCheckBox: opacityMaskCheckBox, // checkbox
      enterBtnGrp: enterBtnGrp, // group
      enterBn: enterBn, // button
    };
    dialogRoot.itemsArray = [
      dialogRoot,
      panelContGrp,
      orgBody,
      paperWidthGrp,
      paperWidthTextField,
      paperWidthInput,
      orientationGrp,
      orgOrientation,
      orientations,
      perDocGrp,
      perDoc,
      perDocField,
      itemsGap,
      itemsGap1,
      itemsGapField,
      requiredPanel,
      nanoDataGrp,
      nanoData,
      nanoDataField,
      sizeContGrp,
      sizeContainer,
      sizeContainerList,
      kidsInVOrientGrp,
      kidsInVCheckBox,
      outlineNANOGrp,
      outlineNANOCheckBox,
      opacityMaskGrp,
      opacityMaskCheckBox,
      enterBtnGrp,
      enterBn,
    ];

    /* Apply field dynamic value start */

    const orientations_array = ["Auto", ...ES6_SA.objectKeys(Orientation)];
    ES6_SA.arrayForEach(orientations_array, (e) => {
      orientations.add("item", e);
    });
    orientations.selection = 0;

    const sizeContainerList_array = ES6_SA.objectKeys(
      CONFIG.Persist_Config.sizes,
    );
    ES6_SA.arrayForEach(sizeContainerList_array, (e) => {
      sizeContainerList.add("item", e);
    });
    const currentSizeContainer = CONFIG.Persist_Config.config["sizeContainer"];
    sizeContainerList.selection = ES6_SA.arrayIndexOf(
      sizeContainerList_array,
      currentSizeContainer,
    );

    /* Apply field dynamic value end */

    // ====================================

    /* Get field input value start */

    const orientationVal = orientations.selection.text;

    const perDocVal = perDocField.text ? parseInt(perDocField.text) : 0;

    const paperMaxWidthVal = paperWidthInput.text
      ? fixMultipleDots(itemsGapField.text)
      : 63.25;

    const itemGapVal = itemsGapField.text
      ? fixMultipleDots(itemsGapField.text)
      : 0;

    const nanoDataVal = nanoDataField.text;

    const sizeContainerVal = sizeContainerList.selection.text;

    const kidsInVVal = kidsInVCheckBox.value;

    const outlineNanoVal = outlineNANOCheckBox.value;

    const opacityMaskVal = opacityMaskCheckBox.value;

    /* Get field input value end */

    // ====================================

    /* Event callback functions start */

    const digitValidateCb = (event) => {};

    function fixMultipleDots(str) {}

    /* Event callback functions end */

    // ====================================

    /* Attach event listener callback functions start */

    perDocField.addEventListener("keydown", digitValidateCb);

    paperWidthInput.addEventListener("keydown", (event) => {
      const key = event.keyName; // Note: using 'key' instead of 'keyName' which is more standard

      if (event.keyName === "Escape") {
        dialogRoot.close();
        return;
      }

      // Allow numbers, backspace, delete, and decimal point
      // Also prevent multiple decimal points
      if (
        !/[0-9]/.test(key) &&
        key !== "Backspace" &&
        key !== "Delete" &&
        key !== "Decimal" &&
        key !== "Period"
      ) {
        event.preventDefault();
      }
      if (key === "Enter") {
        enterBn.notify();
      }
    });

    itemsGapField.addEventListener("keydown", (event) => {
      const key = event.keyName; // Note: using 'key' instead of 'keyName' which is more standard

      if (event.keyName === "Escape") {
        dialogRoot.close();
        return;
      }

      // Allow numbers, backspace, delete, and decimal point
      // Also prevent multiple decimal points
      if (
        !/[0-9]/.test(key) &&
        key !== "Backspace" &&
        key !== "Delete" &&
        key !== "Decimal" &&
        key !== "Period"
      ) {
        event.preventDefault();
      }
      if (key === "Enter") {
        enterBn.notify();
      }
    });

    enterBn.onClick = () => {
      dialogRoot.close();

      CONFIG.Items_Gap = itemGapVal;
      CONFIG.PAPER_MAX_SIZE = paperMaxWidthVal;
      CONFIG.perDoc = perDocVal;
      CONFIG.orientation = orientationVal;
      CONFIG.kidsinV = kidsInVVal;
      CONFIG.outlineNANO = outlineNanoVal;
      CONFIG.opacityMask = opacityMaskVal;
      dialogRoot.close(1); // success signal
    };

    /* Attach event listener callback functions end */

    // Show dialog and act on result
    const result = dialogRoot.show();

    if (result === 1) {
    }
  } catch (error) {
    alertDialogSA(error.message);
  }
};
