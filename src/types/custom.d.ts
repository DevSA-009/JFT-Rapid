type findElementCb = (element: any, index?: number) => null | any;
interface RowInfo {
    height: number;
    remaing: number;
    fitIn: number;
}

interface RowInfoReturn {
    rowIn0:RowInfo;
    rowIn90:RowInfo;
    recommendedIn90:boolean;
}

interface OrgBodyItem {
    item:GroupItem;
    x:number;
    y:number;
}

type MensSize = keyof typeof JFT_SIZE.MENS;
type BabySize = keyof typeof JFT_SIZE.BABY;

interface OrganizeInitParams {
    doc: Application["activeDocument"];
    quantity:number;
    targetSizeChr:MensSize | BabySize;
}

interface OrgBodyItemDir {
    baseItem:GroupItem;
    quantity:number;
    fitIn:number;
    to90:boolean;
}

type RotateDegrees = 90 | -90 | 180 | 0 | -180;

type RunFunctionParams = ((doc: Application["activeDocument"]) => {}) | (() => {}) | null;

type AlignPosition = "L" | "R" | "T" | "B" | "LC" | "RC" | "TC" | "BC" | "C";

interface FixOrganizeRotateAlignParams {
    to90:boolean;
    lastItem: GroupItem;
    baseItem:GroupItem;
}