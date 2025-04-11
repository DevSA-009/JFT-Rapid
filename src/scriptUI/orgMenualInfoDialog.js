
// DIALOGROOT
// ==========
const orgMenualInfoDialog = () => {
    const dialogRoot = new Window("dialog");
    dialogRoot.text = "ORG Body";
    dialogRoot.orientation = "column";
    dialogRoot.alignChildren = ["center", "center"];
    dialogRoot.spacing = 0;
    dialogRoot.margins = 16;

    const digitValidateCb = (event) => {
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
            key !== "Delete"
        ) {
            event.preventDefault();
        }

        if (key === "Enter") {
            enterBn.notify()
        }
    };

    // PANELCONTGRP
    // ============
    const panelContGrp = dialogRoot.add("group", undefined, { name: "panelContGrp" });
    panelContGrp.orientation = "row";
    panelContGrp.alignChildren = ["center", "center"];
    panelContGrp.spacing = 10;
    panelContGrp.margins = [0, 0, 0, 10];

    // ORGBODY
    // =======
    const orgBody = panelContGrp.add("panel", undefined, undefined, { name: "orgBody" });
    orgBody.text = "Basic";
    orgBody.preferredSize.width = 200;
    orgBody.orientation = "column";
    orgBody.alignChildren = ["center", "top"];
    orgBody.spacing = 10;
    orgBody.margins = 10;

    // MODEGRP
    // =======
    const modeGrp = orgBody.add("group", undefined, { name: "modeGrp" });
    modeGrp.preferredSize.width = 100;
    modeGrp.orientation = "column";
    modeGrp.alignChildren = ["center", "center"];
    modeGrp.spacing = 5;
    modeGrp.margins = 0;
    modeGrp.alignment = ["center", "top"];

    const orgMode = modeGrp.add("statictext", undefined, undefined, { name: "orgMode" });
    orgMode.text = "Mode:";
    orgMode.justify = "center";

    const orgModeList_array = objectKeys(OrgMode);
    const orgModeList = modeGrp.add("dropdownlist", undefined, undefined, { name: "orgModeList", items: orgModeList_array });
    orgModeList.selection = 0;
    orgModeList.preferredSize.width = 70;
    orgModeList.preferredSize.height = 10;
    orgModeList.alignment = ["center", "center"];

    // PERDOCGRP
    // =========
    const perDocGrp = orgBody.add("group", undefined, { name: "perDocGrp" });
    perDocGrp.preferredSize.width = 100;
    perDocGrp.orientation = "column";
    perDocGrp.alignChildren = ["center", "center"];
    perDocGrp.spacing = 5;
    perDocGrp.margins = 0;

    const perDoc = perDocGrp.add("statictext", undefined, undefined, { name: "perDoc" });
    perDoc.text = "Per Document";
    perDoc.justify = "center";

    const perDocField = perDocGrp.add('edittext {justify: "center", properties: {name: "perDocField"}}');
    perDocField.text = "0";
    perDocField.preferredSize.width = 70;

    perDocField.addEventListener("keydown", digitValidateCb);

    // ITEMSGAP
    // ========
    const itemsGap = orgBody.add("group", undefined, { name: "itemsGap" });
    itemsGap.preferredSize.width = 100;
    itemsGap.orientation = "column";
    itemsGap.alignChildren = ["center", "center"];
    itemsGap.spacing = 5;
    itemsGap.margins = 0;

    const itemsGap1 = itemsGap.add("statictext", undefined, undefined, { name: "itemsGap1" });
    itemsGap1.text = "Items Gap";
    itemsGap1.justify = "center";

    const itemsGapField = itemsGap.add('edittext {justify: "center", properties: {name: "itemsGapField"}}');
    itemsGapField.text = "0.1";
    itemsGapField.preferredSize.width = 70;

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
            enterBn.notify()
        }
    });

    // REQUIREDPANEL
    // =============
    const requiredPanel = panelContGrp.add("panel", undefined, undefined, { name: "requiredPanel" });
    requiredPanel.text = "Sizes Info";
    requiredPanel.preferredSize.width = 200;
    requiredPanel.orientation = "column";
    requiredPanel.alignChildren = ["center", "top"];
    requiredPanel.spacing = 10;
    requiredPanel.margins = 10;

    // SIZECONTGRP
    // ===========
    const sizeContGrp = requiredPanel.add("group", undefined, { name: "sizeContGrp" });
    sizeContGrp.preferredSize.width = 100;
    sizeContGrp.orientation = "column";
    sizeContGrp.alignChildren = ["center", "center"];
    sizeContGrp.spacing = 5;
    sizeContGrp.margins = 0;

    const sizeContainer = sizeContGrp.add("statictext", undefined, undefined, { name: "sizeContainer" });
    sizeContainer.text = "Size Container";
    sizeContainer.justify = "center";

    const sizeContainerList_array = objectKeys(CONFIG.Size_Container);
    const currentSizeContainer = sizeContainerList_array[0];
    const sizeContainerList = sizeContGrp.add("dropdownlist", undefined, undefined, { name: "sizeContainerList", items: sizeContainerList_array });
    sizeContainerList.selection = 0;
    sizeContainerList.preferredSize.width = 70;
    sizeContainerList.alignment = ["center", "center"];
    const sizeList_array = objectKeys(CONFIG.Size_Container[currentSizeContainer]["MENS"]).concat(objectKeys(CONFIG.Size_Container[currentSizeContainer]["BABY"]));

    // TARGETSIZEGRP
    // =============
    const targetSizeGrp = requiredPanel.add("group", undefined, { name: "targetSizeGrp" });
    targetSizeGrp.preferredSize.width = 100;
    targetSizeGrp.orientation = "column";
    targetSizeGrp.alignChildren = ["center", "center"];
    targetSizeGrp.spacing = 5;
    targetSizeGrp.margins = 0;

    const targetSize = targetSizeGrp.add("statictext", undefined, undefined, { name: "targetSize" });
    targetSize.text = "Target Size";
    targetSize.justify = "center";

    const sizeList = targetSizeGrp.add("dropdownlist", undefined, undefined, { name: "sizeList", items: sizeList_array });
    sizeList.selection = 0;
    sizeList.preferredSize.width = 70;
    sizeList.alignment = ["center", "center"];

    sizeContainerList.onChange = () => {
        // Get the selected size container
        const currentSizeVal = sizeContainerList.selection.text;

        // Update the available sizes based on the selected container
        const currentSizeList_array = objectKeys(CONFIG.Size_Container[currentSizeVal]["MENS"]).concat(objectKeys(CONFIG.Size_Container[currentSizeContainer]["BABY"]));

        // Update the items in the target size dropdown
        sizeList.removeAll(); // Clear the current items in the dropdown

        for (const size of currentSizeList_array) {
            sizeList.add(`item`, size);
        }

        // Optionally reset the selection to the first item (or a default option)
        sizeList.selection = 0;
    };

    // QUANTITYGRP
    // ===========
    const quantityGrp = requiredPanel.add("group", undefined, { name: "quantityGrp" });
    quantityGrp.preferredSize.width = 100;
    quantityGrp.orientation = "column";
    quantityGrp.alignChildren = ["center", "center"];
    quantityGrp.spacing = 5;
    quantityGrp.margins = 0;

    const quantity = quantityGrp.add("statictext", undefined, undefined, { name: "quantity" });
    quantity.text = "Quantity";
    quantity.justify = "center";

    const quantityField = quantityGrp.add('edittext {justify: "center", properties: {name: "quantityField"}}');
    quantityField.text = "2";
    quantityField.preferredSize.width = 70;

    quantityField.addEventListener("keydown", digitValidateCb);

    // ENTERBTNGRP
    // ===========
    const enterBtnGrp = dialogRoot.add("group", undefined, { name: "enterBtnGrp" });
    enterBtnGrp.orientation = "row";
    enterBtnGrp.alignChildren = ["left", "center"];
    enterBtnGrp.spacing = 10;
    enterBtnGrp.margins = 0;

    const enterBn = enterBtnGrp.add("button", undefined, "Start", { name: "ok" });
    enterBn.helpTip = "Start Action";
    enterBn.active = true;

    enterBn.onClick = () => {
        dialogRoot.close();
            function fixMultipleDots(str) {
                const parts = str.split('.');
                if (parts.length <= 2) {
                    return parseFloat(str); // Already a valid float
                }

                // Join only the first two parts to make a valid float
                const fixedStr = parts[0] + '.' + parts[1];
                return parseFloat(fixedStr);
            }

            if (parseInt(quantityField.text) < 2) {
                alertDialogSA("Minimum quantity 2 required");
                return;
            }

            CONFIG.Items_Gap = fixMultipleDots(itemsGapField.text);
            CONFIG.perDoc = parseInt(perDocField.text);

        dialogRoot.close(1); // success signal
    }

    // Show dialog and act on result
    const result = dialogRoot.show();

    if (result === 1) {
        orgMenuallyCB({
            mode: orgModeList.selection.text,
            quantity: parseInt(quantityField.text),
            sizeContainer: sizeContainerList.selection.text,
            targetSizeChr: sizeList.selection.text
        });
    }
}