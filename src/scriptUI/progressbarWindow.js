/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":0,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"constName":"progressWindow","windowType":"Palette","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":true,"independent":false,"closeButton":false,"borderless":false,"resizeable":false},"text":"Progress","preferredSize":[0,0],"margins":30,"orientation":"column","spacing":10,"alignChildren":["fill","top"]}},"item-1":{"id":1,"type":"StaticText","parentId":4,"style":{"enabled":true,"constName":"processTextField","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Process...","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-2":{"id":2,"type":"Progressbar","parentId":0,"style":{"enabled":true,"constName":"progressbar","preferredSize":[315,7],"alignment":null,"helpTip":null}},"item-3":{"id":3,"type":"StaticText","parentId":5,"style":{"enabled":true,"constName":"processPercentState","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"0%","justify":"right","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-4":{"id":4,"type":"Group","parentId":6,"style":{"enabled":true,"constName":"processStateGrp","preferredSize":[0,0],"margins":1,"orientation":"row","spacing":10,"alignChildren":["left","center"],"alignment":["left","center"]}},"item-5":{"id":5,"type":"Group","parentId":6,"style":{"enabled":true,"constName":"processPercentStateGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["right","center"],"alignment":["right","center"]}},"item-6":{"id":6,"type":"Group","parentId":0,"style":{"enabled":true,"constName":"stateTextGrpsContainer","preferredSize":[261,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["fill","center"],"alignment":null}}},"order":[0,6,4,1,5,3,2],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"None"}}
*/

const createProgressWindow = () => {
    let stepValue = 100 / 1;
    let isOpen = false;
    let defaultStateLabel = "Begin...";

    const progressWin = new Window("palette", "Progress", undefined, { minimizeButton: false, closeButton: false });
    progressWin.orientation = "column";
    progressWin.alignChildren = ["fill", "top"];
    progressWin.spacing = 10;
    progressWin.margins = 30;

    // ─────────────────────────────
    // State Text Container
    // ─────────────────────────────
    const stateTextGroup = progressWin.add("group");
    stateTextGroup.orientation = "row";
    stateTextGroup.alignChildren = ["fill", "center"];
    stateTextGroup.spacing = 10;

    // Left Group (Process Text)
    const stateLeftGroup = stateTextGroup.add("group");
    stateLeftGroup.alignment = ["left", "center"];
    const stateLabel = stateLeftGroup.add("statictext", undefined, defaultStateLabel);
    stateLabel.justify = "left";
    stateLabel.characters = 30;

    // Right Group (Percentage)
    const stateRightGroup = stateTextGroup.add("group");
    stateRightGroup.alignment = ["right", "center"];
    const percentLabel = stateRightGroup.add("statictext", undefined, "0%");
    percentLabel.justify = "right";
    percentLabel.characters = 5; // prevent "100%" cutoff

    // ─────────────────────────────
    // Progress Bar
    // ─────────────────────────────
    const progressBar = progressWin.add("progressbar", undefined, 0, 100);
    progressBar.value = 0;
    progressBar.preferredSize = [315, 8];

    // ─────────────────────────────
    // Show function (manual)
    // ─────────────────────────────
    const showWindow = (steps = 0) => {
        try {
            if (isOpen) {
                closeWindow();
            }
            stepValue = 100 / steps;
            progressWin.show();
            isOpen = true;
        } catch (e) {
            // In case of already shown/closed
            closeWindow();
        }
    };

    // ─────────────────────────────
    // Update function
    // ─────────────────────────────
    const updateProgress = (step, text = defaultStateLabel) => {
        if (!isOpen) return; // prevent update before shown

        if (text) {
            defaultStateLabel = text
        }

        const value = Math.min(Math.round(step * stepValue), 100);
        stateLabel.text = defaultStateLabel;
        percentLabel.text = value + "%";
        progressBar.value = value;
        progressWin.update();

        if (value >= 100) closeWindow();
    };

    // ─────────────────────────────
    // Close function
    // ─────────────────────────────
    const closeWindow = () => {
        try {
            if (isOpen) {
                progressWin.close();
                isOpen = false
            }
        } catch (e) {
            alertDialogSA(e.message)
        }

    };

    // return control API
    return {
        showWindow,       // manually show the loader
        updateProgress,   // update progress
        closeWindow,      // close manually
        isOpen() {    // expose flag
            return isOpen;
        }
    };
};