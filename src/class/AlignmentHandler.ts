/**
 * Utility class responsible for positioning and aligning Illustrator PageItems
 * relative to other objects or the active artboard.
 */
class AlignmentHandler {
  /**
   * Moves a PageItem relative to another reference object based on a given direction.
   * The movement is calculated using bounding boxes and an optional gap.
   * Supports both script-based translation and action-based execution.
   *
   * @param arg - Configuration object for the move operation.
   * @param arg.base - Reference object used as the anchor for positioning.
   * @param arg.moving - The PageItem that will be translated.
   * @param arg.position - Direction to place the moving item relative to the base
   * (`"T"`, `"B"`, `"L"`, `"R"`).
   * @param arg.gap - Optional spacing to apply between the base and moving item.
   * @param arg.engine - Execution engine used to apply the transformation.
   *
   * @throws Error if the base object bounds cannot be resolved.
   */
  static moveObjectAfter = (arg: MoveObjectAfterParams) => {
    const { base, moving, position, gap = 0, engine = "script" } = arg;
    // Get bounding boxes of the selection and moving item
    const baseBounds = Utils.getObjectBounds(base); // [left, top, right, bottom]
    const movingBounds = Utils.getObjectBounds(moving); // [left, top, right, bottom]

    if (!baseBounds) {
      throw new Error("Base Bounds Empty");
    }

    let dx = 0,
      dy = 0;

    // Calculate movement based on position
    switch (position) {
      case "T": // Move above
        dy = baseBounds.top - movingBounds.bottom + gap;
        break;
      case "B": // Move below
        dy = baseBounds.bottom - movingBounds.top - gap;
        break;
      case "L": // Move left
        dx = baseBounds.left - movingBounds.right - gap;
        break;
      case "R": // Move right
        dx = baseBounds.right - movingBounds.left + gap;
        break;
    }

    if (engine === "action") {
      dy = Utils.reverseCenterY(dy);
      const transActHandler = new TransActionHandler();
      transActHandler.move({ item: moving as PageItem, x: dx, y: dy });
      transActHandler.removeAll();
    } else {
      // Move the item
      (moving as PageItem).translate(dx, dy);
    }
  };

  /**
   * Aligns one or more PageItems to the active artboard using a specified alignment rule.
   * When multiple items are provided, they are temporarily grouped to preserve
   * relative positioning during alignment.
   *
   * Supported alignments include edges, centers, and combined edge-center positions.
   * Works with both script and action execution engines.
   *
   * @param params - Configuration object for artboard alignment.
   * @param params.items - A single PageItem or a Selection of items to align.
   * @param params.doc - The Illustrator document containing the active artboard.
   * @param params.position - Desired alignment position relative to the artboard.
   * Defaults to center alignment.
   * @param params.engine - Execution engine used to apply the transformation.
   */
  static alignPageItemsToArtboard = (
    params: AlignPageItemsToArtboard,
  ): void => {
    const { doc, position = "C", engine = "script" } = params;

    let items = params.items;

    const artboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
    const [abLeft, abTop, abRight, abBottom] = artboard.artboardRect;

    const {
      top: itemTop,
      left: itemLeft,
      bottom: itemBottom,
      right: itemRight,
    } = Utils.getObjectBounds(items); // [top, left, bottom, right]

    const isItems = isArray(items);

    const groupManger = new GroupManager(
      isItems ? (items as Selection) : ([items] as Selection),
    );
    const { prev } = getAdjacentPageItems(items as Selection);
    if (isItems) {
      groupManger.group(prev);
      items = groupManger.tempGroup as PageItem;
    }

    const { centerX, centerY } = Utils.getCenterXY({
      bounds: {
        left: itemLeft,
        right: itemRight,
        bottom: itemBottom,
        top: itemTop,
      },
      engine: "script",
    });

    let targetX: number = centerX;
    let targetY: number = centerY;

    switch (position) {
      case "L":
        targetX = abLeft - (itemLeft - centerX);
        break;
      case "R":
        targetX = abRight - (itemRight - centerX);
        break;
      case "T":
        targetY = abTop - (itemTop - centerY); // 🔹 FIXED
        break;
      case "B":
        targetY = abBottom - (itemBottom - centerY);
        break;
      case "TC":
        targetX = (abLeft + abRight) / 2;
        targetY = abTop - (itemTop - centerY);
        break;
      case "BC":
        targetX = (abLeft + abRight) / 2;
        targetY = abBottom - (itemBottom - centerY);
        break;
      case "LC":
        targetX = abLeft - (itemLeft - centerX);
        targetY = (abTop + abBottom) / 2;
        break;
      case "RC":
        targetX = abRight - (itemRight - centerX);
        targetY = (abTop + abBottom) / 2;
        break;
      case "CX":
        targetX = (abLeft + abRight) / 2;
        break;
      case "CY":
        targetY = (abTop + abBottom) / 2;
        break;
      case "C":
        targetX = (abLeft + abRight) / 2;
        targetY = (abTop + abBottom) / 2;
        break;
    }

    // Compute translation distance
    const deltaX = targetX - centerX;
    let deltaY = targetY - centerY;

    if (engine === "action") {
      deltaY = Utils.reverseCenterY(deltaY);
      const transActHandler = new TransActionHandler();
      transActHandler.move({ item: items as PageItem, x: deltaX, y: deltaY });
      transActHandler.removeAll();
    } else {
      // Move the item
      (items as PageItem).translate(deltaX, deltaY);
    }

    if (isItems) {
      groupManger.ungroup(prev);
    }
  };

