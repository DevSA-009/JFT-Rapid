/**
 * A class to manage grouping and ungrouping Illustrator items.
 */
class GroupManager {
    private groupItems: GroupItems;
    public tempGroup:GroupItem | null = null;
    private selection:Selection;

    constructor(sel: Selection) {
        this.selection = sel;
        this.groupItems = this.selection[0].layer.groupItems;
    }

    // Group the selection inside the new group.
    group(prev: PageItem | null = null): void {
        if (prev) {
            this.tempGroup = this.groupItems.add();
            this.tempGroup.move(prev, ElementPlacement.PLACEAFTER);
        } else {
            this.tempGroup = this.groupItems.add();
        }
        for (let i = this.selection.length; i > 0; i--) {
            const item = this.selection[i - 1];
            item.move(this.tempGroup, ElementPlacement.INSIDE)
        }
    }

    // Ungroup the items and return them to their original parent position.
    ungroup(prev: PageItem | null = null): void {
        if(this.tempGroup) {
            for (let i = this.tempGroup.pageItems.length; i > 0; i--) {
                const element = this.tempGroup.pageItems[i - 1];
                if (prev) {
                    element.move(prev, ElementPlacement.PLACEAFTER);
                } else {
                    element.move(this.groupItems.parent, ElementPlacement.INSIDE);
                }
            }
        }
    }
}