/**
 * A utility class to manage grouping and ungrouping of Illustrator PageItems.
 * Provides static methods for creating and dissolving groups while maintaining
 * proper z-order and parent relationships.
 */
class GroupManager {
  /**
   * Groups multiple PageItems into a single GroupItem.
   *
   * ### Behavior:
   * - Creates a new group in the same layer as the objects
   * - Maintains the z-order position of the original objects
   * - Moves all objects into the new group
   * - Preserves the stacking order of objects within the group
   *
   * @param {Selection} objects - Array of PageItems to group together
   * @returns The newly created GroupItem containing all the objects
   *
   * @example
   * ```typescript
   * const selectedItems = app.activeDocument.selection;
   * const newGroup = GroupManager.group({ objects: selectedItems });
   * ```
   */
  static group(objects: Selection): GroupItem {
    // Get the adjacent objects to determine placement
    const { prev } = Utils.getAdjacentPageObjects(objects);

    // Get the layer where the first object resides
    const targetLayer = objects[0].layer;

    // Create a new group in the target layer
    const newGroup = targetLayer.groupItems.add();

    // Position the group at the correct z-order location
    if (prev) {
      // Place the group after the previous sibling
      newGroup.move(prev, ElementPlacement.PLACEAFTER);
    }
    // If no previous sibling, group is already at the top

    // Move all objects into the group (reverse order to maintain stacking)
    for (let i = objects.length - 1; i >= 0; i--) {
      const currentObject = objects[i];
      // Move object inside the group
      currentObject.move(newGroup, ElementPlacement.INSIDE);
    }

    // Return the newly created group
    return newGroup;
  }

  /**
   * Ungroups a GroupItem, releasing all its children back to the parent.
   *
   * ### Behavior:
   * - Extracts all PageItems from the group
   * - Places them back in the parent at the group's original position
   * - Maintains the relative z-order of the extracted objects
   * - Removes the empty group container
   *
   * @param {GroupItem} groupObject - The GroupItem to ungroup
   * @returns Array of PageItems that were released from the group
   *
   * @example
   * ```typescript
   * const myGroup = app.activeDocument.groupItems[0];
   * const ungroupedItems = GroupManager.ungroup({ groupObject: myGroup });
   * ```
   */
  static ungroup(groupObject: GroupItem): PageItem[] {
    // Get the group's position relative to siblings
    const { prev } = Utils.getAdjacentPageObjects(groupObject);

    // Get the parent container (Layer or GroupItem)
    const parent = groupObject.parent;

    // Store references to the objects being ungrouped
    const ungroupedObjects: PageItem[] = [];

    // Extract all objects from the group (reverse order to maintain stacking)
    for (let i = groupObject.pageItems.length - 1; i >= 0; i--) {
      const currentObject = groupObject.pageItems[i];

      // Determine placement based on previous sibling
      if (prev && prev.parent === parent) {
        // Place after the previous sibling
        currentObject.move(prev, ElementPlacement.PLACEAFTER);
      } else {
        // Place inside the parent container
        currentObject.move(parent, ElementPlacement.INSIDE);
      }

      // Add to the result array
      ungroupedObjects.push(currentObject);
    }

    // Remove the now-empty group
    groupObject.remove();

    // Return the ungrouped objects in their original order
    return ungroupedObjects.reverse();
  }
}
