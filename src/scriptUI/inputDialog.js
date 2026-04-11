/*
Code for Import https://scriptui.joonas.me — (Triple click to select): 
{"activeId":4,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":"jftRapidInputDialog","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"JFT Rapid By DevSA","preferredSize":[370,140],"margins":16,"orientation":"column","spacing":10,"alignChildren":["center","top"]}},"item-1":{"id":1,"type":"Group","parentId":0,"style":{"enabled":true,"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":20,"alignChildren":["center","center"],"alignment":null}},"item-2":{"id":2,"type":"StaticText","parentId":1,"style":{"enabled":true,"varName":"labelText","creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Enter Object Name:","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}},"item-3":{"id":3,"type":"EditText","parentId":1,"style":{"enabled":true,"varName":"inputField","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"","justify":"center","preferredSize":[170,55],"alignment":null,"helpTip":"input name"}},"item-4":{"id":4,"type":"Button","parentId":1,"style":{"enabled":true,"varName":"enterBtn","text":"Enter","justify":"center","preferredSize":[0,0],"alignment":null,"helpTip":null}}},"order":[0,1,2,3,4],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"None"}}
*/

/**
 * Displays a simple input dialog in Adobe Illustrator.
 * The entered value is passed to the callback ONLY if the user confirms (Enter button or Return key)
 * and the input is not empty.
 *
 * @param {function(string[]): void} callback - Required. Receives the validated input strings
 * @param {Object} [options={}] - Optional settings
 * @param {string} [options.label="Enter Object Name:"] - Text shown above the input
 * @param {string} [options.title="JFT Rapid By DevSA"] - Dialog window title
 * @param {string} [options.buttonText="Enter"] - Text on the confirm button
 * @param {number} [options.inputWidth=220] - Width of the input field
 */
function inputDialog(callback, options = {}) {
  if (typeof callback !== "function") {
    alertDialogSA(`First argument must be a function (callback)`);
    return;
  }

  // ─── Defaults ────────────────────────────────────────────────
  const {
    label = "Enter Object Name:",
    title = "JFT Rapid By DevSA",
    buttonText = "Enter",
    inputWidth = 170,
  } = options;

  // ─── Dialog ──────────────────────────────────────────────────
  const dialog = new Window("dialog", title);
  dialog.preferredSize = { width: 370, height: 140 };
  dialog.orientation = "column";
  dialog.alignChildren = ["center", "top"];
  dialog.spacing = 12;
  dialog.margins = 20;

  // ─── Content group ───────────────────────────────────────────
  const group = dialog.add("group");
  group.orientation = "column";
  group.alignChildren = ["center", "center"];
  group.spacing = 16;

  // Label (no tooltip)
  const lbl = group.add("statictext", undefined, label);
  lbl.justify = "center";

  // Input field (no tooltip, no auto-focus)
  const input = group.add("edittext", undefined, "", {
    justify: "center",
  });
  input.preferredSize.width = inputWidth;
  input.preferredSize.height = 55;
  input.active = true;

  // Confirm button
  const btn = group.add("button", undefined, buttonText, { name: "ok" });
  btn.preferredSize.width = 90;
  // btn.active = true;

  // ─── Button click handler ────────────────────────────────────
  btn.onClick = function () {
    dialog.close(1);
  };

  const result = dialog.show();

  // ─── Show dialog & process result ────────────────────────────
  if (result === 1) {
    const value = input.text || "";

    if (!value) {
      // Optional: re-open dialog automatically
      inputDialog(callback, options);
    } else {
      callback(value.split(","));
    }

    $.gc();
  }
}
