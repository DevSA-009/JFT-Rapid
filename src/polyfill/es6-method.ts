interface ArrayLike<T> {
    length: number;
    [n: number]: T;
}

// ========== Type Definitions End ==========

/**
 * Finds the first occurrence of a specified value in an array and returns its index.
 * If the value is not found, it returns -1.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} array - The array to search in.
 * @param {T} searchElement - The element to find.
 * @param {number} [fromIndex=0] - The index to start searching from (default is 0).
 * @returns {number} - The first index of `searchElement`, or -1 if not found.
 */
const indexOf = <T>(array: T[], searchElement: T, fromIndex?: number): number => {
    var length = array.length;
    if (length === 0) return -1;

    var start = fromIndex !== undefined ? fromIndex : 0;
    if (start >= length) return -1;
    if (start < 0) start = Math.max(0, length + start);

    for (var i = start; i < length; i++) {
        if (array[i] === searchElement) {
            return i;
        }
    }

    return -1;
};

/**
 * Converts an array-like object to an array.
 * This mimics the functionality of `Array.from()` in older JavaScript versions.
 *
 * @param {ArrayLike<T>} arrayLike - An object that has a `length` property and indexed elements (e.g., NodeList, arguments object).
 * @returns {T[]} A new array containing the elements from the array-like object.
 * 
 * @template T - The type of elements in the array-like object.
 */
const arrayFrom = <T>(arrayLike: ArrayLike<T>): T[] => {
    const arr: T[] = [];
    for (let i = 0; i < arrayLike.length; i++) {
        arr.push(arrayLike[i]);
    }
    return arr;
};

/**
 * Custom implementation of Object.keys for ES3 using an arrow function
 * @param obj - The object whose keys you want to retrieve.
 * @returns An array of the object's own enumerable property names.
 */
const objectKeys = (obj: Record<string, any>): string[] => {
    const keys: string[] = [];

    // Loop through all enumerable properties of the object
    for (const key in obj) {
        // Check if the property is directly on the object and not its prototype
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    return keys;
};

/**
 * Checks if the provided value is an array.
 * 
 * @param value - The value to check.
 * @returns {boolean} - Returns `true` if the value is an array, otherwise `false`.
 */
const isArray = (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Array]';
};

/**
 * Finds an element in an array based on a callback function.
 * 
 * @param {Selection} array - The array to search through.
 * @param {findElementCb} cb - The callback function used to test each element.
 * The callback should return a truthy value to indicate that the element matches.
 * @returns {any | null} - The first element that satisfies the callback function or null if none found.
 */
const findElement = <T>(array: T[], cb: findElementCb<T>): T | null => {
    for (let index = 0; index < array.length; index++) {
        let element = array[index];
        if (cb(element, index)) {
            return element;
        }
    }
    return null;
};

/**
 * Slices a string or array from the end based on the specified slice value.
 *
 * @param originalVal - The input string or array to be sliced.
 * @param sliceValue - The number of elements to remove from the end.
 * @returns The sliced value.
 * @throws {Error} Throws an error if sliceValue is negative.
 */
const endSlice = (
    originalVal: string | unknown[],
    sliceValue: number,
): string | unknown[] => {
    if (sliceValue < 0) {
        throw new Error("sliceValue must be non-negative");
    }
    return originalVal.slice(0, originalVal.length - sliceValue);
};