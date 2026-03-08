/**
 * Parameters required to initialize an {@link ItemsInitiater}.
 */
interface ItemsInitiaterParams {
  /** Target dimensions after resizing (values in inches) */
  readonly dimension: DimensionObject;

  /** Apparel size identifier to be written into SIZE_TKN text frames */
  readonly sizeChar: ApparelSize;

  /** Desired final stacking/arrangement pattern */
  readonly stack: StackType;

  /** Exactly two page items — typically front & back or left & right parts */
  readonly items: PageItem[];

  /** Indicates whether this size uses fixed (non-size-specific) dimensions */
  readonly fixedSize: boolean;

  /** Spacing between items when placed side-by-side or stacked (in inches) */
  readonly gap: number;
}

/**
 * Prepares a pair of apparel artwork groups (usually front + back or left + right)
 * for later grid / n-up duplication.
 *
 * Execution order (critical):
 * 1. Convert dimensions from inches to points
 * 2. Center-align item2 on item1
 * 3. Resize both items to target dimensions + update size tokens
 * 4. Apply requested stacking pattern (HH / VV / RHH / RVV / VRH)
 *
 * Important invariants:
 * - Expects **exactly two** items in params.items
 * - Both items are assumed to already be GroupItem (unsafe cast)
 * - Y-axis points **downward** (Illustrator coordinate system)
 * - Transformation engine is controlled by global CONFIG.THREAD_ENGINE
 */
class ItemsInitiater {
  private readonly dimension: DimensionObject;
  private readonly sizeChar: ApparelSize;
  private readonly stack: StackType;
  private readonly item1: PageItem;
  private item2: PageItem = null as unknown as PageItem;
  private readonly gap: number;
  private singleItem = false;
  private groupedItem = null as unknown as GroupItem;

  /** Handler for action-based transformations (used when THREAD_ENGINE = "action") */
  private readonly transAct: TransActionHandler | null = null;

  /**
   * @param params Configuration object with target size, stacking type and source items
   */
  constructor(params: ItemsInitiaterParams) {
    if (Utils.isActionThreadEngine()) {
      this.transAct = new TransActionHandler();
    }

    // Convert target dimensions from user-friendly inches to Illustrator internal points
    this.dimension = {
      width: Utils.convertLength({
        value: params.dimension.width,
        from: "inch",
        to: "pt",
      }),
      height: Utils.convertLength({
        value: params.dimension.height,
        from: "inch",
        to: "pt",
      }),
    };

    this.sizeChar = params.sizeChar;
    this.stack = params.stack;

    // Assumption: caller already validated that exactly two GroupItems are passed
    this.item1 = params.items[0] as GroupItem;
    if (params.items.length === 1) {
      this.singleItem = true;
    } else {
      this.item2 = params.items[1] as GroupItem;
    }

    // Convert gap from inches → points (used in positioning calls)
    this.gap = Utils.convertLength({
      value: params.gap,
      from: "inch",
      to: "pt",
    });

    // Important sequence:
    // 1. Align centers
    // 2. Resize
    // 3. update SIZE_TKN if fixed size=false
    // 3. Apply final layout pattern
    this.alignCenter();
    this.resize();
    if (!params.fixedSize) {
      this.renameSizeToken();
    }
    this[this.stack]();

    if (this.transAct) {
      this.transAct.removeAll();
    }
  }

  /**
   * Centers item2 exactly on top of item1 (geometric center alignment)
   * @private
   */
  private alignCenter(): void {
    if (this.singleItem) return;
    AlignmentHandler.alignObject({
      base: this.item1,
      moving: this.item2,
      engine: CONFIG.THREAD_ENGINE,
    });
  }

  /**
   * Updates all text frames named SIZE_TKN in both groups to current size
   * @private
   */
  private renameSizeToken(): void {
    Utils.renameSizeTKN(this.item1 as GroupItem, this.sizeChar);
    if (this.singleItem) return;
    Utils.renameSizeTKN(this.item2 as GroupItem, this.sizeChar);
  }

  /**
   * Resizes both groups to target dimensions (in points).
   * Uses action engine when available (more reliable with masks/compound paths),
   * otherwise uses script-level resize.
   * Updates size tokens after resize.
   * @private
   */
  private resize(): void {
    if (Utils.isActionThreadEngine()) {
      // Action-based resize — usually safer with complex artwork
      this.transAct!.resize({
        width: this.dimension.width,
        height: this.dimension.height,
        objects: !this.singleItem ? [this.item1, this.item2] : [this.item1],
      });
    } else {
      // Script-level fallback resize
      Utils.resizeObject(
        !this.singleItem ? [this.item1, this.item2] : [this.item1],
        this.dimension.width,
        this.dimension.height,
      );
    }
  }

