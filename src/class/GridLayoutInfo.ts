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
    private mode: ApparelSize;
    quantity: number;

    constructor(params: GridLayoutInfo) {
        this.dimension = params.dimension;
        this.quantity = params.quantity;
        this.mode = params.mode;
    }

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