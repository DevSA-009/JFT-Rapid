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
  private readonly item1: GroupItem;
  private readonly item2: GroupItem;
  private readonly gap: number;

  /** Handler for action-based transformations (used when THREAD_ENGINE = "action") */
  private readonly transAct =
    Utils.getGlobalTransActHandler() as TransActionHandler;

  /**
   * @param params Configuration object with target size, stacking type and source items
   */
  constructor(params: ItemsInitiaterParams) {
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
    this.item2 = params.items[1] as GroupItem;

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
  }

  /**
   * Centers item2 exactly on top of item1 (geometric center alignment)
   * @private
   */
  private alignCenter(): void {
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
    Utils.renameSizeTKN(this.item1, this.sizeChar);
    Utils.renameSizeTKN(this.item2, this.sizeChar);
  }

  /**
   * Resizes both groups to target dimensions (in points).
   * Uses action engine when available (more reliable with masks/compound paths),
   * otherwise uses script-level resize.
   * Updates size tokens after resize.
   * @private
   */
  private resize(): void {
    if (CONFIG.THREAD_ENGINE === "action") {
      // Action-based resize — usually safer with complex artwork
      this.transAct.resize({
        width: this.dimension.width,
        height: this.dimension.height,
        objects: [this.item1, this.item2],
      });
    } else {
      // Script-level fallback resize
      Utils.resizeObject(
        [this.item1, this.item2],
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
    if (CONFIG.THREAD_ENGINE === "action") {
      this.transAct.rotate({ deg, objects });
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
    return GroupManager.group([this.item1, this.item2]);
  }

  // ────────────────────────────────────────────────
  //              Stacking pattern methods
  // ────────────────────────────────────────────────

  /**
   * HH — places item2 to the right of item1 with gap
   */
  public HH(): GroupItem {
    AlignmentHandler.moveObjectAfter({
      base: this.item1,
      moving: this.item2,
      position: "R",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });
    return this.pairGroup()
  }

  /**
   * VV — places item2 below item1 with gap
   */
  public VV(): GroupItem {
    AlignmentHandler.moveObjectAfter({
      base: this.item1,
      moving: this.item2,
      position: "B",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });
    return this.pairGroup()
  }

  /**
   * RHH — rotates item1 clockwise 90°, item2 counter-clockwise 90°, then HH
   */
  public RHH(): GroupItem {
    this.rotate({ deg: -90, objects: [this.item1] });
    this.rotate({ deg: 90, objects: [this.item2] });
    this.HH();
    return this.pairGroup()
  }

  /**
   * RVV — rotates both items counter-clockwise 90°, then VV
   */
  public RVV(): GroupItem {
    this.rotate({ deg: 90, objects: [this.item1, this.item2] });
    this.VV();
    return this.pairGroup()
  }

  /**
   * **VRH** — Vertical-Rotated-Horizontal layout (creates a mirrored / paired arrangement)
   *
   * Purpose:
   *   Arranges two items (typically front/back or left/right symmetric parts)
   *   into a mirrored layout suitable for certain apparel production grids.
   *
   * Current steps:
   *   1. Rotates item1 180° and item2 –90°
   *   2. Aligns left edges of both items
   *   3. Places item2 below item1 with gap
   *   4. Duplicates both items and groups the duplicates
   *   5. Rotates duplicate group 180° (mirror effect)
   *   6. Places the mirrored duplicate group to the right
   *      (base item depends on whether height > width)
   *   7. Ungroups the duplicate group
   *
   * @note
   *   - Rotation of item1 by 180° and item2 by –90° changes orientation significantly
   *     compared to previous versions → verify visually if this is the intended result.
   *   - The choice of base (item1 or item2) for placing the duplicate pair depends on
   *     whether the target height is larger than width — this is a dynamic decision.
   *   - No center compensation is applied here (unlike some other rotate calls)
   */
  public VRH(): GroupItem {
    // Step 1: Apply initial rotations to prepare orientations
    // item1 rotated 180° (upside down), item2 rotated –90° (clockwise 90°)
    this.rotate({ deg: 180, objects: [this.item1] });
    this.rotate({ deg: -90, objects: [this.item2] });

    // Step 2: Determine which item should serve as the horizontal base
    // for placing the mirrored duplicate pair later
    const heightLarge = this.dimension.height >= this.dimension.width;

    // Step 3: Align left edges of both items (makes them share the same left boundary)
    AlignmentHandler.alignObject({
      base: this.item1,
      moving: this.item2,
      engine: CONFIG.THREAD_ENGINE,
      position: "L",
    });

    // Step 4: Position item2 directly below item1 with configured gap
    AlignmentHandler.moveObjectAfter({
      base: this.item1,
      moving: this.item2,
      position: "B",
      engine: CONFIG.THREAD_ENGINE,
      gap: this.gap,
    });

    // Step 5: Create a duplicate pair to become the mirrored side
    // Duplicate both transformed items and group them together
    const dupGrp = GroupManager.group([
      this.item1.duplicate(),
      this.item2.duplicate(),
    ]);

    // Step 6: Rotate the duplicate group 180° to create mirror symmetry
    this.rotate({ deg: -180, objects: [dupGrp] });

    // Step 7: Place the mirrored duplicate group to the right of the chosen base item
    // If height ≥ width → use item1 as reference (taller layout)
    // If width > height → use item2 as reference (wider layout)
    AlignmentHandler.moveObjectAfter({
      base: heightLarge ? this.item1 : this.item2,
      moving: dupGrp,
      position: "R",
      engine: CONFIG.THREAD_ENGINE,
      gap: this.gap,
    });

    return this.pairGroup()
  }
}
