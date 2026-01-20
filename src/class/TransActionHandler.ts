class TransActionHandler {
  private doc: Document;

  private currentSets: CurrentSets = {};

  private templateMove = [
    "/version 3",
    "/name [ 20",
    "5472616e73666f726d6174696f6e5f4465765341",
    "]",
    "/isOpen 1",
    "/actionCount 1",
    "/action-1 {",
    "/name [ 12",
    "4d6f76655f32302e35783330",
    "]",
    "/keyIndex 0",
    "/colorIndex 0",
    "/isOpen 0",
    "/eventCount 1",
    "/event-1 {",
    "/useRulersIn1stQuadrant 0",
    "/internalName (adobe_move)",
    "/localizedName [ 4",
    "4d6f7665",
    "]",
    "/isOpen 1",
    "/isOn 1",
    "/hasDialog 1",
    "/showDialog 0",
    "/parameterCount 3",
    "/parameter-1 {",
    "/key 1752136302",
    "/showInPalette -1",
    "/type (unit real)",
    "/value 679.2466415081",
    "/unit 592476268",
    "}",
    "/parameter-2 {",
    "/key 1987339116",
    "/showInPalette -1",
    "/type (unit real)",
    "/value 0.0",
    "/unit 592476268",
    "}",
    "/parameter-3 {",
    "/key 1668247673",
    "/showInPalette -1",
    "/type (boolean)",
    "/value 0",
    "}",
    "}",
    "}",
  ];

  //   private aiaheader =

  constructor(params: TransActionHandlerParams) {
    const { doc } = params;

    this.doc = doc;
  }

  private createAiaFile(params: CreateAiaFile) {
    const { content, setName } = params;

    const tempPathLocation = Folder.temp;

    const tempFile = `${tempPathLocation.fsName}/Transformation_DevSA_${setName}.aia`;

    const aiaFile = new File(tempFile);

    aiaFile.open("w");

    aiaFile.write(content);

    aiaFile.close();

    return aiaFile;
  }

  move(params: Move) {
    const { deltaX, deltaY, item } = params;

    const setName = `Trans_Move_${deltaX}x${deltaY}`;

    if (this.currentSets[setName]) {
    }

    const setNameInHex = Utils.hexString(setName);

    const template = [...this.templateMove];

    // update set name hex byte length
    template[1] = `/name [ ${setNameInHex.length / 2}`;

    // update set name in hex string
    template[2] = `${setNameInHex}`;

    // update action name hex byte length
    template[7] = `/name [ ${setNameInHex.length / 2}`;

    // update action name in hex string
    template[8] = `${setNameInHex}`;

    //  update delta x value
    template[29] = `/value ${deltaX.toFixed(4)}`;

    //  update delta y value
    template[36] = `/value ${deltaY.toFixed(4)}`;

    const file = this.createAiaFile({
      content: template.join("\n"),
      setName,
    });

    app.loadAction(file);

    this.currentSets[setName] = file;

    file.remove();
  }
}

interface TransActionHandlerParams {
  doc: Document;
}

interface CurrentSets {
  [key: string]: File;
}

interface Move {
  item: PageItem;
  deltaX: number;
  deltaY: number;
}

interface CreateAiaFile {
  setName: string;
  content: string;
}
