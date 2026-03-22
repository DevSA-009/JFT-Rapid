/**
 * Parameters required to initialise an {@link ItemsInitiater}.
 */
interface ItemsInitiaterParams {
  /** Target artwork dimensions in **inches** — converted to points internally. */
  readonly dimension: DimensionObject;

  /** Apparel size identifier written into `SIZE_TKN` text frames. */
  readonly sizeChar: ApparelSize;

  /** Desired stacking / arrangement pattern for the composed group. */
  readonly stack: StackType;

  /**
   * One or two source PageItems — typically front + back or left + right.
   * When only one item is provided, `isSingleItem` is set and the second slot
   * is handled per stacking method (VRH auto-duplicates; others operate as-is).
   */
  readonly items: PageItem[];

  /**
   * When `true`, the item uses a fixed template size and SIZE_TKN frames
   * should **not** be updated (they already carry the correct label).
   */
  readonly fixedSize: boolean;

  /** Gap between items when placed side-by-side or stacked, in **inches**. */
  readonly gap: number;

  /**
   * Whether the two items form a paired set (e.g. front + back of a garment).
   *
   * Controls how {@link buildGroup} wraps the items:
   *
   * - `true`  — items are **never** individually wrapped before combining,
   *   regardless of the `wrapEach` argument.  The pair is always merged
   *   directly into one group.
   * - `false` — normal wrapping logic applies: each item is first wrapped in
   *   its own single-item group (`wrapEach = true`) before the two wrappers
   *   are combined.  During wrapping the item's original name is captured,
   *   the item's name is cleared, and the name is transferred to its wrapper
   *   group to prevent duplicate-name confusion in the document.
   */
  readonly pairable: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prepares a pair (or single) of apparel artwork groups for later grid /
 * n-up duplication by executing the following pipeline in strict order:
 *
 * ```
 * constructor(params)
 *   │
 *   ├── 1. alignCenter()        — overlay item2 on item1 (skipped for single)
 *   ├── 2. resize()             — scale both to target dimensions
 *   ├── 3. updateSizeTokens()   — replace SIZE_TKN text (skipped when fixedSize)
 *   └── 4. this[stack]()        — apply the chosen stacking pattern
 *         HH  · item2 right of item1
 *         VV  · item2 below item1
 *         RHH · item1 −90°, item2 +90°, then HH
 *         RVV · both +90°, then VV
 *         VRH · mirrored symmetric layout (see {@link VRH})
 * ```
 *
 * ### `pairable` and `wrapEach` interaction
 * When `pairable = true`, {@link buildGroup} **never** wraps items individually —
 * the pair is always merged directly, regardless of the `wrapEach` argument.
 * When `pairable = false`, items are each wrapped first (`wrapEach = true`),
 * with their original names preserved on the wrapper groups.
 *
 * ### SIZE_TKN auto-creation
 * When `updateSizeTokens` cannot find a `SIZE_TKN` frame inside an item,
 * {@link createSizeToken} is called automatically to insert one.  The token is
 * a text frame centred over a backing rectangle, aligned to the bottom-centre
 * of the host item, then ungrouped in-place.
 *
 * ### Bugs fixed over the original
 * - **RHH / RVV double-group** — original called `HH()` / `VV()` then
 *   `buildGroup()` again, leaving an orphaned `GroupItem` in the document.
 *   Fixed: `HH` / `VV` own all grouping; `RHH` / `RVV` delegate entirely.
 * - **RVV null crash** — `[item1, item2]` passed `null` when `isSingleItem`.
 *   Fixed with a single-item guard.
 * - **Unsafe null casts** replaced with proper nullable types.
 */
class ItemsInitiater {
  // ─── Immutable configuration ────────────────────────────────────────────

  /** Target dimensions in **points** (converted from params inches). */
  private readonly dimension: DimensionObject;

  /** Apparel size character forwarded to SIZE_TKN text-frame replacement. */
  private readonly sizeChar: ApparelSize;

  /** Stacking pattern — `"HH" | "VV" | "RHH" | "RVV" | "VRH"`. */
  private readonly stack: StackType;

