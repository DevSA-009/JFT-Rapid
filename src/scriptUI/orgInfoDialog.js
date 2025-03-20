const orgDialogRoot = function () {
    const orgDialogRoot = new Window("dialog", undefined, undefined, { closeButton: false });
    orgDialogRoot.text = "ORG SA";
    orgDialogRoot.preferredSize.width = 250;
    orgDialogRoot.orientation = "column";
    orgDialogRoot.alignChildren = ["center", "top"];
    orgDialogRoot.spacing = 10;
    orgDialogRoot.margins = 16;

    // PANEL1
    const panel1 = orgDialogRoot.add("panel", undefined, undefined, { name: "panel1" });
    panel1.text = "INFO";
    panel1.orientation = "column";
    panel1.alignChildren = ["left", "top"];
    panel1.spacing = 20;
    panel1.margins = 7;

    // CGROUP1 - Target Size
    const cGroup1 = panel1.add("group", undefined, { name: "cGroup1" });
    cGroup1.preferredSize.width = 170;
    cGroup1.orientation = "column";
    cGroup1.alignChildren = ["center", "center"];
    cGroup1.spacing = 10;
    cGroup1.margins = [0, 5, 0, 0];
    cGroup1.add("statictext", undefined, "Target Size", { name: "statictext1" });
    const orgTargetSize_array = ["S", "M", "L", "XL", "2XL"];
    const orgTargetSize = cGroup1.add("dropdownlist", undefined, orgTargetSize_array, { name: "orgTargetSize" });
    orgTargetSize.selection = 0;
    orgTargetSize.preferredSize.width = 82;
    orgTargetSize.preferredSize.height = 26;

    // CGROUP2 - Quantity
    const cGroup2 = panel1.add("group", undefined, { name: "cGroup2" });
    cGroup2.preferredSize.width = 170;
    cGroup2.orientation = "column";
    cGroup2.alignChildren = ["center", "center"];
    cGroup2.spacing = 10;
    cGroup2.margins = [0, 0, 0, 5];
    cGroup2.add("statictext", undefined, "Quantity", { name: "statictext2" });
    const edittext1 = cGroup2.add("edittext", undefined, "2");
    edittext1.justify = "center";
    edittext1.preferredSize.width = 82;

    edittext1.addEventListener('keyup', (event) => {
        if (event.keyName === 'Enter') {
            orgEnter.notify();
        }
    });

    // Allow only numeric input in the quantity field
    edittext1.addEventListener("keydown", (event) => {
        // Handle ESC key to close dialog
        if (event.keyName === "Escape") {
            orgDialogRoot.close();
            return;
        }

        // Only allow numbers, backspace, and delete
        if (!/[0-9]/.test(event.keyName) &&
            event.keyName !== "Backspace" &&
            event.keyName !== "Delete") {
            event.preventDefault();
        }
    });

    // Button Group
    const group1 = panel1.add("group", undefined, { name: "group1" });
    group1.orientation = "row";
    group1.alignChildren = ["center", "center"];
    group1.spacing = 10;
    group1.margins = [0, 0, 0, 5];
    group1.alignment = ["center", "top"];

    // Enter Button
    const orgEnter = group1.add("button", undefined, "Enter", { name: "ok" });
    orgEnter.active = true;
    orgEnter.alignment = ["center", "center"];
    orgEnter.onClick = function () {
        const targetSize = orgTargetSize.selection.text;
        const quantity = edittext1.text;
        run((doc) => {
            organizeInit({
                doc,
                quantity:parseInt(quantity),
                targetSizeChr:targetSize
            });
        })
        orgDialogRoot.close();
    };

    orgDialogRoot.show();
};