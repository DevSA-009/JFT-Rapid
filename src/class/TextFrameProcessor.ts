// ─────────────────────────────────────────────────────────────────────────────
// TextFrameProcessor.ts
//
// Encapsulates every text-frame mutation operation that was previously inline
// inside GridLayoutGenerator.modifyTextFramesInItem.
//
// Responsibilities:
//   1. Axis resolution   — which dimension (width / height) governs font scaling
//                          for the active stack type and sub-item index.
//   2. Size snapshot     — capture a TextFrame's visual dimensions in inches
//                          before and after content replacement.
//   3. Font correction   — resize the TextFrame by percentage when the new
//                          content causes it to grow too wide or shrink too small.
//   4. Post-injection    — gradient expansion, arc warp, outline conversion.
//   5. Data consumption  — advance the FIFO data queue by the correct count
//                          based on stack type, pair status and dynamic flags.
//
// ### Usage
// ```typescript
// const processor = new TextFrameProcessor({
//   stack:          this.layoutPassTracker.stack,
//   isPaired:       this.isPaired,
//   isMixedDynamic: !!this.resolveMixedEntries(),
//   data:           this.data,
// });
//
// processor.process(placedItem);
// ```
//
// The `data` array is passed **by reference** — `shift()` calls inside
// `process()` mutate the caller's queue directly, preserving FIFO order
// across all placed items without any extra synchronisation.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────
/*
/**
 * Maximum extra width/height (inches) a text frame may grow after content
 * replacement before the font is scaled down.
 *
 * Example: old = 7 in → acceptable up to 8.5 in; anything beyond triggers
 * a scale-down to `old + TEXT_TARGET_GROW_INCH`.
 */
const TEXT_MAX_GROW_INCH = 1.35;

// /**
//  * Target extra dimension (inches) used as the upper bound when scaling a
//  * "too-large" frame back down.
//  *
//  * Example: old = 7 in → after scale-down the frame lands at 8 in.
//  */
const TEXT_TARGET_GROW_INCH = 1.0;

// /**
//  * Ratio below which a text frame is considered "too small" after content
//  * replacement.  Frames that shrink below `old × TEXT_SHRINK_THRESHOLD`
//  * receive a gentle scale-up.
//  *
//  * Example: 0.5 → trigger when the frame shrinks below 50 % of its original size.
//  */
const TEXT_SHRINK_THRESHOLD = 0.5;

// /**
//  * Fraction of the gap between `newDim` and `oldDim` closed by the gentle
//  * scale-up.  The result deliberately stays below `oldDim` — the frame is
//  * nudged toward the original size, never fully restored.
//  *
//  * Example: old = 10, new = 4 → gap = 6 → target = 4 + 6 × 0.35 = 6.1 in.
//  */
const TEXT_SHRINK_CLOSE_RATIO = 0.35;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Constructor parameters for {@link TextFrameProcessor}.
 *
 * All fields reflect the **current layout pass** state — reconstruct the
 * processor at the start of each pass when `stack` or `isPaired` changes.
 */
interface TextFrameProcessorParams {
  /**
   * Active stack type for the current layout pass.
   * Controls which axis (width vs height) is used for font correction and
   * whether gradient expansion is required.
   */
  readonly stack: StackType;

  /**
   * Whether the current item is treated as a paired set.
   * Affects how many data rows are consumed per placed group when `stack` is VRH.
   */
  readonly isPaired: boolean;

  /**
   * `true` when the two JFT item entries have **different** `isDynamic` flags
   * (one dynamic, one static).
   *
   * - `false` (both same) → every dynamic sub-group shifts the data queue once.
   * - `true`  (mixed)     → data queue is shifted only after every second
   *   dynamic sub-group (odd pass marks pending; even pass commits the shift).
   *
   * Obtain this value from `!!GridLayoutGenerator.resolveMixedEntries()`.
   */
  readonly isMixed: boolean;

