const JFT_CONF_PRODUCTION_PATH =
  "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "H:\\JFT-Rapid\\jft.conf";

const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_PRODUCTION_PATH);

// for globally handler progressbar
// const progressWindow = createProgressWindow();

const JFT_CONF = JFTPersistConfigFetch.read() as PersistConfig;

const CONFIG: JFTRapid_Config = {
  DIST_ITEMS_GAP: 0.1,
  DIMENSION_RANGE: false,
  OUTLINE_TEXT: false,
  PAPER_MAX_SIZE: 63.25,
  JFT_CONF,
  CONFIG: JFT_CONF.config,
  SIZES_DETAILS: JFT_CONF.sizes["JFT"] as unknown as SizesDetails,
  BRAND: JFT_CONF.config.brand,
  KIDSINV: false,
  PER_DOC: 0,
  THREAD_ENGINE: "script",
  ORIENTATION: "auto",
  WRAP_TEXT: false,
  STATIC_MODE: false,
};

CONFIG.SIZES_DETAILS = CONFIG.JFT_CONF["sizes"][
  CONFIG.BRAND
] as unknown as SizesDetails;

const jftProcessSeqWrapper = (data: AutomateData | string) => {
  new JFTProcessSequentially(data as unknown as AutomateData);
};
