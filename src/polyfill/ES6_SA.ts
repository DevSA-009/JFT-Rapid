class ES6_SA {
    /**
    * Returns the first index at which a given element can be found in the array,
    * or -1 if it is not present.
    *
    * ES3-compatible replacement for `Array.prototype.indexOf`.
    *
    * @typeParam T - Element type
    * @param array - The source array
    * @param searchElement - Element to locate
    * @param fromIndex - Optional index to start the search from
    * @returns The first index of the element, or -1 if not found
    */
    static arrayIndexOf<T>(
        array: T[],
        searchElement: T,
        fromIndex?: number
    ): number {
        var len: number = array.length;
        var i: number = 0;

        if (len === 0) {
            return -1;
        }

        i = fromIndex ? fromIndex : 0;

        if (i < 0) {
            i = len + i;
            if (i < 0) {
                i = 0;
            }
        }

        for (; i < len; i++) {
            if (i in array) {
                if (array[i] === searchElement) {
                    return i;
                }
            }
        }

        return -1;
    }
    
    /**
       * Iterates over an object's own enumerable properties.
       * @param obj - Object to iterate
       * @param callback - static called with key and value
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
     * Creates an array from an array-like object.
     *
     * ES3-compatible partial replacement for `Array.from`.
     * Supports array-like objects with a numeric `length`.
     *
     * @typeParam T - Element type
     * @param source - An array-like object
     * @returns A new array copied from `source`
     */
    static arrayFrom<T>(source: { length: number }): T[] {
        var result: T[] = [];
        var i: number = 0;
        var len: number = source.length;

        for (i = 0; i < len; i++) {
            if (i in source) {
                result[result.length] = (source as { [n: number]: T })[i];
            }
        }

        return result;
    }


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
    * Executes a callback static once for each element in an array.
    *
    * ES3-compatible replacement for `Array.prototype.forEach`.
    * Does not rely on built-in array methods or lib typings.
    *
    * @typeParam T - The element type of the array
    * @param array - The source array
    * @param callback - static invoked for each element
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

    /**
     * Checks if the provided value is an array.
     * 
     * @param value - The value to check.
     * @returns {boolean} - Returns `true` if the value is an array, otherwise `false`.
     */
    static isArray(value: any): boolean {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    /**
    * Creates a new array populated with the results of calling a callback
    * static on every existing element in the source array.
    *
    * ES3-compatible replacement for `Array.prototype.map`.
    *
    * @typeParam T - Source element type
    * @typeParam U - Result element type
    * @param array - The source array
    * @param callback - static that produces a new element
    * @returns A new array with mapped values
    */
    static arrayMap<T, U>(
        array: T[],
        callback: (value: T, index: number, array: T[]) => U
    ): U[] {
        var result: U[] = [];
        var i: number = 0;
        var len: number = array.length;

        for (i = 0; i < len; i++) {
            if (i in array) {
                result[result.length] = callback(array[i], i, array);
            }
        }

        return result;
    };

    /**
     * Returns the first element in the array that satisfies the provided
     * testing static.
     *
     * ES3-compatible replacement for `Array.prototype.find`.
     *
     * @typeParam T - Element type
     * @param array - The source array
     * @param predicate - static to test each element
     * @returns The first matching element, or `undefined`
     */
    static arrayFind<T>(
        array: T[],
        predicate: (value: T, index: number, array: T[]) => boolean
    ): T | undefined {
        var i: number = 0;
        var len: number = array.length;

        for (i = 0; i < len; i++) {
            if (i in array) {
                if (predicate(array[i], i, array)) {
                    return array[i];
                }
            }
        }

        return undefined;
    };

    /**
     * Creates a new array with all elements that pass the test
     * implemented by the provided predicate static.
     *
     * ES3-compatible replacement for `Array.prototype.filter`.
     *
     * @typeParam T - Element type
     * @param array - The source array
     * @param predicate - static to test each element
     * @returns A new array with elements that satisfy the predicate
     */
    static arrayFilter<T>(
        array: T[],
        predicate: (value: T, index: number, array: T[]) => boolean
    ): T[] {
        var result: T[] = [];
        var i: number = 0;
        var len: number = array.length;

        for (i = 0; i < len; i++) {
            if (i in array) {
                if (predicate(array[i], i, array)) {
                    result[result.length] = array[i];
                }
            }
        }

        return result;
    };

    /**
     * Determines whether an array includes a certain element.
     *
     * ES3-compatible replacement for `Array.prototype.includes`.
     *
     * @typeParam T - Element type
     * @param array - The source array
     * @param searchElement - Element to search for
     * @returns `true` if found; otherwise `false`
     */
    static arrayIncludes<T>(
        array: T[],
        searchElement: T
    ): boolean {
        var i: number = 0;
        var len: number = array.length;

        for (i = 0; i < len; i++) {
            if (i in array) {
                if (array[i] === searchElement) {
                    return true;
                }
            }
        }

        return false;
    };
}