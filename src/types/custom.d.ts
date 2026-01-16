type findElementCb<T> = (element: T, index?: number) => boolean;


interface JFTRapid_Config {
    readonly PAPER_MAX_SIZE: number;
    Persist_Config: PersistConfig;
    Items_Gap: number;
    kidsinV: boolean;
    orientation: "Auto" | LayoutShapeConstants;
    perDoc: number;
    outlineNANO: boolean;
    opacityMask: boolean;
}

type Selection = PageItem[];

type PrevNextItems = {
    prev: PageItem | GroupItem | null;
    current: PageItem;
    next: PageItem | null;
};

type MensSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";
type BabySize = "2" | "4" | "6" | "8" | "10" | "12" | "14" | "16";
type ApparelSize = MensSize | BabySize;

type Mode = keyof typeof GridMode;

type PantItems = [PageItem, PageItem, PageItem, PageItem];

type Person = {
    readonly NO: number;
    readonly NAME: string;
    readonly PANT: boolean
} & {
    readonly [key: string]: string;
};

type BasePositions = "L" | "R" | "T" | "B";

type RotateDegrees = 90 | -90 | 180 | 0 | -180;

type AlignPosition = BasePositions | "LC" | "RC" | "TC" | "BC" | "C" | "CX" | "CY";

interface MoveItemAfterParams {
    base: Selection | PageItem;
    moving: PageItem;
    gap?: number;
    position: BasePositions
}

type BodyItems = [PageItem, PageItem];

type BabySizeCategory = {
    [key in BabySize]: DimensionObject
}

type MensSizeCategory = {
    [key in MensSize]: DimensionObject
}

interface SizeCategory {
    "MENS": MensSizeCategory;
    "BABY": BabySizeCategory;
}

interface PersistConfig {
    "config": {
        "container": string;
        "mode": Mode;
    };
    "sizes": {
        [key: string]: SizeCategory;
    };
}


type BoundsObject = { left: number; top: number; right: number; bottom: number }
type DimensionObject = { width: number; height: number; }

interface SelectItemsInDocParams {
    doc: Document;
    items: Selection;
    clear?: boolean;
}

type Process = "01" | "10";

interface OrgManuallyParams {
    readonly mode: Mode;
    readonly quantity: number;
    readonly targetSizeChr: ApparelSize;
    readonly sizeContainer: string;
    readonly process: Process;
    data: null | Person[]
}

interface OrgAutoParams {
    readonly mode: Mode;
    readonly sizeContainer: string;
    data: {
        [key in ApparelSize]?: Person[]; // Apparel sizes can be optional too
    };
}

// All New Types

/* ==== TS Built in Utils ==== */
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Basic version (most common use-case)
type Omit<T, K extends keyof any> = {
    [P in keyof T as P extends K ? never : P]: T[P]
}

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
    [P in keyof T as P extends K ? never : P]: T[P]
}

type PropertyKey = string | number | symbol;

/**
 * Keys of Stack Type.
 */
type StackType = "HH" | "VV" | "RHH" | "RVV" | "VRH";

/**
 * Possible stacking configurations.
 */
type StackSizes = Record<StackType,DimensionObject>;

/**
 * stack configurations.
 */
type StackSize = {
    [K in StackType]:Record<K,DimensionObject>
}[StackType];

/** Recommended stack type with its width */
type RecommendedStack = {
    type: StackType;
    width: number;
}

/** Stack orientation type */
type StackOrientation = `${StackOrientations}`;

/**
 * Supported length units.
 */
type LengthUnit = "mm" | "cm" | "inch" | "pt";

type HeightPreference = "Less" | "More";
type DimensionType = "width" | "height";