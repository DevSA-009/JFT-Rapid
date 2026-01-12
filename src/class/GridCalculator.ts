/**
 * Utility class for calculating optimal item stacking and row fitting on a fixed paper size.
 */
class GridCalculator {
    /**
     * Calculates all possible stacking configurations (single or paired, normal or rotated)
     * and returns them along with the recommended configuration that maximizes width.
     *
     * @param params - Configuration for stacking calculation
     * @returns Object containing all stack dimensions and the recommended stack type
     */
    static getStackSizes(params: StackSizeParams): StackSizesResult {
        const { size, pair = true, gap = 0 } = params;
        const horizontalMultiplier = pair ? 2 : 1;

        const { width: itemW, height: itemH } = size;
        const { width: rotatedW, height: rotatedH } = Utils.swapDimensions(size);

        // All possible stacking variants
        const stacks: StackSizes = {
            HH: { width: itemW * horizontalMultiplier + gap, height: itemH },         // Horizontal pair, normal orientation
            RHH: { width: rotatedW * horizontalMultiplier + gap, height: rotatedH },      // Horizontal pair, rotated
            VV: { width: itemW, height: itemH * 2 + gap }, // Vertical pair, normal
            RVV: { width: rotatedW, height: rotatedH * 2 + gap }, // Vertical pair, rotated
        };

        // Determine the stack with maximum width
        let recommended: RecommendedStack = { type: "HH", width: stacks.HH.width };

        ES6_SA.arrayForEach(ES6_SA.objectEntries(stacks), ([type, dims]) => {
            if (dims.width > recommended.width) {
                recommended = { type: type as StackType, width: dims.width };
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
     *
     * @param params - Configuration object
     * @param params.stackWidth - Width of one stack (chosen orientation)
     * @param params.gap - Gap between stacks
     * @returns Maximum number of stacks per row
     */
    static getRowFitCount(params: RowFitCounts): number {
        const { stackWidth, gap = 0 } = params;
        const maxPaperWidth = CONFIG.PAPER_MAX_SIZE;

        const fitCounts = this.calculateMaxFit(stackWidth, gap, maxPaperWidth);

        return fitCounts;
    };

    /**
     * Helper to compute the maximum number of items that fit in a row with gaps.
     *
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
            const totalWidth = Utils.calculateTotalWithGap({ count, value: itemWidth, gap });
            if (totalWidth <= maxWidth) {
                return count;
            }
        }

        return 0;
    };

    /**
     * Calculates the number of full rows required for a given stack type
     * and determines how many items remain after filling complete rows.
     *
     * @param params - Row calculation parameters
     * @param params.quantity - Total number of items to place (default: 1)
     * @param params.stack - Stack size definitions (not used directly but kept for API consistency)
     * @param params.fitRowCount - Maximum number of items that fit in a single row
     *
     * @returns Object containing:
     * - `rows`: Number of rows required to place the items
     * - `remainder`: Items left after filling full rows
     */
    static getRowsByStack(params: RowByStack) {
        const { fitRowCount, quantity = 1 } = params;

        const remainder =
            quantity >= fitRowCount ? quantity % fitRowCount : 0;

        const usableQuantity = quantity - remainder;

        const rowsNeed = Math.max(
            1,
            Math.floor(usableQuantity / fitRowCount)
        );

        return {
            rows: rowsNeed,
            remainder,
        };
    };

    /**
     * Computes total height for a given number of rows, including gaps between them.
     *
     * @param params - Height calculation parameters
     * @param params.count - Number of rows
     * @param params.height - Single row height
     * @param params.gap - Gap between rows
     *
     * @returns Heights for main rows group and a single remainder row
     */
    static getHeightByRows(params: HeightByRows) {
        const { count, height, gap, } = params;


        return {
            mainStack: Utils.calculateTotalWithGap({
                value: height,
                count,
                gap,
            }),
            remainderStack: Utils.calculateTotalWithGap({
                value: height,
                count: 1,
                gap,
            })
        };
    };



}

/** Input parameters for stack size calculation */
interface StackSizeParams {
    /** Dimensions of a single item */
    size: Size;
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

/** Number of items that fit in one row for each orientation */
type RowFitCountsReturn = Record<StackType, number>;

interface RowFitCounts {
    stackWidth: number;
    gap?: number;
};

interface RowByStack {
    quantity?: number;
    stack: StackSizes;
    fitRowCount: number;
}

interface HeightByRows extends StrictOmit<DimensionObject, "width"> {
    gap: number;
    count: number;
}

interface LayoutObjectInfo {
    gap: number;
    stackType: "auto" | StackType;
    size: Size;
    quantity: number;
    pair?: boolean;
}