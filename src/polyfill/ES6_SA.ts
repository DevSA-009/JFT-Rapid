class ES6_SA {
    /**
       * Iterates over an object's own enumerable properties.
       * @param obj - Object to iterate
       * @param callback - Function called with key and value
       */
    static objForEach<T extends Record<string, any>>(
        obj: T,
        callback: <K extends keyof T>(key: K, value: T[K]) => void
    ): void {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                callback(key as keyof T, obj[key as keyof T]);
            }
        }
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
    static arrayFrom = <T>(arrayLike: ArrayLike<T>): T[] => {
        const arr: T[] = [];
        for (let i = 0; i < arrayLike.length; i++) {
            arr.push(arrayLike[i]);
        }
        return arr;
    };

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
    static arrayIndexOf = <T>(array: T[], searchElement: T, fromIndex?: number): number => {
        const length = array.length;
        if (length === 0) return -1;

        let start = fromIndex !== undefined ? fromIndex : 0;
        if (start >= length) return -1;
        if (start < 0) start = Math.max(0, length + start);

        for (let i = start; i < length; i++) {
            if (array[i] === searchElement) {
                return i;
            }
        }

        return -1;
    };

}