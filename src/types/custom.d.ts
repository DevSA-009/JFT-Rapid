type findElementCb<T> = (element: T, index?: number) => boolean;
interface RowInfo {
    height: number;
    remaining: number;
    y: number;
    x: number;
    remainingStartIndex: number;
}

interface JFTRapid_Config {
    readonly PAPER_MAX_SIZE:number;
    readonly Size_Container:SizeContainer;
    Items_Gap:number;
    sizeInc:number;
    orientation:"Auto" | LayoutShapeConstants;
    perDoc: number;
}

interface RowInfoReturn {
    rowIn0: RowInfo;
    rowIn90: RowInfo;
    recommendedIn90: boolean;
}

interface OrgBodyItem {
    item: PageItem;
    x: number;
    y: number;
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

interface CalculateDocRowDistributionParams {
    dim: DimensionObject;
    rowLength: number;
    perDoc?:number;
    to90?: boolean;
}
interface CalculateDocRowDistributionReturn {
    docNeed: number;
    perDocRow: number;
}

type PantItems = [PageItem,PageItem,PageItem,PageItem];

interface Person {
    readonly number: number;
    readonly name: string;
}

type BasePositions = "L" | "R" | "T" | "B";

type RotateDegrees = 90 | -90 | 180 | 0 | -180;

type RunFunctionParams = ((doc: Application["activeDocument"]) => {}) | (() => {}) | null;

type AlignPosition = BasePositions | "LC" | "RC" | "TC" | "BC" | "C" | "CX" | "CY";

interface MoveItemAfterParams {
    base: Selection | PageItem;
    moving: PageItem;
    gap?: number;
    position: BasePositions
}

type BodyItems = [PageItem, PageItem];

interface FixOrganizeRotateAlignParams {
    to90: boolean;
    lastItem: GroupItem;
    baseItem: GroupItem;
}

type DataListContainer = {
    [key in MensSize | BabySize]: Person[];
};

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

interface SizeContainer {
    [key: string]: SizeCategory
}

type BoundsObject = { left: number; top: number; right: number; bottom: number }
type DimensionObject = { width: number; height: number; }

interface SelectItemsInDocParams {
    doc: Document;
    items: Selection;
    clear?: boolean;
}

interface OrgManuallyParams {
    readonly mode:Mode;
    readonly quantity:number;
    readonly targetSizeChr:ApparelSize;
    readonly sizeContainer:string;
}