  /**
   * Shared FIFO data queue passed **by reference**.
   *
   * Each element is a {@link PlayerEntry} row consumed via `Array.shift()`.
   * The caller must pass the correct garment-type bucket (e.g.
   * `details.DATA.SHORT_SLEEVE`) so only the matching players are injected.
   * `null` when no dynamic text injection is needed (static mode or
   * collar/rib parts that carry no player data).
   */
  readonly data: SizeMarkerEntries | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles all text-frame mutation for one placed grid item.
 *
 * ### Axis selection (`resolveAxis`)
 * The font-correction formula compares one linear dimension (width or height)
 * of the text frame before and after content replacement.  Which axis is used
 * depends on the stack type and sub-item index:
 *
 * | Stack      | Rule                                             |
 * |------------|--------------------------------------------------|
 * | RHH / RVV  | Always HEIGHT — item is rotated 90°             |
 * | VRH        | Even sub-item index → WIDTH; odd → HEIGHT        |
 * | All others | Always WIDTH                                     |
 *
 * ### Font correction (`adjustFontSize`)
 * | Condition                              | Action                                         |
 * |----------------------------------------|------------------------------------------------|
 * | `new ≤ old + TEXT_MAX_GROW_INCH`      | No change — within acceptable growth band      |
 * | `new > old + TEXT_MAX_GROW_INCH`      | Scale DOWN: target = `old + TEXT_TARGET_GROW`  |
 * | `old × SHRINK_THRESHOLD ≤ new < old`  | No change — slight shrink acceptable           |
 * | `new < old × SHRINK_THRESHOLD`        | Scale UP: close `CLOSE_RATIO` of gap to `old` |
 *
 * ### Data consumption (`resolveDataConsumeCount`)
 * | Stack | `isPaired` | Shifts per `process()` call |
 * |-------|-----------|---------------------------|
 * | VRH   | `true`    | 2                         |
 * | VRH   | `false`   | 4                         |
 * | other | any       | 1                         |
 *
 * When `isMixedDynamic = true` the shift is deferred: it fires only after
 * every second dynamic sub-group (odd encounters mark pending; even commits).
 *
 * ### Post-injection sequence (per TextFrame, strict order)
 * 1. Snapshot size BEFORE `contents` change.
 * 2. Set `textFrame.contents`.
 * 3. `adjustFontSize` — width/height-based correction.
 * 4. Gradient expansion — only on rotated stacks (RHH / RVV / VRH).
 * 5. Arc warp — when `CONFIG.WRAP_TEXT` is `true`.
 * 6. Create outlines — when `CONFIG.OUTLINE_TEXT` is `true` and `WRAP_TEXT` is
 *    `false`.  **Must be last** — `createOutline()` destroys the TextFrame
 *    reference and replaces it with a GroupItem.
 */
class TextFrameProcessor {
  // ─── Immutable config ──────────────────────────────────────────────────

  /** Active stack type for this layout pass — drives axis selection and gradient expansion. */
  private readonly stack: StackType;
  /**
   * `true` when one JFT item is dynamic and the other is static.
   * Controls the deferred-shift logic in {@link advanceDataQueue}.
   */
  private readonly isMixed: boolean;
  /** FIFO player-entry queue for the current garment-type pass. */
  private readonly data: SizeMarkerEntries | null;
  /**
   * Accumulates live `TextFrame` references that need gradient expansion
   * after the entire placed-item loop completes.  Cleared after each
   * `process()` call and after `expandAppearanceTextFrames()` runs.
   */
  private modifiedTextFrames: TextFrame[] = [];

  /**
   * Cached flag: `true` when the active stack requires gradient expansion.
   * HH and VV are axis-aligned — no expansion needed.
   * All rotated stacks (RHH, RVV, VRH) must expand gradient fills so the
   * baked vectors reflect the rotated orientation.
   */
  private readonly needsGradientExpansion: boolean;

  // ─── Mutable per-call state ────────────────────────────────────────────

