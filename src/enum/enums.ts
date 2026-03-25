const test =
  '{"basic":{"type":"POLO","sleeve":["LONG","SHORT"],"rib":{"type":"NO","apply":[]},"pant":[],"total":10},"details":{"2":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"4":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"6":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"8":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"10":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"12":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"14":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"16":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"XS":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"S":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"M":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"L":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"2XL":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"3XL":{"SUMMARY":{"SHORT_SLEEVE":9,"LONG_SLEEVE":1,"SHORT_PANT":0,"LONG_PANT":0,"BODY":10},"DATA":[{"NAME":"PLAYER01","NUMBER":"01"},{"NAME":"PLAYER02","NUMBER":"02"},{"NAME":"PLAYER03","NUMBER":"03"},{"NAME":"PLAYER04","NUMBER":"04"},{"NAME":"PLAYER05","NUMBER":"05"},{"NAME":"PLAYER06","NUMBER":"06"},{"NAME":"PLAYER07","NUMBER":"07"},{"NAME":"PLAYER08","NUMBER":"08"},{"NAME":"PLAYER09","NUMBER":"09"},{"NAME":"PLAYER10","NUMBER":"10"}]},"4XL":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"5XL":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]}}}';

const ADULT_SIZES = {
  XS: 0,
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  "2XL": 5,
  "3XL": 6,
  "4XL": 7,
  "5XL": 8,
} as const;

const KIDS_SIZES = {
  "2": 9,
  "4": 10,
  "6": 11,
  "8": 12,
  "10": 13,
  "12": 14,
  "14": 15,
  "16": 16,
} as const;

/**
 * Unified size scale mapping.
 * Lower value = smaller size
 */
const SIZE_ORDER_MAP = { ...ADULT_SIZES, ...KIDS_SIZES } as const;

enum PageItemType {
  TextFrame = "TextFrame",
  PathItem = "PathItem",
  GroupItem = "GroupItem",
  CompoundPathItem = "CompoundPathItem",
  PlacedItem = "PlacedItem",
  RasterItem = "RasterItem",
  Layer = "Layer",
}

const ReferencePoints = {
  TOPLEFT: {
    name: "546f70204c656674",
    value: 0,
  },
  TOPMIDDLE: {
    name: "546f70204d6964646c65",
    value: 1,
  },
  TOPRIGHT: {
    name: "546f70205269676874",
    value: 2,
  },
  MIDDLELEFT: {
    name: "4d6964646c65204c656674",
    value: 3,
  },
  CENTER: {
    name: "43656e746572",
    value: 4,
  },
  MIDDLERIGHT: {
    name: "4d6964646c65205269676874",
    value: 5,
  },
  BOTTOMLEFT: {
    name: "426f74746f6d204c656674",
    value: 6,
  },
  BOTTOMMIDDLE: {
    name: "426f74746f6d204d6964646c65",
    value: 7,
  },
  BOTTOMRIGHT: {
    name: "426f74746f6d205269676874",
    value: 8,
  },
};

enum JerseyType {
  POLO = "POLO",
  TSHIRT = "TSHIRT",
}

enum SleeveType {
  SHORT = "SHORT",
  LONG = "LONG",
}

enum StackOrientations {
  "Auto" = "auto",
  "Horizontal" = "horizontal",
  "Vertical" = "vertical",
}

enum RIBType {
  NO = "NO",
  RIB = "RIB",
  CUFF = "CUFF",
}

/**
 * All real layout stack variants iterated by {@link GridCalculator}.
 * `"NONE"` is intentionally excluded — it is not a layout stack,
 * it is a pass-through grouping used by {@link ItemsInitiater}.
 */
const stackTypesTuple: StackType[] = ["HH", "VV", "RHH", "RVV", "VRH"];

enum CountType {
  SET = "SET",
  PCS = "PCS",
  CMD = "CMD",
}

enum PairObjectMarkers {
  BODY = "BODY",
  SHORT_SLEEVE = "S_SLV",
  LONG_SLEEVE = "L_SLV",
  NECK = "NCK",
  COLLAR = "CLR",
  PLACKET = "PLK",
  SHORT_PANT = "S_PANT",
  LONG_PANT = "L_PANT",
  SHORT_SLEEVE_RIB = "S_SLV_RIB",
  LONG_SLEEVE_RIB = "L_SLV_RIB",
}

enum JFTCONFKeywords {
  SLEEVE = "SLEEVE",
  BODY = "BODY",
  COLLAR = "COLLAR",
  PLACKET = "PLACKET",
  NECK = "NECK",
}

enum BasicMarkers {
  NAME = "NAME",
  NUMBER = "NUMBER",
  DYNAMIC = "DYN",
  PAIR = "PAIR",
  FIXED_SIZE = "FSZ",
}

enum DirectionMarkers {
  FRONT = "FRONT",
  BACK = "BACK",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

const SIZE_TKN = "SIZE_TKN";

const SIZE_TKN_FONT = "Sakana-Regular";

const faceBasePair = [PairObjectMarkers.BODY, PairObjectMarkers.COLLAR];
