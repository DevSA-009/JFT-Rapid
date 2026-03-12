const JFT_CONF_PRODUCTION_PATH =
  "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

const JFT_CONF_DEV_PATH = "G:\\JFT-Rapid\\jft.conf";

const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_PRODUCTION_PATH);

// for globally handler progressbar
// const progressWindow = createProgressWindow();

const JFT_CONF = JFTPersistConfigFetch.read() as PersistConfig;

const CONFIG: JFTRapid_Config = {
  ITEMS_GAP: 0.1,
  OUTLINE_TEXT: false,
  PAPER_MAX_SIZE: 63.25,
  JFT_CONF,
  CONFIG: JFT_CONF.config,
  SIZES_DETAILS: JFT_CONF.sizes["JFT"] as unknown as SizesDetails,
  BRAND: "JFT",
  KIDSINV: false,
  PER_DOC: 0,
  THREAD_ENGINE: "script",
  ORIENTATION: "auto",
  WRAP_TEXT: false,
};

CONFIG.SIZES_DETAILS = CONFIG.JFT_CONF["sizes"][
  CONFIG.BRAND
] as unknown as SizesDetails;

const OUTPUT = "";

const jerseyData = {
  basic: {
    type: JerseyType.POLO,
    sleeve: [SleeveType.SHORT, SleeveType.LONG],
    rib: { type: RIBType.RIB, apply: [SleeveType.SHORT,SleeveType.LONG] },
    pant: [],
    total: 30,
  },
  details: {
    "2": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "4": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "6": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "8": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "10": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "12": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "14": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "16": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },

    XS: {
      SUMMARY: { SLEEVE: { LONG: 1, SHORT: 2 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 1", NUMBER: "1" },
        { NAME: "PLAYER 2", NUMBER: "2" },
        { NAME: "PLAYER 3", NUMBER: "3" },
      ],
    },
    S: {
      SUMMARY: { SLEEVE: { LONG: 1, SHORT: 3 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 4", NUMBER: "4" },
        { NAME: "PLAYER 5", NUMBER: "5" },
        { NAME: "PLAYER 6", NUMBER: "6" },
        { NAME: "PLAYER 7", NUMBER: "7" },
      ],
    },
    M: {
      SUMMARY: { SLEEVE: { LONG: 2, SHORT: 4 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 8", NUMBER: "8" },
        { NAME: "PLAYER 9", NUMBER: "9" },
        { NAME: "PLAYER 10", NUMBER: "10" },
        { NAME: "PLAYER 11", NUMBER: "11" },
        { NAME: "PLAYER 12", NUMBER: "12" },
        { NAME: "PLAYER 13", NUMBER: "13" },
      ],
    },
    L: {
      SUMMARY: { SLEEVE: { LONG: 2, SHORT: 4 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 14", NUMBER: "14" },
        { NAME: "PLAYER 15", NUMBER: "15" },
        { NAME: "PLAYER 16", NUMBER: "16" },
        { NAME: "PLAYER 17", NUMBER: "17" },
        { NAME: "PLAYER 18", NUMBER: "18" },
        { NAME: "PLAYER 19", NUMBER: "19" },
      ],
    },
    XL: {
      SUMMARY: { SLEEVE: { LONG: 1, SHORT: 4 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 20", NUMBER: "20" },
        { NAME: "PLAYER 21", NUMBER: "21" },
        { NAME: "PLAYER 22", NUMBER: "22" },
        { NAME: "PLAYER 23", NUMBER: "23" },
        { NAME: "PLAYER 24", NUMBER: "24" },
      ],
    },
    "2XL": {
      SUMMARY: { SLEEVE: { LONG: 1, SHORT: 3 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 25", NUMBER: "25" },
        { NAME: "PLAYER 26", NUMBER: "26" },
        { NAME: "PLAYER 27", NUMBER: "27" },
        { NAME: "PLAYER 28", NUMBER: "28" },
      ],
    },
    "3XL": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 2 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "PLAYER 29", NUMBER: "29" },
        { NAME: "PLAYER 30", NUMBER: "30" },
      ],
    },
    "4XL": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "5XL": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
  },
};

const data: AutomateData = jerseyData;

const startAutomate = () => {
  new JFTProcessSequentially(data);
};

startAutomate();

// const sel = app.activeDocument.activeLayer.pageItems;

/*
new GridLayoutGenerator({
  dimension: { width: 19.5, height: 28 },
  jftItem: {
    info: { countType: CountType.PCS, fixedSize: false, pair: false },
    items: [
      {
        direction: DirectionMarkers.FRONT,
        isDynamic: false,
        isFillRec: false,
        object: sel[0],
      },
      {
        direction: DirectionMarkers.BACK,
        isDynamic: true,
        isFillRec: false,
        object: sel[1],
      },
    ],
    order: JFTCONFKeywords.BODY,
  },
  quantity: 4,
  sizeChar: "S",
  orientation: CONFIG.ORIENTATION,
  data:null
});
*/

const z = "";