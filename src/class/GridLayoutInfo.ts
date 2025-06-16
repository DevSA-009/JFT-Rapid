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
        if (this.mode === "PANT") {
            const pant = Organizer.getPant();

            return getWHDimension(getSelectionBounds(pant));
        }
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
     * Computes the number of columns for horizontal, vertical, and L-shaped layout
     * based on item quantity and paper size limitations.
     * 
     * @returns {ColCalculationResult} An object with:
     *   - inH: Number of columns for horizontal layout
     *   - inV: Number of columns for vertical layout
     *   - inL: Number of L-shaped pairs (0 if not applicable)
     * 
     * @throws {Error} If paper size cannot accommodate any items
     */
    private getCol(): ColCalculationResult {
        const { inH, inL, inV } = this.getItemsPerRow();

        if (!inH && !inL && !inL) {
            throw new Error(`Invalid dimensions!. Exceeded paper size.`)
        }

        const inLBasedOnMode = inL ? Math.ceil(this.quantity / 2) : inL;

        return {
            inH: inH ? Math.ceil(this.quantity / inH) : inH,
            inV: inV ? Math.ceil(this.quantity / inV) : inV,
            inL: inLBasedOnMode
        }
    };

    /**
     * Determines how many items can fit in a row for each layout orientation
     * while honoring paper size and gap constraints.
     * 
     * @returns {ItemsPerRow} An object with:
     *   - inV: Number of items per row in vertical layout
     *   - inH: Number of items per row in horizontal layout
     *   - inL: Number of L-shaped pairs per row (0 if not applicable)
     */
    private getItemsPerRow(): ItemsPerRow {
        const { width: rawWidth, height: rawHeight } = this.getRawDimensionsBasedOnMode();

        const gap = CONFIG.Items_Gap;

        // First, calculate how many items fit without considering gaps
        const itemsInV_NoGap = Math.floor(CONFIG.PAPER_MAX_SIZE / rawWidth);
        const itemsInH_NoGap = Math.floor(CONFIG.PAPER_MAX_SIZE / rawHeight);

        let inV = 0;

        let inH = 0;

        for (let index = itemsInV_NoGap; itemsInV_NoGap > 0; index--) {

            const totalWidth = ((rawWidth * index) + (gap * (index - 1)));


            if (totalWidth <= CONFIG.PAPER_MAX_SIZE) {
                inV = index;
                break;
            }
        }

        for (let index = itemsInH_NoGap; itemsInH_NoGap > 0; index--) {

            const totalWidth = ((rawHeight * index) + (gap * (index - 1)));


            if (totalWidth <= CONFIG.PAPER_MAX_SIZE) {
                inH = index;
                break;
            }
        }

        let inL = 0;

        if (inV < 3 || inH < 3) {
            const lShapeDim = this.calculateLShapeDimensions();
            inL = lShapeDim.width <= CONFIG.PAPER_MAX_SIZE ? 1 : 0;
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

        if (this.mode === "PANT") {
            return "V";
        }

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
     * Generates a complete layout specification for printable items,
     * choosing the most appropriate orientation (L, H, or V) while honoring paper size.
     * 
     * If there’s only a single item in box (B) mode, L is forced.
     * 
     * @returns {LayoutSpecification} An object with:
     *   - orientation: The selected orientation
     *   - rows: Number of rows for the selected orientation
     *   - cols: Number of columns for the selected orientation
     *   - totalHeight: The total rendered height for the selected orientation
     *   - dimensions: The dimensions for each item in the selected orientation
     * 
     * @throws {Error} If the selected orientation cannot be rendered due to paper size limitations
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

        if (!colsMap[selectedOrientation]) {
            throw new Error(this.mode !== "PANT" ? `${selectedOrientation} orientation exceeded paper size. Please choose Auto or others` : `Pant exceeded paper size`);
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
     * 
     * * @throws {Error} If the colsPerDocConfig execeeded the canva height size
     */
    private requiredDocs(): RequiredDocReturn {
        const CANVAS_MAX_HEIGHT = 207;
        const colsPerDocConfig = CONFIG.perDoc;
        const { cols, dimensions } = this.getLayoutSpecification();

        let docsNeeded: number;

        let colsPerDoc: number;

        // Calculate how many columns can fit within the canvas height constraint
        // This ensures we never exceed CANVAS_MAX_HEIGHT
        let calculatedColsPerDoc = Math.floor(CANVAS_MAX_HEIGHT / (dimensions.height + CONFIG.Items_Gap));

        // Ensure we don't exceed the total columns needed
        calculatedColsPerDoc = Math.min(calculatedColsPerDoc, cols);

        // Ensure at least 1 column per document
        colsPerDoc = Math.max(1, calculatedColsPerDoc);
        docsNeeded = Math.ceil(cols / colsPerDoc);

        if (colsPerDocConfig) {
            if (colsPerDocConfig > colsPerDoc) {
                throw new Error(`per docs cols exceeded Canva height`)
            }
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