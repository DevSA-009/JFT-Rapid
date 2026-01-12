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
        const {
            size,
            pair = true,
            gap = 0
        } = params;
        const horizontalMultiplier = pair ? 2 : 1;

        const {
            width: itemW,
            height: itemH
        } = size;
        const {
            width: rotatedW,
            height: rotatedH
        } = Utils.swapDimensions(size);

        // All possible stacking variants
        const stacks: StackSizes = {
            HH: {
                width: itemW * horizontalMultiplier + gap,
                height: itemH
            },
            RHH: {
                width: rotatedW * horizontalMultiplier + gap,
                height: rotatedH
            },
            VV: {
                width: itemW,
                height: itemH * 2 + gap
            },
            RVV: {
                width: rotatedW,
                height: rotatedH * 2 + gap
            },
        };

        // Determine the stack with maximum width
        let recommended: RecommendedStack = {
            type: "HH",
            width: stacks.HH.width
        };

        ES6_SA.arrayForEach(ES6_SA.objectEntries(stacks), ([type, dims]) => {
            if (dims.width > recommended.width) {
                recommended = {
                    type: type as StackType,
                    width: dims.width
                };
            }
        });

        return {
            ...stacks,
            recommended: recommended.type,
        };
    };

    /**
     * Returns how many times the given stack width fits into the paper width,
     * including gaps between items.
     * @param params - Configuration object
     * @param params.stackWidth - Width of one stack (chosen orientation)
     * @param params.gap - Gap between stacks
     * @returns Maximum number of stacks per row
     */
    static getRowFitCount(params: RowFitCounts): number {
        const {
            stackWidth,
            gap = 0
        } = params;
        const maxPaperWidth = CONFIG.PAPER_MAX_SIZE;

        return this.calculateMaxFit(stackWidth, gap, maxPaperWidth);
    };

    /**
     * Helper to compute the maximum number of items that fit in a row with gaps.
     * @param itemWidth - Width of a single stacked item
     * @param gap - Gap between items
     * @param maxWidth - Maximum available width (paper size)
     * @returns Maximum number of items that fit
     */
    private static calculateMaxFit(itemWidth: number, gap: number, maxWidth: number): number {
        if (itemWidth <= 0) return 0;

        // Start with rough estimate without gaps
        let maxCount = Math.floor(maxWidth / itemWidth);

        // Decrease until total width (including gaps) fits
        for (let count = maxCount; count > 0; count--) {
            const totalWidth = Utils.calculateTotalWithGap({
                count,
                value: itemWidth,
                gap
            });
            if (totalWidth <= maxWidth) {
                return count;
            }
        }

        return 0;
    };

    /**
     * Calculates the number of full rows required for a given stack type
     * and determines how many items remain after filling complete rows.
     * @param params - Row calculation parameters
     * @param params.quantity - Total number of items to place (default: 1)
     * @param params.fitRow - Maximum number of items that fit in a single row
     * @returns Object containing:
     *   - rows: Number of rows required to place the items
     *   - remainder: Items left after filling full rows
     */
    static getRowsByStack(params: RowByStack) {
        const {
            fitRow,
            quantity = 1
        } = params;

        // যদি fit না হয় তাহলে সব items remainder
        if (fitRow === 0) return {
            rows: 0,
            remainder: quantity
        };

        const remainder = quantity % fitRow;
        const rowsNeed = Math.floor(quantity / fitRow);

        return {
            rows: rowsNeed,
            remainder,
        };
    };

    /**
     * Computes total height for a given number of rows, including gaps between them.
     * @param params - Height calculation parameters
     * @param params.count - Number of rows
     * @param params.height - Single row height
     * @param params.gap - Gap between rows
     * @returns Heights for main rows group and a single remainder row
     */
    static getHeightByRows(params: HeightByRows) {
        const {
            count,
            height,
            gap
        } = params;

        return {
            mainStack: count > 0 ?
                Utils.calculateTotalWithGap({
                    value: height,
                    count,
                    gap
                }) : 0,
            remainderStack: height,
        };
    };

    /**
     * Main layout calculation method - supports both single stack type and 'auto' (all types)
     * @param params - Layout calculation parameters
     * @returns Layout information for specified stack type or all stack types
     */
    static getLayoutInfo(params: LayoutObjectInfo) {
        const {
            gap,
            size,
            quantity,
            pairGap = 0,
            pair
        } = params;

        const stackTypes: StackType[] = ["HH", "VV", "RHH", "RVV"];
        const stacksInfo = {} as StackInfo;

        const stackSizes = this.getStackSizes({
            size,
            pair,
            gap: pairGap
        });

        for (const type of stackTypes) {
            const stackSize = stackSizes[type];

            const fitRow = this.getRowFitCount({
                stackWidth: stackSize.width,
                gap
            });

            const neededRows = this.getRowsByStack({
                fitRow,
                quantity
            });

            const heightByRows = this.getHeightByRows({
                count: neededRows.rows,
                height: stackSize.height,
                gap,
            });

            stacksInfo[type] = {
                fitRow,
                neededRows,
                heightByRows,
                stackSize
            };
        }

        return stacksInfo;
    };

    /**
     * Analyzes all stack type layouts and determines optimal main and remainder stack
     * @param params - Analysis parameters
     * @returns Recommended main and remainder stack types with details
     */
    static getRecommendedStacks(params: RecommendedStackParams): RecommendedStacksResult {
        const {
            gap,
            size,
            quantity,
            pairGap = 0,
            pair,
            heightPreference = "Less",
            stackOrientation
        } = params;

        // Get layout info for all stack types
        const allStacksInfo = this.getLayoutInfo({
            gap,
            size,
            quantity,
            pairGap,
            pair,
        }) as StackInfo;

        // Determine which stack types to consider based on orientation
        let stackTypes: StackType[];

        if (stackOrientation === "vertical") {
            stackTypes = ["HH", "VV"]; // Normal orientations only
        } else if (stackOrientation === "horizontal") {
            stackTypes = ["RHH", "RVV"]; // Rotated orientations only
        } else {
            stackTypes = ["HH", "VV", "RHH", "RVV"]; // All orientations
        }

        const validCombinations: CombinationScore[] = [];

        // Analyze each main stack type
        for (const mainType of stackTypes) {
            const mainInfo = allStacksInfo[mainType];

            // Skip if doesn't fit
            if (mainInfo.fitRow === 0) continue;

            // If no remainder, only main stack needed
            if (mainInfo.neededRows.remainder === 0) {
                const totalHeight = mainInfo.heightByRows.mainStack;
                validCombinations.push({
                    mainStack: mainType,
                    remainderStack: mainType,
                    totalHeight,
                    hasRemainder: false,
                    score: totalHeight,
                    mainRows: mainInfo.neededRows.rows,
                    remainderItems: 0,
                    mainHeight: mainInfo.heightByRows.mainStack,
                    remainderHeight: 0,
                });
                continue;
            }

            // If remainder exists, check each remainder stack type
            for (const remType of stackTypes) {
                const remInfo = allStacksInfo[remType];

                // Check: remainder stack must fit at least the remainder items
                if (remInfo.fitRow < mainInfo.neededRows.remainder) continue;

                const mainHeight = mainInfo.heightByRows.mainStack;
                const remainderHeight = remInfo.heightByRows.remainderStack;
                const totalHeight = mainHeight + (mainHeight > 0 ? gap : 0) + remainderHeight;

                validCombinations.push({
                    mainStack: mainType,
                    remainderStack: remType,
                    totalHeight,
                    hasRemainder: true,
                    score: totalHeight,
                    mainRows: mainInfo.neededRows.rows,
                    remainderItems: mainInfo.neededRows.remainder,
                    mainHeight,
                    remainderHeight,
                });
            }
        }

        // Sort by score according to height preference
        validCombinations.sort((a, b) => {
            return heightPreference === "Less" ? a.score - b.score : b.score - a.score;
        });

        const best = validCombinations[0] || {
            mainStack: "HH",
            remainderStack: "HH",
            totalHeight: 0,
            hasRemainder: false,
            mainRows: 0,
            remainderItems: 0,
            allCombinations: []
        };

        return {
            mainStack: best.mainStack,
            remainderStack: best.remainderStack,
            totalHeight: best.totalHeight,
            hasRemainder: best.hasRemainder,
            mainRows: best.mainRows,
            remainderItems: best.remainderItems,
            // allCombinations: validCombinations,
        };
    };
}

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

/** Parameters for row calculation by stack */
interface RowByStack {
    quantity?: number;
    fitRow: number;
}

/** Parameters for height calculation by rows */
interface HeightByRows extends StrictOmit<DimensionObject, "width"> {
    gap: number;
    count: number;
}

/** Stack information for each stack type */
type StackInfo = Record<StackType, {
    fitRow: number;
    neededRows: ReturnType<typeof GridCalculator.getRowsByStack>;
    heightByRows: ReturnType<typeof GridCalculator.getHeightByRows>;
    stackSize: DimensionObject;
}>

/** Parameters for layout calculation */
interface LayoutObjectInfo {
    gap: number;
    pairGap?: number;
    size: DimensionObject;
    quantity: number;
    pair?: boolean;
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
    mainRows: number;
    remainderItems: number;
    mainHeight: number;
    remainderHeight: number;
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
    /** Number of main rows */
    mainRows: number;
    /** Number of remainder items */
    remainderItems: number;
    /** All valid combinations (sorted by score) */
    // allCombinations: CombinationScore[];
}