  /** Gap between items in **points** (converted from params inches). */
  private readonly gap: number;

  /**
   * When `true`, items are never individually wrapped in {@link buildGroup}.
   * Mirrors the `pairable` field from {@link ItemsInitiaterParams}.
   */
  private readonly pairable: boolean;

  // ─── Mutable state ───────────────────────────────────────────────────────

  /** Primary artwork item — always present. */
  private readonly item1: PageItem;

  /**
   * Secondary artwork item — `null` when only one item was supplied.
   * VRH auto-creates a duplicate when `null`.
   */
  private item2: PageItem | null;

  /** `true` when only one item was supplied in `params.items`. */
  private isSingleItem: boolean;

  /**
   * Final composed `GroupItem` — `null` until the stacking method completes;
   * guaranteed non-null by the time {@link getItem} is called.
   */
  private composedGroup: GroupItem | null = null;

  /**
   * Action-based transform handler — instantiated only when
   * `CONFIG.THREAD_ENGINE === "action"`, `null` otherwise.
   */
  private readonly actionHandler: TransActionHandler | null;

  // ─── Constructor ─────────────────────────────────────────────────────────

  /**
   * Constructs and immediately runs the full preparation pipeline.
   *
   * @param params - Source items, target size, stack type and layout options.
   */
  constructor(params: ItemsInitiaterParams) {
    this.actionHandler = Utils.isActionThreadEngine()
      ? new TransActionHandler()
      : null;

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

    this.gap = Utils.convertLength({
      value: params.gap,
      from: "inch",
      to: "pt",
    });
    this.sizeChar = params.sizeChar;
    this.stack = params.stack;
    this.pairable = params.pairable;

    this.item1 = params.items[0] as GroupItem;
    this.isSingleItem = params.items.length === 1;
    this.item2 = this.isSingleItem ? null : (params.items[1] as GroupItem);

    // ── Pipeline (order is critical) ─────────────────────────────────────
    this.alignCenter();
    this.resize();

    if (!params.fixedSize) {
      this.updateSizeTokens();
    }

    this[this.stack]();

    if (this.actionHandler) {
      this.actionHandler.removeAll();
    }
  }

  // ─── Private: Preparation pipeline ───────────────────────────────────────

  /**
   * Overlays `item2` exactly on top of `item1` (geometric centre alignment).
   * No-op when `isSingleItem`.
   * @private
   */
  private alignCenter(): void {
    if (this.isSingleItem || !this.item2) return;

    AlignmentHandler.alignObject({
      base: this.item1,
      moving: this.item2,
      engine: CONFIG.THREAD_ENGINE,
    });
  }

  /**
   * Scales both items to `this.dimension` (points).
   * Prefers the action engine for reliability with masks and compound paths.
   * @private
   */
  private resize(): void {
    const targets: PageItem[] =
      this.isSingleItem || !this.item2
        ? [this.item1]
        : [this.item1, this.item2];

    if (this.actionHandler) {
      this.actionHandler.resize({
        width: this.dimension.width,
        height: this.dimension.height,
        objects: targets,
      });
    } else {
      Utils.resizeObject(targets, this.dimension.width, this.dimension.height);
    }
  }

  /**
   * Replaces the `SIZE_TKN` placeholder in both items with `this.sizeChar`.
   *
   * When a `SIZE_TKN` frame is **not found** inside an item,
   * {@link createSizeToken} is called first to inject one automatically —
   * so the token always exists before the rename runs.
   *
   * Skipped entirely when `fixedSize` is `true`.
   *
   * @private
   */
  private updateSizeTokens(): void {
    this.ensureAndRenameSizeToken(this.item1 as GroupItem);

    if (!this.isSingleItem && this.item2) {
      this.ensureAndRenameSizeToken(this.item2 as GroupItem);
    }
  }

