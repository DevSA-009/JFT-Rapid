/**
 * Utility class for calculating optimal item stacking and row fitting on a fixed paper size.
 */
class GridCalculator {
  /**
   * Calculates all possible stacking configurations and returns them with
   * the recommended configuration that maximises width.
   *
   * When `pair` is `true` the secondary item's dimensions are added to the
   * primary item's dimensions (instead of multiplying by 2).
   * `secDim` defaults to `size` when omitted, which preserves the previous
   * symmetric-pair behaviour.
   *
   * @param params - Configuration for stacking calculation.
   * @returns All stack dimensions plus the recommended stack type.
   */
  static getStackSizes(params: StackSizeParams): StackSizesResult {
    const { size, pair = true, gap = 0, secDim } = params;

    // Use the provided secondary dimension, or fall back to the primary
    const sec = secDim ?? size;

    const { width: itemW, height: itemH } = size;
    const { width: rotatedW, height: rotatedH } = Utils.swapDimensions(size);

    // Secondary item dimensions (normal and rotated)
    const { width: secW, height: secH } = sec;
    const { width: secRotW, height: secRotH } = Utils.swapDimensions(sec);

    // VRH uses only the primary item's geometry
    const widthOfVRH = itemW + gap + itemH;

    // All possible stacking variants
    const stacks: StackSizes = {
      VRH: {
        // Square layout — primary item only
        width: widthOfVRH,
        height: widthOfVRH,
      },
      HH: {
        // Primary width + optional secondary width side-by-side
        width: pair ? itemW + gap + secW : itemW,
        height: pair ? Math.max(itemH, secH) : itemH,
      },
      RHH: {
        // Both items rotated 90°, placed side-by-side
        width: pair ? rotatedW + gap + secRotW : rotatedW,
        height: pair ? Math.max(rotatedH, secRotH) : rotatedH,
      },
      VV: {
        // Primary item on top, secondary item below
        width: pair ? Math.max(itemW, secW) : itemW,
        height: pair ? itemH + gap + secH : itemH,
      },
      RVV: {
        // Both rotated 90°, stacked vertically
        width: pair ? Math.max(rotatedW, secRotW) : rotatedW,
        height: pair ? rotatedH + gap + secRotH : rotatedH,
      },
    };

    // Determine the stack with maximum width
    let recommended: RecommendedStack = {
      type: "HH",
      width: stacks.HH.width,
    };

    Object.entries(stacks).forEach(([type, dims]) => {
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

    if (fitRow === 0) {
      return { cols: 0, remainder: quantity };
    }

    // When all items fit within a single row, the main rows consume everything —
    // no remainder exists regardless of how many slots the row has.
    if (quantity <= fitRow) {
      return { cols: 1, remainder: 0 };
    }

    const remainder = quantity % fitRow;
    const cols = Math.floor(quantity / fitRow);

    return { cols: Math.max(1, cols), remainder };
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
   * Calculates layout information for all stack types for a given quantity.
   *
   * For VRH stacks the quantity is divided by `itemsPerVRH` (2 when paired,
   * 4 when unpaired) to determine how many full VRH squares can be formed.
   * Any leftover items that cannot form a complete VRH square are tracked as
   * the `remainder`.
   *
   * For all other stack types the quantity is distributed across rows normally
   * using {@link getColsByStack}, and the `remainder` is whatever cannot fill
   * a complete row.
   *
   * @param params - Layout calculation parameters.
   * @param params.gap        - Gap between stacks (columns/rows).
   * @param params.size       - Primary item dimensions.
   * @param params.quantity   - Total number of items to lay out.
   * @param params.pairGap    - Gap between the two items inside a paired stack (default 0).
   * @param params.pair       - Whether items are placed in pairs (default true).
   * @param params.secDim     - Optional secondary item dimensions for asymmetric pairs.
   * @param params.maxColsInDoc - Hard cap on columns per document (0 = auto).
   * @returns A record keyed by each {@link StackType} with fitRow, neededCols,
   *          heightByCols, stackSize and requiredDocs.
   */
  static getLayoutInfo(params: LayoutObjectInfo) {
    const {
      gap,
      size,
      quantity,
      pairGap = 0,
      pair,
      secDim = null,
      maxColsInDoc,
    } = params;

    const stackTypes: StackType[] = stackTypesTuple;
    const stacksInfo = {} as StackInfo;

    // Pass secDim so asymmetric pairs use their own secondary dimensions
    const stackSizes = this.getStackSizes({
      size,
      pair,
      gap: pairGap,
      secDim,
    });

    for (const type of stackTypes) {
      const typeSafe = type as Exclude<StackType, "NONE">;
      const stackSize = stackSizes[typeSafe];

      const fitRow = this.getRowFitCount({
        stackWidth: stackSize.width,
        gap,
      });

      let adjustedQuantity = quantity;
      let actualRemainder = 0;

      if (type === "VRH") {
        // VRH combines items into squares: 2 per square when paired, 4 when unpaired.
        const itemsPerVRH = 4;

        // Not enough items to form even one VRH square — mark as unavailable.
        if (quantity < (pair ? 2 : 4)) {
          stacksInfo[typeSafe] = {
            fitRow: 0,
            neededCols: { cols: 0, remainder: quantity },
            heightByCols: { mainStack: 0, remainderStack: stackSize.height },
            stackSize,
            requiredDocs: { docsNeeded: 0, colsPerDoc: 0 },
          };
          continue;
        }

        // Divide quantity by itemsPerVRH to get the number of complete squares.
        if (fitRow === 1) {
          adjustedQuantity = Math.max(1, Math.floor(quantity / itemsPerVRH));
        } else {
          adjustedQuantity =
            quantity % 4
              ? Math.ceil(quantity / itemsPerVRH)
              : Math.floor(quantity / itemsPerVRH);
        }

        // Remainder = items that do not fill a complete square.
        actualRemainder = Math.max(
          0,
          quantity - adjustedQuantity * itemsPerVRH,
        );
        if (pair) {
          adjustedQuantity *= quantity > 3 ? 2 : adjustedQuantity;
          if (fitRow === 1 && quantity === 3) {
            actualRemainder = 1;
          }
        }
      }

      const neededCols = this.getColsByStack({
        fitRow,
        quantity: adjustedQuantity,
      });

      // For non-VRH types, remainder comes from the column distribution.
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

      stacksInfo[typeSafe] = {
        fitRow,
        neededCols: { cols: neededCols.cols, remainder: actualRemainder },
        heightByCols,
        stackSize,
        requiredDocs,
      };
    }

    return stacksInfo;
  }

  /**
   * Finds the best remainder stack for a given remainder quantity.
   *
   * Calls {@link getLayoutInfo} with `remainderQuantity` as the quantity,
   * then keeps only candidates whose own `remainder` is zero — meaning all
   * remainder items fit cleanly inside a single column of that stack type.
   * Candidates are sorted by `heightPreference` and the best one is returned.
   *
   * @param params - Parameters forwarded to {@link getLayoutInfo} plus:
   * @param params.remainderQuantity - Number of leftover items to place.
   * @param params.stackTypes        - The stack types to consider.
   * @param params.heightPreference  - `"Less"` to minimise height, `"More"` to maximise.
   * @returns The best remainder stack candidate, or `null` if none fit cleanly.
   */
  static getBestRemainderStack({
    gap,
    size,
    remainderQuantity,
    pairGap = 0,
    pair,
    secDim = null,
    maxColsInDoc,
    stackTypes,
    heightPreference = "Less",
  }: {
    gap: number;
    size: DimensionObject;
    remainderQuantity: number;
    pairGap: number;
    pair?: boolean;
    secDim?: DimensionObject | null;
    maxColsInDoc: number;
    stackTypes: StackType[];
    heightPreference?: HeightPreference;
  }) {
    // Compute layout for all stack types using only the remainder quantity.
    const allStacksInfo = this.getLayoutInfo({
      gap,
      size,
      quantity: remainderQuantity,
      pairGap,
      pair,
      secDim,
      maxColsInDoc,
    });

    const candidates: Array<{
      stackName: StackType;
      fitRow: number;
      neededCols: { cols: number; remainder: number };
      heightByCols: { mainStack: number; remainderStack: number };
      stackSize: DimensionObject;
      requiredDocs: RequiredDocReturn;
    }> = [];

    for (const type of stackTypes) {
      const typeSafe = type as Exclude<StackType, "NONE">;
      const info = allStacksInfo[typeSafe];

      // Skip stack types that cannot hold any items.
      if (info.fitRow === 0) continue;

      // Only keep stacks where all remainder items land in a single column
      // (no further leftover).
      if (info.neededCols.remainder !== 0) continue;

      candidates.push({
        stackName: type,
        fitRow: info.fitRow,
        neededCols: { cols: info.neededCols.cols, remainder: 0 },
        heightByCols: {
          mainStack: info.heightByCols.mainStack,
          remainderStack: 0,
        },
        stackSize: info.stackSize,
        requiredDocs: info.requiredDocs,
      });
    }

    if (candidates.length === 0) return null;

    // Sort by height according to preference.
    candidates.sort((a, b) =>
      heightPreference === "Less"
        ? a.heightByCols.mainStack - b.heightByCols.mainStack
        : b.heightByCols.mainStack - a.heightByCols.mainStack,
    );

    return candidates[0];
  }

  /**
   * Analyses all valid main/remainder stack combinations and returns the
   * optimal one according to `heightPreference`.
   *
   * Algorithm:
   * 1. Call {@link getLayoutInfo} for the full `quantity`.
   * 2. For each `mainType` in the allowed `stackTypes`:
   *    - If `remainder === 0`: push a no-remainder combination.
   *    - Otherwise: call {@link getBestRemainderStack} with the remainder
   *      quantity and push a combination that pairs `mainType` with the
   *      best remainder stack found.
   * 3. Sort all valid combinations by `score` (= `totalHeight`) according
   *    to `heightPreference` and return the winner together with
   *    `allCombinations`.
   *
   * @param params - Analysis parameters.
   * @param params.gap              - Gap between stacks.
   * @param params.size             - Primary item dimensions.
   * @param params.quantity         - Total number of items.
   * @param params.pairGap          - Gap inside a pair (default 0).
   * @param params.pair             - Whether items are paired.
   * @param params.secDim           - Optional secondary item dimensions.
   * @param params.heightPreference - `"Less"` (default) or `"More"`.
   * @param params.stackOrientation - `"vertical"` (HH/VV), `"horizontal"` (RHH/RVV),
   *                                  or omitted / `"auto"` for all types.
   * @param params.maxColsInDoc     - Hard cap on columns per document (0 = auto).
   * @returns Recommended combination plus `allCombinations` array.
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
      secDim,
      heightPreference = "Less",
      stackOrientation,
      maxColsInDoc,
    } = params;

    // Determine which stack types to consider based on orientation filter.
    let stackTypes: StackType[] = stackTypesTuple;
    if (stackOrientation === "vertical") stackTypes = ["HH", "VV"];
    else if (stackOrientation === "horizontal") stackTypes = ["RHH", "RVV"];

    // Compute full layout info for all stack types.
    const allStacksInfo = this.getLayoutInfo({
      gap,
      size,
      quantity,
      pairGap,
      pair,
      secDim,
      maxColsInDoc,
    }) as StackInfo;

    const validCombinations: CombinationScore[] = [];

    for (const mainType of stackTypes) {
      const mainTypeSafe = mainType as Exclude<StackType, "NONE">;
      const mainInfo = allStacksInfo[mainTypeSafe];

      // Skip stack types where nothing fits.
      if (mainInfo.fitRow === 0) continue;

      if (mainInfo.neededCols.remainder === 0) {
        // No remainder — the main stack alone covers all items.
        validCombinations.push({
          mainStack: mainType,
          remainderStack: mainType,
          totalHeight: mainInfo.heightByCols.mainStack,
          hasRemainder: false,
          score: mainInfo.heightByCols.mainStack,
          mainCols: mainInfo.neededCols.cols,
          mainQuantityOccupied: quantity,
          remainderItems: 0,
          remainderQuantityOccupied: 0,
          mainHeight: mainInfo.heightByCols.mainStack,
          remainderHeight: 0,
          mainFitRow: mainInfo.fitRow,
          remainderFitRow: mainInfo.fitRow,
          remainderCols: 0,
          requiredDocs: mainInfo.requiredDocs,
          remainderRequiredDocs: { docsNeeded: 0, colsPerDoc: 0 },
        });
        continue;
      }

      // Remainder exists — find the best stack type to absorb leftover items.
      const remainderQuantity = mainInfo.neededCols.remainder;

      const bestRem = this.getBestRemainderStack({
        gap,
        size,
        remainderQuantity,
        pairGap,
        pair,
        secDim,
        maxColsInDoc,
        stackTypes,
        heightPreference,
      });

      // No valid remainder stack found for this main type — skip.
      if (!bestRem) continue;

      const mainHeight = mainInfo.heightByCols.mainStack;
      const remainderHeight = bestRem.heightByCols.mainStack;
      const totalHeight =
        mainHeight + (mainHeight > 0 ? gap : 0) + remainderHeight;
      const remainderCols = bestRem.neededCols.cols;

      validCombinations.push({
        mainStack: mainType,
        remainderStack: bestRem.stackName,
        totalHeight,
        hasRemainder: true,
        score: totalHeight,
        mainCols: mainInfo.neededCols.cols,
        mainQuantityOccupied: quantity - remainderQuantity,
        remainderItems: remainderQuantity,
        remainderQuantityOccupied: remainderQuantity,
        mainHeight,
        remainderHeight,
        mainFitRow: mainInfo.fitRow,
        remainderFitRow: bestRem.fitRow,
        remainderCols,
        requiredDocs: mainInfo.requiredDocs,
        remainderRequiredDocs: bestRem.requiredDocs,
      });
    }

    // Sort by score according to height preference.
    validCombinations.sort((a, b) =>
      heightPreference === "Less" ? a.score - b.score : b.score - a.score,
    );

    const best = validCombinations[0] ?? {
      mainStack: "HH" as StackType,
      remainderStack: "HH" as StackType,
      totalHeight: 0,
      hasRemainder: false,
      score: 0,
      mainCols: 0,
      mainQuantityOccupied: 0,
      remainderItems: 0,
      remainderQuantityOccupied: 0,
      mainHeight: 0,
      remainderHeight: 0,
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
      mainQuantityOccupied: best.mainQuantityOccupied,
      remainderItems: best.remainderItems,
      remainderQuantityOccupied: best.remainderQuantityOccupied,
      mainFitRow: best.mainFitRow,
      remainderFitRow: best.remainderFitRow,
      remainderCols: best.remainderCols,
      requiredDocs: best.requiredDocs,
      remainderRequiredDocs: best.remainderRequiredDocs,
      allCombinations: validCombinations,
    };
  }

  /**
   * Calculates document requirements based on canvas height and optional
   * per-document column cap.
   *
   * Exposed as `static` (not `private`) so {@link GridLayoutGenerator} can
   * call it directly when building a skip-stack recommendation.
   *
   * @returns Object with `docsNeeded` and `colsPerDoc`.
   */
  static requiredDocs(params: RequiredDocArg): RequiredDocReturn {
    const CANVAS_MAX_HEIGHT = 210;
    const { dimension, neededCols, gap, maxColsInDoc } = params;

    let docsNeeded: number;
    let colsPerDoc: number;

    // Calculate how many columns can fit within the canvas height constraint
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

    return { docsNeeded: Math.max(1, docsNeeded), colsPerDoc };
  }
}

// ... (interface definitions remain the same)

/** Input parameters for stack size calculation */
interface StackSizeParams {
  /** Dimensions of the primary (first) item. */
  size: DimensionObject;
  /** Whether to pair two items into one stack unit (default: `true`). */
  pair?: boolean;
  /** Gap between paired/stacked items in the same unit (default: `0`). */
  gap?: number;
  /**
   * Dimensions of the secondary (second) item.
   * When omitted the primary `size` is reused, reproducing the old ×2 behaviour.
   */
  secDim?: DimensionObject | null;
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

/** Stack information for each real layout stack type. */
type StackInfo = Record<
  Exclude<StackType, "NONE">,
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
  /** Optional secondary item dimension — passed through to {@link getStackSizes}. */
  secDim?: DimensionObject | null;
  quantity: number;
  pair?: boolean;
  maxColsInDoc: number;
}

/** Parameters for recommended stack analysis */
interface RecommendedStackParams extends LayoutObjectInfo {
  /** Height preference: `"Less"` (minimize height) or `"More"` (maximize height). */
  heightPreference: HeightPreference;
  /** Stack orientation filter: `"auto"` (all), `"vertical"` (HH/VV), `"horizontal"` (RHH/RVV). */
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
  mainQuantityOccupied: number;
  remainderItems: number;
  remainderQuantityOccupied: number;
  mainHeight: number;
  remainderHeight: number;
  mainFitRow: number;
  remainderFitRow: number;
  remainderCols: number;
  requiredDocs: RequiredDocReturn;
  remainderRequiredDocs: RequiredDocReturn;
}

/** Result from {@link GridCalculator.getRecommendedStacks}. */
interface RecommendedStacksResult {
  mainStack: StackType;
  remainderStack: StackType;
  totalHeight: number;
  hasRemainder: boolean;
  mainCols: number;
  mainQuantityOccupied: number;
  remainderItems: number;
  remainderQuantityOccupied: number;
  mainFitRow: number;
  remainderFitRow: number;
  remainderCols: number;
  requiredDocs: RequiredDocReturn;
  remainderRequiredDocs: RequiredDocReturn;
  allCombinations?: CombinationScore[];
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
