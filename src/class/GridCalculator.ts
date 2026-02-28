/**
 * Utility class for calculating optimal item stacking and row fitting on a fixed paper size.
 */
class GridCalculator {
  /**
   * Calculates all possible stacking configurations (single or paired, normal or rotated)
   * and returns them along with the recommended configuration that maximizes width.
   * @param params - Configuration for stacking calculation
   * @returns Object containing all stack dimensions and the recommended stack type
   */
  static getStackSizes(params: StackSizeParams): StackSizesResult {
    const { size, pair = true, gap = 0 } = params;
    const horizontalMultiplier = pair ? 2 : 1;

    const { width: itemW, height: itemH } = size;
    const { width: rotatedW, height: rotatedH } = Utils.swapDimensions(size);

    const widthOfVRH = itemW + gap + itemH;

    // All possible stacking variants
    const stacks: StackSizes = {
      VRH: {
        width: widthOfVRH,
        height: widthOfVRH,
      },
      HH: {
        width: itemW * horizontalMultiplier + (pair ? gap : 0),
        height: itemH,
      },
      RHH: {
        width: rotatedW * horizontalMultiplier + (pair ? gap : 0),
        height: rotatedH,
      },
      VV: {
        width: itemW,
        height: itemH * 2 + (pair ? gap : 0),
      },
      RVV: {
        width: rotatedW,
        height: rotatedH * 2 + (pair ? gap : 0),
      },
    };

    // Determine the stack with maximum width
    let recommended: RecommendedStack = {
      type: "HH",
      width: stacks.HH.width,
    };

    ES6_SA.arrayForEach(ES6_SA.objectEntries(stacks), ([type, dims]) => {
      if (dims.width > recommended.width) {
        recommended = {
          type: type as StackType,
          width: dims.width,
        };
      }
    });

    return {
      ...stacks,
      recommended: recommended.type,
    };
  }

  /**
   * Returns how many times the given stack width fits into the paper width,
   * including gaps between items.
   * @param params - Configuration object
   * @param params.stackWidth - Width of one stack (chosen orientation)
   * @param params.gap - Gap between stacks
   * @returns Maximum number of stacks per row
   */
  static getRowFitCount(params: RowFitCounts): number {
    const { stackWidth, gap = 0 } = params;
    const maxPaperWidth = CONFIG.PAPER_MAX_SIZE;

    return this.calculateMaxFit(stackWidth, gap, maxPaperWidth);
  }

  /**
   * Helper to compute the maximum number of items that fit in a row with gaps.
   * @param itemWidth - Width of a single stacked item
   * @param gap - Gap between items
   * @param maxWidth - Maximum available width (paper size)
   * @returns Maximum number of items that fit
   */
  private static calculateMaxFit(
    itemWidth: number,
    gap: number,
    maxWidth: number,
  ): number {
    if (itemWidth <= 0) return 0;

    // Start with rough estimate without gaps
    let maxCount = Math.floor(maxWidth / itemWidth);

    // Decrease until total width (including gaps) fits
    for (let count = maxCount; count > 0; count--) {
      const totalWidth = Utils.calculateTotalWithGap({
        count,
        value: itemWidth,
        gap,
      });
      if (totalWidth <= maxWidth) {
        return count;
      }
    }

    return 0;
  }

  /**
   * Calculates the number of full rows required for a given stack type
   * and determines how many items remain after filling complete rows.
   * @param params - Row calculation parameters
   * @param params.quantity - Total number of items to place (default: 1)
   * @param params.fitRow - Maximum number of items that fit in a single row
   * @returns Object containing:
   *   - cols: Number of rows required to place the items
   *   - remainder: Items left after filling full rows
   */
  static getColsByStack(params: RowByStack) {
    const { fitRow, quantity = 1 } = params;

    // if can't fit items then all are remainder
    if (fitRow === 0) {
      return {
        cols: 0,
        remainder: quantity,
      };
    }

    const remainder = quantity % fitRow;
    const cols = Math.floor(quantity / fitRow);

    return {
      cols,
      remainder,
    };
  }

