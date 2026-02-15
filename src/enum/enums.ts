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

const stackTypesTuple: StackType[] = ["HH", "VV", "RHH", "RVV", "VRH"];

enum SearchingKeywords {
  SIZE_TKN = "SIZE_TKN",
  FRONT = "FRONT",
  NECK = "NECK",
  BACK = "BACK",
  BODY = "BODY",
  PAIR = "PAIR",
  DYNAMIC = "DYN",
  LONG_SLV = "L_SLV",
  SHORT_PANT = "S_PANT",
  LONG_PANT = "L_PANT",
  SHORT_SLV = "S_SLV",
  SOLID = "SLD",
  COLLAR = "CLR",
  PLACKET = "PLC",
  SHORT_SLV_RIB = "S_RIB",
  LONG_SLV_RIB = "L_RIB",
  NUMBER = "NUMBER",
  NAME = "NAME",
}

const faceBasePair = [SearchingKeywords.BODY, SearchingKeywords.COLLAR];

enum SearchingKeywordsForPant {
  PANT_F_L = "PANT_F_L",
  PANT_F_R = "PANT_F_R",
  PANT_B_L = "PANT_B_L",
  PANT_B_R = "PANT_B_R",
}
