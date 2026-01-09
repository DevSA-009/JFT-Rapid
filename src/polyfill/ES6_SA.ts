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
        for (var key in obj) {
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
        var arr: T[] = [];
        for (var i = 0; i < arrayLike.length; i++) {
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
     * Returns an array of the object's own enumerable property names.
     *
     * ES3-compatible replacement for `Object.keys`.
     *
     * @typeParam T - The object type
     * @param obj - The source object
     * @returns An array of property names belonging to `obj`
     */
    static objectKeys<T extends {}>(obj: T): (keyof T)[] {
        var result: (keyof T)[] = [];
        var key: string;

        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[result.length] = key as keyof T;
            }
        }

        return result;
    };


    /**
     * Returns an array of key–value pairs for the object's own enumerable properties.
     *
     * ES3-compatible replacement for `Object.entries`.
     *
     * @typeParam T - The object type
     * @param obj - The source object
     * @returns An array of `[key, value]` tuples
     */
    static objectEntries<T extends {}>(obj: T): [keyof T, T[keyof T]][] {
        var result: [keyof T, T[keyof T]][] = [];
        var key: string;

        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[result.length] = [
                    key as keyof T,
                    obj[key as keyof T]
                ];
            }
        }
        return result;
    };

    /**
    * Executes a callback function once for each element in an array.
    *
    * ES3-compatible replacement for `Array.prototype.forEach`.
    * Does not rely on built-in array methods or lib typings.
    *
    * @typeParam T - The element type of the array
    * @param array - The source array
    * @param callback - Function invoked for each element
    */
    static arrayForEach<T>(
        array: T[],
        callback: (value: T, index: number, array: T[]) => void
    ): void {
        var i: number = 0;
        var len: number = array.length;

        for (i = 0; i < len; i++) {
            if (i in array) {
                callback(array[i], i, array);
            }
        }
    };

}