/**
 * A utility class for organizing and arranging items in an Adobe Illustrator document.
 * Provides static methods for artboard manipulation and item alignment.
 */
class Organizer {
  /**
   * Verifies that there is an active document and a valid selection.
   *
   * @returns {SelectionVerifyChainReturn} An object containing the active document and selection if valid; otherwise.
   */
  static selectionVerifyChain(): SelectionVerifyChainReturn {
    const doc = app.activeDocument;
    if (!doc) {
      throw new Error("No open document found.");
    }

    const selection: Selection | undefined = doc.selection;

    if (!selection || !selection.length) {
      throw new Error("Please select objects.");
    }

    return { selection, doc };
  }

  /**
   * Resizes an artboard in the document based on specified dimensions (in points).
   *
   * @param {ArtboardScaler} params - Configuration object containing:
   *   @param {Document} params.doc - The Illustrator document containing the artboard
   *   @param {number} params.width - The desired width in points
   *   @param {number} params.height - The desired height in points
   */
  static artboardScaler(params: ArtboardScaler): void {
    const artboardManager = new ArtboardManager(params.doc);
    artboardManager.resize(params.width, params.height);
  }

  /**
   * Resizes the active artboard to a small default size (1x1 inches).
   * Convenience wrapper around artboardScaler with preset dimensions.
   *
   * @param {Document} doc - The Illustrator document to modify
   */
  static smallArtboard(doc: Document): void {
    this.artboardScaler({
      doc,
      width: Utils.convertLength({ value: 1, from: "inch", to: "pt" }),
      height: Utils.convertLength({ value: 1, from: "inch", to: "pt" }),
    });
  }

  /**
   * Aligns all items in the active layer to the artboard boundaries.
   *
   * The operation:
   * 1. Clears any existing selection
   * 2. Selects all page items in the active layer
   * 3. Aligns them to the artboard using default alignment
   * 4. Clears the selection when complete
   */
  static alignItemsToBoardCenter(doc: Document): void {
    const activeLayerItems = doc.activeLayer.pageItems;
    const itemsToSelect = ES6_SA.arrayFrom(activeLayerItems) as Selection;
    AlignmentHandler.alignPageItemsToArtboard({
      doc,
      objects: itemsToSelect,
      engine: "action",
    });
    this.docAllObjectsSelectionHandler({ doc, type: false });
  }

  /**
   * Selects or deselects all visible and unlocked objects in the active layer of a document.
   *
   * ### Behavior:
   * - Processes only objects in the currently active layer
   * - Skips hidden objects (object.hidden = true)
   * - Skips locked objects (object.locked = true)
   * - Uses `docSelectionHandler` internally for proper selection management
   *
   * ### When to use:
   * - Selecting all editable content in the active layer
   * - Clearing selection in the active layer
   * - Preparing objects for batch operations
   *
   * @param params - The configuration object (optional)
   * @param params.doc - The target Illustrator document. Default is app.activeDocument.
   * @param params.type - Whether to select (true) or deselect (false) all objects. Default is true.
   * @returns Array of objects that were selected or deselected
   *
   * @example
   * ```typescript
   * // Select all objects in active layer of active document
   * const selected = Utils.docAllObjectsSelectionHandler();
   *
   * // Select all objects in specific document
   * const selected = Utils.docAllObjectsSelectionHandler({
   *   doc: myDocument
   * });
   *
   * // Deselect all objects in active layer
   * const deselected = Utils.docAllObjectsSelectionHandler({
   *   type: false
   * });
   *
   * // Deselect all objects in specific document
   * const deselected = Utils.docAllObjectsSelectionHandler({
   *   doc: myDocument,
   *   type: false
   * });
   * ```
   */
  static docAllObjectsSelectionHandler(
    params: DocAllObjectsSelectionHandler = {},
  ): PageItem[] {
    const {
      doc = app.activeDocument, // Default to active document
      type = true, // Default to select (true)
    } = params;

    // Get the active layer
    const activeLayer = doc.activeLayer;

    // Get all page objects in the active layer
    const layerObjects = activeLayer.pageItems;

    // Collect all visible and unlocked objects
    const processableObjects: PageItem[] = [];

    for (let i = 0; i < layerObjects.length; i++) {
      const object = layerObjects[i];

      // Skip hidden objects
      if (object.hidden) continue;

      // Skip locked objects
      if (object.locked) continue;

      // Add to processable objects
      processableObjects.push(object);
    }

    // Use docSelectionHandler to manage selection
    this.docSelectionHandler({
      doc: doc,
      objects: processableObjects,
      remaingExistSelection: false, // Replace entire selection
      type: type, // Select or deselect based on type parameter
    });

    // Return the processed objects
    return processableObjects;
  }

