//@include './polyfill/es6-method.js';
//@include './polyfill/json2.js';
//@include './utils/utils.js';
//@include './utils/JSONFileHandler.js';
//@include './utils/IllustratorDocHandler.js';
//@include './utils/ArtboardManager.js';
//@include './utils/GroupManager.js';
//@include './scriptUI/orgInfoDialog.js';
//@include './scriptUI/alertUI.js';

const FRONT = "FRONT";
const BACK = "BACK";
const PAPER_MAX_SIZE = 63.25;

const NO_MAX_SIZE = {
    FRONT: 3,
    BACK: 11
};

const ITEMS_GAP_SIZE = 0.10;

const JFT_SIZE = {
    MENS: {
        S: {
            width: 19.5,
            height: 28
        },
        M: {
            width: 19.5,
            height: 29
        },
        L: {
            width: 20.5,
            height: 30
        },
        XL: {
            width: 21.5,
            height: 31
        },
        "2XL": {
            width: 22.5,
            height: 31.5
        },
    },
    BABY: {
        "2": {
            width: 12.5,
            height: 16
        },
        "4": {
            width: 13,
            height: 17.5
        },
        "6": {
            width: 13.5,
            height: 19
        },
        "8": {
            width: 14.5,
            height: 20.5
        },
        "10": {
            width: 15.5,
            height: 22
        },
        "12": {
            width: 16.5,
            height: 23.5
        },
        "14": {
            width: 17.5,
            height: 25
        },
        "16": {
            width: 18.5,
            height: 26.5
        },
    }
};

const orgForFBMode = (data: ListData[]) => {
    const doc = app.activeDocument;
    const selection = doc.selection as Selection;
    const front = findElement(selection, (sel) => sel.name === "FRONT");
    const back = findElement(selection, (sel) => sel.name === "BACK");
    if (!front || !back) {
        throw new Error(`Can't find ${!front ? "FRONT" : "BACK"}`);
    }
    const orgDocFB = [front, back];
    const ilstDocHandler = new IllustratorDocument();
    const tmpDoc = ilstDocHandler.create(orgDocFB);
    const tmpDocSel = tmpDoc.selection as Selection;
    const tmpDocFront = findElement(tmpDocSel, (sel) => sel.name === "FRONT") as PageItem;
    const tmpDocBack = findElement(tmpDocSel, (sel) => sel.name === "BACK") as PageItem;
    const tmpDocFB = [tmpDocFront,tmpDocBack];
    // align items CC
    alignItems(tmpDocFront, tmpDocBack, "C");
    moveItemAfter({
        moving: tmpDocFront,
        position: 'T',
        gap: 0.1,
        base: tmpDocBack
    });
    rotateItem(tmpDocFront, -180);
    const groupManager = new GroupManager(tmpDocFB);
    groupManager.group();
    if(groupManager.tempGroup) {
        const artboardManager = new ArtboardManager(tmpDoc);
        alignPageItemsToArtboard(groupManager.tempGroup, tmpDoc,"T");
        artboardManager.resize(100*72,100*72);
        alignPageItemsToArtboard(groupManager.tempGroup, tmpDoc,"CX");
    }
};

const runAutoMode = () => {
    const dtStr = '{"M":[{"name":"safin","number":10},{"name":"sumon","number":0},{"name":"fahim","number":999}]}';
    const mode = "FB";
    const data = JSONSA.parse(dtStr);
    for (const key in data) {
        const sizeChr = key as keyof typeof JFT_SIZE.MENS;
        const listArr = data[key] as ListData[];

    }
}

const selection = app.activeDocument.selection as Selection;

orgForFBMode([]);


const extra = ""