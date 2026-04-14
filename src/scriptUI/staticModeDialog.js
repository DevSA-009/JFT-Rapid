/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":201,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":"dlg","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"JFT Static Mode","preferredSize":[0,0],"margins":16,"orientation":"column","spacing":6,"alignChildren":["fill","top"]}},"item-1":{"id":1,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"mainRow","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":8,"alignChildren":["fill","fill"],"alignment":null}},"item-2":{"id":2,"type":"Panel","parentId":1,"style":{"enabled":true,"varName":"configPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Config","preferredSize":[220,0],"margins":[10,12,10,10],"orientation":"column","spacing":8,"alignChildren":["fill","top"],"alignment":null}},"item-10":{"id":10,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"configRow1","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":8,"alignChildren":["fill","top"],"alignment":null}},"item-11":{"id":11,"type":"Group","parentId":10,"style":{"enabled":true,"varName":"paperWidthCell","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":3,"alignChildren":["center","center"],"alignment":null}},"item-12":{"id":12,"type":"StaticText","parentId":11,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Paper W","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-13":{"id":13,"type":"EditText","parentId":11,"style":{"enabled":true,"varName":"paperWidthInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"63.3","justify":"center","preferredSize":[68,0],"alignment":null,"helpTip":"Maximum paper width in inches (e.g. 63.3)"}},"item-14":{"id":14,"type":"Group","parentId":10,"style":{"enabled":true,"varName":"orientCell","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":3,"alignChildren":["center","center"],"alignment":null}},"item-15":{"id":15,"type":"StaticText","parentId":14,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Orient.","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-16":{"id":16,"type":"DropDownList","parentId":14,"style":{"enabled":true,"varName":"orientationDropdown","text":"DropDownList","listItems":"Auto,Vertical,Horizontal","preferredSize":[90,0],"alignment":null,"selection":0,"helpTip":"Stack orientation: Auto lets the engine decide, Vertical forces portrait stacking, Horizontal forces landscape"}},"item-20":{"id":20,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"configRow2","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":8,"alignChildren":["fill","top"],"alignment":null}},"item-21":{"id":21,"type":"Group","parentId":20,"style":{"enabled":true,"varName":"brandCell","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":3,"alignChildren":["center","center"],"alignment":null}},"item-22":{"id":22,"type":"StaticText","parentId":21,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Brand","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-23":{"id":23,"type":"DropDownList","parentId":21,"style":{"enabled":true,"varName":"brandDropdown","text":"DropDownList","listItems":"JFT,A,B,C","preferredSize":[68,0],"alignment":null,"selection":0,"helpTip":"Size chart brand — determines garment dimensions loaded from JFT_CONF"}},"item-24":{"id":24,"type":"Group","parentId":20,"style":{"enabled":true,"varName":"gapCell","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":3,"alignChildren":["center","center"],"alignment":null}},"item-25":{"id":25,"type":"StaticText","parentId":24,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Gap","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-26":{"id":26,"type":"EditText","parentId":24,"style":{"enabled":true,"varName":"itemsGapInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"0.1","justify":"center","preferredSize":[90,0],"alignment":null,"helpTip":"Gap between placed items in inches (e.g. 0.1)"}},"item-30":{"id":30,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"checkRow","preferredSize":[0,0],"margins":[0,4,0,0],"orientation":"row","spacing":14,"alignChildren":["center","center"],"alignment":["center","top"]}},"item-31":{"id":31,"type":"Checkbox","parentId":30,"style":{"enabled":true,"varName":"actionThreadChk","text":"Action","preferredSize":[0,0],"alignment":null,"helpTip":"Action engine: uses Illustrator action files for transforms — more reliable on masked or compound artwork","checked":true}},"item-32":{"id":32,"type":"Checkbox","parentId":30,"style":{"enabled":true,"varName":"rangeChk","text":"Range","preferredSize":[0,0],"alignment":null,"helpTip":"Range: merge adjacent sizes (e.g. XS-S, M-L) so sleeve pieces share a single layout document","checked":true}},"item-40":{"id":40,"type":"Panel","parentId":2,"style":{"enabled":true,"varName":"sep","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"","preferredSize":[0,1],"margins":0,"orientation":"column","spacing":0,"alignChildren":["fill","top"],"alignment":["fill","top"]}},"item-41":{"id":41,"type":"Group","parentId":2,"style":{"enabled":true,"varName":"previewGrp","preferredSize":[0,0],"margins":0,"orientation":"column","spacing":3,"alignChildren":["fill","fill"],"alignment":["fill","fill"]}},"item-42":{"id":42,"type":"StaticText","parentId":41,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Generated String:","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-43":{"id":43,"type":"EditText","parentId":41,"style":{"enabled":true,"varName":"previewField","creationProps":{"noecho":false,"readonly":true,"multiline":true,"scrollable":true,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":true,"text":"","justify":"left","preferredSize":[0,0],"alignment":["fill","fill"],"helpTip":"Read-only preview — updates live as you change controls. This string is passed to jftProcessSeqWrapper on Start"}},"item-50":{"id":50,"type":"Panel","parentId":1,"style":{"enabled":true,"varName":"dataPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Static Data","preferredSize":[0,0],"margins":[10,12,10,10],"orientation":"column","spacing":6,"alignChildren":["fill","top"],"alignment":null}},"item-51":{"id":51,"type":"Group","parentId":50,"style":{"enabled":true,"varName":"globalRow","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["center","center"],"alignment":null}},"item-52":{"id":52,"type":"Group","parentId":51,"style":{"enabled":true,"varName":"typeCell","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":4,"alignChildren":["center","center"],"alignment":null}},"item-53":{"id":53,"type":"StaticText","parentId":52,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Type:","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-54":{"id":54,"type":"DropDownList","parentId":52,"style":{"enabled":true,"varName":"typeDropdown","text":"DropDownList","listItems":"POLO,TSHIRT","preferredSize":[72,0],"alignment":null,"selection":0,"helpTip":"POLO: generates Placket + Collar pieces  |  TSHIRT: generates Neck piece only"}},"item-55":{"id":55,"type":"Group","parentId":51,"style":{"enabled":true,"varName":"ribCell","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":4,"alignChildren":["center","center"],"alignment":null}},"item-56":{"id":56,"type":"StaticText","parentId":55,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Rib:","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-57":{"id":57,"type":"DropDownList","parentId":55,"style":{"enabled":true,"varName":"ribDropdown","text":"DropDownList","listItems":"NO,RIB,CUFF","preferredSize":[60,0],"alignment":null,"selection":0,"helpTip":"NO: no rib pieces  |  RIB: standard rib  |  CUFF: cuff rib (short sleeve qty doubled)"}},"item-60":{"id":60,"type":"Group","parentId":51,"style":{"enabled":true,"varName":"slvCell","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":4,"alignChildren":["left","center"],"alignment":null}},"item-61":{"id":61,"type":"StaticText","parentId":60,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"SLV:","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-62":{"id":62,"type":"Group","parentId":60,"style":{"enabled":true,"varName":"slvChkGrp","preferredSize":[0,0],"margins":[0,5,0,0],"orientation":"row","spacing":4,"alignChildren":["left","center"],"alignment":null}},"item-63":{"id":63,"type":"Checkbox","parentId":62,"style":{"enabled":true,"varName":"slvShortChk","text":"S","preferredSize":[0,0],"alignment":null,"helpTip":"Short sleeve: include SHORT_SLEEVE layout documents","checked":true}},"item-64":{"id":64,"type":"Checkbox","parentId":62,"style":{"enabled":true,"varName":"slvLongChk","text":"L","preferredSize":[0,0],"alignment":null,"helpTip":"Long sleeve: include LONG_SLEEVE layout documents","checked":true}},"item-65":{"id":65,"type":"Group","parentId":51,"style":{"enabled":true,"varName":"pantCell","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":4,"alignChildren":["left","center"],"alignment":null}},"item-66":{"id":66,"type":"StaticText","parentId":65,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Pant:","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-67":{"id":67,"type":"Group","parentId":65,"style":{"enabled":true,"varName":"pantChkGrp","preferredSize":[0,0],"margins":[0,5,0,0],"orientation":"row","spacing":4,"alignChildren":["left","center"],"alignment":null}},"item-68":{"id":68,"type":"Checkbox","parentId":67,"style":{"enabled":true,"varName":"pantShortChk","text":"S","preferredSize":[0,0],"alignment":null,"helpTip":"Short pant: include SHORT_PANT layout documents","checked":true}},"item-69":{"id":69,"type":"Checkbox","parentId":67,"style":{"enabled":true,"varName":"pantLongChk","text":"L","preferredSize":[0,0],"alignment":null,"helpTip":"Long pant: include LONG_PANT layout documents","checked":true}},"item-70":{"id":70,"type":"Group","parentId":50,"style":{"enabled":true,"varName":"tableRow","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":10,"alignChildren":["fill","fill"],"alignment":null}},"item-71":{"id":71,"type":"Panel","parentId":70,"style":{"enabled":true,"varName":"adultColPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Adult","preferredSize":[0,0],"margins":[6,10,6,6],"orientation":"column","spacing":2,"alignChildren":["left","top"],"alignment":["fill","fill"]}},"item-72":{"id":72,"type":"Panel","parentId":70,"style":{"enabled":true,"varName":"kidsColPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Kids","preferredSize":[0,0],"margins":[6,10,6,6],"orientation":"column","spacing":2,"alignChildren":["left","top"],"alignment":["fill","fill"]}},"item-200":{"id":200,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"bottomRow","preferredSize":[0,0],"margins":[0,2,0,0],"orientation":"row","spacing":0,"alignChildren":["right","center"],"alignment":null}},"item-201":{"id":201,"type":"Button","parentId":200,"style":{"enabled":true,"varName":"startBtn","text":"Start","justify":"center","preferredSize":[80,0],"alignment":null,"helpTip":"Validate, apply CONFIG settings, and run the JFT static-mode layout pipeline"}}},"order":[0,1,2,10,11,12,13,14,15,16,20,21,22,23,24,25,26,30,31,32,40,41,42,43,50,51,52,53,54,55,56,57,60,61,62,63,64,65,66,67,68,69,70,71,72,200,201],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

/**
 * staticModeDialog
 *
 * ScriptUI dialog for the JFT static-mode layout pipeline.
 *
 * ── Layout (landscape, wide over tall) ──────────────────────────────────────
 *
 *  ┌─ Dialog (~780 × ~340 px) ─────────────────────────────────────────────┐
 *  │  ┌─ Config (30%) ───────┐  ┌─ Static Data (70%) ─────────────────────┐│
 *  │  │  Paper W  Orient.    │  │  Type:[v]  Rib:[v]  SLV:☑S ☑L  Pant:☑S ☑L││
 *  │  │  Brand    Gap         │  │  ┌── Adult sizes ──┐  ┌── Kids sizes ──┐  ││
 *  │  │     ☑ Action  ☑ Range│  │  │Size Qty SS LS SP│  │Size Qty SS LS SP│  ││
 *  │  │─────────────────────-│  │  │ XS  _  _  _  _ │  │  2  _  _  _  _ │  ││
 *  │  │  Generated String:   │  │  │  S  _  _  _  _ │  │  4  _  _  _  _ │  ││
 *  │  │  [preview (fill)] ↕  │  │  │  M  _  _  _  _ │  │  6  _  _  _  _ │  ││
 *  │  └─────────────────────-┘  │  │  …               │  │  …              │  ││
 *  │                             │  └─────────────────┘  └────────────────┘  ││
 *  │                             └──────────────────────────────────────────┘ │
 *  │                                                                [ Start ]  │
 *  └─────────────────────────────────────────────────────────────────────────┘
 *
 * Key dimensions:
 *   - Dialog total width  ≈ 780 px
 *   - Left Config panel   ≈ 220 px  (30 %)
 *   - Right Data panel    ≈ 530 px  (70 %)
 *   - Size table: adult + kids split into two columns → height halved
 *   - Preview lives in the left panel, keeping the right panel free of it
 *
 * On Start:
 *   1. Validates at least one size has a positive QTY.
 *   2. Writes left-panel values into CONFIG.
 *   3. Forces CONFIG.STATIC_MODE = true.
 *   4. Calls jftProcessSeqWrapper(builtString).
 */
const staticModeDialog = () => {
  try {
    Organizer.checkDocument();

    // ─── Size definitions ────────────────────────────────────────────────
    // Split into two groups so we can render side-by-side columns:
    //   adultSizes → left column of the table
    //   kidsSizes  → right column of the table
    // Together they cover all SIZE_ORDER_MAP keys.
    const ALL_SIZES = Object.keys(SIZE_ORDER_MAP);

    // ScriptUI element names must not contain characters outside [a-zA-Z0-9_].
    // This sanitiser handles size keys like "2XL" that start with a digit.
    function safeName(sizeKey) {
      return sizeKey.replace(/[^a-zA-Z0-9]/g, "_");
    }

    // ─── Shared column geometry ──────────────────────────────────────────
    // All numbers below are in pixels.  Changing COL_* here is the single
    // source of truth — header labels and cell widths read from these values.
    const COL_SIZE = 32; // "Size" label column
    const COL_QTY = 40; // "Qty" input column
    const COL_SS = 36; // "SS" input column
    const COL_LS = 36; // "LS" input column
    const COL_SP = 36; // "SP" input column
    const COL_LP = 36; // "LP" input column
    const COL_GAP = 3; // spacing between cells inside one row

    // ─── Root dialog ─────────────────────────────────────────────────────
    const dlg = new Window("dialog");
    dlg.text = "JFT Static Mode";
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 6;
    dlg.margins = 16;

    // ── Main content row: Config (left 30%) + Data (right 70%) ───────────
    const mainRow = dlg.add("group");
    mainRow.orientation = "row";
    mainRow.alignChildren = ["fill", "fill"];
    mainRow.spacing = 8;
    mainRow.margins = 0;

    // ══════════════════════════════════════════════════════════════════════
    // LEFT PANEL — Config (30 %)
    // ══════════════════════════════════════════════════════════════════════
    const configPanel = mainRow.add("panel");
    configPanel.text = "Config";
    configPanel.preferredSize.width = 220;
    configPanel.orientation = "column";
    configPanel.alignChildren = ["fill", "top"];
    configPanel.spacing = 8;
    configPanel.margins = [10, 12, 10, 10];

    // ── Row 1: Paper Width + Orientation side by side ────────────────────
    const configRow1 = configPanel.add("group");
    configRow1.orientation = "row";
    configRow1.alignChildren = ["fill", "top"];
    configRow1.spacing = 8;

    // Paper Width cell
    const paperWidthCell = configRow1.add("group");
    paperWidthCell.orientation = "column";
    paperWidthCell.alignChildren = ["center", "center"];
    paperWidthCell.spacing = 3;

    paperWidthCell.add("statictext", undefined, "Paper W").justify = "center";

    const paperWidthInput = paperWidthCell.add('edittext {justify: "center"}');
    paperWidthInput.helpTip = "Maximum paper width in inches (e.g. 63.3)";
    paperWidthInput.text = CONFIG.PAPER_MAX_SIZE.toString();
    paperWidthInput.preferredSize.width = 68;

    // Orientation cell
    const orientCell = configRow1.add("group");
    orientCell.orientation = "column";
    orientCell.alignChildren = ["center", "center"];
    orientCell.spacing = 3;

    orientCell.add("statictext", undefined, "Orient.").justify = "center";

    const orientationDropdown = orientCell.add(
      "dropdownlist",
      undefined,
      undefined,
    );
    orientationDropdown.preferredSize.width = 90;
    orientationDropdown.helpTip =
      "Stack orientation: Auto lets the engine decide, Vertical forces portrait stacking, Horizontal forces landscape";

    // Populate from StackOrientations enum keys
    const orientationKeys = Object.keys(StackOrientations);
    orientationKeys.forEach(function (key) {
      orientationDropdown.add("item", key);
    });
    // Pre-select the key matching the current CONFIG.ORIENTATION value
    let currentOrientationIdx = 0;
    orientationKeys.forEach(function (key, idx) {
      if (StackOrientations[key] === CONFIG.ORIENTATION)
        currentOrientationIdx = idx;
    });
    orientationDropdown.selection = currentOrientationIdx;

    // ── Row 2: Brand Size + Items Gap side by side ───────────────────────
    const configRow2 = configPanel.add("group");
    configRow2.orientation = "row";
    configRow2.alignChildren = ["fill", "top"];
    configRow2.spacing = 8;

    // Brand cell
    const brandCell = configRow2.add("group");
    brandCell.orientation = "column";
    brandCell.alignChildren = ["center", "center"];
    brandCell.spacing = 3;

    brandCell.add("statictext", undefined, "Brand").justify = "center";

    const brandDropdown = brandCell.add("dropdownlist", undefined, undefined);
    brandDropdown.preferredSize.width = 68;
    brandDropdown.helpTip =
      "Size chart brand - determines garment dimensions loaded from JFT_CONF";

    // Populate brand list from JFT_CONF.sizes keys
    const brandKeys = Object.keys(JFT_CONF.sizes);
    brandKeys.forEach(function (key) {
      brandDropdown.add("item", key);
    });
    const currentBrandIdx = brandKeys.indexOf(CONFIG.BRAND);
    brandDropdown.selection = currentBrandIdx >= 0 ? currentBrandIdx : 0;

    // Gap cell
    const gapCell = configRow2.add("group");
    gapCell.orientation = "column";
    gapCell.alignChildren = ["center", "center"];
    gapCell.spacing = 3;

    gapCell.add("statictext", undefined, "Gap").justify = "center";

    const itemsGapInput = gapCell.add('edittext {justify: "center"}');
    itemsGapInput.helpTip =
      "Gap between distributed placed items in inches (e.g. 0.1)";
    itemsGapInput.text = 0.1;
    itemsGapInput.preferredSize.width = 90;

    // ── Row 3: Checkboxes centered horizontally ──────────────────────────
    const checkRow = configPanel.add("group");
    checkRow.orientation = "row";
    checkRow.alignChildren = ["center", "center"]; // x and y center
    checkRow.spacing = 14;
    checkRow.margins = [0, 4, 0, 0];
    checkRow.alignment = ["center", "top"]; // center the row itself inside the panel

    const actionThreadChk = checkRow.add(
      "checkbox",
      undefined,
      "Action Thread",
    );
    actionThreadChk.helpTip =
      "Action engine: uses Illustrator action files for transforms — more reliable on masked or compound artwork";
    actionThreadChk.value = CONFIG.THREAD_ENGINE === "action";

    const rangeChk = checkRow.add("checkbox", undefined, "Range");
    rangeChk.helpTip =
      "Range: merge adjacent sizes (e.g. XS-S, M-L) so sleeve pieces share a single layout document";
    rangeChk.value = true; // always default true regardless of current CONFIG state

    // ── Separator ────────────────────────────────────────────────────────
    const sep = configPanel.add("panel");
    sep.preferredSize.height = 1;
    sep.alignment = ["fill", "top"];

    // ── Preview (Generated String) ───────────────────────────────────────
    // Fills all remaining vertical space inside the Config panel so its height
    // always matches the right panel height — no fixed pixel value needed.
    const previewGrp = configPanel.add("group");
    previewGrp.orientation = "column";
    previewGrp.alignChildren = ["fill", "fill"];
    previewGrp.alignment = ["fill", "fill"]; // stretch to fill remaining panel height
    previewGrp.spacing = 3;

    previewGrp.add("statictext", undefined, "Generated String:").justify =
      "left";

    const previewField = previewGrp.add(
      'edittext {justify: "left", properties: {multiline: true, readonly: true}}',
    );
    // fill both axes — height grows to match whatever space the panel has left
    previewField.alignment = ["fill", "fill"];
    previewField.helpTip =
      "Read-only preview — updates live as you change controls. This string is passed to jftProcessSeqWrapper on Start";

    // ══════════════════════════════════════════════════════════════════════
    // RIGHT PANEL — Static Data (70 %)
    // ══════════════════════════════════════════════════════════════════════
    const dataPanel = mainRow.add("panel");
    dataPanel.text = "Static Data";
    dataPanel.orientation = "column";
    dataPanel.alignChildren = ["fill", "top"];
    dataPanel.spacing = 6;
    dataPanel.margins = [10, 12, 10, 10];

    // ── Compact global-config row: Type, Rib, Slv, Pant all in one line ──
    const globalRow = dataPanel.add("group");
    globalRow.orientation = "row";
    globalRow.alignChildren = ["center", "center"];
    globalRow.spacing = 10;

    // TYPE dropdown
    const typeCell = globalRow.add("group");
    typeCell.orientation = "row";
    typeCell.alignChildren = ["center", "center"];
    typeCell.spacing = 4;
    typeCell.add("statictext", undefined, "Type:");

    const typeDropdown = typeCell.add("dropdownlist", undefined, undefined);
    typeDropdown.add("item", "POLO");
    typeDropdown.add("item", "TSHIRT");
    typeDropdown.selection = 0;
    typeDropdown.preferredSize.width = 72;
    typeDropdown.helpTip =
      "POLO: generates Placket + Collar pieces  |  TSHIRT: generates Neck piece only";

    // RIB dropdown
    const ribCell = globalRow.add("group");
    ribCell.orientation = "row";
    ribCell.alignChildren = ["center", "center"];
    ribCell.spacing = 4;
    ribCell.add("statictext", undefined, "RIB:");

    const ribDropdown = ribCell.add("dropdownlist", undefined, undefined);
    ribDropdown.add("item", "NO");
    ribDropdown.add("item", "RIB");
    ribDropdown.add("item", "CUFF");
    ribDropdown.selection = 0;
    ribDropdown.preferredSize.width = 60;
    ribDropdown.helpTip =
      "NO: no rib pieces  |  RIB: standard rib  |  CUFF: cuff rib (short sleeve qty doubled)";

    // SLV — label sits directly in slvCell, checkboxes wrapped in their own
    // group with a top margin of 5 px so they visually align with the label.
    const slvCell = globalRow.add("group");
    slvCell.orientation = "row";
    slvCell.alignChildren = ["left", "center"];
    slvCell.spacing = 4;

    slvCell.add("statictext", undefined, "SLV:");

    // Checkbox wrapper — top margin nudges checkboxes down to align with label
    const slvChkGrp = slvCell.add("group");
    slvChkGrp.orientation = "row";
    slvChkGrp.alignChildren = ["left", "center"];
    slvChkGrp.spacing = 4;
    slvChkGrp.margins = [0, 5, 0, 0]; // top:5 aligns checkboxes with the label baseline

    const slvShortChk = slvChkGrp.add("checkbox", undefined, "S");
    slvShortChk.helpTip = "Short sleeve: include SHORT_SLEEVE layout documents";
    slvShortChk.value = true;

    const slvLongChk = slvChkGrp.add("checkbox", undefined, "L");
    slvLongChk.helpTip = "Long sleeve: include LONG_SLEEVE layout documents";
    slvLongChk.value = true;

    // PANT — same structure as SLV
    const pantCell = globalRow.add("group");
    pantCell.orientation = "row";
    pantCell.alignChildren = ["left", "center"];
    pantCell.spacing = 4;

    pantCell.add("statictext", undefined, "Pant:");

    // Checkbox wrapper — top margin nudges checkboxes down to align with label
    const pantChkGrp = pantCell.add("group");
    pantChkGrp.orientation = "row";
    pantChkGrp.alignChildren = ["left", "center"];
    pantChkGrp.spacing = 4;
    pantChkGrp.margins = [0, 5, 0, 0]; // top:5 aligns checkboxes with the label baseline

    const pantShortChk = pantChkGrp.add("checkbox", undefined, "S");
    pantShortChk.helpTip = "Short pant: include SHORT_PANT layout documents";
    pantShortChk.value = true;

    const pantLongChk = pantChkGrp.add("checkbox", undefined, "L");
    pantLongChk.helpTip = "Long pant: include LONG_PANT layout documents";
    pantLongChk.value = true;

    // ── Two-column size table ─────────────────────────────────────────────
    // Adult sizes in the left half, kids sizes in the right half.
    // This converts a 17-row tall single column into a ~9-row two-column grid,
    // roughly halving the height consumed by the table.
    const tableRow = dataPanel.add("group");
    tableRow.orientation = "row";
    tableRow.alignChildren = ["fill", "fill"]; // fill on y-axis so both columns stretch to the same height
    tableRow.spacing = 10;

    // sizeFields stores { qty, ss, ls, sp, lp } per size key for later reading
    const sizeFields = {};

    /**
     * Builds one table column (header row + one row per size) inside `parent`.
     * Column widths are driven by the shared COL_* constants at the top.
     *
     * @param {object}   parent    - ScriptUI container for this column.
     * @param {string[]} sizeGroup - Array of size keys to render.
     * @param {string}   title     - Panel title shown above the column.
     */
    function buildSizeColumn(parent, sizeGroup, title) {
      // Outer panel — alignment fill on both axes so Kids stretches to match Adult height
      const colPanel = parent.add("panel");
      colPanel.text = title;
      colPanel.orientation = "column";
      colPanel.alignChildren = ["left", "top"];
      colPanel.alignment = ["fill", "fill"]; // fill height of the tableRow container
      colPanel.spacing = 2;
      colPanel.margins = [6, 10, 6, 6];

      // ── Column header row ──────────────────────────────────────────────
      const hdr = colPanel.add("group");
      hdr.orientation = "row";
      hdr.alignChildren = ["center", "center"];
      hdr.spacing = COL_GAP;

      function hdrCell(txt, w, helpTip) {
        const lbl = hdr.add("statictext", undefined, txt);
        lbl.helpTip = helpTip || txt;
        lbl.preferredSize.width = w;
        lbl.justify = "center";
      }

      hdrCell("Size", COL_SIZE);
      hdrCell("Qty", COL_QTY, "Quantity");
      hdrCell("SS", COL_SS, "Short Sleeve");
      hdrCell("LS", COL_LS, "Long Sleeve");
      hdrCell("SP", COL_SP, "Short Pant");
      hdrCell("LP", COL_LP, "Long Pant");

      // ── One data row per size ──────────────────────────────────────────
      sizeGroup.forEach(function (sizeKey) {
        const ns = safeName(sizeKey); // safe element name suffix
        const row = colPanel.add("group");
        row.orientation = "row";
        row.alignChildren = ["center", "center"];
        row.spacing = COL_GAP;

        // Size label
        const lbl = row.add("statictext", undefined, sizeKey);
        lbl.preferredSize.width = COL_SIZE;
        lbl.justify = "right";

        // Helper: one input cell with fixed width and a helpTip
        function addCell(_, tip, w) {
          const cell = row.add('edittext {justify: "center"}');

          cell.preferredSize.width = w;
          cell.helpTip = tip;
          return cell;
        }

        const qtyCell = addCell(
          "qty_" + ns,
          "Body qty for " + sizeKey + " (blank = skip)",
          COL_QTY,
        );
        const ssCell = addCell(
          "ss_" + ns,
          "Short sleeve override - blank inherits qty",
          COL_SS,
        );
        const lsCell = addCell(
          "ls_" + ns,
          "Long sleeve override - blank inherits qty",
          COL_LS,
        );
        const spCell = addCell(
          "sp_" + ns,
          "Short pant override - blank inherits qty",
          COL_SP,
        );
        const lpCell = addCell(
          "lp_" + ns,
          "Long pant override - blank inherits qty",
          COL_LP,
        );

        // Register in the shared lookup table
        sizeFields[sizeKey] = {
          qty: qtyCell,
          ss: ssCell,
          ls: lsCell,
          sp: spCell,
          lp: lpCell,
        };
      });
    }

    // Build the two side-by-side columns
    buildSizeColumn(tableRow, Object.keys(ADULT_SIZES), "Adult");
    buildSizeColumn(tableRow, Object.keys(KIDS_SIZES), "Kids");

    // ══════════════════════════════════════════════════════════════════════
    // BOTTOM ROW — Start button (full width, right-aligned)
    // ══════════════════════════════════════════════════════════════════════
    const bottomRow = dlg.add("group");
    bottomRow.orientation = "row";
    bottomRow.alignChildren = ["right", "center"];
    bottomRow.spacing = 0;
    bottomRow.margins = [0, 2, 0, 0];

    const startBtn = bottomRow.add("button", undefined, "Start", {
      name: "ok",
    });
    startBtn.helpTip =
      "Validate, apply CONFIG settings, and run the JFT static-mode layout pipeline";
    startBtn.active = true;
    startBtn.preferredSize.width = 80;

    // ══════════════════════════════════════════════════════════════════════
    // STRING BUILDER
    // ══════════════════════════════════════════════════════════════════════

    /**
     * Reads all right-panel controls and assembles the static-mode string.
     *
     * Rules:
     *  - TYPE and RIB are always emitted.
     *  - SLV / PANT segments are omitted when no checkbox is checked.
     *  - A size entry is emitted only when QTY > 0.
     *  - Per-size overrides (SS/LS/SP/LP) are appended only when the value
     *    is a valid integer that differs from the base QTY.
     *
     * @returns {string} Comma-separated static-mode input string.
     */
    function buildStaticString() {
      const parts = [];

      // Global keys
      parts.push(
        "TYPE=" +
          (typeDropdown.selection ? typeDropdown.selection.text : "POLO"),
      );
      parts.push(
        "RIB=" + (ribDropdown.selection ? ribDropdown.selection.text : "NO"),
      );

      const slvParts = [];
      if (slvShortChk.value) slvParts.push("S");
      if (slvLongChk.value) slvParts.push("L");
      if (slvParts.length) parts.push("SLV=" + slvParts.join("."));

      const pantParts = [];
      if (pantShortChk.value) pantParts.push("S");
      if (pantLongChk.value) pantParts.push("L");
      if (pantParts.length) parts.push("PANT=" + pantParts.join("."));

      // Size entries — iterate in the canonical order defined by ALL_SIZES
      ALL_SIZES.forEach((sizeKey) => {
        const fields = sizeFields[sizeKey];
        const qty = parseInt((fields.qty.text || "").trim(), 10);

        // Skip sizes with no valid positive quantity
        if (isNaN(qty) || qty <= 0) return;

        // Base segment: SIZE=qty — must be let so override tokens can be appended
        let segment = sizeKey + "=" + qty;

        /**
         * Returns the integer from `field` when it is a valid number different
         * from `qty`; returns null when blank, non-numeric, or redundant.
         */
        function readOverride(field) {
          const raw = (field.text || "").trim();
          if (!raw) return null;
          const n = parseInt(raw, 10);
          if (isNaN(n) || n === qty) return null;
          return n;
        }

        const ssVal = readOverride(fields.ss);
        const lsVal = readOverride(fields.ls);
        const spVal = readOverride(fields.sp);
        const lpVal = readOverride(fields.lp);

        if (ssVal !== null) segment += ".SS" + ssVal;
        if (lsVal !== null) segment += ".LS" + lsVal;
        if (spVal !== null) segment += ".SP" + spVal;
        if (lpVal !== null) segment += ".LP" + lpVal;

        parts.push(segment);
      });

      // ScriptUI edittext has no CSS padding property.
      // Prepend a single space so text does not render flush against the left edge,
      // giving the appearance of inner horizontal padding.
      return " " + parts.join(",");
    }

    /**
     * Rebuilds the preview field from current control state.
     * Attached to onChange / onChanging / onClick of every interactive control.
     */
    function refreshPreview() {
      previewField.text = buildStaticString();
    }

    // ══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ══════════════════════════════════════════════════════════════════════

    paperWidthInput.addEventListener("keydown", Utils.floatKeydown);
    itemsGapInput.addEventListener("keydown", Utils.floatKeydown);

    // Right-panel global controls rebuild the preview on change
    typeDropdown.onChange = refreshPreview;
    ribDropdown.onChange = refreshPreview;

    slvShortChk.onClick = refreshPreview;
    slvLongChk.onClick = refreshPreview;
    pantShortChk.onClick = refreshPreview;
    pantLongChk.onClick = refreshPreview;

    // Size table: digit-only validator + preview rebuild per cell
    ALL_SIZES.forEach((sizeKey) => {
      const fields = sizeFields[sizeKey];

      // Integer validator — no decimal in size quantities
      function intKeydown(event) {
        const key = event.keyName;

        // === Allow modifier shortcuts (Ctrl/Cmd + A, C, V, X) ===
        if (
          (event.ctrlKey || event.metaKey) &&
          (key === "A" || key === "C" || key === "V" || key === "X")
        ) {
          return;
        }

        // === Allow standalone modifier keys ===
        if (event.ctrlKey || event.metaKey || event.altKey || key === "Shift") {
          return;
        }

        // === Allow control/navigation keys ===
        if (
          key === "Backspace" ||
          key === "Delete" ||
          key === "Escape" ||
          key === "Tab" ||
          key === "Left" ||
          key === "Right" ||
          key === "Up" ||
          key === "Enter" ||
          key === "Down" ||
          key === "Home" ||
          key === "End"
        ) {
          return;
        }

        // === Block decimal input explicitly ===
        if (key === "Period" || key === "Decimal") {
          event.preventDefault();
          return;
        }

        // === Allow digits only (0–9) ===
        if (!/^[0-9]$/.test(key)) {
          event.preventDefault();
          return;
        }
      }

      fields.qty.addEventListener("keydown", intKeydown);
      fields.ss.addEventListener("keydown", intKeydown);
      fields.ls.addEventListener("keydown", intKeydown);
      fields.sp.addEventListener("keydown", intKeydown);
      fields.lp.addEventListener("keydown", intKeydown);

      // onChanging fires on every keystroke — keeps the preview live
      fields.qty.onChanging = refreshPreview;
      fields.ss.onChanging = refreshPreview;
      fields.ls.onChanging = refreshPreview;
      fields.sp.onChanging = refreshPreview;
      fields.lp.onChanging = refreshPreview;
    });

    // ══════════════════════════════════════════════════════════════════════
    // START BUTTON
    // ══════════════════════════════════════════════════════════════════════
    startBtn.onClick = function () {
      // Validate: at least one size must have a positive QTY.
      // Must be let — const cannot be reassigned inside the forEach callback.
      let hasSizeEntry = false;
      ALL_SIZES.forEach((sizeKey) => {
        const qty = parseInt(sizeFields[sizeKey].qty.text || "", 10);
        if (!isNaN(qty) && qty > 0) hasSizeEntry = true;
      });

      if (!hasSizeEntry) {
        alertDialogSA(
          "Enter a quantity for at least one size before starting.",
        );
        return;
      }

      // ── Write left-panel values into CONFIG ──────────────────────────

      const paperWidthVal = parseFloat(paperWidthInput.text);
      CONFIG.PAPER_MAX_SIZE = paperWidthVal;

      const itemGapVal = parseFloat(itemsGapInput.text);
      // Bug fix: was CONFIG.DIST_ITEMS_GAP — correct key is CONFIG.ITEMS_GAP
      CONFIG.ITEMS_GAP =
        !isNaN(itemGapVal) && itemGapVal >= 0 ? itemGapVal : 0.1;

      // Map the selected orientation key to its StackOrientations enum value
      const orientKey = orientationDropdown.selection
        ? orientationDropdown.selection.text
        : "Auto";
      CONFIG.ORIENTATION = StackOrientations[orientKey];

      // Update brand and reload the matching size-detail table
      CONFIG.BRAND = brandDropdown.selection
        ? brandDropdown.selection.text
        : CONFIG.BRAND;
      CONFIG.SIZES_DETAILS = CONFIG.JFT_CONF["sizes"][CONFIG.BRAND];

      CONFIG.THREAD_ENGINE = actionThreadChk.value ? "action" : "script";
      CONFIG.DIMENSION_RANGE = rangeChk.value;
      CONFIG.STATIC_MODE = true; // this dialog is exclusively for static mode

      // Close the dialog, then immediately delegate to the pipeline wrapper.
      // jftProcessSeqWrapper must be called here — staticStr is only in scope
      // inside this onClick closure. Calling it in the outer result===1 block
      // caused a ReferenceError because staticStr was not accessible there.
      dlg.close(1);
    };

    // ── Initial preview render ────────────────────────────────────────────
    // Populate the preview once on open so it is never blank.
    refreshPreview();

    // Show the dialog — execution blocks here until the user closes or starts.
    // jftProcessSeqWrapper is called inside startBtn.onClick before dlg.close(1)
    // so no action is needed here after show() returns.
    const result = dlg.show();

    if (result === 1) {
      const staticStr = buildStaticString();
      jftProcessSeqWrapper(staticStr);
      $.gc();
    }
  } catch (error) {
    alertDialogSA(error.message);
  } finally {
    resetNonUIInteractionConfigs();
  }
};