  /**
   * Converts an Illustrator PageItems collection to a standard array
   * @param {PageItems} pageItems - The Illustrator PageItems collection to convert
   * @returns {PageItem[]} Array containing all items from the collection
   */
  static pageItemsToArray(pageItems: PageItems): PageItem[] {
    const selectedItems = [];

    for (let i = 0; i < pageItems.length; i++) {
      const item = pageItems[i];

      selectedItems.push(item);
    }

    return selectedItems;
  }

  /**
   * Gets the current document's directory and counts files in that directory
   * @param {Document} [doc=app.activeDocument] - The Illustrator document to check
   * @returns {GetDirectoryFileInfoReturn}
   * @throws {Error} If no document is open or document isn't saved
   */
  static getDirectoryFileInfo(
    doc: Document = app.activeDocument,
  ): GetDirectoryFileInfoReturn {
    if (!app.documents.length) {
      throw new Error("No document is open!");
    }

    const docPath = doc.fullName;

    if (!docPath) {
      throw new Error(
        "Document must be saved first to determine its location.",
      );
    }

    const folder = docPath.parent;
    const items = folder.getFiles();
    let fileCount = 0;
    let folderCount = 0;

    for (let i = 0; i < items.length; i++) {
      if (items[i] instanceof Folder) {
        folderCount++;
      } else if (items[i] instanceof File) {
        fileCount++;
      }
    }

    return {
      files: fileCount,
      folder: folderCount,
      nexFileIndex: fileCount,
    };
  }

  /**
   * Retrieves pant-related items from the document's active layer.
   *
   * This method looks for the following items by their names:
   * - F_L
   * - F_R
   * - B_L
   * - B_R
   *
   * If any of these are missing, it throws an Error with a list of missing item names.
   *
   * @param {Document} doc - The document from which to retrieve pant items.
   * @returns {PantItems} An array of pant-related items tuple.
   * @throws {Error} If any pant items are missing.
   */
  static getPantItems(container: PageItem[]): PantItems {
    const pageItems = container;

    const F_L = ES6_SA.arrayFind(
      pageItems,
      (item) => item.name === SearchingKeywordsForPant.PANT_F_L,
    );
    const F_R = ES6_SA.arrayFind(
      pageItems,
      (item) => item.name === SearchingKeywordsForPant.PANT_F_R,
    );
    const B_L = ES6_SA.arrayFind(
      pageItems,
      (item) => item.name === SearchingKeywordsForPant.PANT_B_L,
    );
    const B_R = ES6_SA.arrayFind(
      pageItems,
      (item) => item.name === SearchingKeywordsForPant.PANT_B_R,
    );

    const missing = [];

    if (!F_L) missing.push(SearchingKeywordsForPant.PANT_F_L);
    if (!F_R) missing.push(SearchingKeywordsForPant.PANT_F_R);
    if (!B_L) missing.push(SearchingKeywordsForPant.PANT_B_L);
    if (!B_R) missing.push(SearchingKeywordsForPant.PANT_B_R);

    if (missing.length > 0) {
      throw new Error(
        `Can't find pant items: missing [${missing.join(", ")}].`,
      );
    }

    return [F_L as PageItem, F_R as PageItem, B_L as PageItem, B_R as PageItem];
  }

