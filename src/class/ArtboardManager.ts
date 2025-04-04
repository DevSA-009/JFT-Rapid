/**
 * ArtboardManager - A class to manage artboards in Adobe Illustrator using ExtendScript.
 */
class ArtboardManager {
    private document: Document;
    private artboard: Artboard;
    private size: { width: number; height: number };
    private position: { x: number; y: number };

    /**
     * Creates an instance of ArtboardManager for the active document.
     * @param {Document} doc - The Illustrator document instance.
     */
    constructor(doc: Document) {
        if (!app.documents.length) {
            throw new Error("No document is open.");
        }
        this.document = doc;
        this.artboard = this.document.artboards[this.document.artboards.getActiveArtboardIndex()];

        // Store initial size and position
        this.size = this.getSize();
        this.position = this.getPosition();
    }

    /**
     * Resizes the current artboard and updates stored size.
     * @param {number} [width] - The new width (default: current width).
     * @param {number} [height] - The new height (default: current height).
     */
    resize(width?: number, height?: number): void {
        const { width: currentWidth, height: currentHeight } = this.size;

        width = width ?? currentWidth;
        height = height ?? currentHeight;

        const centerX = this.position.x;
        const centerY = -this.position.y; // Convert UI to ExtendScript Y

        this.artboard.artboardRect = [
            centerX - width / 2,  // Left
            centerY + height / 2, // Top
            centerX + width / 2,  // Right
            centerY - height / 2  // Bottom
        ];

        // Update stored values
        this.size = { width, height };
    }

    /**
     * Moves the current artboard to a new position and updates stored position.
     * @param {number} [x] - New X position in points (default: current X).
     * @param {number} [y] - New Y position in points (default: current Y).
     */
    move(x?: number, y?: number): void {
        const { width, height } = this.size;

        // Use provided values, or default to current position
        x = x ?? this.position.x;
        y = y !== undefined ? -y : -this.position.y; // Convert UI to ExtendScript Y

        this.artboard.artboardRect = [
            x - width / 2,  // Left
            y + height / 2, // Top
            x + width / 2,  // Right
            y - height / 2  // Bottom
        ];

        // Update stored values
        this.position = { x, y: -y }; // Convert back to UI Y
    }

    /**
     * Gets the artboard's center position (matching Illustrator UI).
     * @returns {{ x: number, y: number }} The X and Y position in points.
     */
    getPosition(): { x: number; y: number } {
        const bounds = this.artboard.artboardRect;
        const centerX = (bounds[0] + bounds[2]) / 2;
        const centerY = (bounds[1] + bounds[3]) / 2;

        return { x: centerX, y: -centerY }; // Convert ExtendScript Y to UI Y
    }

    /**
     * Gets the width and height of the current artboard.
     * @returns {{ width: number, height: number }} The width and height in points.
     */
    getSize(): { width: number; height: number } {
        const bounds = this.artboard.artboardRect;
        return { width: bounds[2] - bounds[0], height: bounds[1] - bounds[3] };
    }
}
