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
    static getStackSizes(params: StackParams): StackSizesResult {
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
     * Calculates how many items of each stack type can fit in a single row,
     * accounting for gaps between items.
     *
     * @param params - Stack dimensions and recommended type from getStackSizes()
     * @returns Object with the maximum fitting count for each stack orientation
     */
    static getRowFitCount(params: StackSizesResult): RowFitCounts {
        const { HH, RHH, VV, RVV } = params;
        const gap = CONFIG.Items_Gap;
        const maxPaperWidth = CONFIG.PAPER_MAX_SIZE;

        const fitCounts = {
            HH: this.calculateMaxFit(HH.width, gap, maxPaperWidth),
            VV: this.calculateMaxFit(VV.width, gap, maxPaperWidth),
            RHH: this.calculateMaxFit(RHH.width, gap, maxPaperWidth),
            RVV: this.calculateMaxFit(RVV.width, gap, maxPaperWidth),
        };

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
            const totalWidth = itemWidth * count + gap * (count - 1);
            if (totalWidth <= maxWidth) {
                return count;
            }
        }

        return 0;
    };
}

/** Input parameters for stack size calculation */
interface StackParams {
    /** Dimensions of a single item */
    size: Size;
    /** Whether to allow pairing two items horizontally (default: true) */
    pair?: boolean;
    /** Gap between paired/stacked items (default: 0) */
    gap?: number;
}

/** Individual stack dimensions */
interface StackDimensions {
    width: number;
    height: number;
}

/** Result from getStackSizes() */
interface StackSizesResult extends StackSizes {
    /** The stack type that gives the maximum width */
    recommended: StackType;
}

/** Number of items that fit in one row for each orientation */
interface RowFitCounts {
    HH: number;
    VV: number;
    RHH: number;
    RVV: number;
}