  /**
   * Ensures a `SIZE_TKN` frame exists inside `item` — creating one via
   * {@link createSizeToken} if absent — then sets its contents to the
   * formatted size label.
   *
   * @param item - The `GroupItem` to check and update.
   * @throws {Error} When `item` is not a `GroupItem`.
   * @private
   */
  private ensureAndRenameSizeToken(item: GroupItem): void {
    if (item.typename !== PageItemType.GroupItem) {
      throw new Error(
        `SIZE_TKN target must be a GroupItem — received "${item.typename}" ("${item.name}").`,
      );
    }

    const tokenExists = !!ES6_SA.arrayFind(
      item.pageItems,
      (child) =>
        child.typename === PageItemType.TextFrame && child.name === SIZE_TKN,
    );

    if (!tokenExists) {
      this.createSizeToken(item);
    }

    Utils.renameSizeTKN(item, this.sizeChar);
  }

  // ─── Private: SIZE_TKN factory ────────────────────────────────────────────

  /**
   * Creates a `SIZE_TKN` composite and injects it into `hostItem`.
   *
   * ### Composite structure
   * ```
   * ┌──────────────────────────┐  ← rect      1.00 × 0.20 inch
   * │      [SIZE_TKN text]     │  ← textFrame  0.55 × 0.17 inch, centred on rect
   * └──────────────────────────┘
   * ```
   *
   * ### Colours
   * | Element    | Fill                       | Stroke                         |
   * |------------|----------------------------|--------------------------------|
   * | Rectangle  | CMYK white (0 / 0 / 0 / 0) | 0.5 pt · CMYK 75 / 75 / 67 / 100 |
   * | Text frame | CMYK 75 / 75 / 67 / 100    | none                           |
   *
   * ### Font
   * **Sakana Bold** is applied when available; the document default is used as
   * a silent fallback when the font is not installed.
   *
   * ### Placement sequence
   * 1. Build the composite group (textFrame + rect).
   * 2. Move the group into `hostItem` so it shares the same coordinate space.
   * 3. Align the group to the **bottom-centre** (`"BC"`) of `hostItem` via
   *    {@link AlignmentHandler.alignObject}.
   * 4. Ungroup via {@link GroupManager.ungroup} — children are promoted
   *    directly into `hostItem`'s page-item list and the container is removed.
   *
   * @param hostItem - The `GroupItem` that will receive the composite.
   * @throws {Error} When `hostItem` is not a `GroupItem`.
   * @private
   */
  private createSizeToken(hostItem: GroupItem): void {
    if (hostItem.typename !== PageItemType.GroupItem) {
      throw new Error(
        `createSizeToken requires a GroupItem — received "${hostItem.typename}" ("${hostItem.name}").`,
      );
    }

    const doc = app.activeDocument;

    // ── Dimensions: inches → points ──────────────────────────────────────
    const rectW = Utils.convertLength({ value: 1.0, from: "inch", to: "pt" });
    const rectH = Utils.convertLength({ value: 0.2, from: "inch", to: "pt" });
    const textW = Utils.convertLength({ value: 0.55, from: "inch", to: "pt" });
    const textH = Utils.convertLength({ value: 0.17, from: "inch", to: "pt" });

    // ── Shared dark ink colour: CMYK 75 / 75 / 67 / 100 ──────────────────
    const inkColor = new CMYKColor();
    inkColor.cyan = 75;
    inkColor.magenta = 75;
    inkColor.yellow = 67;
    inkColor.black = 100;

    // ── White fill for the rectangle ─────────────────────────────────────
    const whiteColor = new CMYKColor();
    whiteColor.cyan = 0;
    whiteColor.magenta = 0;
    whiteColor.yellow = 0;
    whiteColor.black = 0;

    // ── 1. Backing rectangle ─────────────────────────────────────────────
    // Created at origin; final position is set by alignObject in step 3
    const rect = doc.activeLayer.pathItems.rectangle(0, 0, rectW, rectH);
    rect.filled = true;
    rect.fillColor = whiteColor;
    rect.stroked = true;
    rect.strokeWidth = 0.5;
    rect.strokeColor = inkColor;

    // ── 2. Text frame ─────────────────────────────────────────────────────
    const textFrame = doc.activeLayer.textFrames.add();
    textFrame.contents = SIZE_TKN;
    textFrame.name = SIZE_TKN;
    textFrame.width = textW;
    textFrame.textRange.paragraphAttributes.justification =
      Justification.CENTER;
    textFrame.height = textH;

    // Apply font with silent fallback
    try {
      textFrame.textRange.characterAttributes.textFont =
        app.textFonts.getByName(SIZE_TKN_FONT);
    } catch (_) {
      // Sakana Bold not installed — document default font remains in effect
    }

    textFrame.textRange.characterAttributes.fillColor = inkColor;

    // ── 3. Centre text frame over the rectangle ───────────────────────────
    AlignmentHandler.alignObject({
      base: rect,
      moving: textFrame,
      engine: "script",
    });

    // ── 4. Group composite (text on top of rect in stacking order) ────────
    const tokenGroup = GroupManager.group([textFrame, rect]);

    // align bottom-centre
    AlignmentHandler.alignObject({
      base: hostItem,
      moving: tokenGroup,
      position: "BC",
      engine: "script",
    });

    // ── 5. Place inside hostItem and  ──────────────────
    // Moving into hostItem ensures both share the same coordinate space
    // before the alignment call
    tokenGroup.move(hostItem, ElementPlacement.INSIDE);

    // ── 6. Ungroup — promote children into hostItem's page-item list ──────
    // GroupManager.ungroup removes the container and returns the released
    // children, which are now direct members of hostItem
    GroupManager.ungroup(tokenGroup);
  }

