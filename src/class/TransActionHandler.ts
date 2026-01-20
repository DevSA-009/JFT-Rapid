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

	private templateRotate = [
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

	private templateScale = [
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

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
		});

		if (this.currentSets[setName]) {
			// app.doScript(setName, setName);

			Organizer.docSelectionHandler({
				doc: this.doc,
				items: [item],
				type: false,
			});
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

		this.currentSets[setName] = true;

		file.remove();

		// app.doScript(setName,setName);

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
			type: false,
		});
	}

	scale(params: Scale) {
		const { scaleFacX, scaleFacY, item } = params;

		const setName = `Trans_Scale_${scaleFacX.toFixed(0)}x${scaleFacY.toFixed(0)}`;

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
		});

		if (this.currentSets[setName]) {
			// app.doScript(setName, setName);

			Organizer.docSelectionHandler({
				doc: this.doc,
				items: [item],
				type: false,
			});
		}

		const setNameInHex = Utils.hexString(setName);

		const template = [...this.templateScale];

		// update set name hex byte length
		template[1] = `/name [ ${setNameInHex.length / 2}`;

		// update set name in hex string
		template[2] = `${setNameInHex}`;

		// update action name hex byte length
		template[7] = `/name [ ${setNameInHex.length / 2}`;

		// update action name in hex string
		template[8] = `${setNameInHex}`;

		//  update scale factor x value
		template[41] = `/value ${scaleFacX.toFixed(4)}`;

		//  update scale factor y value
		template[48] = `/value ${scaleFacY.toFixed(4)}`;

		const file = this.createAiaFile({
			content: template.join("\n"),
			setName,
		});

		app.loadAction(file);

		this.currentSets[setName] = true;

		file.remove();

		// app.doScript(setName,setName);

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
			type: false,
		});
	}

	rotate(params: Rotate) {
		const { deg, item } = params;

		const setName = `Trans_Rotate_${deg}`;

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
		});

		if (this.currentSets[setName]) {
			// app.doScript(setName, setName);

			Organizer.docSelectionHandler({
				doc: this.doc,
				items: [item],
				type: false,
			});
		}

		const setNameInHex = Utils.hexString(setName);

		const template = [...this.templateRotate];

		// update set name hex byte length
		template[1] = `/name [ ${setNameInHex.length / 2}`;

		// update set name in hex string
		template[2] = `${setNameInHex}`;

		// update action name hex byte length
		template[7] = `/name [ ${setNameInHex.length / 2}`;

		// update action name in hex string
		template[8] = `${setNameInHex}`;

		// update rotate angel value
		template[37] = `/value ${deg.toFixed(4)}`;

		const file = this.createAiaFile({
			content: template.join("\n"),
			setName,
		});

		app.loadAction(file);

		this.currentSets[setName] = true;

		file.remove();

		// app.doScript(setName,setName);

		Organizer.docSelectionHandler({
			doc: this.doc,
			items: [item],
			type: false,
		});
	}

	public removeAll() {
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
