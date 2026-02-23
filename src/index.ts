const JFT_CONF_PRODUCTION_PATH =
  "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

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
  orientation: "auto",
};

const globalTransActHandler = new TransActionHandler();

const data: AutomateData = {
  basic: {
    type: JerseyType.POLO,
    sleeve: [SleeveType.SHORT],
    rib: { type: RIBType.RIB, apply: [SleeveType.SHORT] },
    pant: [],
    total:5
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
  }
};

// .... all task

const startAutomate = () => {

  const {basic,details} = data;

  const gap = 0.1;

  const maxColsInDoc = 5;

  const jftProcess = new JFTProcessOrderGenerator(basic);

  const jftItems = jftProcess.jftItems();

  const fszItems = ES6_SA.arrayFilter(jftItems,item => item.info.fixedSize);

  const nonFszItems = ES6_SA.arrayFilter(jftItems,item => !item.info.fixedSize);

  const z = nonFszItems[0];

  ES6_SA.arrayForEach(jftItems,item => {
    const {info,items,order} = item;
    const objectSize = Utils.getDimension(Utils.getObjectBounds(items[0].object));
    
  })
};

startAutomate()
globalTransActHandler.removeAll();