  // ─── Private: Shared transform helper ────────────────────────────────────

  /**
   * Rotates `objects` by `deg` degrees using the active engine.
   *
   * Positive = counter-clockwise in Illustrator.
   * Negative = clockwise (e.g. −90° = rotate right).
   *
   * @param deg     - Rotation angle in degrees.
   * @param objects - Items to rotate.
   * @private
   */
  private rotate(deg: number, objects: PageItem[]): void {
    if (this.actionHandler) {
      this.actionHandler.rotate({ deg, objects });
    } else {
      Utils.rotateItems(objects, deg);
    }
  }

  // ─── Private: Group builder ───────────────────────────────────────────────

  /**
   * Combines `item1` and `item2` into a single `GroupItem`.
   *
   * ### `pairable` override
   * When `this.pairable = true`, items are **always** merged directly —
   * the `wrapEach` argument is ignored and individual wrapping never occurs.
   *
   * ### `wrapEach` behaviour (active only when `pairable = false`)
   * - `true` **(default)**: each item's name is captured and cleared, the item
   *   is wrapped in its own single-item group, and the captured name is set on
   *   the wrapper.  The two named wrappers are then combined into the outer group.
   * - `false`: items are merged directly without per-item wrappers.
   *   Used by {@link VRH} to flatten the base pair alongside a mirrored group.
   *
   * Returns `item1` as-is when `isSingleItem` is `true`.
   *
   * @param wrapEach - Wrap each item individually (ignored when `pairable = true`).
   * @returns The composed `GroupItem`.
   * @private
   */
  private buildGroup(wrapEach: boolean = true): GroupItem {
    if (this.isSingleItem || !this.item2) {
      return this.item1 as GroupItem;
    }

    // pairable=true → always direct merge, wrapEach has no effect
    const shouldWrap = !this.pairable && wrapEach;

    if (shouldWrap) {
      // Capture names — wrapper groups inherit them, items' names are cleared
      // to prevent duplicate-name confusion at the document level
      const name1 = this.item1.name;
      const name2 = this.item2.name;

      const wrapper1 = GroupManager.group([this.item1]);
      const wrapper2 = GroupManager.group([this.item2]);

      wrapper1.name = name1;
      wrapper2.name = name2;

      return GroupManager.group([wrapper1, wrapper2]);
    }

    // Direct merge — no per-item wrappers
    return GroupManager.group([this.item1, this.item2]);
  }

  // ─── Private: Stacking pattern methods ───────────────────────────────────

  /**
   * **HH** — Horizontal-Horizontal.
   * Places `item2` to the right of `item1` with `this.gap`, then groups both.
   * @private
   */
  private HH(): void {
    if (!this.isSingleItem && this.item2) {
      AlignmentHandler.moveObjectAfter({
        base: this.item1,
        moving: this.item2,
        position: "R",
        gap: this.gap,
        engine: CONFIG.THREAD_ENGINE,
      });
    }

    this.composedGroup = this.buildGroup();
  }

