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
}