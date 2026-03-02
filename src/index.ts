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
};

CONFIG.SIZES_DETAILS = CONFIG.JFT_CONF["sizes"][
  CONFIG.BRAND
] as unknown as SizesDetails;

// const globalTransActHandler = new TransActionHandler();

/*
const data: AutomateData = {
  basic: {
    type: JerseyType.POLO,
    sleeve: [SleeveType.SHORT],
    rib: { type: RIBType.RIB, apply: [SleeveType.SHORT] },
    pant: [],
    total: 5,
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
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    S: {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    M: {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 1 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [{ NAME: "I.SAMIM", NUMBER: "30" }],
    },
    L: {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 3 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [
        { NAME: "ALAUDDIN", NUMBER: "7" },
        { NAME: "PARVEJ JR", NUMBER: "21" },
        { NAME: "SM.UZZAL VAI", NUMBER: "22" },
      ],
    },
    XL: {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 1 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [{ NAME: "NOBIR HOSSEN", NUMBER: "11" }],
    },
    "2XL": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
    },
    "3XL": {
      SUMMARY: { SLEEVE: { LONG: 0, SHORT: 0 }, PANT: { LONG: 0, SHORT: 0 } },
      DATA: [],
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

// .... all task

const startAutomate = () => {
  const { basic, details } = data;

  const gap = 0.1;

  const maxColsInDoc = 5;

  new JFTProcessOrderGenerator(data);
};

startAutomate();

*/

// new ItemsInitiater({
//   dimension:{width:19.5,height:29},
//   gap:0.1,
//   items:[app.activeDocument.selection[0],app.activeDocument.selection[1]],
//   fixedSize:false,
//   sizeChar:"M",
//   stack:"VRH"
// })

const sel = app.activeDocument.selection;


new GridLayoutGenerator({
  dimension: { width: 19.5, height: 29 },
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
    order:JFTCONFKeywords.BODY
  },
  quantity:8,
  sizeChar:"M"
  
});

/*
const $1z = GridCalculator.getRecommendedStacks({
  gap:0.1,
  maxColsInDoc:0,
  quantity:3,
  pair:false,
  size:{width:23.5,height:33},
  pairGap:0.1,
  heightPreference:"Less",
  stackOrientation:"auto"
})
*/

const z = "";

// globalTransActHandler.removeAll();
