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
  Both = "BOTH",
}

enum StackOrientations {
  "Auto" = "auto",
  "Horizontal" = "horizontal",
  "Vertical" = "vertical",
}

enum BodyType {
  "BODY",
}

enum HamType {
  None = "NONE",
  RIB = "RIB",
  CUFF = "CUFF",
}
const stackTypesTuple: StackType[] = ["HH", "VV", "RHH", "RVV", "VRH"];

enum SearchingKeywords {
  SIZE_TKN = "SIZE_TKN",
  FRONT = "FRONT",
  BACK = "BACK",
  LONG_SLV = "L_SLV",
  SHORT_SLV = "S_SLV",
  SOLID = "SLD",
  COLLAR = "CLR",
  PLACKET = "PLC",
  S_SLV_RIB = "S_RIB",
  L_SLV_RIB = "L_RIB",
  NO = "NO",
  NAME = "NAME",
}

enum NANOBaseSize {
  NAME = 9.7,
  F_NO = 2.75,
  NO = 9,
  BASE_BODY = 19.5,
  BASE_GAP = 0.5,
}

enum SearchingKeywordsForPant {
  PANT_F_L = "PANT_F_L",
  PANT_F_R = "PANT_F_R",
  PANT_B_L = "PANT_B_L",
  PANT_B_R = "PANT_B_R",
}

enum GridMode {
  B = "B",
  FB = "FB",
  PANT = "PANT",
}

enum GridOrientation {
  V = "V",
  H = "H",
  L = "L",
}

const processSeqOrder = [JerseyType, HamType, SleeveType];