  /**
   * **VV** — Vertical-Vertical.
   * Places `item2` below `item1` with `this.gap`, then groups both.
   * @private
   */
  private VV(): void {
    if (!this.isSingleItem && this.item2) {
      AlignmentHandler.moveObjectAfter({
        base: this.item1,
        moving: this.item2,
        position: "B",
        gap: this.gap,
        engine: CONFIG.THREAD_ENGINE,
      });
    }

    this.composedGroup = this.buildGroup();
  }

  /**
   * **RHH** — Rotated-Horizontal-Horizontal.
   * Rotates `item1` −90°, `item2` +90°, then delegates to {@link HH}.
   * @private
   */
  private RHH(): void {
    this.rotate(-90, [this.item1]);

    if (!this.isSingleItem && this.item2) {
      this.rotate(90, [this.item2]);
    }

    // HH owns positioning AND grouping — no additional buildGroup() needed
    this.HH();
  }

  /**
   * **RVV** — Rotated-Vertical-Vertical.
   * Rotates both items +90°, then delegates to {@link VV}.
   * Single-item guard prevents passing `null` to the rotate call.
   * @private
   */
  private RVV(): void {
    const targets: PageItem[] =
      this.isSingleItem || !this.item2
        ? [this.item1]
        : [this.item1, this.item2];

    this.rotate(90, targets);

    // VV owns positioning AND grouping — no additional buildGroup() needed
    this.VV();
  }

  /**
   * **VRH** — Vertical-Rotated-Horizontal (mirrored symmetric layout).
   *
   * Gang-run layout where the substrate is folded along the vertical axis.
   *
   * ### Steps
   * 1. Auto-duplicate `item1` → `item2` when `isSingleItem`.
   * 2. Rotate `item1` 180°, `item2` −90°.
   * 3. Align left edges (shared left boundary).
   * 4. Stack `item2` below `item1` with gap.
   * 5. Duplicate both → group → rotate −180° → `mirroredGroup`.
   * 6. Place `mirroredGroup` to the right of the portrait/landscape anchor.
   * 7. Flatten base pair + mirrored group into `composedGroup`.
   *
   * {@link GroupManager.ungroup} removes intermediate containers so no orphaned
   * groups accumulate in the document.
   *
   * @private
   */
  private VRH(): void {
    // Step 1 — VRH always needs two items
    if (this.isSingleItem) {
      this.item2 = this.item1.duplicate() as GroupItem;
      this.isSingleItem = false;
    }

    const item2 = this.item2!;

    // Step 2
    this.rotate(180, [this.item1]);
    this.rotate(-90, [item2]);

    // Step 3
    AlignmentHandler.alignObject({
      base: this.item1,
      moving: item2,
      position: "L",
      engine: CONFIG.THREAD_ENGINE,
    });

    // Step 4
    AlignmentHandler.moveObjectAfter({
      base: this.item1,
      moving: item2,
      position: "B",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });

    // Step 5
    const mirroredGroup = GroupManager.group([
      this.item1.duplicate(),
      item2.duplicate(),
    ]);

    this.rotate(-180, [mirroredGroup]);

    // Step 6 — portrait → item1 taller anchor; landscape → item2 wider anchor
    const rightAnchor =
      this.dimension.height >= this.dimension.width ? this.item1 : item2;

    AlignmentHandler.moveObjectAfter({
      base: rightAnchor,
      moving: mirroredGroup,
      position: "R",
      gap: this.gap,
      engine: CONFIG.THREAD_ENGINE,
    });

    // Step 7
    this.composedGroup = GroupManager.group([
      ...GroupManager.ungroup(this.buildGroup(false)),
      ...GroupManager.ungroup(mirroredGroup),
    ]);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Returns the fully prepared composed `GroupItem` ready for grid duplication.
   *
   * Guaranteed non-null — every stacking method sets `composedGroup`.
   *
   * @returns The composed `GroupItem`.
   */
  public getItem(): GroupItem {
    return this.composedGroup!;
  }
}
