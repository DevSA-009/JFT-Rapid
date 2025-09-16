
const JFT_CONF_PRODUCTION_PATH = "C:\\Users\\Admin\\AppData\\Roaming\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "G:\\JFT-Rapid\\jft.conf";

const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_DEV_PATH);

const CONFIG: JFTRapid_Config = {
    Items_Gap: 0.1,
    orientation: "Auto",
    outlineNANO: false,
    PAPER_MAX_SIZE: 63.25,
    Persist_Config: ((JFTPersistConfigFetch).read() as PersistConfig),
    kidsinV: false,
    perDoc: 0,
    sKeywords:[SearchingKeywords.NAME,SearchingKeywords.NO]
};

const gridMenuallyCB = (params: OrgManuallyParams) => {
    try {
        const { mode, quantity, sizeContainer, targetSizeChr,data,process } = params;

        // ----------------- validation chaining ---------------\\
        if (mode !== "PANT") {
            ValidatorManager.checkBodyItems(app.activeDocument);
        }
        // ----------------- validation chaining ---------------\\

        const dimension = Organizer.getBodyDimenstion({ sizeContainer, targetSizeChr });

        const filesSeqIndex = Math.abs(Organizer.getDirectoryFileInfo().nexFileIndex - 1);

        new AutomateGridLayout({
            mode,
            quantity,
            dimension,
            targetSizeChr,
            filesSeqIndex,
            data,
            process,
            folderPath:app.activeDocument.path.fsName
        });

        const newPersist_Config = { ...CONFIG.Persist_Config };

        newPersist_Config.config["container"] = sizeContainer;
        newPersist_Config.config["mode"] = mode;

        JFTPersistConfigFetch.write(newPersist_Config);

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

const testData = {
    S: [
        {
            NAME: "Sumon",
            NO: 15
        }
    ],
    M: [
        {
            NAME: "Safin",
            NO: "99"
        },
        {
            NAME: "Piyash",
            NO: "7"
        }
    ],
    L: [
        {
            NAME: "Atik Khan",
            NO: "000"
        },
        {
            NAME: "Romjan Rafi",
            NO: "27"
        }
    ],
    XL: [
        {
            NAME: "NIBIR",
            NO: "16"
        }
    ],
    "2XL": [
        {
            NAME: "Fahim",
            NO: ""
        }
    ],
    "3XL": [
        {
            NAME: "Sumon",
            NO: "100"
        }
    ]
};

const automateNANO = (params: OrgAutoParams) => {
    try {
        const { mode, data, sizeContainer } = params;

        const sizeList_array = objectKeys(CONFIG.Persist_Config.sizes[sizeContainer]["MENS"])
            .concat(objectKeys(CONFIG.Persist_Config.sizes[sizeContainer]["BABY"]));

        const validData = JSONSA.parse(data) as typeof data;

        const filteredDataObj: Partial<typeof validData> = {};

        const missedTargetSizes:ApparelSize[] = [];

        for (const size in validData) {
            if (arrayIncludes(sizeList_array, size)) {
                filteredDataObj[size as ApparelSize] = validData[size as ApparelSize];
            } else {
                missedTargetSizes.push(size as ApparelSize);
            }
        }

        if(missedTargetSizes.length) {
            alertDialogSA(`Missing Size = ${missedTargetSizes.toString()}`);
        }

        for (const size in filteredDataObj) {
            const typedKey = size as keyof typeof data;
             const element = validData[typedKey];
             const quantity = element.length;

             if(!quantity) {
                continue
             }

             gridMenuallyCB({
                mode,
                quantity,
                sizeContainer,
                targetSizeChr:size as ApparelSize,
                process:"10",
                data:element
             })
        }

    } catch (error: any) {
        alertDialogSA(error.message);
    }
};


gridMenuallyCB({
    mode:"B",
    quantity:1,
    sizeContainer:"JFT",
    targetSizeChr:"2XL",
    data:null,
    process:"01"
})


// automateInfoDialog()