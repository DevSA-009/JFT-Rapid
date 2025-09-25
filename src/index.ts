
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
    sKeywords: [SearchingKeywords.NAME, SearchingKeywords.NO]
};

const gridMenuallyCB = (params: OrgManuallyParams) => {
    try {
        const { mode, quantity, sizeContainer, targetSizeChr, data, process } = params;

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
            folderPath: app.activeDocument.path.fsName
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

const automateNANO = (params: OrgAutoParams) => {
    try {
        const { mode, data, sizeContainer } = params;

        let outputInfo = "----- Output Result -----";

        const sizeList_array = objectKeys(CONFIG.Persist_Config.sizes[sizeContainer]["MENS"])
            .concat(objectKeys(CONFIG.Persist_Config.sizes[sizeContainer]["BABY"]));

        const validData = JSONSA.parse(data) as typeof data;

        // deep copy goalkeepers object
        const gkItems = JSONSA.parse(JSONSA.stringify(validData["GK"]));

        // remove goalkeepers object from original object
        if (validData["GK"]) {
            delete validData["GK"];
        }

        const validItems: Partial<typeof validData> = {};

        const missedTargetSizes: ApparelSize[] = [];

        const selectedOrientaion = CONFIG.orientation;

        // removed missed size or unknown size data and store valid size (which exist in container) data
        for (const size in validData) {
            if (arrayIncludes(sizeList_array, size)) {
                validItems[size as ApparelSize] = validData[size as ApparelSize];
            } else {
                missedTargetSizes.push(size as ApparelSize);
            }
        }

        const pantItems = [];

        // filter pant items
        for (const size in validItems) {
            const typedKey = size as keyof typeof data;
            const persons = validData[typedKey]!;
            for (let i = 0; i < persons.length; i++) {
                const person = persons[i];
                if (person.PANT) {
                    pantItems.push(person);
                }
            }
        }

        if (missedTargetSizes.length) {
            alertDialogSA(`Missed Size = ${missedTargetSizes.toString()}`);
        }

        // process body
        for (const size in validItems) {
            const typedKey = size as keyof typeof data;
            const element = validData[typedKey];
            const quantity = element?.length;

            if (!quantity) {
                continue
            }

            const tempOrientation = CONFIG.orientation;

            const sizeCategory = CONFIG.Persist_Config.sizes[sizeContainer as keyof typeof CONFIG.Persist_Config.sizes];

            const isBaby = isBabySize(typedKey as ApparelSize, sizeCategory["BABY"]);

            if (isBaby && CONFIG.kidsinV && tempOrientation !== "V") {
                CONFIG.orientation = "V";
            } else {
                if (selectedOrientaion !== CONFIG.orientation) {
                    CONFIG.orientation = selectedOrientaion;
                }
            }

            outputInfo = `${outputInfo}\n${typedKey}=${quantity}`

            const finalMode: Mode = quantity > 1 ? mode : "FB";

            gridMenuallyCB({
                mode: finalMode,
                quantity,
                sizeContainer,
                targetSizeChr: size as ApparelSize,
                process: "10",
                data: element
            })
        }

        if (pantItems.length) {
            gridMenuallyCB({
                mode: "PANT",
                quantity: pantItems.length,
                sizeContainer,
                targetSizeChr: "3XL",
                process: "10",
                data: pantItems
            })
        }

    } catch (error: any) {
        alertDialogSA(error.message);
    }
};


// gridMenuallyCB({
//     mode:"B",
//     quantity:1,
//     sizeContainer:"JFT",
//     targetSizeChr:"2XL",
//     data:null,
//     process:"01"
// })


// automateInfoDialog()