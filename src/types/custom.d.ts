interface JFTRapid_Config {
  PAPER_MAX_SIZE: number;
  JFT_CONF: PersistConfig;
  CONFIG: PersistConfig["config"];
  SIZES_DETAILS: SizesDetails;
  ITEMS_GAP: number;
  KIDSINV: boolean;
  ORIENTATION: StackOrientation;
  PER_DOC: number;
  BRAND: string;
  OUTLINE_TEXT: boolean;
  THREAD_ENGINE: ThreadEngine;
  WRAP_TEXT:boolean;
  STATIC_MODE:boolean
}

/**
 * Represents a selection of PageItems in Illustrator.
 */
type Selection = PageItem[];

type PrevNextItems = {
  prev: PageItem | GroupItem | null;
  current: PageItem;
  next: PageItem | null;
};

type MensSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";
type BabySize = "2" | "4" | "6" | "8" | "10" | "12" | "14" | "16";

type BasePositions = "L" | "R" | "T" | "B";

type RotateDegrees = 90 | -90 | 180 | 0 | -180;

type AlignPosition =
  | BasePositions
  | "LC"
  | "RC"
  | "TC"
  | "BC"
  | "C"
  | "CX"
  | "CY";

type SizesDetails = {
  [key in ApparelSize]: {
    BODY: DimensionObject;
    SLEEVE: Record<"SHORT" | "LONG", Record<"SIZE" | "RIB", DimensionObject>>;
    NECK_AREA: Record<"COLLAR" | "PLACKET" | "NECK", DimensionObject>;
    PANT: Record<"SHORT" | "LONG", Record<"FRONT" | "BACK", DimensionObject>>;
  };
};

interface SizeContainer {
  [key: string]: SizesDetails;
}

type PantItems = [PageItem, PageItem, PageItem, PageItem];

interface PersistConfig {
  config: {
    brand: string;
    paperMaxWidth: number;
  };
  sizes: {
    [key: string]: SizeContainer;
  };
}

type BoundsObject = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
type DimensionObject = { width: number; height: number };

// All New Types

/* ==== TS Built in Utils ==== */
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

// Basic version (most common use-case)
type Omit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

/**
 * Exclude from `T` those types that are assignable to `U`.
 *
 * @example
 * type A = "a" | "b" | "c";
 * type B = Exclude<A, "b">;
 * //   ^? "a" | "c"
 */
type Exclude<T, U> = T extends U ? never : T;

/**
 * Extract from `T` those types that are assignable to `U`.
 *
 * @example
 * type A = "a" | "b" | "c";
 * type B = Extract<A, "a" | "c">;
 * //   ^? "a" | "c"
 */
type Extract<T, U> = T extends U ? T : never;

// Even stricter (prevents passing invalid keys - very safe)
type StrictOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type PropertyKey = string | number | symbol;

/**
 * Keys of Stack Type.
 */
type StackType = "HH" | "VV" | "RHH" | "RVV" | "VRH";

/**
 * Possible stacking configurations.
 */
type StackSizes = Record<StackType, DimensionObject>;

/**
 * stack configurations.
 */
type StackSize = {
  [K in StackType]: Record<K, DimensionObject>;
}[StackType];

/** Recommended stack type with its width */
type RecommendedStack = {
  type: StackType;
  width: number;
};

/** Stack orientation type */
type StackOrientation = `${StackOrientations}`;

/**
 * Supported length units.
 */
type LengthUnit = "mm" | "cm" | "inch" | "pt";

type HeightPreference = "Less" | "More";
type DimensionType = "width" | "height";

type ThreadEngine = "script" | "action";

type ApparelSize = BabySize | MensSize;

interface SelectItemsInDocParams {
  doc: Document;
  items: Selection;
  clear?: boolean;
}

interface AutomateData {
  basic: {
    type: JerseyType;
    sleeve: SleeveType[];
    rib: { type: RIBType; apply: SleeveType[] };
    pant: SleeveType[];
    total: number;
  };
  details: {
    [key in ApparelSize]: {
      SUMMARY: Record<
        "SLEEVE" | "PANT",
        Record<SleeveType.LONG | SleeveType.SHORT, number>
      >;
      DATA: (Record<BasicMarkers.NAME | BasicMarkers.NUMBER, string> &
        Record<string, string>)[];
    };
  };
}
