//@include '../index.js';

const orgDialogRoot = function () {

    // ORGDIALOGROOT
    // =============
    const orgDialogRoot = new Window("dialog", undefined, undefined, {closeButton:false});
    orgDialogRoot.text = "ORG SA";
    orgDialogRoot.preferredSize.width = 250;
    orgDialogRoot.orientation = "column";
    orgDialogRoot.alignChildren = ["center", "top"];
    orgDialogRoot.spacing = 10;
    orgDialogRoot.margins = 16;

    // PANEL1
    // ======
    const panel1 = orgDialogRoot.add("panel", undefined, undefined, { name: "panel1" });
    panel1.text = "INFO";
    panel1.orientation = "column";
    panel1.alignChildren = ["left", "top"];
    panel1.spacing = 20;
    panel1.margins = 7;

    // CGROUP1
    // =======
    const cGroup1 = panel1.add("group", undefined, { name: "cGroup1" });
    cGroup1.preferredSize.width = 170;
    cGroup1.orientation = "column";
    cGroup1.alignChildren = ["center", "center"];
    cGroup1.spacing = 10;
    cGroup1.margins = [0, 5, 0, 0];

    const statictext1 = cGroup1.add("statictext", undefined, undefined, { name: "statictext1" });
    statictext1.text = "Target Size";
    statictext1.justify = "center";

    const orgTargetSize_array = ["S", "M", "L", "XL", "2XL"];
    const orgTargetSize = cGroup1.add("dropdownlist", undefined, undefined, { name: "orgTargetSize", items: orgTargetSize_array });
    orgTargetSize.selection = 0;
    orgTargetSize.preferredSize.width = 82;
    orgTargetSize.preferredSize.height = 26;

    // CGROUP2
    // =======
    const cGroup2 = panel1.add("group", undefined, { name: "cGroup2" });
    cGroup2.preferredSize.width = 170;
    cGroup2.orientation = "column";
    cGroup2.alignChildren = ["center", "center"];
    cGroup2.spacing = 10;
    cGroup2.margins = [0, 0, 0, 5];

    const statictext2 = cGroup2.add("statictext", undefined, undefined, { name: "statictext2" });
    statictext2.text = "Quantity";
    statictext2.justify = "center";

    const edittext1 = cGroup2.add('edittext {justify: "center", properties: {name: "edittext1"}}');
    edittext1.text = "0";
    edittext1.preferredSize.width = 82;

    // GROUP1
    // ======
    const group1 = panel1.add("group", undefined, { name: "group1" });
    group1.orientation = "row";
    group1.alignChildren = ["center", "center"];
    group1.spacing = 10;
    group1.margins = [0, 0, 0, 5];
    group1.alignment = ["center", "top"];

    const orgEnter = group1.add("button", undefined, undefined, { name: "orgEnter" });
    orgEnter.text = "Enter";
    orgEnter.onClick = () => {
        // Create data object with selected values
        const result = {
            targetSize: orgTargetSize.selection.text,
            quantity: parseInt(edittext1.text, 10)
        };

        // Store the result in a property of the dialog
        orgDialogRoot.dialogResult = result;

        alert(JFT_SIZE.MENS[targetSize].width)

        // Close the dialog
        orgDialogRoot.close();
    };
    orgEnter.alignment = ["center", "center"];

    const orgCancel = group1.add("button", undefined, undefined, { name: "orgCancel" });
    orgCancel.onClick = () => {
        orgDialogRoot.close();
    }
    orgCancel.text = "Cancel";
    orgCancel.alignment = ["center", "center"];

    orgDialogRoot.show();

    return orgDialogRoot.dialogResult;

};