  /**
   * Rotates given objects by specified angle using current engine
   * @param params Rotation parameters
   * @private
   */
  private rotate({ deg, objects }: { deg: number; objects: PageItem[] }): void {
    if (Utils.isActionThreadEngine()) {
      this.transAct!.rotate({ deg, objects });
    } else {
      Utils.rotateItems(objects, deg);
    }
  }

  /**
   * Groups item1 and item2 into one GroupItem
   * (currently unused in public API)
   * @private
   */
  private pairGroup(): GroupItem {
    return GroupManager.group(
      !this.singleItem ? [this.item1, this.item2] : [this.item1],
    );
  }

  // ────────────────────────────────────────────────
  //              Stacking pattern methods
  // ────────────────────────────────────────────────

  /**
   * HH — places item2 to the right of item1 with gap
   */
  private HH(): void {
    if (!this.singleItem) {
      AlignmentHandler.moveObjectAfter({
        base: this.item1,
        moving: this.item2,
        position: "R",
        gap: this.gap,
        engine: CONFIG.THREAD_ENGINE,
      });
    }
    this.groupedItem = this.pairGroup();
  }

  /**
   * VV — places item2 below item1 with gap
   */
  private VV(): void {
    if (!this.singleItem) {
      AlignmentHandler.moveObjectAfter({
        base: this.item1,
        moving: this.item2,
        position: "B",
        gap: this.gap,
        engine: CONFIG.THREAD_ENGINE,
      });
    }
    this.groupedItem = this.pairGroup();
  }

  /**
   * RHH — rotates item1 clockwise 90°, item2 counter-clockwise 90°, then HH
   */
  private RHH(): void {
    this.rotate({ deg: -90, objects: [this.item1] });
    if (!this.singleItem) {
      this.rotate({ deg: 90, objects: [this.item2] });
      this.HH();
    }
    this.groupedItem = this.pairGroup();
  }

  /**
   * RVV — rotates both items counter-clockwise 90°, then VV
   */
  private RVV(): void {
    this.rotate({ deg: 90, objects: [this.item1, this.item2] });
    if (!this.singleItem) {
      this.VV();
    }
    this.groupedItem = this.pairGroup();
  }

  /**
   * **VRH** — Vertical-Rotated-Horizontal (mirrored / symmetric layout)
   *
   * Special layout often used in apparel gang-run production.
   * Creates a mirrored pair suitable for certain folding/cutting workflows.
   *
   * Behavior in single-item mode:
   *   Duplicates the single item and treats it as item2
   *
   * Steps:
   * 1. Rotate item1 180° (upside down), item2 –90° (clockwise 90°)
   * 2. Align left edges of both items
   * 3. Stack item2 below item1 with gap
   * 4. Duplicate both items → group duplicates
   * 5. Rotate duplicate group 180° (creates mirror)
   * 6. Place mirrored group to the right of the taller/wider base item
   *
   * @returns Final grouped artwork (usually already contains mirrored pair)
   */
  private VRH(): void {
    // ── Single-item fallback: duplicate item1 to allow mirroring ─────
    if (this.singleItem) {
      this.item2 = this.item1.duplicate() as GroupItem;
      this.singleItem = false;
    }

    // Step 1: Apply orientation rotations
    this.rotate({ deg: 180, objects: [this.item1] });
    this.rotate({ deg: -90, objects: [this.item2] });

    // Step 2: Decide which item should be the reference for right-side placement
    const heightIsLargerOrEqual = this.dimension.height >= this.dimension.width;

    // Step 3: Align left edges (create common left boundary)
    AlignmentHandler.alignObject({
      base: this.item1,
      moving: this.item2,
      position: "L",
      engine: CONFIG.THREAD_ENGINE,
    });

    // Step 4: Stack second item below first with configured gap
    AlignmentHandler.moveObjectAfter({
      base: this.item1,
      moving: this.item2,
      position: "B",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });

    // Step 5: Create mirrored copy (duplicate → group → rotate 180°)
    const mirroredGroup = GroupManager.group([
      this.item1.duplicate(),
      this.item2.duplicate(),
    ]);

    this.rotate({ deg: -180, objects: [mirroredGroup] });

    // Step 6: Place mirrored side to the right of chosen base item
    AlignmentHandler.moveObjectAfter({
      base: heightIsLargerOrEqual ? this.item1 : this.item2,
      moving: mirroredGroup,
      position: "R",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });
    

    // Return final grouped result (contains original + mirrored side)
    this.groupedItem = GroupManager.group([...GroupManager.ungroup(this.pairGroup()), ...GroupManager.ungroup(mirroredGroup)]);
  }

  /**
   * get initiated group item
   * @returns
   */
  public getItem() {
    return this.groupedItem;
  }
}
