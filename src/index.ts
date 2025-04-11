//@include './polyfill/es6-method.js';
//@include './enum/enums.js';
//@include './polyfill/json2.js';
//@include './utils/utils.js';
//@include './class/JSONFileHandler.js';
//@include './class/IllustratorDocHandler.js';
//@include './class/ArtboardManager.js';
//@include './class/GroupManager.js';
//@include './class/Organizer.js';
//@include './scriptUI/orgMenualInfoDialog.js';
//@include './scriptUI/alertUI.js';

const sizeContainerFetch = new JSONFileHandler("G:\\JFT-Khelar\\jft.conf").read();

const CONFIG:JFTRapid_Config = {
    Items_Gap:0.1,
    PAPER_MAX_SIZE:63.25,
    Size_Container:sizeContainerFetch as SizeContainer,
    perDoc:0
};

const orgMenuallyCB = (params:OrgManuallyParams) => {
    try {
        const { mode, quantity, sizeContainer, targetSizeChr } = params;

        const doc = app.activeDocument;

        const selection = doc.selection as Selection;

        const body = Organizer.getBody(doc, selection);

        const tempDoc = Organizer.createTempDocument({
            items: body,
            mode,
            cb: Organizer.selectBodyCB as TempDocumentHandlerParams["cb"]
        });

        Organizer.initializeOrganization({
            doc: tempDoc.doc,
            mode,
            quantity,
            targetSizeChr,
            sizeContainer
        });
    } catch (error:any) {
        alertDialogSA(error.message);
    }
};

orgMenualInfoDialog()