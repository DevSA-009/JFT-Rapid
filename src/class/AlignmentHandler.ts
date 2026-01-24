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
   * When multiple items are provided, they are temporarily grouped so their
   * relative layout is preserved during alignment.
   *
   * The alignment is calculated from the geometric bounds of the items and the
   * active artboard, then applied as a translation using the selected engine.
   *
   * Supported alignment positions:
   *
   * **Edges:**
   * - `"L"` : Align left edge of item(s) to the left edge of the artboard
   * - `"R"` : Align right edge of item(s) to the right edge of the artboard
   * - `"T"` : Align top edge of item(s) to the top edge of the artboard
   * - `"B"` : Align bottom edge of item(s) to the bottom edge of the artboard
   *
   * **Edge + Center:**
   * - `"LC"` : Align left edge of item(s) and center vertically on the artboard
   * - `"RC"` : Align right edge of item(s) and center vertically on the artboard
   * - `"TC"` : Align top edge of item(s) and center horizontally on the artboard
   * - `"BC"` : Align bottom edge of item(s) and center horizontally on the artboard
   *
   * **Center:**
   * - `"C"`  : Center both horizontally and vertically on the artboard
   * - `"CX"` : Center horizontally only
   * - `"CY"` : Center vertically only
   *
   * @param params - Configuration object for artboard alignment.
   * @param params.items - A single PageItem or a Selection of PageItems to align.
   * @param params.doc - Illustrator document that owns the active artboard.
   * @param params.position - Alignment rule to apply relative to the artboard
   * (defaults to `"C"`).
   * @param params.engine - Execution engine used to apply the translation.
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

  	/**
	 * Moves a selected item to a specific position on the Illustrator canvas.
	 *
	 * @param {PageItem} item - The selected object in Illustrator.
	 * @param {AlignPosition} position - The desired position:
	 *  - `"L"`  (Left)
	 *  - `"R"`  (Right)
	 *  - `"T"`  (Top)
	 *  - `"B"`  (Bottom)
	 *  - `"LC"` (Left-Center)
	 *  - `"RC"` (Right-Center)
	 *  - `"TC"` (Top-Center)
	 *  - `"BC"` (Bottom-Center)
	 *  - `"C"`  (Center both horizontally and vertically)
	 */
	static moveItemToCanvas = (
		item: PageItem,
		position: AlignPosition = "C",
	): void => {
		// Illustrator's max canvas size is 16383 x 16383 points
		const canvasSize = 16344; //idle size

		const canvasHalf = canvasSize / 2;

		// Get item bounds using Utils.getObjectBounds
		const bounds = Utils.getObjectBounds(item);
		const { left, bottom, right, top } = bounds;
		const { height, width } = Utils.getDimension(bounds);
		const itemWidth = width / 2;
		const itemHeight = height / 2;

		// Default movement offsets (no movement)
		let moveX = 0;
		let moveY = 0;

		// Calculate target positions based on alignment choice
		switch (position) {
			case "L": // Left edge
				moveX = -(canvasHalf) - left;
				break;
			case "R": // Right edge
				moveX = canvasHalf - right;
				break;
			case "T": // Top edge
				moveY = canvasHalf - top;
				break;
			case "B": // Bottom edge
				moveY = -canvasHalf - bottom;
				break;
			case "LC": // Left-Center
				moveX = -(canvasHalf) - left;
				moveY = -bounds.top + itemHeight / 2;
				break;
			case "RC": // Right-Center
				moveX = canvasHalf - bounds.right;
				moveY = -bounds.top + itemHeight / 2;
				break;
			case "TC": // Top-Center
				moveX = -bounds.left + itemWidth / 2;
				moveY = canvasHalf - bounds.top;
				break;
			case "BC": // Bottom-Center
				moveX = -bounds.left + itemWidth / 2;
				moveY = -canvasHalf - bounds.bottom;
				break;
			case "C": // Fully Centered
				moveX = -canvasHalf + itemWidth / 2;
				moveY = -bounds.top + itemHeight / 2;
				break;
		}

		// Apply movement
		item.translate(moveX, moveY);
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