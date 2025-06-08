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
     * Calculates raw dimensions based on the current mode.
     * For "FB" mode, doubles the height.
     * 
     * @returns {DimensionObject} An object containing the calculated width and height dimensions
     */
    getRawDimensionsBasedOnMode(): DimensionObject {
        const { width, height } = this.dimension;
        return {
            width,
            height: this.mode === "FB" ? height * 2 : height
        };
    };

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

    /**
     * Calculates the number of rows needed for different layout configurations
     * based on the quantity of items and paper size constraints.
     * 
     * @returns {RowCalculationResult} An object containing:
     *   - inH: Number of rows needed for horizontal layout
     *   - inV: Number of rows needed for vertical layout 
     *   - inL: Number of L-shaped pairs needed (0 if L-shape not possible)
     * 
     */
    getRow(): RowCalculationResult {
        const { inH, lShapePossible, inV } = this.getItemsPerRow();

        return {
            inH: Math.ceil(this.quantity / inH),
            inV: Math.ceil(this.quantity / inV),
            inL: lShapePossible ? Math.ceil(this.quantity / 2) : 0
        }
    };

    /**
     * Calculates how many items can fit in a single row for different layout orientations
     * considering paper size constraints and gap requirements.
     * 
     * @private
     * @returns {ItemsPerRow} Object containing:
    */
    private getItemsPerRow(): ItemsPerRow  {

        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();

        // Determine how many items fit per row in both orientations
        const inV = Math.max(1, Math.floor(CONFIG.PAPER_MAX_SIZE / (rawWidth + CONFIG.Items_Gap)));
        const inH = Math.max(1, Math.floor(CONFIG.PAPER_MAX_SIZE / (rawHeight + CONFIG.Items_Gap)));

        let lShapePossible: boolean = false;

        if (inV < 3 || inH < 3) {
            // addtion with  width wih height
            const newMixedWidth = this.dimension.width + this.dimension.height + CONFIG.Items_Gap;

            lShapePossible = newMixedWidth < CONFIG.PAPER_MAX_SIZE;
        }

        return {
            inH,
            inV,
            lShapePossible
        }
    };

    /**
     * Calculates the total height required for each layout type (horizontal, vertical, L-shape)
     * including gaps between rows.
     * 
     * @returns {LayoutTotalHeights} Object containing total heights for each layout type:
    */
    private calculateTotalHeights(): LayoutTotalHeights {
        const { inH, inL, inV } = this.getRow();

        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();
        
        const lShapeDimension = this.calculateLShapeDimensions();

        const totalHeightInV = rawHeight * inV + ((inV - 1) * CONFIG.Items_Gap);

        const totalHeightInH = rawWidth * inH + ((inH - 1) * CONFIG.Items_Gap);

        const totalHeightInL = lShapeDimension.height * inL + ((inL - 1) * CONFIG.Items_Gap);

        return {
            inH: totalHeightInH,
            inV: totalHeightInV,
            inL: totalHeightInL
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

interface ItemsPerRow {
    /** Number of items that fit per row in horizontal orientation */
    inH: number;
    /** Number of items that fit per row in vertical orientation */
    inV: number;
    /** Whether L-shaped layout is possible within paper constraints */
    lShapePossible: boolean;
}

interface RowCalculationResult {
    /** Number of rows needed for horizontal layout */
    inH: number;
    /** Number of rows needed for vertical layout */
    inV: number;
    /** Number of L-shaped pairs needed (0 if not possible) */
    inL: number;
}

type LayoutTotalHeights = RowCalculationResult;