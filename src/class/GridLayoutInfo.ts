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
    private quantity: number;

    constructor(params: GridLayoutInfoCons) {
        this.dimension = params.dimension;
        this.quantity = params.quantity;
        this.mode = params.mode;
    };

    /**
     * Calculates raw dimensions based on the current mode.
     * For "FB" mode, doubles the height.
     * 
     * @returns {DimensionObject} An object containing the calculated width and height dimensions
     */
    private getRawDimensionsBasedOnMode(): DimensionObject {
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
    private calculateLShapeDimensions(): DimensionObject {
        const { width: rawWidth, height: rawHeight } = this.dimension;

        const totalSize = rawWidth + rawHeight + CONFIG.Items_Gap;

        return {
            width: totalSize,
            height: totalSize // Enforced symmetry for L-shape
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
    private getRow(): RowCalculationResult {
        const { inH, lShapePossible, inV } = this.getItemsPerRow();

        const inLBasedOnMode = lShapePossible ? Math.ceil(this.quantity / 2) : 0;

        return {
            inH: Math.ceil(this.quantity / inH),
            inV: Math.ceil(this.quantity / inV),
            inL: this.mode === "B" ? Math.ceil(inLBasedOnMode / 2) : inLBasedOnMode
        }
    };

    /**
     * Calculates how many items can fit in a single row for different layout orientations
     * considering paper size constraints and gap requirements.
     * 
     * @private
     * @returns {ItemsPerRow} Object containing:
    */
    private getItemsPerRow(): ItemsPerRow {

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
     *   - inH: Total height for horizontal layout (items rotated 90°)
     *   - inV: Total height for vertical layout (standard orientation)
     *   - inL: Total height for L-shape layout (adjusted for mode if needed)
     */
    private calculateTotalHeights(): LayoutTotalHeights {
        const { inH, inL, inV } = this.getRow();

        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();

        const lShapeDimension = this.calculateLShapeDimensions();

        const totalHeightInV = rawHeight * inV + ((inV - 1) * CONFIG.Items_Gap);

        const totalHeightInH = rawWidth * inH + ((inH - 1) * CONFIG.Items_Gap);

        const totalHeightInL = inL ? lShapeDimension.height * inL + ((inL - 1) * CONFIG.Items_Gap) : inL;

        let totalHeightInLBasedOnMode = 0;

        if (totalHeightInL && this.mode === "B") {
            totalHeightInLBasedOnMode = totalHeightInL / 2;
        } else if (totalHeightInL) {
            totalHeightInLBasedOnMode = totalHeightInL;
        }

        return {
            inH: totalHeightInH,
            inV: totalHeightInV,
            inL: totalHeightInLBasedOnMode
        }
    };

    /**
     * Determines the most space-efficient layout orientation by comparing total heights
     * of all possible configurations (horizontal, vertical, and L-shape).
     * 
     * @returns {LayoutShapeConstants} Recommended layout type:
     *   - "L" - When L-shape is viable AND has smallest total height
     *   - "H" - When horizontal layout is more compact than vertical
     *   - "V" - When vertical layout is most space-efficient
     * 
     * @example
     * // Returns "H" for 7 items (20.5x30") since horizontal height (82.3") < vertical (90.2")
     * getRecommendedOrientation();
     * 
     * @example
     * // Returns "L" when L-shape exists and has smallest height
     * getRecommendedOrientation(); 
     */
    private getRecommendedOrientation(): LayoutShapeConstants {

        const { inH: heighInH, inV: heightInV, inL: heightInL } = this.calculateTotalHeights();

        if (heightInL && heightInL < heighInH && heightInL < heightInV) {
            return "L";
        } else {
            return heighInH <= heightInV ? "H" : "V"
        }
    };

    /**
     * Gets complete layout specifications for either a specified orientation or the automatically recommended one.
     * 
     * @param {LayoutShapeConstants} [orientation] Optional forced orientation (overrides recommendation)
     * @returns {LayoutSpecification} Consolidated layout data including:
     *   - orientation: The layout type being used (V/H/L)
     *   - rows: Number of cols fit in page
     *   - rows: Number of rows required
     *   - totalHeight: Total height including gaps between rows
     *   - dimensions: Physical dimensions to use for layout
     * 
     * getLayoutSpecification('H'); // Returns H layout data
     */
    private getLayoutSpecification(orientation?: LayoutShapeConstants): LayoutSpecification {
        const selectedOrientation = orientation || this.getRecommendedOrientation();
        const allRows = this.getRow();
        const allCols = this.getItemsPerRow();
        const allHeights = this.calculateTotalHeights();

        return {
            orientation: selectedOrientation,

            cols: selectedOrientation === 'L' ? 1
                : selectedOrientation === 'H' ? allCols.inH
                    : allCols.inV,

            rows: selectedOrientation === 'L' ? allRows.inL
                : selectedOrientation === 'H' ? allRows.inH
                    : allRows.inV,
            totalHeight: selectedOrientation === 'L' ? allHeights.inL
                : selectedOrientation === 'H' ? allHeights.inH
                    : allHeights.inV,
            dimensions: this.getDimensionBasedOnOrientation()
        };
    }

    /**
     * Determines final dimensions based on the recommended layout orientation.
     * Returns either L-shape dimensions or swapped dimensions for horizontal layout.
     * 
     * @returns {DimensionObject} Final dimensions for cutting/printing:
     *   - L-shape dimensions if "L" orientation recommended
     *   - Swapped width/height for "H" (horizontal) orientation
     *   - Original dimensions for "V" (vertical) orientation
     * 
     * @example
     * // Returns { width: 30, height: 20.5 } when "H" is recommended
     * getDimensionBasedOnOrientation();
    */
    private getDimensionBasedOnOrientation(): DimensionObject {

        const recommendedOrientation = this.getRecommendedOrientation();

        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();

        const lShapeDimension = this.calculateLShapeDimensions();

        const finalDimension = recommendedOrientation === "L" ? lShapeDimension : {
            width: recommendedOrientation === "H" ? rawHeight : rawWidth,
            height: recommendedOrientation === "H" ? rawWidth : rawHeight,
        }

        return finalDimension;
    };

    /**
     * Calculates document requirements for printing based on physical constraints.
     * Determines either:
     * - Documents needed when limited by maximum canvas height (inches), or
     * - Documents needed when using fixed rows-per-document configuration
     * 
     * @returns {RequiredDocReturn} Object containing:
     *   - docsNeeded: Total number of documents required
     *   - rowsPerDoc: Maximum rows that can fit in each document
     */
    private requiredDocs(): RequiredDocReturn {
        const CANVAS_MAX_HEIGHT = 207;

        const rowsPerDocConfig = CONFIG.perDoc;

        const orientation = this.getRecommendedOrientation();

        const { totalHeight, rows, dimensions } = this.getLayoutSpecification(orientation);

        const docsNeeded = !rowsPerDocConfig ? Math.ceil(totalHeight / CANVAS_MAX_HEIGHT) : Math.ceil(rows / rowsPerDocConfig);

        const maxHeightPerDoc = Math.ceil(totalHeight / docsNeeded);
        
        const rowsPerDoc = !rowsPerDocConfig ? Math.ceil(maxHeightPerDoc / dimensions.height) : rowsPerDocConfig;

        return { docsNeeded, rowsPerDoc };
    };

    /**
     * Aggregates all critical layout information for display or export.
     * Combines layout specifications with document requirements in a single response.
     * 
     * @returns {LayoutInfo} Consolidated layout metadata including:
     *   - requiredDocuments: { docsNeeded: number, rowsPerDoc: number }
     *   - orientation: Recommended layout type ("V" | "H" | "L")
     *   - totalHeight: Total height including gaps (inches)
     *   - rows: Number of rows needed
     *   - cols: Number of columns (items per row)
     * 
     * @example
     * // Returns for 8 items (20.5x30") in mode "B":
     * {
     *   requiredDocuments: { docsNeeded: 1, rowsPerDoc: 4 },
     *   orientation: "H",
     *   totalHeight: 82.3,
     *   rows: 4,
     *   cols: 2
     * }
     */
    public getLayoutInfo(): LayoutInfo {
        const { orientation, rows, cols, totalHeight } = this.getLayoutSpecification();

        return {
            requiredDocuments: this.requiredDocs(),
            orientation,
            totalHeight,
            rows,
            cols
        };
    };

}

interface GridLayoutInfoCons {
    dimension: DimensionObject;
    mode: Mode;
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

type LayoutShapeConstants = "V" | "H" | "L";

type LayoutTotalHeights = RowCalculationResult;

interface RequiredDocReturn {
    /** Total documents required to fit all content */
    docsNeeded: number;
    /** Maximum rows allocated per document */
    rowsPerDoc: number;
}

interface LayoutSpecification {
    /** Recommended layout orientation */
    orientation: LayoutShapeConstants;
    /** Number of columns fit in per row */
    cols: number;
    /** Number of rows needed */
    rows: number;
    /** Total height including gaps */
    totalHeight: number;
    /** Final dimensions to use */
    dimensions: DimensionObject;
}

interface LayoutInfo {
    /** Document requirements for printing */
    requiredDocuments: {
        docsNeeded: number;
        rowsPerDoc: number;
    };
    /** Recommended layout orientation */
    orientation: LayoutShapeConstants;
    /** Total height including gaps (inches) */
    totalHeight: number;
    /** Number of rows in layout */
    rows: number;
    /** Number of columns (items per row) */
    cols: number;
}