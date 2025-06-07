/*

for testing purpose input

use inch unit

# paper max size 63.25
# gap size 0.1

dimention = {
    width:20.5,
    height:30
}

quantity = 8

mode = "B"

*/

class GridLayoutInfo {
    private dimension: DimensionObject;
    private mode: Mode;
    quantity: number;

    constructor(params: GridLayoutInfo) {
        this.dimension = params.dimension;
        this.quantity = params.quantity;
        this.mode = params.mode;
    }

    /**
     * Calculates L-shaped dimensions based on raw width/height and gap configuration
     * @returns {DimensionObject} Dimensions of the L-shape {width, height}
     */
    calculateLShapeDimensions(): DimensionObject {
        const { width: rawWidth, height: rawHeight } = this.dimension;
        const gap = CONFIG.Items_Gap;
        const widthDifference = rawHeight - rawWidth;

        const shapeWidth = rawWidth + rawHeight + gap;
        const shapeHeight = (rawHeight * 2) - widthDifference + gap;

        return {
            width: shapeWidth,
            height: shapeHeight
        };
    };

    private getFitInPage() {
        const width = this.dimension.width;
        const height = this.dimension.height;

        // Determine how many items fit per row in both orientations
        const inV = Math.max(1, Math.floor(CONFIG.PAPER_MAX_SIZE / (width + CONFIG.Items_Gap)));
        const inH = Math.max(1, Math.floor(CONFIG.PAPER_MAX_SIZE / (height + CONFIG.Items_Gap)));

        let inL: boolean = false;

        if (inV < 3 || inH < 3) {
            // addtion with  width wih height
            const newMixedWidth = width + height;

            inL = newMixedWidth < CONFIG.PAPER_MAX_SIZE;
        }

        return {
            inH,
            inV,
            inL
        }
    };

    private getRecommendedOrientation() {

    }

}

interface GridLayoutInfoCons {
    dimension: DimensionObject;
    mode: ApparelSize;
    quantity: number;
}

interface LayoutFitInfo {
    /** Number of items that fit per row in horizontal orientation */
    inH: number;
    /** Number of items that fit per row in vertical orientation */
    inV: number;
    /** Boolean indicating if L-shape layout is possible */
    inL: boolean;
}

interface RowCalculationResult {
    /** Number of rows needed for horizontal layout */
    inH: number;
    /** Number of rows needed for vertical layout */
    inV: number;
    /** Number of L-shaped pairs needed (0 if not possible) */
    inL: number;
}