  /**
   * Computes total height for a given number of rows, including gaps between them.
   * @param params - Height calculation parameters
   * @param params.count - Number of rows
   * @param params.height - Single row height
   * @param params.gap - Gap between rows
   * @returns Heights for main rows group and a single remainder row
   */
  static getHeightByCols(params: HeightByCols) {
    const { count, height, gap } = params;

    return {
      mainStack:
        count > 0
          ? Utils.calculateTotalWithGap({
              value: height,
              count,
              gap,
            })
          : 0,
      remainderStack: height,
    };
  }

  /**
   * Main layout calculation method - supports both single stack type and 'auto' (all types)
   * @param params - Layout calculation parameters
   * @returns Layout information for specified stack type or all stack types
   */
  static getLayoutInfo(params: LayoutObjectInfo) {
    const { gap, size, quantity, pairGap = 0, pair, maxColsInDoc } = params;

    const stackTypes: StackType[] = stackTypesTuple;
    const stacksInfo = {} as StackInfo;

    const stackSizes = this.getStackSizes({
      size,
      pair,
      gap: pairGap,
    });

    for (const type of stackTypes) {
      const stackSize = stackSizes[type];

      const fitRow = this.getRowFitCount({
        stackWidth: stackSize.width,
        gap,
      });

      // VRH special handling: capacity depends on pair value
      let adjustedQuantity = quantity;
      let actualRemainder = 0;

      if (type === "VRH") {
        // ✅ NEW LOGIC: VRH capacity depends on pair
        const itemsPerVRH = pair ? 2 : 4;

        // Skip VRH if quantity < itemsPerVRH (can't make even 1 full square)
        if (quantity < itemsPerVRH) {
          stacksInfo[type] = {
            fitRow: 0,
            neededCols: {
              cols: 0,
              remainder: quantity,
            },
            heightByCols: {
              mainStack: 0,
              remainderStack: stackSize.height,
            },
            stackSize,
            requiredDocs: { docsNeeded: 0, colsPerDoc: 0 },
          };
          continue;
        }

        // Calculate full VRH squares and remainder
        adjustedQuantity = Math.floor(quantity / itemsPerVRH);
        actualRemainder = quantity % itemsPerVRH;
      }

      const neededCols = this.getColsByStack({
        fitRow,
        quantity: adjustedQuantity,
      });

      // Update remainder for non-VRH types
      if (type !== "VRH") {
        actualRemainder = neededCols.remainder;
      }

      const heightByCols = this.getHeightByCols({
        count: neededCols.cols,
        height: stackSize.height,
        gap,
      });

      const requiredDocs = this.requiredDocs({
        dimension: {
          width: stackSize.width,
          height: stackSize.height,
        },
        gap,
        maxColsInDoc,
        neededCols: neededCols.cols,
      });

      stacksInfo[type] = {
        fitRow,
        neededCols: {
          cols: neededCols.cols,
          remainder: actualRemainder,
        },
        heightByCols,
        stackSize,
        requiredDocs,
      };
    }

    return stacksInfo;
  }

