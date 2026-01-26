const JFT_CONF_PRODUCTION_PATH =
	"C:\\Users\\Admin\\AppData\\Roaming\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "G:\\JFT-Rapid\\jft.conf";

const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_PRODUCTION_PATH);

// for globally handler progressbar
// const progressWindow = createProgressWindow();

const CONFIG: JFTRapid_Config = {
	Items_Gap: 0.1,
	outlineNANO: false,
	PAPER_MAX_SIZE: 63.25,
	Persist_Config: JFTPersistConfigFetch.read() as PersistConfig,
	kidsinV: false,
	perDoc: 0,
	opacityMask: false,
	orientation:"auto"
};

const transActHandler = new TransActionHandler();

const $item1 = app.activeDocument.activeLayer.pageItems[0];
const $item2 = app.activeDocument.activeLayer.pageItems[1];

AlignmentHandler.moveObjectAfter({
	base:$item1,
	moving:$item2,
	engine:'action',
	position:"B"
})