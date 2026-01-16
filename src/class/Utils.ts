class Utils {
	/**
	 * Swaps the width and height values of a dimension object.
	 *
	 * @param dims - An object containing width and height values
	 * @returns A new Dimensions object with width and height swapped
	 *
	 * @example
	 * ```ts
	 * DimensionUtils.swapDimensions({ width: 800, height: 600 });
	 * // => { width: 600, height: 800 }
	 * ```
	 */
	static swapDimensions(dims: DimensionObject): DimensionObject {
		return {
			width: dims.height,
			height: dims.width,
		};
	}

	/**
	 * Converts a numeric value between length units.
	 * Defaults from 'pt' to 'inch'.
	 * @param params - Object containing value, optional from/to units
	 * @returns Converted numeric value
	 */
	static convertLength(params: ConvertParams): number {
		const { value, from = "pt", to = "inch" } = params;

		// Conversion factors to inches
		var toInches: Record<LengthUnit, number> = {
			inch: 1,
			mm: 1 / 25.4,
			cm: 1 / 2.54,
			pt: 1 / 72,
		};

		// Convert from "from" unit to inches
		const valueInInches = value * toInches[from];

		// Convert inches to "to" unit
		return valueInInches / toInches[to];
	}

	/**
	 * Slices a string or array from the end based on the specified slice value.
	 *
	 * @param originalVal - The input string or array to be sliced.
	 * @param sliceValue - The number of elements to remove from the end.
	 * @returns The sliced value.
	 * @throws {Error} Throws an error if sliceValue is negative.
	 */
	static endSlice = (
		originalVal: string | unknown[],
		sliceValue: number
	): string | unknown[] => {
		if (sliceValue < 0) {
			throw new Error("sliceValue must be non-negative");
		}
		return originalVal.slice(0, originalVal.length - sliceValue);
	};

	/**
	 * Calculates the total size of repeated items with gaps applied
	 * only between items (no trailing gap).
	 *
	 * Formula:
	 *   (itemSize * count) + (gap * (count - 1))
	 *
	 * @param params - Calculation parameters
	 * @returns Total size including gaps
	 */
	static calculateTotalWithGap(params: CalculateTotalWithGapParams): number {
		const { value, count, gap } = params;
		if (count <= 0) return 0;
		if (count === 1) return value;
		return value * count + gap * (count - 1);
	}

	/**
	 * Determines whether a given number is odd.
	 *
	 * @param value - The number to evaluate.
	 * @returns `true` if the number is odd, otherwise `false`.
	 */
	static isOdd(value: number) {
		return !!(value % 2);
	}
}

interface ConvertParams {
	value: number;
	from?: LengthUnit; // default = "pt"
	to?: LengthUnit; // default = "inch"
}

/**
 * Parameters for calculating total size with gaps between items.
 */
interface CalculateTotalWithGapParams {
	/** Base value */
	value: number;

	/** Number of counts */
	count: number;

	/** Gap between consecutive items */
	gap: number;
}
