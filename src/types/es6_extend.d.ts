//(ES3 polyfills)

interface Array<T> {
  /**
   * Returns the first index at which a given element can be found in the array,
   * or -1 if it is not present.
   *
   * The array is searched using strict equality (`===`).
   *
   * @param searchElement - Element to locate in the array.
   * @param fromIndex     - Optional index to start the search from.
   *                        If negative, it is taken as the offset from the end.
   * @returns The first index of the element, or -1 if not found.
   */
  indexOf(searchElement: T, fromIndex?: number): number;

  /**
   * Calls a defined callback function for each element in an array.
   * The callback is invoked only for indexes of the array which have assigned values.
   *
   * @param callbackfn - A function that accepts up to three arguments.
   *                     The forEach method calls the callbackfn function one time for each element in the array.
   * @param thisArg    - An object to which the this keyword can refer in the callbackfn function.
   *                     If thisArg is omitted, undefined is used as the this value.
   */
  forEach(
    callbackfn: (value: T, index: number, array: T[]) => void,
    thisArg?: any,
  ): void;

  /**
   * Calls a defined callback function on each element of an array,
   * and returns an array that contains the results.
   *
   * @param callbackfn - A function that accepts up to three arguments.
   *                     The map method calls the callbackfn function one time for each element in the array.
   * @param thisArg    - An object to which the this keyword can refer in the callbackfn function.
   *                     If thisArg is omitted, undefined is used as the this value.
   * @returns An array containing the results of the callback function.
   */
  map<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any,
  ): U[];

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   *
   * @param predicate  - A function that accepts up to three arguments.
   *                     The filter method calls the predicate function one time for each element in the array.
   * @param thisArg    - An object to which the this keyword can refer in the predicate function.
   *                     If thisArg is omitted, undefined is used as the this value.
   */
  filter<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): S[];
  filter(
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): T[];

  /**
   * Determines whether an array includes a certain element,
   * returning true or false as appropriate.
   *
   * @param searchElement - The element to search for.
   * @param fromIndex     - The position in this array at which to begin searching. Defaults to 0.
   */
  includes(searchElement: T, fromIndex?: number): boolean;

  /**
   * Returns the value of the first element in the array that satisfies
   * the provided testing function. Otherwise undefined is returned.
   *
   * @param predicate  - A function that accepts up to three arguments.
   *                     The find method calls the predicate function one time for each element in the array
   *                     until it finds one where predicate returns true.
   * @param thisArg    - An object to which the this keyword can refer in the predicate function.
   *                     If thisArg is omitted, undefined is used as the this value.
   */
  find<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): S | undefined;
  find(
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): T | undefined;

  /**
   * Calls the specified callback function for all the elements in an array.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * @param callbackfn A function that accepts up to four arguments.
   *                   The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
   *                     The first call to the callbackfn function provides this value as an argument
   *                     instead of an array value.
   * @returns The accumulated result from the last call to callbackfn.
   */
  reduce<U>(
    callbackfn: (
      previousValue: U,
      currentValue: T,
      currentIndex: number,
      array: T[],
    ) => U,
    initialValue: U,
  ): U;

  /**
   * Calls the specified callback function for all the elements in an array.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * Important: If no initialValue is provided, the first element of the array
   * will be used as the initial accumulator value and skipped in iteration.
   * Calling reduce on an empty array without initialValue throws a TypeError.
   *
   * @param callbackfn A function that accepts up to four arguments.
   * @returns The accumulated result from the last call to callbackfn.
   * @throws {TypeError} If the array is empty and no initialValue is provided.
   */
  reduce<U = T>(
    callbackfn: (
      previousValue: U,
      currentValue: T,
      currentIndex: number,
      array: T[],
    ) => U,
  ): U;

  /**
   * Returns the index of the first element in the array that satisfies the provided testing function.
   * Otherwise, -1 is returned.
   *
   * @param predicate  - A function that accepts up to three arguments.
   *                     The findIndex method calls the predicate function one time for each element in the array
   *                     until it finds one where predicate returns true.
   * @param thisArg    - An object to which the this keyword can refer in the predicate function.
   *                     If thisArg is omitted, undefined is used as the this value.
   * @returns          The index of the first element that satisfies the testing function, or -1 if no element is found.
   */
  findIndex(
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): number;

  /**
   * Returns the index of the first element in the array that satisfies the provided type guard testing function.
   * Otherwise, -1 is returned.
   *
   * @param predicate  - A type guard function that narrows the type of the element.
   * @param thisArg    - An object to which the this keyword can refer in the predicate function.
   * @returns          The index of the first element that satisfies the type guard, or -1 if none is found.
   */
  findIndex<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): number;
}

interface ObjectConstructor {
  /**
   * Returns the names of the enumerable string properties and methods of an object.
   *
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  keys(o: object): string[];

  /**
   * Returns an array of key/values of the enumerable properties of an object.
   * The order of properties is the same as that provided by a for...in loop
   * (the difference being that a for-in loop enumerates properties in the prototype chain as well).
   *
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  entries(o: object): [string, any][];

  /**
   * Returns an array of values of the enumerable properties of an object.
   * The order of property values is the same as that provided by a for...in loop
   * (the difference being that a for-in loop enumerates properties in the prototype chain as well).
   *
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  values(o: object): any[];

  /**
   * Determines whether an object has the specified property as its own property
   * (not inherited from the prototype chain).
   *
   * @param o       The object whose property is being checked.
   * @param prop    The name of the property to check.
   * @returns       true if the object has the property as an own property; otherwise false.
   */
  hasOwn(o: object, prop: PropertyKey): boolean;
}

interface String {
  /**
   * Returns true if searchString appears as a substring of the result of converting
   * this object to a String, at one or more positions that are greater than or equal to position;
   * otherwise, returns false.
   *
   * @param search   - search string
   * @param position - If position is undefined, 0 is assumed, so as to search all of the String.
   */
  includes(search: string, position?: number): boolean;

  /**
   * Removes leading and trailing whitespace from a string.
   *
   * @returns A new string with leading and trailing white-space removed.
   */
  trim(): string;
}
