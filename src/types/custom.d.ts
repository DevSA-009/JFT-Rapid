type findElementCb<T> = (element: T, index?: number) => boolean;

interface JFTRapid_Config {
    readonly PAPER_MAX_SIZE: number;
    Persist_Config: PersistConfig;
    Items_Gap: number;
    kidsinV: boolean;
    orientation: "Auto" | LayoutShapeConstants;
    perDoc: number;
    outlineNANO:boolean;
    sKeywords:string[]
}

type Selection = PageItem[];

type PrevNextItems = {
    prev: PageItem | GroupItem | null;
    current: PageItem;
    next: PageItem | null;
};

type MensSize = "S" | "M" | "L" | "XL" | "2XL";
type BabySize = "2" | "4" | "6" | "8" | "10" | "12" | "14" | "16";
type ApparelSize = MensSize | BabySize;

type Mode = keyof typeof GridMode;

type PantItems = [PageItem, PageItem, PageItem, PageItem];

type Person = {
    readonly NO: number;
    readonly NAME: string;
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
    data:null | Person[]
}

interface OrgAutoParams {
    readonly mode: Mode;
    readonly sizeContainer: string;
    data:{[key in ApparelSize]: Person[]}
}