  /**
   * Tracks whether the previous dynamic sub-group already consumed a pass
   * without shifting the data queue (mixed-dynamic deferred-shift logic).
   *
   * `1` = last dynamic encounter was odd (pending shift).
   * `2` = last dynamic encounter was even (shift was committed; reset to 1).
   */
  private currentPassed: number = 1;

  // ─── Constructor ──────────────────────────────────────────────────────

  /**
   * @param params - Configuration for the current layout pass.
   */
  constructor(params: TextFrameProcessorParams) {
    this.stack = params.stack;
    this.isMixed = params.isMixed;
    this.data = params.data;

    this.needsGradientExpansion =
      params.stack !== "HH" && params.stack !== "VV";
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /**
   * Processes all dynamic text frames inside `placedItem`.
   *
   * Only sub-groups carrying the `_DYN_` marker are processed — static
   * sub-groups are visited but their text frames are left unchanged.
   *
   * Calling this method for a non-GroupItem or when the data queue is empty
   * is safe — both cases are detected and return immediately.
   *
   * @param placedItem - Top-level GroupItem in its final grid position.
   */
  public process(placedItem: PageItem): void {
    if (placedItem.typename !== PageItemType.GroupItem) return;
    if (!this.data || !this.data.length) return;

    // Reset the list at the start of each call — prevents stale TextFrame
    // references from a previous process() call from leaking into this one.
    // Stale refs are dead DOM nodes after createOutline() destroyed them.
    this.modifiedTextFrames = [];

    const group = placedItem as GroupItem;

    for (let i = 0; i < group.pageItems.length; i++) {
      const subGroup = group.pageItems[i];
      if (subGroup.typename !== PageItemType.GroupItem) continue;
      if (!this.data.length) break;

      const isDynamic = subGroup.name.includes(`_${BasicMarkers.DYNAMIC}_`);

      if (!isDynamic) continue;

      // Process all TextFrames inside this dynamic sub-group
      this.processSubGroup(subGroup as GroupItem, i);

      // Advance the data queue by the appropriate number of rows
      this.advanceDataQueue();
    }

    if (this.needsGradientExpansion && CONFIG.OUTLINE_TEXT) {
      this.expandAppearanceTextFrames();
    }
  }

  // ─── Private: Sub-group processing ───────────────────────────────────

  /**
   * Iterates all TextFrame children of `subGroup` and applies the full
   * post-injection mutation sequence to each one whose name matches a key
   * in the front data row.
   *
   * @param subGroup     - Dynamic sub-group whose TextFrames will be mutated.
   * @param subItemIndex - 0-based index of this sub-group within the parent
   *                       group — used for VRH axis selection.
   * @private
   */
  private processSubGroup(subGroup: GroupItem, subItemIndex: number): void {
    const currentDataRow = this.data![0];

    for (let j = 0; j < subGroup.pageItems.length; j++) {
      const child = subGroup.pageItems[j];
      if (child.typename !== PageItemType.TextFrame) continue;

      const textFrame = child as TextFrame;
      const replacementText = currentDataRow[textFrame.name];
      if (replacementText === undefined) continue;

      // ── 1. Snapshot BEFORE content change ──────────────────────────────
      const originalSize = this.captureSize(textFrame);

      // ── 2. Inject content ───────────────────────────────────────────────
      textFrame.contents = replacementText;

      // Flush the text layout engine so adjustFontSize reads correct bounds —
      // stale bounds cause wrong font corrections in action engine mode
      if (Utils.isActionThreadEngine()) app.redraw();

      // ── 3. Font correction ──────────────────────────────────────────────
      this.adjustFontSize(textFrame, originalSize, subItemIndex);

      // ── 4. Arc warp ─────────────────────────────────────────────────────
      if (CONFIG.WRAP_TEXT) {
        // Utils.applyArcTextWarp(textFrame);
      }

      // ── 5. Determine whether this frame will survive as a live TextFrame ─
      // createOutline() destroys the TextFrame DOM node and replaces it with
      // a GroupItem. Storing that reference in modifiedTextFrames would leave
      // a dead (invalid) object in the array, which causes errors when
      // expandAppearanceTextFrames() later tries to select those objects.
      // Only track the frame when it will NOT be outlined immediately below.
      const willBeOutlined =
        !CONFIG.WRAP_TEXT &&
        CONFIG.OUTLINE_TEXT &&
        !this.needsGradientExpansion;

      if (!willBeOutlined) {
        // Frame remains a live TextFrame — safe to track for gradient expansion
        this.modifiedTextFrames.push(textFrame);
      }

      // ── 6. Outline — MUST be last (destroys TextFrame reference) ────────
      if (willBeOutlined) {
        textFrame.createOutline();
        // Force scene graph commit after outline — next duplicate() must see
        // the new GroupItem node, not the destroyed TextFrame
        if (Utils.isActionThreadEngine()) app.redraw();
      }
    }
  }

  // ─── Private: Axis resolution ────────────────────────────────────────

  /**
   * Returns the axis key (`"width"` or `"height"`) to use when comparing
   * text frame dimensions for font correction.
   *
   * | Stack      | Rule                                          |
   * |------------|-----------------------------------------------|
   * | RHH / RVV  | `"height"` — item is rotated 90°             |
   * | VRH        | Even index → `"width"`; odd index → `"height"` |
   * | All others | `"width"`                                     |
   *
   * @param subItemIndex - 0-based sub-group index within the placed group.
   * @private
   */
  private resolveAxis(subItemIndex: number): "width" | "height" {
    if (this.stack === "RHH" || this.stack === "RVV") return "height";

    if (this.stack === "VRH") {
      return subItemIndex % 2 === 0 ? "width" : "height";
    }

    return "width";
  }

  // ─── Private: Size snapshot ──────────────────────────────────────────

  /**
   * Captures the current visual dimensions of `textFrame` in **inches**.
   *
   * Geometric bounds are used so the result is independent of the active
   * ruler units and reflects the actual rendered size at the moment of capture.
   *
   * @param textFrame - The TextFrame to measure.
   * @returns `DimensionObject` with `width` and `height` in inches.
   * @private
   */
  private captureSize(textFrame: TextFrame): DimensionObject {
    const bounds = Utils.getObjectBounds(textFrame);
    const dim = Utils.getDimension(bounds);

    return {
      width: Utils.convertLength({ value: dim.width }),
      height: Utils.convertLength({ value: dim.height }),
    };
  }

  // ─── Private: Font correction ────────────────────────────────────────

  /**
   * Applies a proportional resize to `textFrame` when the post-injection
   * dimension falls outside the acceptable band.
   *
   * ### Decision table
   * | Condition                                      | Action                                          |
   * |------------------------------------------------|-------------------------------------------------|
   * | `new ≤ old + TEXT_MAX_GROW_INCH`              | No change                                       |
   * | `new > old + TEXT_MAX_GROW_INCH`              | Scale DOWN: land at `old + TEXT_TARGET_GROW`    |
   * | `old × SHRINK_THRESHOLD ≤ new < old`          | No change — slight shrink acceptable            |
   * | `new < old × SHRINK_THRESHOLD`                | Scale UP: close `CLOSE_RATIO` of gap toward old |
   *
   * The scale is applied via `textFrame.resize(widthPct, heightPct)` where
   * `100` locks the non-target axis and the calculated percentage adjusts the
   * target axis.
   *
   * @param textFrame    - The TextFrame to adjust.
   * @param originalSize - Snapshot taken BEFORE content replacement.
   * @param subItemIndex - Sub-group index for axis resolution.
   * @private
   */
  private adjustFontSize(
    textFrame: TextFrame,
    originalSize: DimensionObject,
    subItemIndex: number,
  ): void {
    const newSize = this.captureSize(textFrame);
    const axis = this.resolveAxis(subItemIndex);
    const oldDim = originalSize[axis];
    const newDim = newSize[axis];

    if (oldDim <= 0 || newDim <= 0) return;

    let scaleFactor: number | null = null;

    if (newDim > oldDim + TEXT_MAX_GROW_INCH) {
      // Too large — scale DOWN so the frame lands at old + TARGET_GROW
      scaleFactor = (oldDim + TEXT_TARGET_GROW_INCH) / newDim;
    } else if (newDim < oldDim * TEXT_SHRINK_THRESHOLD) {
      // Too small — scale UP closing CLOSE_RATIO of the gap toward old
      scaleFactor =
        (newDim + (oldDim - newDim) * TEXT_SHRINK_CLOSE_RATIO) / newDim;
    }

    if (scaleFactor === null) return;

    // resize() takes percentage values: 100 = unchanged, 85 = scale to 85 %
    const pct = scaleFactor * 100;

    if (axis === "width") {
      textFrame.resize(pct, 100); // adjust width, lock height
    } else {
      textFrame.resize(100, pct); // lock width, adjust height
    }
  }

  // ─── Private: Gradient expansion ────────────────────────────────────

  // ─── Private: Data queue management ─────────────────────────────────

  /**
   * Advances the FIFO data queue after one dynamic sub-group has been
   * processed.
   *
   * ### Shift count (VRH stacks)
   * VRH groups represent 4 physical items (pair=false) or 2 sets (pair=true).
   * The queue must be advanced by the matching count so the next placed group
   * receives the correct data rows.
   *
   * | Stack | `isPaired` | Shifts |
   * |-------|-----------|--------|
   * | VRH   | `true`    | 2      |
   * | VRH   | `false`   | 4      |
   * | other | any       | 1      |
   *
   * ### Mixed-dynamic deferral
   * When `isMixedDynamic = true` (one dynamic entry, one static entry in the
   * JFT item pair), each dynamic sub-group represents only half of the
   * logical data row.  The shift is deferred until the second dynamic
   * sub-group of the same placed item has been processed:
   *
   * - Odd encounter  → mark as pending (`currentPassed = 2`), do NOT shift.
   * - Even encounter → commit the shift, reset `currentPassed = 1`.
   *
   * @private
   */
  private advanceDataQueue(): void {
    if (!this.data) return;

    if (!this.isMixed) {
      // Deferred shift: commit only on even encounters
      if (!Utils.isOdd(this.currentPassed)) {
        this.data.shift();
        this.currentPassed = 1;
      } else {
        this.currentPassed = 2;
      }
      return;
    }

    // Non-mixed: shift immediately
    this.data.shift();
  }

  /**
   * Expands appearance (gradient fills) on all tracked modified text frames
   * and optionally outlines them.
   *
   * Only relevant for rotated stacks (RHH, RVV, VRH) — HH and VV stacks
   * are axis-aligned and do not require gradient expansion.
   *
   * Called at the end of {@link process} when `needsGradientExpansion` is
   * `true` and `CONFIG.OUTLINE_TEXT` is `true`.
   *
   * @private
   */
  private expandAppearanceTextFrames() {
    // Gradient expansion (rotated stacks only)
    if (this.modifiedTextFrames.length) {
      const prevSelection = app?.activeDocument?.selection[0];

      app.executeMenuCommand("deselectall");
      Organizer.docSelectionHandler({
        doc: app.activeDocument,
        objects: this.modifiedTextFrames,
      });
      app.executeMenuCommand("expandStyle");
      if (CONFIG.OUTLINE_TEXT) {
        app.executeMenuCommand("outline");
      }
      app.executeMenuCommand("deselectall");
      app.redraw();
      if (Utils.isActionThreadEngine()) {
        if (prevSelection) prevSelection.selected = true;
      }

      // Clear the list after use — the frames are now outlined/expanded and
      // their DOM nodes may be invalid. Keeping them would cause errors if
      // expandAppearanceTextFrames() were ever called a second time.
      this.modifiedTextFrames = [];
    }
  }
}