  /**
   * Analyzes all stack type layouts and determines optimal main and remainder stack
   * @param params - Analysis parameters
   * @returns Recommended main and remainder stack types with details
   */
  static getRecommendedStacks(
    params: RecommendedStackParams,
  ): RecommendedStacksResult {
    const {
      gap,
      size,
      quantity,
      pairGap = 0,
      pair,
      heightPreference = "Less",
      stackOrientation,
      maxColsInDoc,
    } = params;

    // Get layout info for all stack types
    const allStacksInfo = this.getLayoutInfo({
      gap,
      size,
      quantity,
      pairGap,
      pair,
      maxColsInDoc,
    }) as StackInfo;

    // Determine which stack types to consider based on orientation
    let stackTypes: StackType[] = stackTypesTuple;

    if (stackOrientation === "vertical") {
      stackTypes = ["HH", "VV"]; // Normal orientations only
    } else if (stackOrientation === "horizontal") {
      stackTypes = ["RHH", "RVV"]; // Rotated orientations only
    }

    const validCombinations: CombinationScore[] = [];

    // Analyze each main stack type
    for (const mainType of stackTypes) {
      const mainInfo = allStacksInfo[mainType];

      // Skip if doesn't fit
      if (mainInfo.fitRow === 0) continue;

      // If no remainder, only main stack needed
      if (mainInfo.neededCols.remainder === 0) {
        const totalHeight = mainInfo.heightByCols.mainStack;
        validCombinations.push({
          mainStack: mainType,
          remainderStack: mainType,
          totalHeight,
          hasRemainder: false,
          score: totalHeight,
          mainCols: mainInfo.neededCols.cols,
          remainderItems: 0,
          mainHeight: mainInfo.heightByCols.mainStack,
          remainderHeight: 0,
          mainFitRow: mainInfo.fitRow,
          remainderFitRow: mainInfo.fitRow,
          remainderCols: 0,
          requiredDocs: mainInfo.requiredDocs,
          remainderRequiredDocs: { docsNeeded: 0, colsPerDoc: 0 }, // ✅ NEW
        });
        continue;
      }

      // If remainder exists, check each remainder stack type
      for (const remType of stackTypes) {
        const remInfo = allStacksInfo[remType];

        // Check: remainder stack must fit at least the remainder items
        if (remInfo.fitRow < mainInfo.neededCols.remainder) continue;

        const mainHeight = mainInfo.heightByCols.mainStack;
        const remainderHeight = remInfo.heightByCols.remainderStack;
        const totalHeight =
          mainHeight + (mainHeight > 0 ? gap : 0) + remainderHeight;

        // ✅ Calculate remainder docs (always 1 col since it's a single remainder row)
        const remainderRequiredDocs = this.requiredDocs({
          dimension: {
            width: remInfo.stackSize.width,
            height: remInfo.stackSize.height,
          },
          gap,
          maxColsInDoc,
          neededCols: 1, // Remainder is always 1 col
        });

        validCombinations.push({
          mainStack: mainType,
          remainderStack: remType,
          totalHeight,
          hasRemainder: true,
          score: totalHeight,
          mainCols: mainInfo.neededCols.cols,
          remainderItems: mainInfo.neededCols.remainder,
          mainHeight,
          remainderHeight,
          mainFitRow: mainInfo.fitRow,
          remainderFitRow: remInfo.fitRow,
          remainderCols: mainInfo.neededCols.remainder > 0 ? 1 : 0,
          requiredDocs: mainInfo.requiredDocs,
          remainderRequiredDocs, // ✅ NEW
        });
      }
    }

    // Sort by score according to height preference
    validCombinations.sort((a, b) => {
      return heightPreference === "Less"
        ? a.score - b.score
        : b.score - a.score;
    });

    const best = validCombinations[0] || {
      mainStack: "HH",
      remainderStack: "HH",
      totalHeight: 0,
      hasRemainder: false,
      mainCols: 0,
      remainderItems: 0,
      mainFitRow: 0,
      remainderFitRow: 0,
      remainderCols: 0,
      requiredDocs: { docsNeeded: 0, colsPerDoc: 0 },
      remainderRequiredDocs: { docsNeeded: 0, colsPerDoc: 0 },
    };

    return {
      mainStack: best.mainStack,
      remainderStack: best.remainderStack,
      totalHeight: best.totalHeight,
      hasRemainder: best.hasRemainder,
      mainCols: best.mainCols,
      remainderItems: best.remainderItems,
      mainFitRow: best.mainFitRow,
      remainderFitRow: best.remainderFitRow,
      remainderCols: best.remainderCols,
      requiredDocs: best.requiredDocs,
      remainderRequiredDocs: best.remainderRequiredDocs, // ✅ NEW
    };
  }

  /**
   * Calculates document requirements for printing based on physical constraints.
   * Determines either:
   * - Documents needed when limited by maximum canvas height (inches), or
   * - Documents needed when using fixed columns-per-document configuration
   * - If the colsPerDocConfig exceeded the canvas height size
   *
   * @returns {RequiredDocReturn} Object containing:
   *   - docsNeeded: Total number of documents required
   *   - colsPerDoc: Maximum columns that can fit in each document
   */
  private static requiredDocs(params: RequiredDocArg): RequiredDocReturn {
    const CANVAS_MAX_HEIGHT = 210;
    const { dimension, neededCols, gap, maxColsInDoc } = params;

    let docsNeeded: number;
    let colsPerDoc: number;

    // Calculate how many columns can fit within the canvas height constraint
    // This ensures we never exceed CANVAS_MAX_HEIGHT
    let calculatedMaxColsInDoc = Math.floor(
      CANVAS_MAX_HEIGHT / (dimension.height + gap),
    );

    // Ensure we don't exceed the total columns needed
    calculatedMaxColsInDoc = Math.min(calculatedMaxColsInDoc, neededCols);

    // Ensure at least 1 column per document
    colsPerDoc = Math.max(1, calculatedMaxColsInDoc);
    docsNeeded = Math.ceil(neededCols / colsPerDoc);

    if (maxColsInDoc) {
      colsPerDoc = maxColsInDoc > colsPerDoc ? colsPerDoc : maxColsInDoc;
      docsNeeded = Math.ceil(neededCols / colsPerDoc);
    }

    return { docsNeeded, colsPerDoc };
  }
}

