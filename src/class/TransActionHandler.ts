class TransActionHandler {
  private readonly doc: Document;
  private currentSets: CurrentSets = {};

  private readonly templateMove = [
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

  private readonly templateRotate = [
    "/version 3",
    "/name [ 5",
    "5365742031",
    "]",
    "/isOpen 1",
    "/actionCount 1",
    "/action-1 {",
    "/name [ 8",
    "416374696f6e2031",
    "]",
    "/keyIndex 0",
    "/colorIndex 0",
    "/isOpen 1",
    "/eventCount 1",
    "/event-1 {",
    "/useRulersIn1stQuadrant 0",
    "/internalName (ai_plugin_transformPalette)",
    "/localizedName [ 15",
    "5472616e73666f726d2050616e656c",
    "]",
    "/isOpen 1",
    "/isOn 1",
    "/hasDialog 0",
    "/parameterCount 2",
    "/parameter-1 {",
    "/key 1954115685",
    "/showInPalette -1",
    "/type (enumerated)",
    "/name [ 7",
    "526f746174653a",
    "]",
    "/value 5",
    "}",
    "/parameter-2 {",
    "/key 1986096245",
    "/showInPalette -1",
    "/type (unit real)",
    "/value 90.0",
    "/unit 591490663",
    "}",
    "}",
    "}",
  ];

  private readonly templateScale = [
    "/version 3",
    "/name [ 5",
    "5365742032",
    "]",
    "/isOpen 1",
    "/actionCount 1",
    "/action-1 {",
    "/name [ 8",
    "416374696f6e2031",
    "]",
    "/keyIndex 0",
    "/colorIndex 0",
    "/isOpen 1",
    "/eventCount 1",
    "/event-1 {",
    "/useRulersIn1stQuadrant 0",
    "/internalName (adobe_scale)",
    "/localizedName [ 5",
    "5363616c65",
    "]",
    "/isOpen 0",
    "/isOn 1",
    "/hasDialog 1",
    "/showDialog 0",
    "/parameterCount 5",
    "/parameter-1 {",
    "/key 1970169453",
    "/showInPalette -1",
    "/type (boolean)",
    "/value 0",
    "}",
    "/parameter-2 {",
    "/key 1818848869",
    "/showInPalette -1",
    "/type (boolean)",
    "/value 1",
    "}",
    "/parameter-3 {",
    "/key 1752136302",
    "/showInPalette -1",
    "/type (unit real)",
    "/value 95.3488",
    "/unit 592474723",
    "}",
    "/parameter-4 {",
    "/key 1987339116",
    "/showInPalette -1",
    "/type (unit real)",
    "/value 96.7742",
    "/unit 592474723",
    "}",
    "/parameter-5 {",
    "/key 1668247673",
    "/showInPalette -1",
    "/type (boolean)",
    "/value 0",
    "}",
    "}",
    "}",
  ];

  constructor({ doc }: TransActionHandlerParams) {
    this.doc = doc;
  }

  private createAiaFile({ content, setName }: CreateAiaFile): File {
    const tempPathLocation = Folder.temp;
    const tempFile = `${tempPathLocation.fsName}/Transformation_DevSA_${setName}.aia`;
    const aiaFile = new File(tempFile);

    aiaFile.open("w");
    aiaFile.write(content);
    aiaFile.close();

    return aiaFile;
  }

  private selectionHandler(item: PageItem, type: boolean): void {
    if (!type) {
      app.executeMenuCommand("deselectall");
    } else {
      item.selected = type;
    }
  }

  private loadActionSet(setName: string, template: string[]): void {
    const file = this.createAiaFile({
      content: template.join("\n"),
      setName,
    });

    app.loadAction(file);
    this.currentSets[setName] = true;
    file.remove();
  }

  move({ deltaX, deltaY, item }: Move): void {
    const setName = `Trans_Move_${deltaX}x${deltaY}`;

    this.selectionHandler(item, true);

    if (this.currentSets[setName]) {
      app.doScript(setName, setName);
      this.selectionHandler(item, false);
      return;
    }

    const hexName = Utils.hexString(setName);
    const template = [...this.templateMove];
    const hexByteLength = hexName.length / 2;

    // Update set and action names
    template[1] = `/name [ ${hexByteLength}`;
    template[2] = hexName;
    template[7] = `/name [ ${hexByteLength}`;
    template[8] = hexName;

    // Update delta values
    template[29] = `/value ${deltaX.toFixed(4)}`;
    template[36] = `/value ${deltaY.toFixed(4)}`;

    this.loadActionSet(setName, template);
    app.doScript(setName, setName);
    this.selectionHandler(item, false);
  }

  scale({ scaleFacX, scaleFacY, item }: Scale): void {
    const setName = `Trans_Scale_${scaleFacX.toFixed(0)}x${scaleFacY.toFixed(0)}`;

    this.selectionHandler(item, true);

    if (this.currentSets[setName]) {
      app.doScript(setName, setName);
      this.selectionHandler(item, false);
      return;
    }

    const hexName = Utils.hexString(setName);
    const template = [...this.templateScale];
    const hexByteLength = hexName.length / 2;

    // Update set and action names
    template[1] = `/name [ ${hexByteLength}`;
    template[2] = hexName;
    template[7] = `/name [ ${hexByteLength}`;
    template[8] = hexName;

    // Update scale factor values
    template[41] = `/value ${scaleFacX.toFixed(4)}`;
    template[48] = `/value ${scaleFacY.toFixed(4)}`;

    this.loadActionSet(setName, template);
    app.doScript(setName, setName);
    this.selectionHandler(item, false);
  }

  rotate({ deg, item }: Rotate): void {
    const setName = `Trans_Rotate_${deg}`;

    this.selectionHandler(item, true);

    if (this.currentSets[setName]) {
      app.doScript(setName, setName);
      this.selectionHandler(item, false);
      return;
    }

    const hexName = Utils.hexString(setName);
    const template = [...this.templateRotate];
    const hexByteLength = hexName.length / 2;

    // Update set and action names
    template[1] = `/name [ ${hexByteLength}`;
    template[2] = hexName;
    template[7] = `/name [ ${hexByteLength}`;
    template[8] = hexName;

    // Update rotation angle
    template[37] = `/value ${deg.toFixed(4)}`;

    this.loadActionSet(setName, template);
    app.doScript(setName, setName);
    this.selectionHandler(item, false);
  }

  removeAll(): void {
    for (const setName in this.currentSets) {
      app.unloadAction(setName, "");
    }

    this.currentSets = {};
  }
}

interface TransActionHandlerParams {
  doc: Document;
}

interface CurrentSets {
  [key: string]: boolean;
}

interface Move {
  item: PageItem;
  deltaX: number;
  deltaY: number;
}

interface Scale {
  item: PageItem;
  scaleFacX: number;
  scaleFacY: number;
}

interface Rotate {
  item: PageItem;
  deg: RotateDegrees;
}

interface CreateAiaFile {
  setName: string;
  content: string;
}
