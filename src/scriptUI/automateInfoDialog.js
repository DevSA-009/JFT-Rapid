/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":16,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":"dialogRoot","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"Automate NAME/NUMBER","preferredSize":[0,0],"margins":16,"orientation":"column","spacing":0,"alignChildren":["center","center"]}},"item-2":{"id":2,"type":"Panel","parentId":23,"style":{"enabled":true,"varName":"basicPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Basic","preferredSize":[200,250],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-3":{"id":3,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"orientationGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":"center"}},"item-4":{"id":4,"type":"StaticText","parentId":3,"style":{"enabled":true,"varName":"orientationLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Orientation:","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-5":{"id":5,"type":"DropDownList","parentId":3,"style":{"enabled":true,"varName":"orientationDropdown","text":"DropDownList","listItems":"Auto, Vertical, Horizontal","preferredSize":[70,10],"alignment":"center","selection":0,"helpTip":null}},"item-9":{"id":9,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"perDocColsGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-10":{"id":10,"type":"StaticText","parentId":9,"style":{"enabled":true,"varName":"perDocColsLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Per Doc Cols","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-11":{"id":11,"type":"EditText","parentId":9,"style":{"enabled":true,"varName":"perDocColsInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"0","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}},"item-15":{"id":15,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"distributeItemsGapGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-16":{"id":16,"type":"StaticText","parentId":15,"style":{"enabled":true,"varName":"distributeItemsGapLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Dist. Items Gap","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-17":{"id":17,"type":"EditText","parentId":15,"style":{"enabled":true,"varName":"distributeItemsGapInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"0.1","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}},"item-18":{"id":18,"type":"Panel","parentId":23,"style":{"enabled":true,"varName":"requiredPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Data","preferredSize":[200,250],"margins":10,"orientation":"column","spacing":10,"alignChildren":["center","top"],"alignment":null}},"item-23":{"id":23,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"panelContGrp","preferredSize":[0,0],"margins":[0,0,10,0],"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-24":{"id":24,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"enterBtnGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-25":{"id":25,"type":"Button","parentId":24,"style":{"enabled":true,"varName":"enterActionBtn","text":"Start","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"Start Action"}},"item-29":{"id":29,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"jsonDataGrp","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-30":{"id":30,"type":"StaticText","parentId":29,"style":{"enabled":true,"varName":"jsonDataLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"JSON Data","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"the data that will apply!"}},"item-31":{"id":31,"type":"EditText","parentId":29,"style":{"enabled":true,"varName":"jsonDataInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"","justify":"center","preferredSize":[127,50],"alignment":null,"helpTip":"data should be json format"}},"item-32":{"id":32,"type":"Group","parentId":49,"style":{"enabled":true,"varName":"actionEngineThreadGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-35":{"id":35,"type":"Checkbox","parentId":32,"style":{"enabled":true,"varName":"actionEngineThreadCheckBox","text":"Action Thread","preferredSize":[0,0],"alignment":null,"helpTip":"when true script for transformation happend engine base","checked":true}},"item-36":{"id":36,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"sizeBrandGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":"center"}},"item-37":{"id":37,"type":"StaticText","parentId":36,"style":{"enabled":true,"varName":"sizeBrandLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Size Brand","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-38":{"id":38,"type":"DropDownList","parentId":36,"style":{"enabled":true,"varName":"sizeBrandListDropdown","text":"DropDownList","listItems":"A,B,C","preferredSize":[70,10],"alignment":"center","selection":0,"helpTip":null}},"item-39":{"id":39,"type":"Group","parentId":48,"style":{"enabled":true,"varName":"createOutlineGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-40":{"id":40,"type":"Checkbox","parentId":39,"style":{"enabled":true,"varName":"createOutlineCheckBox","text":"Text Outline","preferredSize":[0,0],"alignment":null,"helpTip":"NANO text convert to shape","checked":true}},"item-43":{"id":43,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"paperWidthGrp","preferredSize":[100,0],"margins":0,"orientation":"column","spacing":5,"alignChildren":["center","center"],"alignment":null}},"item-44":{"id":44,"type":"StaticText","parentId":43,"style":{"enabled":true,"varName":"paperWidthLabel","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Paper Width","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":"paper width in inch"}},"item-45":{"id":45,"type":"EditText","parentId":43,"style":{"enabled":true,"varName":"paperWidthInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"63.3","justify":"center","preferredSize":[70,0],"alignment":null,"helpTip":null}},"item-46":{"id":46,"type":"Group","parentId":48,"style":{"enabled":false,"varName":"wrapTextGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-47":{"id":47,"type":"Checkbox","parentId":46,"style":{"enabled":false,"varName":"wrapTextCheckBox","text":"Curve Text","preferredSize":[0,0],"alignment":null,"helpTip":"handle properly transform opacity mask item","checked":false}},"item-48":{"id":48,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"textManipulateGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-49":{"id":49,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"engineManipulate","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-50":{"id":50,"type":"Group","parentId":49,"style":{"enabled":true,"varName":"rangeGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":null}},"item-51":{"id":51,"type":"Checkbox","parentId":50,"style":{"enabled":true,"varName":"rangeCheckBox","text":"Range","preferredSize":[0,0],"alignment":null,"helpTip":"when true script for transformation happend engine base","checked":true}}},"order":[0,23,2,43,44,45,3,4,5,9,10,11,15,16,17,18,29,30,31,36,37,38,48,39,40,46,47,49,32,35,50,51,24,25],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

// DIALOGROOT
// ==========
const automateInfoDialog = () => {
  try {
    Organizer.checkDocument();

    // DIALOGROOT
    // ==========
    const dialogRoot = new Window("dialog");
    dialogRoot.text = "Automate NAME/NUMBER";
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

    // BASICPANEL
    // ==========
    const basicPanel = panelContGrp.add("panel", undefined, undefined, {
      name: "basicPanel",
    });
    basicPanel.text = "Basic";
    basicPanel.preferredSize.width = 200;
    basicPanel.preferredSize.height = 250;
    basicPanel.orientation = "column";
    basicPanel.alignChildren = ["center", "top"];
    basicPanel.spacing = 10;
    basicPanel.margins = 10;

    // PAPERWIDTHGRP
    // =============
    const paperWidthGrp = basicPanel.add("group", undefined, {
      name: "paperWidthGrp",
    });
    paperWidthGrp.preferredSize.width = 100;
    paperWidthGrp.orientation = "column";
    paperWidthGrp.alignChildren = ["center", "center"];
    paperWidthGrp.spacing = 5;
    paperWidthGrp.margins = 0;

    const paperWidthLabel = paperWidthGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "paperWidthLabel" },
    );
    paperWidthLabel.helpTip = "paper width in inch";
    paperWidthLabel.text = "Paper Width";
    paperWidthLabel.justify = "center";

    const paperWidthInput = paperWidthGrp.add(
      'edittext {justify: "center", properties: {name: "paperWidthInput"}}',
    );
    paperWidthInput.text = "63.3";
    paperWidthInput.preferredSize.width = 70;

    // ORIENTATIONGRP
    // ==============
    const orientationGrp = basicPanel.add("group", undefined, {
      name: "orientationGrp",
    });
    orientationGrp.preferredSize.width = 100;
    orientationGrp.orientation = "column";
    orientationGrp.alignChildren = ["center", "center"];
    orientationGrp.spacing = 5;
    orientationGrp.margins = 0;
    orientationGrp.alignment = ["center", "top"];

    const orientationLabel = orientationGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "orientationLabel" },
    );
    orientationLabel.text = "Orientation:";
    orientationLabel.justify = "center";
    const orientationDropdown = orientationGrp.add(
      "dropdownlist",
      undefined,
      undefined,
      { name: "orientationDropdown" },
    );
    orientationDropdown.selection = 0;
    orientationDropdown.preferredSize.width = 70;
    orientationDropdown.preferredSize.height = 10;
    orientationDropdown.alignment = ["center", "center"];

    // PERDOCCOLSGRP
    // =============
    const perDocColsGrp = basicPanel.add("group", undefined, {
      name: "perDocColsGrp",
    });
    perDocColsGrp.preferredSize.width = 100;
    perDocColsGrp.orientation = "column";
    perDocColsGrp.alignChildren = ["center", "center"];
    perDocColsGrp.spacing = 5;
    perDocColsGrp.margins = 0;

    const perDocColsLabel = perDocColsGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "perDocColsLabel" },
    );
    perDocColsLabel.text = "Per Doc Cols";
    perDocColsLabel.justify = "center";

    const perDocColsInput = perDocColsGrp.add(
      'edittext {justify: "center", properties: {name: "perDocColsInput"}}',
    );
    perDocColsInput.text = "0";
    perDocColsInput.preferredSize.width = 70;

    // DISTRIBUTEITEMSGAPGRP
    // =====================
    const distributeItemsGapGrp = basicPanel.add("group", undefined, {
      name: "distributeItemsGapGrp",
    });
    distributeItemsGapGrp.preferredSize.width = 100;
    distributeItemsGapGrp.orientation = "column";
    distributeItemsGapGrp.alignChildren = ["center", "center"];
    distributeItemsGapGrp.spacing = 5;
    distributeItemsGapGrp.margins = 0;

    const distributeItemsGapLabel = distributeItemsGapGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "distributeItemsGapLabel" },
    );
    distributeItemsGapLabel.text = "Dist. Items Gap";
    distributeItemsGapLabel.justify = "center";

    const distributeItemsGapInput = distributeItemsGapGrp.add(
      'edittext {justify: "center", properties: {name: "distributeItemsGapInput"}}',
    );
    distributeItemsGapInput.text = "0.1";
    distributeItemsGapInput.preferredSize.width = 70;

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

    // JSONDATAGRP
    // ===========
    const jsonDataGrp = requiredPanel.add("group", undefined, {
      name: "jsonDataGrp",
    });
    jsonDataGrp.orientation = "column";
    jsonDataGrp.alignChildren = ["center", "center"];
    jsonDataGrp.spacing = 5;
    jsonDataGrp.margins = 0;

    const jsonDataLabel = jsonDataGrp.add("statictext", undefined, undefined, {
      name: "jsonDataLabel",
    });
    jsonDataLabel.helpTip = "the data that will apply!";
    jsonDataLabel.text = "JSON Data";
    jsonDataLabel.justify = "center";

    const jsonDataInput = jsonDataGrp.add(
      'edittext {justify: "center", properties: {name: "jsonDataInput"}}',
    );
    jsonDataInput.helpTip = "data should be json format";
    jsonDataInput.preferredSize.width = 127;
    jsonDataInput.preferredSize.height = 50;

    // SIZEBRANDGRP
    // ============
    const sizeBrandGrp = requiredPanel.add("group", undefined, {
      name: "sizeBrandGrp",
    });
    sizeBrandGrp.preferredSize.width = 100;
    sizeBrandGrp.orientation = "column";
    sizeBrandGrp.alignChildren = ["center", "center"];
    sizeBrandGrp.spacing = 5;
    sizeBrandGrp.margins = 0;
    sizeBrandGrp.alignment = ["center", "top"];

    const sizeBrandLabel = sizeBrandGrp.add(
      "statictext",
      undefined,
      undefined,
      { name: "sizeBrandLabel" },
    );
    sizeBrandLabel.text = "Size Brand";
    sizeBrandLabel.justify = "center";

    const sizeBrandListDropdown = sizeBrandGrp.add(
      "dropdownlist",
      undefined,
      undefined,
      { name: "sizeBrandListDropdown" },
    );
    sizeBrandListDropdown.selection = 0;
    sizeBrandListDropdown.preferredSize.width = 70;
    sizeBrandListDropdown.preferredSize.height = 10;
    sizeBrandListDropdown.alignment = ["center", "center"];

    // TEXTMANIPULATEGRP
    // =================
    const textManipulateGrp = requiredPanel.add("group", undefined, {
      name: "textManipulateGrp",
    });
    textManipulateGrp.orientation = "row";
    textManipulateGrp.alignChildren = ["left", "center"];
    textManipulateGrp.spacing = 10;
    textManipulateGrp.margins = 0;

    // CREATEOUTLINEGRP
    // ================
    const createOutlineGrp = textManipulateGrp.add("group", undefined, {
      name: "createOutlineGrp",
    });
    createOutlineGrp.orientation = "row";
    createOutlineGrp.alignChildren = ["left", "center"];
    createOutlineGrp.spacing = 10;
    createOutlineGrp.margins = 0;

    const createOutlineCheckBox = createOutlineGrp.add(
      "checkbox",
      undefined,
      undefined,
      { name: "createOutlineCheckBox" },
    );
    createOutlineCheckBox.helpTip = "NANO text convert to shape";
    createOutlineCheckBox.text = "Text Outline";
    createOutlineCheckBox.value = true;

    // WRAPTEXTGRP
    // ===========
    const wrapTextGrp = textManipulateGrp.add("group", undefined, {
      name: "wrapTextGrp",
    });
    wrapTextGrp.enabled = false;
    wrapTextGrp.orientation = "row";
    wrapTextGrp.alignChildren = ["left", "center"];
    wrapTextGrp.spacing = 10;
    wrapTextGrp.margins = 0;

    const wrapTextCheckBox = wrapTextGrp.add("checkbox", undefined, undefined, {
      name: "wrapTextCheckBox",
    });
    wrapTextCheckBox.enabled = false;
    wrapTextCheckBox.helpTip = "handle properly transform opacity mask item";
    wrapTextCheckBox.text = "Curve Text";

    // ENGINEMANIPULATE
    // ================
    const engineManipulate = requiredPanel.add("group", undefined, {
      name: "engineManipulate",
    });
    engineManipulate.orientation = "row";
    engineManipulate.alignChildren = ["left", "center"];
    engineManipulate.spacing = 10;
    engineManipulate.margins = 0;

    // ACTIONENGINETHREADGRP
    // =====================
    const actionEngineThreadGrp = engineManipulate.add("group", undefined, {
      name: "actionEngineThreadGrp",
    });
    actionEngineThreadGrp.orientation = "row";
    actionEngineThreadGrp.alignChildren = ["left", "center"];
    actionEngineThreadGrp.spacing = 10;
    actionEngineThreadGrp.margins = 0;

    const actionEngineThreadCheckBox = actionEngineThreadGrp.add(
      "checkbox",
      undefined,
      undefined,
      { name: "actionEngineThreadCheckBox" },
    );
    actionEngineThreadCheckBox.helpTip =
      "when true script for transformation happend engine base";
    actionEngineThreadCheckBox.text = "Action Thread";
    actionEngineThreadCheckBox.value = false;

    // RANGEGRP
    // ========
    const rangeGrp = engineManipulate.add("group", undefined, {
      name: "rangeGrp",
    });
    rangeGrp.orientation = "row";
    rangeGrp.alignChildren = ["left", "center"];
    rangeGrp.spacing = 10;
    rangeGrp.margins = 0;

    const rangeCheckBox = rangeGrp.add("checkbox", undefined, undefined, {
      name: "rangeCheckBox",
    });
    rangeCheckBox.helpTip =
      "when true script for transformation happend engine base";
    rangeCheckBox.text = "Range";
    rangeCheckBox.value = true;

    // ENTERBTNGRP
    // ===========
    const enterBtnGrp = dialogRoot.add("group", undefined, {
      name: "enterBtnGrp",
    });
    enterBtnGrp.orientation = "row";
    enterBtnGrp.alignChildren = ["left", "center"];
    enterBtnGrp.spacing = 10;
    enterBtnGrp.margins = 0;

    const enterActionBtn = enterBtnGrp.add("button", undefined, "Start", {
      name: "ok",
    });
    enterActionBtn.helpTip = "Start Action";

    // ITEM REFERENCE LIST ( Info: http://jongware.mit.edu/Sui/index_1.html )
    dialogRoot.items = {
      dialogRoot: dialogRoot, // dialog
      panelContGrp: panelContGrp, // group
      basicPanel: basicPanel, // panel
      paperWidthGrp: paperWidthGrp, // group
      paperWidthLabel: paperWidthLabel, // statictext
      paperWidthInput: paperWidthInput, // edittext
      orientationGrp: orientationGrp, // group
      orientationLabel: orientationLabel, // statictext
      orientationDropdown: orientationDropdown, // dropdownlist
      perDocColsGrp: perDocColsGrp, // group
      perDocColsLabel: perDocColsLabel, // statictext
      perDocColsInput: perDocColsInput, // edittext
      distributeItemsGapGrp: distributeItemsGapGrp, // group
      distributeItemsGapLabel: distributeItemsGapLabel, // statictext
      distributeItemsGapInput: distributeItemsGapInput, // edittext
      requiredPanel: requiredPanel, // panel
      jsonDataGrp: jsonDataGrp, // group
      jsonDataLabel: jsonDataLabel, // statictext
      jsonDataInput: jsonDataInput, // edittext
      sizeBrandGrp: sizeBrandGrp, // group
      sizeBrandLabel: sizeBrandLabel, // statictext
      sizeBrandListDropdown: sizeBrandListDropdown, // dropdownlist
      textManipulateGrp: textManipulateGrp, // group
      createOutlineGrp: createOutlineGrp, // group
      createOutlineCheckBox: createOutlineCheckBox, // checkbox
      wrapTextGrp: wrapTextGrp, // group
      wrapTextCheckBox: wrapTextCheckBox, // checkbox
      engineManipulate: engineManipulate, // group
      actionEngineThreadGrp: actionEngineThreadGrp, // group
      actionEngineThreadCheckBox: actionEngineThreadCheckBox, // checkbox
      rangeGrp: rangeGrp, // group
      rangeCheckBox: rangeCheckBox, // checkbox
      enterBtnGrp: enterBtnGrp, // group
      enterActionBtn: enterActionBtn, // button
    };
    dialogRoot.itemsArray = [
      dialogRoot,
      panelContGrp,
      basicPanel,
      paperWidthGrp,
      paperWidthLabel,
      paperWidthInput,
      orientationGrp,
      orientationLabel,
      orientationDropdown,
      perDocColsGrp,
      perDocColsLabel,
      perDocColsInput,
      distributeItemsGapGrp,
      distributeItemsGapLabel,
      distributeItemsGapInput,
      requiredPanel,
      jsonDataGrp,
      jsonDataLabel,
      jsonDataInput,
      sizeBrandGrp,
      sizeBrandLabel,
      sizeBrandListDropdown,
      textManipulateGrp,
      createOutlineGrp,
      createOutlineCheckBox,
      wrapTextGrp,
      wrapTextCheckBox,
      engineManipulate,
      actionEngineThreadGrp,
      actionEngineThreadCheckBox,
      rangeGrp,
      rangeCheckBox,
      enterBtnGrp,
      enterActionBtn,
    ];

    /* Apply field dynamic value start */

    const orientations_array = Object.keys(StackOrientations);
    orientations_array.forEach((e) => {
      orientationDropdown.add("item", e);
    });
    orientationDropdown.selection = 0;

    const brandList_array = Object.keys(JFT_CONF.sizes);
    brandList_array.forEach((e) => {
      sizeBrandListDropdown.add("item", e);
    });
    const currentBrand = CONFIG.BRAND;
    sizeBrandListDropdown.selection = brandList_array.indexOf(currentBrand);

    /* Apply field dynamic value end */

    // ====================================

    // ====================================

    /* Event callback functions start */

    const digitValidateCb = (event) => {
      const key = event.keyName; // Note: using 'key' instead of 'keyName' which is more standard

      if (event.keyName === "Escape") {
        dialogRoot.close();
        return;
      }

      // Allow numbers, backspace, delete, and decimal point
      // Also prevent multiple decimal points
      if (!/[0-9]/.test(key) && key !== "Backspace" && key !== "Delete") {
        event.preventDefault();
      }

      if (key === "Enter") {
        enterActionBtn.notify();
      }
    };

    function fixMultipleDots(str) {
      const parts = str.split(".");
      if (parts.length <= 2) {
        return parseFloat(str); // Already a valid float
      }

      // Join only the first two parts to make a valid float
      const fixedStr = parts[0] + "." + parts[1];
      return parseFloat(fixedStr);
    }

    /* Event callback functions end */

    // ====================================

    /* Attach event listener callback functions start */

    perDocColsInput.addEventListener("keydown", digitValidateCb);

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
        enterActionBtn.notify();
      }
    });

    distributeItemsGapInput.addEventListener("keydown", (event) => {
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
        enterActionBtn.notify();
      }
    });

    enterActionBtn.onClick = () => {
      dialogRoot.close();

      const orientationVal = orientationDropdown.selection.text.toLowerCase();

      const perDocColsVal = perDocColsInput.text
        ? parseInt(perDocColsInput.text)
        : 0;

      const paperWidthVal = paperWidthInput.text
        ? fixMultipleDots(paperWidthInput.text)
        : 63.25;

      const distItemGapVal = distributeItemsGapInput.text
        ? fixMultipleDots(distributeItemsGapInput.text)
        : 0;

      const brandVal = sizeBrandListDropdown.selection.text;

      const actionEngineThreadVal = actionEngineThreadCheckBox.value;

      const createOutlineval = createOutlineCheckBox.value;

      const wrapTextVal = wrapTextCheckBox.value;

      const rangeVal = rangeCheckBox.value;

      CONFIG.DIST_ITEMS_GAP = distItemGapVal;
      CONFIG.PAPER_MAX_SIZE = paperWidthVal;
      CONFIG.BRAND = brandVal;
      CONFIG.PER_DOC = perDocColsVal;
      CONFIG.ORIENTATION = orientationVal;
      CONFIG.OUTLINE_TEXT = createOutlineval;
      CONFIG.THREAD_ENGINE = actionEngineThreadVal ? "action" : "script";
      CONFIG.DIMENSION_RANGE = rangeVal;
      dialogRoot.close(1); // success signal
    };

    /* Attach event listener callback functions end */

    // Show dialog and act on result
    const result = dialogRoot.show();

    if (result === 1) {
      const dataVal = jsonDataInput.text;

      if (typeof dataVal === "string") {
        jftProcessSeqWrapper(dataVal);
        return;
      }

      if (!dataVal) {
        throw new Error(`Invalid JSON data type`);
      }

      jftProcessSeqWrapper(dataVal);
    }
  } catch (error) {
    alertDialogSA(error.message);
  }
};
