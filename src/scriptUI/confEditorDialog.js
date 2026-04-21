/*
Code for Import https://scriptui.joonas.me — (Triple click to select):
{"activeId":0,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"enabled":true,"varName":"dlg","windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"text":"JFT Conf Editor","preferredSize":[760,580],"margins":14,"orientation":"column","spacing":8,"alignChildren":["fill","top"]}},"item-1":{"id":1,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"topBar","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":12,"alignChildren":["left","center"],"alignment":null}},"item-2":{"id":2,"type":"StaticText","parentId":1,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Brand:","justify":"left","preferredSize":[0,0],"alignment":null}},"item-3":{"id":3,"type":"DropDownList","parentId":1,"style":{"enabled":true,"varName":"brandDrop","text":"DropDownList","listItems":"","preferredSize":[130,0],"alignment":null,"selection":0}},"item-4":{"id":4,"type":"StaticText","parentId":1,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Paper width (in):","justify":"left","preferredSize":[0,0],"alignment":null}},"item-5":{"id":5,"type":"EditText","parentId":1,"style":{"enabled":true,"varName":"paperInput","creationProps":{"noecho":false,"readonly":false,"multiline":false,"scrollable":false,"borderless":false,"enterKeySignalsOnChange":false},"softWrap":false,"text":"63.5","justify":"center","preferredSize":[80,0],"alignment":null}},"item-6":{"id":6,"type":"Button","parentId":1,"style":{"enabled":true,"varName":"addBrandBtn","text":"+ Brand","justify":"center","preferredSize":[85,0],"alignment":null}},"item-7":{"id":7,"type":"Button","parentId":1,"style":{"enabled":true,"varName":"delBrandBtn","text":"- Brand","justify":"center","preferredSize":[85,0],"alignment":null}},"item-8":{"id":8,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"midGrp","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":12,"alignChildren":["fill","fill"],"alignment":null}},"item-9":{"id":9,"type":"Panel","parentId":8,"style":{"enabled":true,"varName":"sizePanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Sizes","preferredSize":[150,0],"margins":10,"orientation":"column","spacing":6,"alignChildren":["fill","top"],"alignment":null}},"item-10":{"id":10,"type":"ListBox","parentId":9,"style":{"enabled":true,"varName":"sizeList","creationProps":{"multiselect":false},"preferredSize":[130,350],"alignment":null}},"item-11":{"id":11,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"sizeAddBtn","text":"+ Add Size","justify":"center","preferredSize":[130,0],"alignment":null}},"item-12":{"id":12,"type":"Button","parentId":9,"style":{"enabled":true,"varName":"sizeDelBtn","text":"- Delete Size","justify":"center","preferredSize":[130,0],"alignment":null}},"item-13":{"id":13,"type":"Panel","parentId":8,"style":{"enabled":true,"varName":"partPanel","creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"text":"Part Dimensions (Width x Height in inches)","preferredSize":[0,0],"margins":10,"orientation":"column","spacing":4,"alignChildren":["fill","top"],"alignment":["fill","fill"]}},"item-14":{"id":14,"type":"Group","parentId":13,"style":{"enabled":true,"varName":"hdrRow","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":8,"alignChildren":["left","center"],"alignment":null}},"item-15":{"id":15,"type":"StaticText","parentId":14,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Part","justify":"left","preferredSize":[175,0],"alignment":null}},"item-16":{"id":16,"type":"StaticText","parentId":14,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Width","justify":"center","preferredSize":[65,0],"alignment":null}},"item-17":{"id":17,"type":"StaticText","parentId":14,"style":{"enabled":true,"varName":null,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"softWrap":false,"text":"Height","justify":"center","preferredSize":[65,0],"alignment":null}},"item-18":{"id":18,"type":"Group","parentId":0,"style":{"enabled":true,"varName":"botBar","preferredSize":[0,0],"margins":0,"orientation":"row","spacing":12,"alignChildren":["left","center"],"alignment":null}},"item-19":{"id":19,"type":"Button","parentId":18,"style":{"enabled":true,"varName":"setActiveBtn","text":"Set as Active Brand","justify":"center","preferredSize":[165,0],"alignment":null}},"item-20":{"id":20,"type":"Group","parentId":18,"style":{"enabled":true,"varName":"spacer","preferredSize":[200,0],"margins":0,"orientation":"row","spacing":0,"alignChildren":["left","center"],"alignment":null}},"item-21":{"id":21,"type":"Button","parentId":18,"style":{"enabled":true,"varName":"saveBtn","text":"Save All","justify":"center","preferredSize":[100,0],"alignment":null}},"item-22":{"id":22,"type":"Button","parentId":18,"style":{"enabled":true,"varName":"cancelBtn","text":"Cancel","justify":"center","preferredSize":[100,0],"alignment":null}}},"order":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":true,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"var"}}
*/

