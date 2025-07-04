
const JFT_CONF_PRODUCTION_PATH = "C:\\Users\\Admin\\AppData\\Roaming\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "G:\\JFT-Rapid\\jft.conf";

const sizeContainerFetch = new JSONFileHandler(JFT_CONF_PRODUCTION_PATH).read();

const CONFIG: JFTRapid_Config = {
    Items_Gap: 0.1,
    orientation: "Auto",
    sizeInc: 0,
    PAPER_MAX_SIZE: 63.25,
    Size_Container: sizeContainerFetch as SizeContainer,
    perDoc: 0
};

const gridMenuallyCB = (params: OrgManuallyParams) => {
    try {
        const { mode, quantity, sizeContainer, targetSizeChr } = params;

        // ----------------- validation chaining ---------------\\
        ValidatorManager.checkBodyItems(app.activeDocument);
        // ----------------- validation chaining ---------------\\

        const dimension = Organizer.getBodyDimenstion({ sizeContainer, targetSizeChr });

        const filesSeqIndex = Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1);

        new AutomateGridLayout({
            mode,
            quantity,
            dimension,
            targetSizeChr,
            filesSeqIndex
        })

    } catch (error: any) {
        alertDialogSA(error.message);
    }
};

const initiatePant = () => {
    try {
        ValidatorManager.checkdocument();
        ItemsInitiater.initPant(app.activeDocument);
    } catch (error: any) {
        alertDialogSA(error.message)
    }
};

// gridMenuallyCB({
//     mode:"PANT",
//     quantity:3,
//     sizeContainer:"JFT",
//     targetSizeChr:"L"
// })