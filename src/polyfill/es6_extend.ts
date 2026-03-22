// polyfills.ts
// ES3-compatible polyfills – direct implementation

// Array.prototype.indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function <T>(
    this: T[],
    searchElement: T,
    fromIndex?: number,
  ): number {
    const len = this.length >>> 0;
    let i = fromIndex ? fromIndex >>> 0 : 0;

    if (len === 0) return -1;
    if (i < 0) {
      i = len + i;
      if (i < 0) i = 0;
    }

    for (; i < len; i++) {
      if (i in this && this[i] === searchElement) {
        return i;
      }
    }
    return -1;
  };
}

// Array.prototype.forEach
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function <T>(
    this: T[],
    callback: (value: T, index: number, array: T[]) => void,
    thisArg?: any,
  ): void {
    const len = this.length >>> 0;
    for (let i = 0; i < len; i++) {
      if (i in this) {
        callback.call(thisArg, this[i], i, this);
      }
    }
  };
}

// Array.prototype.map
if (!Array.prototype.map) {
  Array.prototype.map = function <T, U>(
    this: T[],
    callback: (value: T, index: number, array: T[]) => U,
    thisArg?: any,
  ): U[] {
    const len = this.length >>> 0;
    const result = new Array<U>(len);
    for (let i = 0; i < len; i++) {
      if (i in this) {
        result[i] = callback.call(thisArg, this[i], i, this);
      }
    }
    return result;
  };
}

// Array.prototype.filter
if (!Array.prototype.filter) {
  Array.prototype.filter = function <T>(
    this: T[],
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): T[] {
    const len = this.length >>> 0;
    const result: T[] = [];
    for (let i = 0; i < len; i++) {
      if (i in this) {
        const val = this[i];
        if (callback.call(thisArg, val, i, this)) {
          result.push(val);
        }
      }
    }
    return result;
  };
}

// Array.prototype.includes
if (!Array.prototype.includes) {
  Array.prototype.includes = function <T>(
    this: T[],
    searchElement: T,
    fromIndex?: number,
  ): boolean {
    const len = this.length >>> 0;
    let i = fromIndex ? fromIndex >>> 0 : 0;

    if (i < 0) {
      i = len + i;
      if (i < 0) i = 0;
    }

    for (; i < len; i++) {
      if (i in this && this[i] === searchElement) {
        return true;
      }
    }
    return false;
  };
}

// Array.prototype.find
if (!Array.prototype.find) {
  Array.prototype.find = function <T>(
    this: T[],
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): T | undefined {
    const len = this.length >>> 0;
    for (let i = 0; i < len; i++) {
      if (i in this) {
        const val = this[i];
        if (predicate.call(thisArg, val, i, this)) {
          return val;
        }
      }
    }
    return undefined;
  };
}

// Array.prototype.reduce polyfill (ES3 compatible)
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function (callback /*, initialValue */) {
    "use strict";

    // Check if array is null or undefined
    if (this == null) {
      throw new Error("Array.prototype.reduce called on null or undefined");
    }

    // Check if callback is a function
    if (typeof callback !== "function") {
      throw new Error(callback + " is not a function");
    }

    var t = Object(this);
    var len = t.length >>> 0;

    // If array is empty and no initial value provided → error
    if (len === 0 && arguments.length === 1) {
      throw new Error("Reduce of empty array with no initial value");
    }

    var k = 0;
    var accumulator;

    // Use initialValue if provided
    if (arguments.length >= 2) {
      accumulator = arguments[1];
    }
    // Otherwise find the first defined element as initial value
    else {
      var found = false;
      for (; k < len; k++) {
        if (k in t) {
          accumulator = t[k];
          found = true;
          k++; // skip this element in the loop below
          break;
        }
      }
      if (!found) {
        throw new Error("Reduce of empty array with no initial value");
      }
    }

    // Iterate over remaining elements
    for (; k < len; k++) {
      if (k in t) {
        accumulator = callback.call(undefined!, accumulator, t[k], k, t);
      }
    }

    return accumulator;
  };
}

// Array.prototype.findIndex
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function <T>(
    this: T[],
    predicate: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any,
  ): number {
    const len = this.length >>> 0;
    for (let i = 0; i < len; i++) {
      if (i in this) {
        const val = this[i];
        if (predicate.call(thisArg, val, i, this)) {
          return i;
        }
      }
    }
    return -1;
  };
}

// Object.keys
if (!Object.keys) {
  Object.keys = function <T extends object>(obj: T): string[] {
    const result: string[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result.push(key);
      }
    }
    return result;
  };
}

// Object.entries
if (!Object.entries) {
  Object.entries = function <T extends object>(obj: T): [string, any][] {
    const result: [string, any][] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result.push([key, (obj as any)[key]]);
      }
    }
    return result;
  };
}

// Object.values
if (!Object.values) {
  Object.values = function <T extends object>(obj: T): any[] {
    const result: any[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result.push((obj as any)[key]);
      }
    }
    return result;
  };
}

// Object.hasOwn (ES2022 method – very useful polyfill)
if (!Object.hasOwn) {
  Object.hasOwn = function (obj: object, prop: PropertyKey): boolean {
    // Most reliable ES3-compatible way: uses hasOwnProperty from Object.prototype
    // Also handles edge cases where obj might be null/undefined or hasOwnProperty is shadowed
    if (obj == null) {
      throw new Error("Cannot convert undefined or null to object");
    }

    // Convert prop to string (PropertyKey = string | symbol, but symbols not in ES3)
    // In ES3 we only care about string keys anyway
    const propStr = String(prop);

    return Object.prototype.hasOwnProperty.call(obj, propStr);
  };
}

// String.prototype.includes
if (!String.prototype.includes) {
  String.prototype.includes = function (
    this: string,
    search: string,
    position?: number,
  ): boolean {
    position = position ?? 0;
    if (search === "") return true;

    const strLen = this.length;
    const searchLen = search.length;

    if (position < 0) position = 0;
    if (position >= strLen) return false;
    if (position + searchLen > strLen) return false;

    for (let i = position; i <= strLen - searchLen; i++) {
      let match = true;
      for (let j = 0; j < searchLen; j++) {
        if (this.charAt(i + j) !== search.charAt(j)) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
    return false;
  };
}

// String.prototype.trim
if (!String.prototype.trim) {
  String.prototype.trim = function (this: string): string {
    // This pattern matches leading + trailing whitespace (ES3 safe)
    // \s = whitespace characters (space, tab, newline, etc.)
    return this.replace(/^\s+|\s+$/g, "");
  };
}