// =============================================================================
// confEditorDialog.js
//
// ScriptUI dialog for editing jft.conf.
// Lets the user add/rename brands, add/delete sizes and edit all part
// dimensions (width x height in inches) per size.
//
// IMPORTANT: ExtendScript targets ES3.  Do NOT use:
//   - for...of loops
//   - Array.prototype.filter / includes / find
//   - Arrow functions in event handlers
//   - const / let inside function bodies in older hosts
// =============================================================================

/**
 * Opens the JFT Configuration Editor dialog.
 *
 * Loads `jft.conf` into a deep-copied working object so every edit is
 * non-destructive until the user clicks "Save All".  On save the conf
 * is written back to disk and the live {@link CONFIG} object is reloaded
 * in-memory so the current session reflects the new values immediately.
 *
 * @returns {void}
 */
const confEditorDialog = () => {
  try {
    // ── 1. Load config ────────────────────────────────────────────────────────

    /** Raw conf read from disk — never mutated */
    const originalConf = CONFIG.JFT_CONF;
    if (!originalConf) {
      alertDialogSA("Could not read jft.conf.");
      return;
    }

    /**
     * Deep copy of the conf used for all editing.
     * Only written to disk when the user clicks "Save All".
     * @type {PersistConfig}
     */
    const workingConf = Utils.deepCopy(originalConf);

    // ── 2. Constants ──────────────────────────────────────────────────────────

    /**
     * All garment-part markers that can have dimensions.
     * Matches the keys used in jft.conf's size entries.
     */
    const PART_KEYS = [
      "NECK",
      "COLLAR",
      "PLACKET",
      "SHORT_SLEEVE",
      "LONG_SLEEVE",
      "SHORT_SLEEVE_RIB",
      "LONG_SLEEVE_RIB",
      "BODY",
      "SHORT_PANT_FRONT",
      "SHORT_PANT_BACK",
      "LONG_PANT_FRONT",
      "LONG_PANT_BACK",
    ];

    /**
     * All standard apparel sizes in preferred display order.
     * Used to compute the "available" list when adding a size.
     */
    const ALL_SIZES = Object.keys(SIZE_ORDER_MAP);

    // ── 3. Build UI ───────────────────────────────────────────────────────────

    const dlg = new Window("dialog", "JFT Conf Editor - Live Sync", undefined, {
      closeButton: true,
      resizeable: false,
    });
    dlg.preferredSize = [760, 580];
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 8;
    dlg.margins = 14;

    // ── Top bar ───────────────────────────────────────────────────────────────
    const topBar = dlg.add("group");
    topBar.orientation = "row";
    topBar.alignChildren = ["left", "center"];
    topBar.spacing = 12;

    topBar.add("statictext", undefined, "Brand:");

    /** Brand selector drop-down — populated in refreshBrands() */
    const brandDrop = topBar.add("dropdownlist", undefined, []);
    brandDrop.preferredSize.width = 130;

    topBar.add("statictext", undefined, "Paper width (in):");

    /** Paper-width input — synced to workingConf.config on Save */
    const paperInput = topBar.add('edittext {justify:"center"}');
    paperInput.preferredSize.width = 80;
    paperInput.text =
      workingConf.config.paperMaxWidth.toString() || (63.25).toString();

    /** Add a new brand (clones from current) */
    const addBrandBtn = topBar.add("button", undefined, "+ Brand");
    addBrandBtn.preferredSize.width = 85;

    /** Delete the currently selected brand */
    const delBrandBtn = topBar.add("button", undefined, "- Brand");
    delBrandBtn.preferredSize.width = 85;

    // ── Middle row ────────────────────────────────────────────────────────────
    const midGrp = dlg.add("group");
    midGrp.orientation = "row";
    midGrp.alignChildren = ["fill", "fill"];
    midGrp.spacing = 12;

    // Left: sizes list
    const sizePanel = midGrp.add("panel", undefined, "Sizes");
    sizePanel.orientation = "column";
    sizePanel.alignChildren = ["fill", "top"];
    sizePanel.preferredSize.width = 150;
    sizePanel.margins = 10;
    sizePanel.spacing = 6;

    /** Sizes present in the selected brand */
    const sizeList = sizePanel.add("listbox", undefined, [], {
      multiselect: false,
    });
    sizeList.preferredSize = [130, 350];

    /** Open the "Add Size" picker */
    const sizeAddBtn = sizePanel.add("button", undefined, "+ Add Size");
    sizeAddBtn.preferredSize.width = 130;

    /** Permanently remove the selected size from workingConf */
    const sizeDelBtn = sizePanel.add("button", undefined, "- Delete Size");
    sizeDelBtn.preferredSize.width = 130;

    // Right: part dimension rows
    const partPanel = midGrp.add(
      "panel",
      undefined,
      "Part Dimensions (Width x Height in inches)",
    );
    partPanel.orientation = "column";
    partPanel.alignChildren = ["fill", "top"];
    partPanel.margins = 10;
    partPanel.spacing = 4;

    // Column header
    const hdrRow = partPanel.add("group");
    hdrRow.orientation = "row";
    hdrRow.spacing = 8;
    const hdrLbl = hdrRow.add("statictext", undefined, "Part");
    hdrLbl.preferredSize.width = 175;
    const hdrW = hdrRow.add("statictext", undefined, "Width");
    hdrW.preferredSize.width = 65;
    const hdrH = hdrRow.add("statictext", undefined, "Height");
    hdrH.preferredSize.width = 65;

    /**
     * Map of part key → {w: EditText, h: EditText}.
     * Used by loadPartDimensions / savePartDimensions.
     * @type {Object}
     */
    const partRows = {};
    for (const pi = 0; pi < PART_KEYS.length; pi++) {
      const pkey = PART_KEYS[pi];
      const prow = partPanel.add("group");
      prow.orientation = "row";
      prow.spacing = 8;
      prow.alignChildren = ["left", "center"];

      const plbl = prow.add("statictext", undefined, pkey);
      plbl.preferredSize.width = 175;

      const wIn = prow.add('edittext {justify:"center"}');
      wIn.addEventListener("keydown", Utils.floatKeydown);
      wIn.preferredSize.width = 65;
      const hIn = prow.add('edittext {justify:"center"}');
      hIn.addEventListener("keydown", Utils.floatKeydown);
      hIn.preferredSize.width = 65;

      partRows[pkey] = { w: wIn, h: hIn };
    }

    // ── Bottom bar ────────────────────────────────────────────────────────────
    const botBar = dlg.add("group");
    botBar.orientation = "row";
    botBar.alignChildren = ["left", "center"];
    botBar.spacing = 12;

    /** Mark the currently selected brand as CONFIG.BRAND */
    const setActiveBtn = botBar.add("button", undefined, "Set as Active Brand");
    setActiveBtn.preferredSize.width = 165;

    const spacer = botBar.add("group");
    spacer.preferredSize.width = 200;

    /** Flush workingConf to disk and reload CONFIG */
    const saveBtn = botBar.add("button", undefined, "Save All", { name: "ok" });
    saveBtn.active = true;
    saveBtn.preferredSize.width = 100;

    /** Discard all changes and close */
    const cancelBtn = botBar.add("button", undefined, "Cancel", { name: "no" });
    cancelBtn.preferredSize.width = 100;

    // ── 4. Utility helpers ────────────────────────────────────────────────────

    /**
     * Returns all brand keys currently in workingConf.sizes.
     * Always reads from the live workingConf — reflects adds/deletes.
     * @returns {string[]}
     */
    function getBrands() {
      const keys = [];
      const sizes = workingConf.sizes || {};
      for (const k in sizes) {
        if (sizes.hasOwnProperty(k)) keys.push(k);
      }
      return keys;
    }

    /**
     * Returns the currently selected brand name, or null.
     * @returns {string|null}
     */
    function currentBrand() {
      return brandDrop.selection ? brandDrop.selection.text : null;
    }

    /**
     * Returns the currently selected size name, or null.
     * @returns {string|null}
     */
    function currentSize() {
      return sizeList.selection ? sizeList.selection.text : null;
    }

    /**
     * Returns all size keys present for `brand` in workingConf.
     * Always reads from the live workingConf — reflects adds/deletes.
     *
     * @param {string} brand
     * @returns {string[]}
     */
    function getSizesForBrand(brand) {
      if (!brand || !workingConf.sizes || !workingConf.sizes[brand]) return [];
      const keys = [];
      const entry = workingConf.sizes[brand];
      for (const k in entry) {
        if (entry.hasOwnProperty(k)) keys.push(k);
      }
      return Utils.sortSizes(keys);
    }

    /**
     * Rebuilds the brand drop-down from workingConf.
     * @param {string|null} selectBrand - Brand to pre-select; falls back to index 0.
     */
    function refreshBrands(selectBrand) {
      brandDrop.removeAll();
      const brands = getBrands();
      for (const i = 0; i < brands.length; i++) {
        brandDrop.add("item", brands[i]);
      }
      // Try to select the requested brand
      const matched = false;
      if (selectBrand) {
        for (const j = 0; j < brandDrop.items.length; j++) {
          if (brandDrop.items[j].text === selectBrand) {
            brandDrop.selection = j;
            matched = true;
            break;
          }
        }
      }
      if (!matched && brandDrop.items.length > 0) {
        brandDrop.selection = 0;
      }
    }

    /**
     * Rebuilds sizeList for `brand` and optionally pre-selects `selectSize`.
     * Loads part dimensions for the resulting selection.
     *
     * @param {string} brand
     * @param {string|null} selectSize - Size to pre-select; falls back to index 0.
     */
    function refreshSizes(brand, selectSize) {
      sizeList.removeAll();
      const sizes = getSizesForBrand(brand);
      for (const i = 0; i < sizes.length; i++) {
        sizeList.add("item", sizes[i]);
      }

      // Try to select the requested size
      const matched = false;
      if (selectSize) {
        for (const j = 0; j < sizeList.items.length; j++) {
          if (sizeList.items[j].text === selectSize) {
            sizeList.selection = j;
            matched = true;
            break;
          }
        }
      }
      if (!matched && sizeList.items.length > 0) {
        sizeList.selection = 0;
      }

      // Record for save-on-switch tracking
      sizeList._lastSelected = currentSize();

      // Load dimensions for the resulting selection
      loadPartDimensions(brand, currentSize());
    }

    /**
     * Populates the part dimension inputs from workingConf for `brand` + `size`.
     * Clears and disables all inputs when brand or size is null/missing.
     *
     * @param {string|null} brand
     * @param {string|null} size
     */
    function loadPartDimensions(brand, size) {
      const hasData = !!(
        brand &&
        size &&
        workingConf.sizes &&
        workingConf.sizes[brand] &&
        workingConf.sizes[brand][size]
      );

      for (const i = 0; i < PART_KEYS.length; i++) {
        const key = PART_KEYS[i];
        const row = partRows[key];
        const dim = hasData ? workingConf.sizes[brand][size][key] : null;

        row.w.text = dim && dim.width != null ? dim.width.toString() : "";
        row.h.text = dim && dim.height != null ? dim.height.toString() : "";
        row.w.enabled = hasData;
        row.h.enabled = hasData;
      }
    }

    /**
     * Reads current input values and writes them back into workingConf.
     * Rows with both valid w+h are written; rows with blank/invalid values
     * are removed from the size entry so stale data does not persist.
     *
     * @param {string} brand
     * @param {string} size
     */
    function savePartDimensions(brand, size) {
      if (!brand || !size) {
        alertDialogSA("Please select a brand and size first.");
        return;
      }

      // Ensure path exists in workingConf
      if (!workingConf.sizes[brand]) workingConf.sizes[brand] = {};
      if (!workingConf.sizes[brand][size]) workingConf.sizes[brand][size] = {};

      for (const i = 0; i < PART_KEYS.length; i++) {
        const key = PART_KEYS[i];
        const row = partRows[key];
        const w = parseFloat(row.w.text);
        const h = parseFloat(row.h.text);

        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          // Valid pair — write
          workingConf.sizes[brand][size][key] = { width: w, height: h };
        } else {
          // Invalid or blank — remove stale entry
          delete workingConf.sizes[brand][size][key];
        }
      }
    }

    /**
     * Returns all sizes from ALL_SIZES that are NOT yet present in `brand`.
     * Reads from live workingConf so deletions are immediately reflected.
     *
     * @param {string} brand
     * @returns {string[]}
     */
    function getMissingSizes(brand) {
      const existing = getSizesForBrand(brand);

      // Build a lookup map for O(1) checks — ES3 safe
      const existingMap = {};
      for (const i = 0; i < existing.length; i++) {
        existingMap[existing[i]] = true;
      }

      // Return only sizes that are not in the map
      const missing = [];
      for (const j = 0; j < ALL_SIZES.length; j++) {
        if (!existingMap[ALL_SIZES[j]]) {
          missing.push(ALL_SIZES[j]);
        }
      }
      return missing;
    }

    // ── 5. Event handlers ─────────────────────────────────────────────────────

    /**
     * Brand changed — save current size dimensions then reload the size list
     * for the newly selected brand.
     */
    /**
     * Brand changed — save current size dimensions then reload the size list
     * for the newly selected brand.
     */
    brandDrop.onChange = function () {
      const currentBrandNow = currentBrand();
      const lastBrandStored = sizeList._lastBrand;
      const lastSizeStored = sizeList._lastSelected;

      // Save the previously selected size to its ORIGINAL brand before switching
      if (lastBrandStored && lastSizeStored && lastBrandStored !== currentBrandNow) {
        savePartDimensions(lastBrandStored, lastSizeStored);
      }

      // Update tracking to the newly selected brand
      sizeList._lastBrand = currentBrandNow;
      sizeList._lastSelected = null; // Reset size selection

      // Refresh sizes for the newly selected brand
      refreshSizes(currentBrandNow, null);
    };

    paperInput.addEventListener("keydown", Utils.floatKeydown);

    /**
     * Size selection changed — save the previous size's dimensions then load
     * the newly selected size.
     */
    sizeList.onChange = function () {
      const brand = currentBrand();
      const newSize = currentSize();
      const oldSize = sizeList._lastSelected;

      // Only save if we're staying in the SAME brand and size actually changed
      if (brand && oldSize && oldSize !== newSize) {
        savePartDimensions(brand, oldSize);
      }

      // Update tracking and load new dimensions
      sizeList._lastSelected = newSize;
      loadPartDimensions(brand, newSize);
    };

    /**
     * Add a new brand — clones the current brand's sizes as a starting point.
     */
    addBrandBtn.onClick = function () {
      const name = prompt("New brand name:", "");
      if (!name || !name.trim()) {
        alertDialogSA("Brand name cannot be empty.");
        return;
      }

      const trimmed = name.trim().toUpperCase();
      if (workingConf.sizes[trimmed]) {
        alertDialogSA("Brand '" + trimmed + "' already exists.");
        return;
      }

      // Clone from current brand so the user has a complete template to edit
      const src = currentBrand();
      if (src && workingConf.sizes[src]) {
        workingConf.sizes[trimmed] = Utils.deepCopy(workingConf.sizes[src]);
      } else {
        workingConf.sizes[trimmed] = {};
      }

      refreshBrands(trimmed);
      refreshSizes(trimmed, null);
    };

    /**
     * Delete the currently selected brand.
     * The active brand (workingConf.config.brand) cannot be deleted.
     */
    /**
     * Delete the currently selected brand.
     * The active brand (workingConf.config.brand) cannot be deleted.
     */
    delBrandBtn.onClick = function () {
      const brand = currentBrand();
      if (!brand) {
        alertDialogSA("Please select a brand first.");
        return;
      }
      if (brand === workingConf.config.brand) {
        alertDialogSA(
          "Cannot delete the active brand.\nSet a different brand as active first.",
        );
        return;
      }
      const brands = getBrands();
      if (brands.length <= 1) {
        alertDialogSA("At least one brand must remain.");
        return;
      }

      // Ask for confirmation BEFORE deleting
      if (!confirm("Delete brand '" + brand + "' and all its sizes? This cannot be undone.")) {
        return;
      }

      // Delete from working config
      delete workingConf.sizes[brand];

      // Clear any tracking related to deleted brand
      sizeList._lastBrand = null;
      sizeList._lastSelected = null;

      // Refresh UI to show remaining brands
      refreshBrands(null);
      refreshSizes(currentBrand(), null);

      // AUTO-SAVE immediately so deletion persists to disk
      const pw = parseFloat(paperInput.text);
      workingConf.config.paperMaxWidth = pw;
      const success = JFTPersistConfigFetch.write(workingConf);

      if (!success) {
        alertDialogSA("Failed to delete brand '" + brand + "'. Please try again.");
        // Restore the brand if save failed
        return;
      }

      // Reload into memory to sync with disk
      const reloaded = JFTPersistConfigFetch.read();
      if (reloaded) {
        CONFIG.JFT_CONF = reloaded;
        CONFIG.CONFIG = reloaded.config;
        CONFIG.BRAND = reloaded.config.brand;
        CONFIG.PAPER_MAX_SIZE = reloaded.config.paperMaxWidth || CONFIG.PAPER_MAX_SIZE;
        CONFIG.SIZES_DETAILS = reloaded.sizes[CONFIG.BRAND];
      }

      alertDialogSA("Brand '" + brand + "' deleted successfully.");
    };

    /**
     * Open the "Add Size" picker.
     *
     * The available list is computed fresh from workingConf every time the
     * button is clicked — so sizes deleted earlier in this session appear
     * as available immediately without needing to reopen the dialog.
     *
     * The newly added size is pre-selected in sizeList after the picker closes
     * so the user can immediately edit its dimensions.
     */
    sizeAddBtn.onClick = function () {
      const brand = currentBrand();
      const size = currentSize();
      if (!brand || !size) {
        alertDialogSA(`Please select a ${!brand ? "brand" : "size"} first.`);
        return;
      }
      // Always compute from live workingConf — reflects all adds and deletes
      const available = getMissingSizes(brand);

      if (available.length === 0) {
        alertDialogSA(
          "All standard sizes have already been added to this brand.",
        );
        return;
      }

      // ── Picker dialog ───────────────────────────────────────────────────────
      const pickDlg = new Window("dialog", "Add Size", undefined, {
        resizeable: false,
      });
      pickDlg.preferredSize = [240, 320];
      pickDlg.orientation = "column";
      pickDlg.margins = 16;
      pickDlg.spacing = 12;

      pickDlg.add("statictext", undefined, "Select a size to add:");

      const pickList = pickDlg.add("listbox", undefined, available, {
        multiselect: false,
      });
      pickList.preferredSize = [200, 220];
      if (pickList.items.length > 0) pickList.selection = 0;

      const btnRow = pickDlg.add("group");
      btnRow.orientation = "row";
      btnRow.spacing = 15;
      const pickOk = btnRow.add("button", undefined, "Add");
      const pickCancel = btnRow.add("button", undefined, "Cancel");

      /**
       * Capture selected size BEFORE closing the dialog — after close() the
       * pickList DOM is destroyed and pickList.selection becomes null.
       */
      const pickedSize = null;

      pickOk.onClick = function () {
        if (!pickList.selection) return;

        // Capture text NOW, before close() destroys the dialog
        pickedSize = pickList.selection.text;

        // Build a template: copy from currently selected size, else first existing
        const templateSrc = currentSize();
        const existing = getSizesForBrand(brand);
        const template = {};

        if (
          templateSrc &&
          workingConf.sizes[brand] &&
          workingConf.sizes[brand][templateSrc]
        ) {
          template = workingConf.sizes[brand][templateSrc];
        } else if (
          existing.length > 0 &&
          workingConf.sizes[brand][existing[0]]
        ) {
          template = workingConf.sizes[brand][existing[0]];
        }

        // Write the new size into workingConf as a deep copy of the template
        workingConf.sizes[brand][pickedSize] = Utils.deepCopy(template);

        pickDlg.close(1);
      };

      pickCancel.onClick = function () {
        pickDlg.close(0);
      };

      const result = pickDlg.show();

      if (result === 1 && pickedSize) {
        // Refresh and auto-select the newly added size
        refreshSizes(brand, pickedSize);
      }
      // If user cancelled or no size was captured, do nothing
    };

    /**
     * Delete the currently selected size from workingConf completely.
     * Asks for confirmation first.
     */
    sizeDelBtn.onClick = function () {
      const brand = currentBrand();
      const size = currentSize();
      if (!brand || !size) {
        alertDialogSA(`Please select a ${!brand ? "brand" : "size"} first.`);
        return;
      }

      if (!confirm("Delete size '" + size + "' from brand '" + brand + "'?")) {
        return;
      }

      // Remove the size property entirely from workingConf
      if (workingConf.sizes[brand]) {
        delete workingConf.sizes[brand][size];
      }

      // Clear tracking so onChange does not try to save the deleted size
      sizeList._lastSelected = null;

      // Refresh — the deleted size will no longer appear in sizeList
      // and will immediately appear in the "Add Size" picker
      refreshSizes(brand, null);
    };

    /**
     * Mark the currently selected brand as the active brand in workingConf.
     * The change only persists after "Save All".
     */
    setActiveBtn.onClick = function () {
      const brand = currentBrand();
      if (!brand) {
        alertDialogSA("Please select a brand first.");
        return;
      }
      workingConf.config.brand = brand;
      alertDialogSA(
        "Active brand set to: " +
        brand +
        "\nChanges will apply after 'Save All'.",
      );
    };

    /**
     * Flush all edits to disk and reload global CONFIG.
     * Saves the currently visible part dimensions first, then writes workingConf.
     */
    saveBtn.onClick = function () {
      // Save dimensions of the currently visible size before writing
      savePartDimensions(currentBrand(), currentSize());

      // Sync paper width
      const pw = parseFloat(paperInput.text);

      workingConf.config.paperMaxWidth = pw;

      const success = JFTPersistConfigFetch.write(workingConf);
      if (!success) {
        alertDialogSA("Failed to save jft.conf");
        return;
      }

      // Reload into memory so the current session uses the new values
      const reloaded = JFTPersistConfigFetch.read();
      if (reloaded) {
        CONFIG.JFT_CONF = reloaded;
        CONFIG.CONFIG = reloaded.config;
        CONFIG.BRAND = reloaded.config.brand;
        CONFIG.PAPER_MAX_SIZE =
          reloaded.config.paperMaxWidth || CONFIG.PAPER_MAX_SIZE;
        CONFIG.SIZES_DETAILS = reloaded.sizes[CONFIG.BRAND];
      }

      alertDialogSA("Configure updated");
      dlg.close(1);
    };

    /**
     * Close without saving — workingConf is discarded, originalConf unchanged.
     */
    cancelBtn.onClick = function () {
      dlg.close(0);
    };

    // ── 6. Initialise ─────────────────────────────────────────────────────────

    // Populate brand list, pre-select the currently active brand
    refreshBrands(workingConf.config.brand);

    // Populate size list for that brand, pre-select first size
    refreshSizes(currentBrand(), null);

    // Track current brand so onChange can save before switching
    sizeList._lastBrand = currentBrand();
    sizeList._lastSelected = currentSize();

    const result = dlg.show();

    if (result === 1) {
      $.gc();
    }
  } catch (error) {
    alertDialogSA("An error occurred while saving jft.conf");
  }
};
