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

enum CountType {
  SET = "SET",
  PCS = "PCS",
  CMD = "CMD",
}

enum PairObjectMarkers {
  BODY = "BODY",
  SHORT_SLV = "S_SLV",
  LONG_SLV = "L_SLV",
  NECK = "NCK",
  COLLAR = "CLR",
  PLACKET = "PLK",
  SHORT_PANT = "S_PANT",
  LONG_PANT = "L_PANT",
  SHORT_SLV_RIB = "S_RIB",
  LONG_SLV_RIB = "L_RIB",
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

const faceBasePair = [PairObjectMarkers.BODY, PairObjectMarkers.COLLAR];
