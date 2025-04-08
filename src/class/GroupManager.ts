/**
 * A class to manage grouping and ungrouping Illustrator items.
 */
class GroupManager {
    private groupItems: GroupItems;
    public tempGroup: GroupItem | null = null;
    private items: Selection;

    constructor(items: Selection) {
        this.items = items;
        this.groupItems = this.items[0].layer.groupItems;
    }

    // Group the selection inside the new group.
    group(prev: PageItem | GroupItem | Layer | null = null): void {
        if (prev) {
            this.tempGroup = this.groupItems.add();
            this.tempGroup.move(prev, ElementPlacement.PLACEAFTER);
        } else {
            this.tempGroup = this.groupItems.add();
        }
        for (let i = this.items.length; i > 0; i--) {
            const item = this.items[i - 1];
            item.move(this.tempGroup, ElementPlacement.INSIDE)
        }
    }

    // Ungroup the items and return them to their original parent position.
    ungroup(prev: PageItem | GroupItem | Layer | null = null): void {
        if (this.tempGroup) {
            const parent = this.tempGroup.parent;

            for (let i = this.tempGroup.pageItems.length; i > 0; i--) {
                const element = this.tempGroup.pageItems[i - 1];
                if (prev && prev.parent === parent) {
                    element.move(prev, ElementPlacement.PLACEAFTER);
                } else {
                    element.move(parent, ElementPlacement.INSIDE);
                }
            }

            this.tempGroup.remove();
            this.tempGroup = null;
        }
    }

}