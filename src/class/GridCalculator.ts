class GridCalculator {

    /**
     * Calculates all possible stacking dimensions and recommends the configuration
     * with the maximum width.
     * 
     * @param params - Parameters including size, pair flag, and gap
     * @returns An object with all stack sizes and the recommended stack
     */
    static getStackSizes(params: StackParams) {
        const { size, pair = true, gap = 0 } = params;
        const factor = pair ? 2 : 0;

        const { width: w, height: h } = size;

        const { width: sw, height: sh } = Utils.swapDimensions({ width: w, height: h });

        // All stacking possibilities
        const stacks: StackSizes = {
            HH: { width: w * factor + gap, height: h },
            RHH: { width: sw * factor + gap, height: sh },
            VV: { width: w, height: h * 2 + gap },
            RVV: { width: sw, height: sh * 2 + gap },
        };

        // Find recommended stack (max width)
        const recommended: RecommendedStack = { type: "HH", width: stacks.HH.width };

        ES6_SA.objForEach(stacks, (key, value) => {
            if (value.width > recommended.width) {
                recommended.type = key;
                recommended.width = value.width;
            }
        });

        return {
            ...stacks,
            recommended: recommended.type
        };
    };

}

/**
 * Parameters for calculating stack sizes.
 */
interface StackParams {
    size: Size;
    pair?: boolean; // Whether to consider double items horizontally/vertically
    gap?: number;   // Space between stacked items
}