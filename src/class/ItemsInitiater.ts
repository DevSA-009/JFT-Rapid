class ItemsInitiater {
    private mode: Mode;
    private orientation: LayoutShapeConstants;
    private bodyItems: BodyItems;
    private targetSizeChr: ApparelSize;
    private dimension: DimensionObject;
    private gap = CONFIG.Items_Gap * 72;

    constructor(params: ItemsInitiaterConst) {
        this.mode = params.mode;
        this.bodyItems = params.bodyItems;
        this.orientation = params.orientation;
        this.dimension = params.dimension;
        this.targetSizeChr = params.targetSizeChr;
        this.resizeBody();
    };

    /**
     * Initiates items in the configured layout orientation
     * @returns {GroupItem} The grouped items in specified layout
     */
    public initiatedItem(): GroupItem {
        if (this.orientation === "L") {
            return this.initiateInL()!;
        } else if (this.orientation === "H") {
            return this.initiateInH();
        } else {
            return this.initiateInV()
        }
    };

    /**
     * Resizes and prepares body items for layout
     * @private
     * @returns {void}
     */
    private resizeBody(): void {
        alignItems(this.bodyItems[0], this.bodyItems[1], "C");
        resizeSelection(this.bodyItems, this.dimension.width, this.dimension.height);
        renameSizeTKN(this.bodyItems[0] as GroupItem, this.targetSizeChr);
        renameSizeTKN(this.bodyItems[1] as GroupItem, this.targetSizeChr);
    };

    /**
     * Arranges items in vertical layout
     * @private
     * @returns {GroupItem} Vertically stacked group
     */
    private initiateInV(): GroupItem {
        const [front, back] = this.bodyItems;

        if (this.mode === "FB") {
            moveItemAfter({
                base: front,
                moving: back,
                position: "B",
                gap: this.gap
            });
        }

        const groupManager = new GroupManager(this.bodyItems);
        groupManager.group();
        return groupManager.tempGroup!;
    };

    /**
     * Arranges items in horizontal layout
     * @private
     * @returns {GroupItem} Horizontally arranged group
     */
    private initiateInH(): GroupItem {
        const [front, back] = this.bodyItems;

        rotateItems(this.bodyItems, -90);

        if (this.mode === "FB") {
            moveItemAfter({
                base: front,
                moving: back,
                position: "R",
                gap: this.gap
            });
            rotateItems(back, 180);
        };

        const groupManager = new GroupManager(this.bodyItems);
        groupManager.group();
        return groupManager.tempGroup!;
    };

    /**
     * Creates L-shaped layout with mirrored duplicates
     * @private
     * @returns {GroupItem} L-shaped arrangement group
     */
    private initiateInL(): GroupItem {
        const [front, back] = this.bodyItems;

        // step 1 L design
        rotateItems(back, 90);
        alignItems(front, back, "B");

        moveItemAfter({
            base: front,
            moving: back,
            position: "R",
            gap: this.gap
        });

        // step 2 reflecting
        let duplicated = [] as Selection;

        duplicated = [front.duplicate(), back.duplicate()];

        rotateItems(duplicated, 180);

        moveItemAfter({
            base: front,
            moving: duplicated[1],
            position: "T",
            gap: this.gap
        });

        moveItemAfter({
            base: back,
            moving: duplicated[0],
            position: "T",
            gap: this.gap
        });

        const groupManager = new GroupManager([...this.bodyItems, ...duplicated]);
        groupManager.group();

        return groupManager.tempGroup!;
    };
}

interface ItemsInitiaterConst {
    mode: Mode;
    orientation: LayoutShapeConstants;
    bodyItems: BodyItems;
    targetSizeChr: ApparelSize;
    dimension: DimensionObject;
}