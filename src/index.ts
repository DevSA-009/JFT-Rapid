const JFT_CONF_PRODUCTION_PATH =
  "C:\\Users\\Admin\\AppData\\Roaming\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "G:\\JFT-Rapid\\jft.conf";

const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_DEV_PATH);

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
  orientation: "auto",
};

const globalTransActHandler = new TransActionHandler();

// .... all task

globalTransActHandler.removeAll();
