type findElementCb<T> = (element: T, index?: number) => boolean;
interface RowInfo {
    height: number;
    remaining: number;
    y: number;
    x: number;
    remainingStartIndex: number;
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
    prev: PageItem | null;
    current: PageItem;
    next: PageItem | null;
};

type MensSize = "S" | "M" | "L" | "XL" | "2XL";
type BabySize = "2" | "4" | "6" | "8" | "10" | "12" | "14" | "16";

type Mode = "PANT" | "B" | "FB";

interface OrganizeInitParams {
    doc: Application["activeDocument"];
    quantity: number;
    mode: Mode;
    sizeConatiner?: string;
    targetSizeChr: MensSize | BabySize;
}

interface CalculateDocRowDistributionParams {
    dim: DimensionObject;
    rowLength: number;
    to90?:boolean;
}
interface CalculateDocRowDistributionReturn {
    docNeed:number;
    perDocRow:number;
}

interface OrgBodyItemDir {
    items: Selection;
    mode: Mode;
    quantity: number;
    fitIn: number;
    to90: boolean;
}

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

interface FixOrganizeRotateAlignParams {
    to90: boolean;
    lastItem: GroupItem;
    baseItem: GroupItem;
}

type TempDocumentHandlerCB = (tempDoc: IllustratorDocument) => void

type DataListConatiner = {
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

interface OrganizerParams {
    dataString: string;
    mode: Mode;
    targetSizeChr: MensSize | BabySize;
    doc?: Document;
    sizeConatiner: string;
}

type BoundsObject = { left: number; top: number; right: number; bottom: number }
type DimensionObject = { width: number; height: number; }