  /**
   * Aligns a moving PageItem relative to a base PageItem using bounding-box geometry.
   * Calculates translation deltas based on the requested alignment position and
   * applies the movement using either the script engine or the action engine.
   *
   * Supported alignment positions:
   * - `"L"`  : Left edges aligned
   * - `"R"`  : Right edges aligned
   * - `"T"`  : Top edges aligned
   * - `"B"`  : Bottom edges aligned
   * - `"LC"` : Left aligned, vertically centered
   * - `"RC"` : Right aligned, vertically centered
   * - `"TC"` : Top aligned, horizontally centered
   * - `"BC"` : Bottom aligned, horizontally centered
   * - `"C"`  : Fully centered (both axes)
   * - `"CX"` : Horizontally centered
   * - `"CY"` : Vertically centered
   *
   * @param params - Configuration object for object alignment.
   * @param params.base - Reference PageItem used as the alignment anchor.
   * @param params.moving - PageItem that will be translated.
   * @param params.position - Alignment rule to apply (defaults to `"C"`).
   * @param params.engine - Execution engine used to apply the translation.
   *
   * @throws Error if an unsupported alignment position is provided.
   */
  static alignObject = (params: AlignObjectParams): void => {
    const { base, moving, position = "C", engine = "script" } = params;

    const baseBounds = Utils.getObjectBounds(base);

    // Get geometric bounds for the moving item
    const movingBounds = Utils.getObjectBounds(moving);

    // Calculate dimensions and centers
    const baseLeft = baseBounds.left;
    const baseTop = baseBounds.top;
    const baseRight = baseBounds.right;
    const baseBottom = baseBounds.bottom;

    const moveLeft = movingBounds.left;
    const moveTop = movingBounds.top;
    const moveRight = movingBounds.right;
    const moveBottom = movingBounds.bottom;

    // Calculate centers
    const baseCenterX = (baseLeft + baseRight) / 2;
    const baseCenterY = (baseTop + baseBottom) / 2;
    const moveCenterX = (moveLeft + moveRight) / 2;
    const moveCenterY = (moveTop + moveBottom) / 2;

    // Calculate required movement
    let deltaX = 0;
    let deltaY = 0;

    // Determine alignment based on position parameter
    switch (position.toUpperCase()) {
      case "L": // Left align
        deltaX = baseLeft - moveLeft;
        break;
      case "R": // Right align
        deltaX = baseRight - moveRight;
        break;
      case "T": // Top align
        deltaY = baseTop - moveTop;
        break;
      case "B": // Bottom align
        deltaY = baseBottom - moveBottom;
        break;
      case "LC": // Left and vertically centered
        deltaX = baseLeft - moveLeft;
        deltaY = baseCenterY - moveCenterY;
        break;
      case "RC": // Right and vertically centered
        deltaX = baseRight - moveRight;
        deltaY = baseCenterY - moveCenterY;
        break;
      case "TC": // Top and horizontally centered
        deltaX = baseCenterX - moveCenterX;
        deltaY = baseTop - moveTop;
        break;
      case "BC": // Bottom and horizontally centered
        deltaX = baseCenterX - moveCenterX;
        deltaY = baseBottom - moveBottom;
        break;
      case "C": // Center in both directions
        deltaX = baseCenterX - moveCenterX;
        deltaY = baseCenterY - moveCenterY;
        break;
      case "CY": // Center in Y directions
        deltaY = baseCenterY - moveCenterY;
        break;
      case "CX": // Center in X directions
        deltaX = baseCenterX - moveCenterX;
        break;
      default:
        throw new Error(
          "Invalid position parameter: " +
            position +
            ". Use L, R, B, T, LC, RC, TC, BC, or C.",
        );
    }

    if (engine === "action") {
      deltaY = Utils.reverseCenterY(deltaY);
      const transActHandler = new TransActionHandler();
      transActHandler.move({ item: moving as PageItem, x: deltaX, y: deltaY });
      transActHandler.removeAll();
    } else {
      // Move the item
      (moving as PageItem).translate(deltaX, deltaY);
    }
  };
}

/**
 * Parameters used to move a PageItem relative to another object.
 */
interface MoveObjectAfterParams {
  /** Reference object used as the positioning anchor */
  base: Selection | PageItem;
  /** PageItem that will be moved */
  moving: PageItem;
  /** Optional spacing between base and moving item */
  gap?: number;
  /** Relative position for placement */
  position: BasePositions;
  /** Engine used to execute the movement */
  engine?: ThreadEngine;
}

/**
 * Parameters used to align PageItems to the active artboard.
 */
interface AlignPageItemsToArtboard {
  /** Item or items to be aligned */
  items: Selection | PageItem;
  /** Illustrator document containing the artboard */
  doc: Document;
  /** Desired alignment position */
  position?: AlignPosition;
  /** Engine used to execute the alignment */
  engine?: ThreadEngine;
}

/**
 * Parameters used to align a PageItem relative to another PageItem.
 */
interface AlignObjectParams {
  /** Reference PageItem used as the alignment anchor */
  base: PageItem;
  /** PageItem that will be translated */
  moving: PageItem;
  /** Alignment rule describing how the moving item should be positioned */
  position?: AlignPosition;
  /** Engine used to execute the alignment */
  engine?: ThreadEngine;
}