// ... (interface definitions remain the same)

/** Input parameters for stack size calculation */
interface StackSizeParams {
  /** Dimensions of a single item */
  size: DimensionObject;
  /** Whether to allow pairing two items horizontally (default: true) */
  pair?: boolean;
  /** Gap between paired/stacked items (default: 0) */
  gap?: number;
}

/** Result from getStackSizes() */
interface StackSizesResult extends StackSizes {
  /** The stack type that gives the maximum width */
  recommended: StackType;
}

/** Number of items that fit in one row */
interface RowFitCounts {
  stackWidth: number;
  gap?: number;
}

/** Parameters for cols calculation by stack */
interface RowByStack {
  quantity?: number;
  fitRow: number;
}

/** Parameters for height calculation by rows */
interface HeightByCols extends StrictOmit<DimensionObject, "width"> {
  gap: number;
  count: number;
}

/** Stack information for each stack type */
type StackInfo = Record<
  StackType,
  {
    fitRow: number;
    neededCols: ReturnType<typeof GridCalculator.getColsByStack>;
    heightByCols: ReturnType<typeof GridCalculator.getHeightByCols>;
    stackSize: DimensionObject;
    requiredDocs: RequiredDocReturn;
  }
>;

/** Parameters for layout calculation */
interface LayoutObjectInfo {
  gap: number;
  pairGap?: number;
  size: DimensionObject;
  quantity: number;
  pair?: boolean;
  maxColsInDoc: number;
}

/** Parameters for recommended stack analysis */
interface RecommendedStackParams extends LayoutObjectInfo {
  /** Height preference: "Less" (minimize height) or "More" (maximize height) */
  heightPreference: HeightPreference;
  /** Stack orientation: "auto" (all), "vertical" (HH/VV only), "horizontal" (RHH/RVV only) */
  stackOrientation: StackOrientation;
}

/** Combination score tracking */
interface CombinationScore {
  mainStack: StackType;
  remainderStack: StackType;
  totalHeight: number;
  hasRemainder: boolean;
  score: number;
  mainCols: number;
  remainderItems: number;
  mainHeight: number;
  remainderHeight: number;
  mainFitRow: number;
  remainderFitRow: number;
  remainderCols: number;
  requiredDocs: RequiredDocReturn;
  remainderRequiredDocs: RequiredDocReturn; // ✅ NEW
}

/** Result from getRecommendedStacks */
interface RecommendedStacksResult {
  /** Recommended stack type for main rows */
  mainStack: StackType;
  /** Recommended stack type for remainder row */
  remainderStack: StackType;
  /** Total height (main + remainder + gaps) */
  totalHeight: number;
  /** Whether remainder exists */
  hasRemainder: boolean;
  /** Number of main cols */
  mainCols: number;
  /** Number of remainder items */
  remainderItems: number;
  /** Number of items that fit per row in main stack */
  mainFitRow: number;
  /** Number of items that fit per row in remainder stack */
  remainderFitRow: number;
  /** Number of remainder rows (always 0 or 1) */
  remainderCols: number;
  /** info about main stack docs */
  requiredDocs: RequiredDocReturn;
  /** info about remainder stack docs */ // ✅ NEW
  remainderRequiredDocs: RequiredDocReturn;
}

interface RequiredDocArg {
  neededCols: number;
  dimension: DimensionObject;
  maxColsInDoc: number;
  gap: number;
}

interface RequiredDocReturn {
  /** Total documents required to fit all content */
  docsNeeded: number;
  /** Maximum columns allocated per document */
  colsPerDoc: number;
}