  /**
   * Handles the key object selection logic.
   *
   * This static method checks the current document and selection, and either sets or removes
   * a custom `key` property on the selected item based on the `dispatch` flag.
   *
   * ### Error Cases:
   * - No document open
   * - No selection
   * - Multiple items selected
   * @param {boolean} dispatch - A boolean flag indicating whether to set (`true`) or remove (`false`) the `key` property on the selected object.
   *
   * @throws Will show an alert dialog with an error message if:
   * - No document is open.
   * - No object is selected.
   * - More than one object is selected.
   */
  static objectKeyHandler(dispatch: boolean): void {
    try {
      const { selection } = this.selectionVerifyChain();

      if (selection.length > 1) {
        throw new Error("Multiple key objects are not supported.");
      }

      const item = selection[0];

      if (dispatch) {
        item.key = true;
      } else {
        delete item.key;
      }
      app.beep();
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * select all clipped path from selection
   */
  static selectTopClippingPath() {
    const { doc, selection } = this.selectionVerifyChain();
    const clippingPathObjects: PageItem[] = [];

    for (let i = 0; i < selection.length; i++) {
      const item = selection[i];
      const topClippingPath = Utils.getTopClippingPath(item);
      if (topClippingPath) {
        clippingPathObjects.push(topClippingPath);
      }
    }

    if (clippingPathObjects.length) {
      this.docSelectionHandler({ doc, objects: clippingPathObjects });
      app.redraw();
    } else {
      throw new Error(`No clipping path found!`);
    }
  }

  /**
   * check the objects are opacity mask existing by moving and rotateting
   */
  static checkisOpacityMask() {
    try {
      const { selection } = this.selectionVerifyChain();

      const groupItem = GroupManager.group(selection);

      if (!groupItem) {
        throw new Error(`Can't grouping`);
      }

      const dupItem = groupItem.duplicate();

      AlignmentHandler.moveObjectAfter({
        base: groupItem,
        moving: dupItem,
        gap: 1,
        position: "T",
      });

      GroupManager.ungroup(groupItem);
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * Initializes the preparation of a sleeve set using two selected Illustrator objects.
   *
   * ### Workflow Summary:
   * 1. Verifies exactly 2 objects are selected.
   * 2. Duplicates both and ensures they are the same dimensions.
   * 3. Rotates, aligns, and arranges them into a 1-set sleeve layout.
   * 4. Duplicates the 1-set to make a 2-set layout.
   * 5. Validates if final layout fits within maximum paper size.
   * 6. Resizes if necessary and removes the original selection.
   *
   * @throws {Error} If:
   * - Selection count is not 2.
   * - Duplicated items do not have equal dimensions.
   * - Sleeve set exceeds the allowed paper size.
   */
  static fSlv2SetInit() {
    try {
      const { selection } = this.selectionVerifyChain();

      // Validate exactly two objects are selected
      if (selection.length !== 2) {
        throw new Error("You must select exactly two objects.");
      }

      const [obj1, obj2] = selection;

      // Duplicate both objects
      const dupObj1 = obj1.duplicate(obj1.parent);
      const dupObj2 = obj2.duplicate(obj2.parent);

      // Get dimensions of duplicated objects
      const dupObj1Dim = Utils.getDimension(Utils.getObjectBounds(dupObj1));
      const dupObj2Dim = Utils.getDimension(Utils.getObjectBounds(dupObj2));

      // Check if duplicated objects have the same dimensions
      if (
        !(
          dupObj1Dim.width === dupObj2Dim.width &&
          dupObj1Dim.height === dupObj2Dim.height
        )
      ) {
        dupObj1.remove();
        dupObj2.remove();
        throw new Error("Both objects must have equal dimensions.");
      }

      // Define initial translation values (in points)
      const firstXTrans = Utils.convertLength({
        value: -2.2,
        from: "inch",
        to: "pt",
      });
      const secondXTrans = Utils.convertLength({
        value: -0.4,
        from: "inch",
        to: "pt",
      });

      const gTransAct = Utils.getGlobalTransActHandler();
      const transActHandler = gTransAct || new TransActionHandler();

      // Align duplicated items to center (both horizontal and vertical)
      AlignmentHandler.alignObject({
        base: dupObj1,
        moving: dupObj2,
        engine: "action",
        position: "C",
      });

      // Move second object to the right of the first
      AlignmentHandler.moveObjectAfter({
        base: dupObj1,
        moving: dupObj2,
        position: "R",
        engine: "action",
      });

      // Rotate the second object by 180 degrees
      transActHandler.rotate({ objects: [dupObj2], deg: 180 });

      // Move the second object left by 2.2 inches
      transActHandler.move({ objects: [dupObj2], x: firstXTrans, y: 0 });

      // Rotate both objects by -7.5 degrees
      transActHandler.rotate({
        deg: -7.5 as unknown as RotateDegrees,
        objects: [dupObj1, dupObj2],
      });
      // Align both again to vertical center
      AlignmentHandler.alignObject({
        base: dupObj1,
        moving: dupObj2,
        engine: "action",
        position: "CY",
      });

      // Move the second object slightly right (0.4 inches)
      transActHandler.move({ objects: [dupObj2], x: secondXTrans, y: 0 });

      const tempGroup = GroupManager.group([dupObj1, dupObj2]);

      // Get dimensions of the grouped sleeve set
      const groupedItemDim = Utils.getDimension(
        Utils.getObjectBounds(tempGroup),
      );

      // Calculate half of the max allowed paper size
      const halfOfPaperSize = Math.ceil(CONFIG.PAPER_MAX_SIZE / 2);

      // If the 1-set width exceeds half the paper size, abort
      if (
        Utils.convertLength({ value: groupedItemDim.width }) >= halfOfPaperSize
      ) {
        tempGroup.remove();
        throw new Error(
          `Sleeve width exceeds half of the allowed paper size (${CONFIG.PAPER_MAX_SIZE}").`,
        );
      }

      // Duplicate the group to make a 2-set layout
      const dupGroupedItem = tempGroup.duplicate();

      // Place the duplicated group to the right of the original
      AlignmentHandler.moveObjectAfter({
        base: tempGroup,
        moving: dupGroupedItem,
        position: "R",
        engine: "action",
      });

      // Get combined dimension of both sleeve sets
      const finalDim = Utils.getDimension(
        Utils.getObjectBounds([tempGroup, dupGroupedItem]),
      );

      const PAPER_MAX_SIZE_IN_POINT = Utils.convertLength({
        value: CONFIG.PAPER_MAX_SIZE,
        from: "inch",
        to: "pt",
      });

      // Resize if the combined width exceeds the paper limit
      if (finalDim.width > PAPER_MAX_SIZE_IN_POINT) {
        transActHandler.resize({
          objects: [tempGroup, dupGroupedItem],
          width: PAPER_MAX_SIZE_IN_POINT,
        });
      }

      // Clean up original selected objects
      obj1.remove();
      obj2.remove();

      // clean action
      if (!gTransAct) transActHandler.removeAll();
    } catch (error: any) {
      // Show error message via custom alert
      alertDialogSA(error.message);
    }
  }

  /**
   * Assigns a custom name (mark) to all selected Illustrator objects.
   *
   * This method is useful for tagging or identifying specific elements
   * within a document by applying a shared name to the currently selected items.
   *
   * ### Workflow:
   * 1. Verifies that a document is open and there is a valid selection.
   * 2. Iterates over the selected items.
   * 3. Sets the `.name` property of each item to the provided `mark` string.
   *
   * @param {string} mark - The name or identifier to assign to each selected object.
   *
   * @throws Will throw an error if:
   * - No document is open.
   * - No items are selected.
   */
  static objectMarkByName(mark: string) {
    const selectionVerifyChain = this.selectionVerifyChain();
    const selection = selectionVerifyChain.selection;

    for (const element of selection) {
      element.name = mark;
    }
  }

  /**
   * Assigns a custom name (mark) to selected Illustrator objects, ensuring they are grouped as a pair.
   *
   * Behavior:
   * - If **exactly 1 object** is selected → duplicates it and groups the original + duplicate
   * - If **exactly 2 objects** are selected → groups them directly
   * - If **0 or >2 objects** are selected → throws an error
   *
   * After grouping, the resulting group receives the given `mark` as its `.name`.
   * Finally, the group becomes the only selected object.
   *
   * Useful for quickly creating symmetrically named pairs (e.g. left/right, top/bottom, before/after states).
   *
   * @param {string} mark - The name/identifier to assign to the resulting group
   *
   * @throws {Error}
   * - When no document is open
   * - When selection is empty
   * - When more than 2 objects are selected
   * - When selection verification fails
   *
   * @example
   * ```ts
   * // Select one rectangle → creates duplicate + group named "button-pair"
   * IllustratorUtils.objectMarkByNameAsPair("button-pair");
   *
   * // Select two paths → groups them and names the group "arrow-group"
   * IllustratorUtils.objectMarkByNameAsPair("arrow-group");
   * ```
   */
  static objectMarkByNameAsPair(mark: string) {
    try {
      const selectionVerifyChain = this.selectionVerifyChain();
      let selection = selectionVerifyChain.selection;

      if (selection.length > 2) {
        throw new Error(`Select only 1 or 2 objects.`);
      }

      if (selection.length === 1) {
        const dupObj = selection[0].duplicate();
        Organizer.docSelectionHandler({
          doc: app.activeDocument,
          remaingExistSelection: true,
          objects: [dupObj],
        });
      }

      selection = app.activeDocument.selection;

      const groupObject = GroupManager.group(selection);
      groupObject.name = mark;

      Organizer.docSelectionHandler({
        doc: app.activeDocument,
        objects: [groupObject],
      });
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * Returns the previous and next sibling items of a given page item,
   * as well as its index within the parent container's pageItems array.
   *
   * @param item - The PageItem (e.g., GroupItem, PathItem) to find siblings for.
   * @returns An object containing:
   *  - `prevItem`: the previous sibling (or `null` if first)
   *  - `nextItem`: the next sibling (or `null` if last)
   *  - `itemIndex`: the index of the current item in its parent’s pageItems
   *
   * @throws Error if the item is not found in its parent’s pageItems collection.
   */
  static getSiblingItems(item: PageItem): GetSiblingItemsReturn {
    // Get the parent container (Layer, GroupItem, or Document) of the given item
    const parent = item.parent as Layer | GroupItem | Document;

    // Get all page items under the parent — includes all types (GroupItem, PathItem, etc.)
    const siblings = parent.pageItems;

    // Initialize index to -1 (not found)
    let index = -1;

    // Loop through siblings to find the index of the current item
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i] === item) {
        index = i;
        break; // Exit the loop once the item is found
      }
    }

    // If the item wasn't found, throw an error
    if (index === -1) {
      throw new Error("Item not found in parent's pageItems.");
    }

    // Get the previous item, or null if this is the first item
    const prevItem = index > 0 ? siblings[index - 1] : null;

    // Get the next item, or null if this is the last item
    const nextItem = index < siblings.length - 1 ? siblings[index + 1] : null;

    // Return the previous and next siblings, and the current item index
    return { prevItem, nextItem, itemIndex: index };
  }

  /**
   * Manages the document's selection by either adding or removing objects.
   *
   * ### Behavior:
   * - If `type` is `true` (default): objects are added to the document's selection.
   * - If `type` is `false`: objects are removed from the selection.
   *
   * The `remaingExistSelection` flag determines whether to preserve the current selection or replace it.
   *
   * ### Implementation:
   * - Directly manipulates each PageItem's `selected` property
   * - Updates `doc.selection` array to reflect changes
   * - Ensures proper synchronization between object states and document selection
   *
   * @param params - The configuration object.
   * @param params.doc - The target Illustrator document.
   * @param params.objects - The PageItems to add or remove.
   * @param params.remaingExistSelection - If true, merges with/removes from existing selection. Default is false.
   * @param params.type - Whether to add (true) or remove (false) the objects. Default is true.
   *
   * @example
   * ```typescript
   * // Replace selection with new objects
   * Utils.docSelectionHandler({
   *   doc: app.activeDocument,
   *   objects: [object1, object2, object3]
   * });
   *
   * // Add to existing selection
   * Utils.docSelectionHandler({
   *   doc: app.activeDocument,
   *   objects: [object4, object5],
   *   remaingExistSelection: true
   * });
   *
   * // Remove specific objects from selection
   * Utils.docSelectionHandler({
   *   doc: app.activeDocument,
   *   objects: [object2, object3],
   *   remaingExistSelection: true,
   *   type: false
   * });
   * ```
   */
  static docSelectionHandler(params: DocSelectionHandler): void {
    const {
      doc, // Target document
      objects, // Objects to modify selection with
      remaingExistSelection = false, // Whether to keep existing selection
      type = true, // true = add, false = remove
    } = params;

    // ========================
    // ADD OBJECTS TO SELECTION
    // ========================
    if (type) {
      if (!remaingExistSelection) {
        // Step 1: Deselect all currently selected objects
        if (doc.selection && doc.selection.length > 0) {
          for (let i = 0; i < doc.selection.length; i++) {
            doc.selection[i].selected = false;
          }
        }

        // Step 2: Clear document selection
        doc.selection = null;

        // Step 3: Select new objects and build array
        const selectedArray: PageItem[] = [];
        for (let i = 0; i < objects.length; i++) {
          objects[i].selected = true;
          selectedArray.push(objects[i]);
        }

        // Step 4: Assign to document selection
        doc.selection = selectedArray;
      } else {
        // Merge with existing selection
        // Step 1: Select the new objects
        for (let i = 0; i < objects.length; i++) {
          objects[i].selected = true;
        }

        // Step 2: Merge with existing selection
        if (doc.selection && doc.selection.length > 0) {
          doc.selection = [...doc.selection, ...objects];
        } else {
          doc.selection = objects;
        }
      }
    }

    // ========================
    // REMOVE OBJECTS FROM SELECTION
    // ========================
    if (!type && doc.selection && doc.selection.length > 0) {
      if (!remaingExistSelection) {
        // Clear all selection
        // Step 1: Deselect all objects
        for (let i = 0; i < doc.selection.length; i++) {
          doc.selection[i].selected = false;
        }

        // Step 2: Clear document selection
        doc.selection = null;
      } else {
        // Remove specific objects
        // Step 1: Deselect the objects to be removed
        for (let i = 0; i < objects.length; i++) {
          objects[i].selected = false;
        }

        // Step 2: Filter out removed objects from selection
        const filteredObjects = ES6_SA.arrayFilter(
          doc.selection,
          (object) => !ES6_SA.arrayIncludes(objects, object),
        );

        doc.selection = filteredObjects;
      }
    }
  }

  /**
   * Recursively searches through a list of `PageItem`s and returns all items
   * whose names match any value in the given name array.
   *
   * This is useful for finding objects by name within deeply nested Illustrator
   * document structures (e.g., groups, layers).
   *
   * The search can optionally exclude items that are hidden or locked.
   *
   * @param objects - The top-level array of PageItems to begin the recursive search from.
   * @param name - An array of strings to match against each PageItem’s `.name` property.
   * @param onlyVisibleAndUnlocked - If `true`, ignores hidden or locked items. Defaults to `true`.
   *
   * @returns An array of PageItems whose `.name` matches any string in the `name` array.
   */
  static getObjectsByNames(
    objects: PageItem[],
    name: string[],
    onlyVisibleAndUnlocked: boolean = true,
  ): PageItem[] {
    // Holds all matching PageItems found during the recursive search
    const foundItems: PageItem[] = [];

    /**
     * Internal recursive function to walk through the PageItem tree.
     * @param _items - A batch of PageItems at the current recursion depth.
     */
    const recursivelyFind = (_items: PageItem[]) => {
      // Iterate through the current level of items
      for (const item of _items) {
        // Check if item name matches one of the names in the array
        // Also check if visibility and lock filtering is enabled and passed
        const nameMatches = ES6_SA.arrayIncludes(name, item.name);
        const passesVisibilityCheck =
          !onlyVisibleAndUnlocked || (!item.hidden && !item.locked);

        if (nameMatches && passesVisibilityCheck) {
          // If both conditions pass, add the item to the result
          foundItems.push(item);
        }

        // If item has nested PageItems (e.g., GroupItem), search recursively
        if ("pageItems" in item && item.pageItems.length > 0) {
          recursivelyFind(item.pageItems);
        }
      }
    };

    // Begin the recursive search from the root list
    recursivelyFind(objects);

    // Return the complete list of found PageItems
    return foundItems;
  }

  /**
   * Retrieves the parent Illustrator `Document` from a given PageItem.
   *
   * This method is useful when dealing with nested selections (e.g., inside Groups, Layers),
   * where the document reference is not directly accessible from the selected object.
   *
   * It traverses the `.parent` chain recursively until it finds an object
   * that is an instance of `Document`.
   *
   * @param item - The Illustrator PageItem (e.g., PathItem, GroupItem, etc.) to start from.
   * @returns The `Document` object the item belongs to.
   *
   * @throws Will throw an error if the traversal reaches a null parent
   *         or no document is found (which shouldn't happen if the input is valid).
   */
  static getDocumentFromItem(item: PageItem): Document {
    // Start traversal from the given item
    let current: any = item;

    // Traverse upward through the item's parent hierarchy
    while (current && !(current instanceof Document)) {
      // Move up to the parent container (GroupItem, Layer, etc.)
      current = current.parent;
    }

    // Return the found Document, or throw if none found
    if (current instanceof Document) {
      return current;
    }

    // If the loop ended without finding a Document, something went wrong
    throw new Error("Could not find Document from the given item.");
  }

  /**
   * repairing document by copying active layer objects to created new document and save
   */
  static repairDocumentError() {
    try {
      const actDoc = app.activeDocument;
      if (!actDoc) {
        throw new Error("No open document found.");
      }
      const fileNameWithoutExt = actDoc.fullName.name.replace(/\.[^.]+$/, "");
      const fileName = `${fileNameWithoutExt} Fixed`;
      const newDocHandler = new IllustratorDocument(fileName);
      const fixedDoc = newDocHandler.create(actDoc.activeLayer.pageItems);
      this.smallArtboard(fixedDoc);
      newDocHandler.save({
        filePath: actDoc.path.fsName,
        fileName,
        format: "AI",
      });

      app.beep();
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * Arranges selected objects so they appear **immediately after** a designated "key object" in the stacking order (Z-order).
   *
   * Useful for controlling appearance order (e.g., which object is in front/behind others) without changing layers.
   *
   * @throws {Error} With user-friendly message
   */
  static arrangeObjectsAfter(): void {
    try {
      const { selection, doc } = this.selectionVerifyChain();

      if (selection.length < 2) {
        throw new Error("Please select at least two objects");
      }

      // Find the previously marked key object
      const keyObject = ES6_SA.arrayFind(
        selection,
        (object) => object.key === true,
      );

      if (!keyObject) {
        throw new Error("No key object found in the selection.");
      }

      // All other selected objects (excluding the key)
      const itemsToArrange = ES6_SA.arrayFilter(
        selection,
        (object) => object !== keyObject,
      );

      // Move each item right after the key object
      ES6_SA.arrayForEach(itemsToArrange, (item) => {
        item.move(keyObject, ElementPlacement.PLACEAFTER);
      });

      // reset key object
      keyObject.key = false;

      // Optional: small feedback sound
      app.beep();
    } catch (error: any) {
      // Use your custom alert function (assuming it exists)
      alertDialogSA(error.message);
    }
  }

  /**
   * Duplicates the top clipping path of the current selection (if it is a clipped group),
   * removes its clipping attribute, applies a specific stroke color (CMYK [75,67,67,100]),
   * removes any fill, and selects the resulting stroked path(s) instead.
   *
   * Purpose:
   *   - Useful for visualizing/debugging clipping paths
   *   - Creates an outline/stroke-only version of the clipping boundary
   *   - Commonly used in prepress, die-line creation, or mask inspection workflows
   *
   * @throws {Error} If no valid clipping path is found, selection is invalid,
   *                 or any operation fails (caught and shown via alert)
   */
  static applyStrokeOnClipPath() {
    try {
      this.selectTopClippingPath();

      const { doc, selection } = this.selectionVerifyChain();

      const newObject: PathItem[] = [];

      ES6_SA.arrayForEach(selection as PathItems, (clipPath) => {
        const dupPathObject = clipPath.duplicate(
          clipPath,
          ElementPlacement.PLACEAFTER,
        );
        dupPathObject.clipping = false;
        Utils.setCMYKColor({
          object: dupPathObject,
          color: [75, 67, 67, 100],
          target: "stroke",
        });
        Utils.setCMYKColor({
          object: dupPathObject,
          color: null,
          target: "fill",
        });
        newObject.push(dupPathObject);
      });

      this.docSelectionHandler({
        doc,
        objects: newObject,
      });
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * Selects all page items in the current selection whose `.name` property matches
   * any of the provided name strings. Only visible and unlocked items are considered.
   *
   * This method is useful for quickly selecting multiple tagged/marked objects
   * (e.g., components, labels, die-lines, registration marks, etc.) by their names.
   *
   * @param names - Array of strings to match against each `PageItem.name`
   * @throws {Error} If no document is open or no objects are selected (via `selectionVerifyChain`)
   */
  private static selectObjectsByNames(names: string[]) {
    try {
      const { selection } = this.selectionVerifyChain();
      const validName = ES6_SA.arrayFilter(names, (name) => !!name);
      const matchedObjects = this.getObjectsByNames(selection, validName, true);

      if (!matchedObjects.length) throw new Error(`Matched objects not found`);
      this.docSelectionHandler({
        doc: app.activeDocument,
        objects: matchedObjects,
      });
    } catch (error: any) {
      alertDialogSA(error.message);
    }
  }

  /**
   * select object by names method for CEP Button
   */
  static selectObjectsByNamesUI() {
    inputDialog(this.selectObjectsByNames);
  }

  /**
   * Replaces each selected object with an embedded TIFF raster copy of itself.
   * Useful for flattening, rasterizing or creating bitmap versions while keeping position.
   */
  static replaceSelectionWithEmbeddedTiffCopies() {
    // Verify we have an active document and at least one selected item
    const { doc, selection } = this.selectionVerifyChain();

    // Loop through every selected object using its index as identifier
    for (const index in selection) {
      // Get reference to the current original vector object
      const originalItem = selection[index];

      // Create short, unique base name for temporary files (helps debugging)
      const tempBaseName = `jft_rapid_devsa_009_temp_raster_${index}`;

      // Remember in which folder the current Illustrator document lives
      const folderPath = doc.path.fsName;

      // Create helper object that will manage our short-lived temporary document
      const tempDocument = new IllustratorDocument(tempBaseName);

      // Build brand new document containing **only** the current selected object
      tempDocument.create([originalItem]);

      // Export that tiny document immediately as TIFF format
      tempDocument.save({
        filePath: folderPath, // save right next to original document
        fileName: tempBaseName, // consistent naming
        format: "TIFF", // raster format we want
      });

      // Close temporary document right away – we don't need it open anymore
      tempDocument.close();

      // Build File object pointing to the TIFF we just created
      const tempTiffFile = new File(`${folderPath}/${tempBaseName}.tif`);

      // Create new placed item slot in the original document
      const placedImage = doc.placedItems.add();

      // Tell Illustrator to use our freshly saved TIFF file as content
      placedImage.file = tempTiffFile;

      // Put the new placed image immediately after original item in stacking order
      placedImage.move(originalItem, ElementPlacement.PLACEAFTER);

      // Perfectly align the new raster image with original vector object's position
      AlignmentHandler.alignObject({
        base: originalItem, // use original as reference
        moving: placedImage, // move placed TIFF to match it
      });

      // Convert the linked TIFF into embedded image data (no external file dependency)
      placedImage.embed();

      // Delete the temporary TIFF file from disk – cleanup
      tempTiffFile.remove();

      // Remove the original vector object – we replaced it with raster version
      originalItem.remove();
    }
  }
}

interface GetDirectoryFileInfoReturn {
  folder: number;
  files: number;
  nexFileIndex: number;
}

type ArtboardScaler = {
  doc: Document;
  width: number;
  height: number;
};

interface GetBodyDimenstionParams {
  sizeContainer: string;
  targetSizeChr: ApparelSize;
}

type MoveAfterItemUiDirection = "L" | "R" | "T" | "B";

interface SelectionVerifyChainReturn {
  selection: Selection;
  doc: Document;
}

type GetSiblingItemsReturn = {
  prevItem: PageItem | null;
  nextItem: PageItem | null;
  itemIndex: number;
};

/**
 * Parameters for document selection handler
 */
interface DocSelectionHandler {
  /** The target Illustrator document */
  doc: Document;
  /** The PageItems to add or remove from selection */
  objects: PageItem[];
  /** If true, merges with/removes from existing selection. Default is false. */
  remaingExistSelection?: boolean;
  /** Whether to add (true) or remove (false) the objects. Default is true. */
  type?: boolean;
}

/**
 * Parameters for selecting all objects in document
 */
interface DocAllObjectsSelectionHandler {
  /** The target Illustrator document. Default is active document. */
  doc?: Document;
  /** Whether to select (true) or deselect (false) all objects. Default is true. */
  type?: boolean;
}
