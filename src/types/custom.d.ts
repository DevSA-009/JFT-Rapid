type findElementCb = (element: any, index?: number) => null | any;
interface RowInfo {
    totalHeight: number;
    remainingItems: number;
    fitIn: number;
}

interface TotalHeightReturn {
    rowIn0:RowInfo;
    rowIn90:RowInfo;
    recommendedIn90:boolean;
}

interface OrgBodyItem {
    item:GroupItem;
    x:number;
    y:number;
}

interface OrgBodyItemDir {
    baseItem:GroupItem;
    bodyPath:PageItem;
    playerLength:number;
    colInfo:RowInfo;
    bodyDim:{
        w:number;
        h:number
    };
    is90:boolean;
}

type AlignPosition = "L" | "R" | "T" | "B" | "LC" | "RC" | "TC" | "BC" | "C"