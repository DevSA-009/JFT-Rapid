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
     * Calculates the number of columns needed for different layout configurations
     * based on the quantity of items and paper size constraints.
     * 
     * @returns {ColCalculationResult} An object containing:
     *   - inH: Number of columns needed for horizontal layout
     *   - inV: Number of columns needed for vertical layout 
     *   - inL: Number of L-shaped pairs needed (0 if L-shape not possible)
     * 
     */
    private getCol(): ColCalculationResult {
        const { inH, inL, inV } = this.getItemsPerRow();

        const inLBasedOnMode = inL ? Math.ceil(this.quantity / 2) : inL;

        return {
            inH: inH ? Math.ceil(this.quantity / inH) : inH,
            inV: Math.ceil(this.quantity / inV),
            inL: inLBasedOnMode
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

        // First, calculate how many items fit without considering gaps
        const itemsInV_NoGap = Math.floor(CONFIG.PAPER_MAX_SIZE / rawWidth);
        const itemsInH_NoGap = Math.floor(CONFIG.PAPER_MAX_SIZE / rawHeight);

        // Calculate how many items fit considering gaps between items
        // For vertical layout (items arranged horizontally): width + gap between each item
        let inV = 0;
        for (let i = 1; i <= itemsInV_NoGap; i++) {
            const totalWidth = (i * rawWidth) + ((i - 1) * CONFIG.Items_Gap);
            if (totalWidth <= CONFIG.PAPER_MAX_SIZE) {
                inV = i;
            } else {
                break;
            }
        }

        // For horizontal layout (items arranged vertically): height + gap between each item
        let inH = 0;
        for (let i = 1; i <= itemsInH_NoGap; i++) {
            const totalHeight = (i * rawHeight) + ((i - 1) * CONFIG.Items_Gap);
            if (totalHeight <= CONFIG.PAPER_MAX_SIZE) {
                inH = i;
            } else {
                break;
            }
        }

        let inL = 0;

        if (inV < 3 || inH < 3) {
            // Mixed orientation: combine width and height (no gap added here as requested)
            const newMixedWidth = this.dimension.width + this.dimension.height;
            inL = newMixedWidth <= CONFIG.PAPER_MAX_SIZE ? 1 : 0;
        }

        return {
            inH,
            inV,
            inL
        };
    };

    /**
     * Calculates the total height required for each layout type (horizontal, vertical, L-shape)
     * including gaps between columns.
     * 
     * @returns {LayoutTotalHeights} Object containing total heights for each layout type:
     *   - inH: Total height for horizontal layout (items rotated 90°)
     *   - inV: Total height for vertical layout (standard orientation)
     *   - inL: Total height for L-shape layout (adjusted for mode if needed)
     */
    private calculateTotalHeights(): LayoutTotalHeights {
        const { inH, inL, inV } = this.getCol();

        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();

        const lShapeDimension = this.calculateLShapeDimensions();

        const totalHeightInV = inV ? (rawHeight * inV + ((inV - 1) * CONFIG.Items_Gap)) : inV;

        const totalHeightInH = inH ? (rawWidth * inH + ((inH - 1) * CONFIG.Items_Gap)) : inH;

        let totalHeightInL = (inL ? lShapeDimension.height * inL + ((inL - 1) * CONFIG.Items_Gap) : inL);

        if (this.mode === "B" && inL) {
            totalHeightInL = totalHeightInL / 2;
        }

        return {
            inH: totalHeightInH,
            inV: totalHeightInV,
            inL: totalHeightInL
        }
    };

    /**
     * Determines the recommended layout orientation based on calculated total heights
     * for horizontal ("H"), vertical ("V"), and landscape ("L") layouts.
     *
     * The logic ensures:
     * - Only considers layout heights that are greater than 0.
     * - Returns "L" (landscape) only if it is valid (> 0) and smaller than both "H" and "V".
     * - Handles cases where one or more layout types are invalid (i.e., height <= 0).
     */
    private getRecommendedOrientation(): LayoutShapeConstants {
        if (CONFIG.orientation === "Auto") {
            const { inH: heightInH, inV: heightInV, inL: heightInL } = this.calculateTotalHeights();

            const isValidL = heightInL > 0;
            const isValidH = heightInH > 0;
            const isValidV = heightInV > 0;

            if (
                isValidL &&
                (!isValidH || heightInL < heightInH) &&
                (!isValidV || heightInL < heightInV)
            ) {
                return "L";
            }

            if (!isValidH) return "V";
            if (!isValidV) return "H";

            return heightInH <= heightInV ? "H" : "V";
        }

        return CONFIG.orientation;
    };

    /**
     * Builds a layout specification object based on the given or recommended orientation.
     * Uses map-based lookup for columns, rows, and totalHeight based on orientation.
     *
     * @param orientation Optional layout orientation ("L", "H", or "V"). If not provided, the best one is auto-selected.
     * @returns {LayoutSpecification} Layout spec including orientation, dimensions, columns, rows, and height.
     */
    private getLayoutSpecification(): LayoutSpecification {
        let selectedOrientation = this.getRecommendedOrientation();

        if (this.mode === "B" && this.quantity === 1) {
            selectedOrientation = "L";
        };

        const allCols = this.getCol();
        const allRows = this.getItemsPerRow();
        const allHeights = this.calculateTotalHeights();

        const colsMap = {
            L: allCols.inL,
            H: allCols.inH,
            V: allCols.inV,
        };

        const rowsMap = {
            L: allRows.inL,
            H: allRows.inH,
            V: allRows.inV,
        };

        const heightMap = {
            L: allHeights.inL,
            H: allHeights.inH,
            V: allHeights.inV,
        };

        return {
            orientation: selectedOrientation,
            rows: rowsMap[selectedOrientation] ?? 0,
            cols: colsMap[selectedOrientation] ?? 0,
            totalHeight: heightMap[selectedOrientation] ?? 0,
            dimensions: this.getDimensionBasedOnOrientation()
        };
    };

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
     * - Documents needed when using fixed columns-per-document configuration
     * 
     * @returns {RequiredDocReturn} Object containing:
     *   - docsNeeded: Total number of documents required
     *   - colsPerDoc: Maximum columns that can fit in each document
     */
    private requiredDocs(): RequiredDocReturn {
        const CANVAS_MAX_HEIGHT = 207;
        const colsPerDocConfig = CONFIG.perDoc;
        const { cols, dimensions } = this.getLayoutSpecification();

        let docsNeeded: number;

        let colsPerDoc: number;

        if (!colsPerDocConfig) {
            // Calculate how many columns can fit within the canvas height constraint
            // This ensures we never exceed CANVAS_MAX_HEIGHT
            let calculatedColsPerDoc = Math.floor(CANVAS_MAX_HEIGHT / (dimensions.height + CONFIG.Items_Gap));

            // Ensure we don't exceed the total columns needed
            calculatedColsPerDoc = Math.min(calculatedColsPerDoc, cols);

            // Ensure at least 1 column per document
            colsPerDoc = Math.max(1, calculatedColsPerDoc);
            docsNeeded = Math.ceil(cols / colsPerDoc);
        } else {
            colsPerDoc = colsPerDocConfig;
            docsNeeded = Math.ceil(cols / colsPerDoc);
        }

        return { docsNeeded, colsPerDoc };
    }

    /**
     * Aggregates all critical layout information for display or export.
     * Combines layout specifications with document requirements in a single response.
     * 
     * @returns {LayoutInfo} Consolidated layout metadata including:
     *   - requiredDocuments: { docsNeeded: number, colsPerDoc: number }
     *   - orientation: Recommended layout type ("V" | "H" | "L")
     *   - totalHeight: Total height including gaps (inches)
     *   - rows: Number of rows needed
     *   - cols: Number of columns (items per row)
     * 
     * @example
     * // Returns for 8 items (20.5x30") in mode "B":
     * {
     *   requiredDocuments: { docsNeeded: 1, colsPerDoc: 4 },
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
    /** Number of items that fit per column in horizontal orientation */
    inH: number;
    /** Number of items that fit per column in vertical orientation */
    inV: number;
    /** Whether L-shaped layout is possible within paper constraints */
    inL: number;
}

interface ColCalculationResult {
    /** Number of columns needed for horizontal layout */
    inH: number;
    /** Number of columns needed for vertical layout */
    inV: number;
    /** Number of L-shaped pairs needed (0 if not possible) */
    inL: number;
}

type LayoutShapeConstants = keyof typeof GridOrientation;

type LayoutTotalHeights = ColCalculationResult;

interface RequiredDocReturn {
    /** Total documents required to fit all content */
    docsNeeded: number;
    /** Maximum columns allocated per document */
    colsPerDoc: number;
}

interface LayoutSpecification {
    /** Recommended layout orientation */
    orientation: LayoutShapeConstants;
    /** Number of rows fit in per column */
    rows: number;
    /** Number of columns needed */
    cols: number;
    /** Total height including gaps */
    totalHeight: number;
    /** Final dimensions to use */
    dimensions: DimensionObject;
}

interface LayoutInfo {
    /** Document requirements for printing */
    requiredDocuments: {
        docsNeeded: number;
        colsPerDoc: number;
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