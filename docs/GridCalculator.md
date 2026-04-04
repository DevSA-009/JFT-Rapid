<div align="center">

# GridCalculator — Technical Reference

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Purpose

`GridCalculator` is a pure-math utility class. It has no side effects and never touches the Illustrator DOM. Its sole responsibility is to answer the question:

> **"Given a garment pair of known dimensions, a paper width, and a total quantity — what is the most paper-efficient way to arrange them?"**

It is called by `GridLayoutGenerator` before any artwork is duplicated.

---

## The Five Stack Types

A "stack" is the combined bounding box of one garment pair placed together in a specific orientation. All five variants are scored:

```
HH  (Horizontal-Horizontal)
┌────────┐┌────────┐
│ item1  ││ item2  │   Width  = w1 + gap + w2
└────────┘└────────┘   Height = max(h1, h2)

VV  (Vertical-Vertical)
┌────────┐
│ item1  │             Width  = max(w1, w2)
└────────┘             Height = h1 + gap + h2
┌────────┐
│ item2  │
└────────┘

RHH  (Rotated-Horizontal-Horizontal)
┌──┐┌──┐               Both items rotated 90° clockwise
│  ││  │               Width  = h1 + gap + h2
│  ││  │               Height = max(w1, w2)
└──┘└──┘

RVV  (Rotated-Vertical-Vertical)
┌────────────┐          Both items rotated 90° clockwise
│   item1    │          Width  = max(h1, h2)
└────────────┘          Height = w1 + gap + w2
┌────────────┐
│   item2    │
└────────────┘

VRH  (Variable-Rotated-Hybrid — primary item only)
┌──┬────────────┐
│  │            │      Width  = Height = w + gap + h  (square)
│  │  item1     │      Uses only the primary item's geometry
└──┴────────────┘
```

For asymmetric pairs (e.g. pant front ≠ pant back), each item's own dimensions are used. For symmetric pairs, both slots use the same dimensions.

---

## API Reference

### `GridCalculator.getStackSizes(params)`

Calculates all five stack dimensions for a given pair.

**Parameters (`StackSizeParams`):**

| Field    | Type                      | Default  | Description                                      |
| -------- | ------------------------- | -------- | ------------------------------------------------ |
| `size`   | `DimensionObject`         | required | Primary item dimensions in inches                |
| `pair`   | `boolean`                 | `true`   | `false` = single item (no secondary)             |
| `gap`    | `number`                  | `0`      | Gap between the two items in inches              |
| `secDim` | `DimensionObject \| null` | `size`   | Secondary item dimensions (for asymmetric pairs) |

**Returns (`StackSizesResult`):** All five `StackSizes` plus a `recommended` key with the stack type that has the maximum width.

---

### `GridCalculator.getRowFitCount(params)`

Calculates how many stacks fit in one row within `CONFIG.PAPER_MAX_SIZE`.

**Formula:**

```
Find the largest N such that:
  (stackWidth × N) + (gap × (N-1)) ≤ paperMaxWidth
```

---

### `GridCalculator.getColsByStack(params)`

Given the number that fit per row (`fitRow`) and the total `quantity`, returns:

- `cols` — the number of rows needed for the full quantity
- `remainder` — items left over after filling complete rows

**Special case:** If `quantity ≤ fitRow`, returns `cols = 1, remainder = 0`.

---

### `GridCalculator.getLayoutInfo(params)`

Runs all five stack types through `getRowFitCount` and `getColsByStack`. Returns a `StackInfo` map with full layout data for every stack type.

**VRH special handling:**

- Capacity is `pair ? 2 : 4` items per VRH square.
- If `quantity < capacity`, VRH is marked as `fitRow = 0` and skipped in recommendations.

---

### `GridCalculator.getRecommendedStacks(params)`

The main entry point called by `GridLayoutGenerator`.

**Algorithm:**

1. Call `getLayoutInfo` for all five stack types.
2. Filter stack types by `stackOrientation` (`"vertical"` → HH/VV only; `"horizontal"` → RHH/RVV only).
3. For each valid main stack, pair it with each valid remainder stack.
4. Score each combination by total height.
5. Sort by `heightPreference` (`"Less"` = prefer shorter output).
6. Return the best combination plus all combinations for inspection.

**Returns (`RecommendedStacksResult`):**

| Field             | Description                               |
| ----------------- | ----------------------------------------- |
| `mainStack`       | Best stack type for the majority of items |
| `remainderStack`  | Stack type for leftover items             |
| `hasRemainder`    | Whether a remainder pass is needed        |
| `mainCols`        | Number of rows in the main pass           |
| `remainderCols`   | Number of rows in the remainder pass      |
| `mainFitRow`      | Items per row in the main pass            |
| `remainderFitRow` | Items per row in the remainder pass       |
| `requiredDocs`    | Documents needed and columns per document |
| `allCombinations` | All valid combinations (for debugging)    |

---

### `GridCalculator.requiredDocs(params)`

Splits a column count into documents when the total height would exceed the 210-inch Illustrator canvas limit.

**Formula:**

```
maxColsInDoc = floor(210 / (stackHeight + gap))
docsNeeded   = ceil(neededCols / maxColsInDoc)
```

---

## Document Count Example

Given:

- Item: 10 × 13.5 inches (long sleeve)
- Paper width: 63.25 inches
- Quantity: 40 items
- Gap: 0.1 inches
- Pair: true (front + back = HH width ≈ 20.1 inches)

```
HH stack width = 10 + 0.1 + 10 = 20.1 in
Fit per row    = floor(63.25 / 20.1) = 3 pairs
Rows needed    = ceil(40 / 3) = 14 rows
Stack height   = 13.5 in
Total height   = 14 × (13.5 + 0.1) = 204.4 in  → fits in one document
```

---

## Debugging

Open `src/debug/interactive tool/GridCalculatorDebugger.html` in any browser to interactively test all stack calculations with custom dimensions and quantities.

---

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## উদ্দেশ্য

`GridCalculator` একটি বিশুদ্ধ-গণিত ইউটিলিটি ক্লাস। এর কোনো সাইড ইফেক্ট নেই এবং এটি কখনো Illustrator DOM স্পর্শ করে না। এর একমাত্র দায়িত্ব হলো এই প্রশ্নের উত্তর দেওয়া:

> **"নির্দিষ্ট মাপের একটি গার্মেন্ট পেয়ার, একটি পেপার উইথ এবং মোট পরিমাণ দেওয়া থাকলে — সবচেয়ে কাগজ-সাশ্রয়ী সাজানোর পদ্ধতি কোনটি?"**

এটি `GridLayoutGenerator` দ্বারা যেকোনো আর্টওয়ার্ক ডুপ্লিকেট করার আগে কল হয়।

---

## পাঁচটি স্ট্যাক টাইপ

একটি "স্ট্যাক" হলো একটি নির্দিষ্ট ওরিয়েন্টেশনে একসাথে রাখা একটি গার্মেন্ট পেয়ারের মিলিত বাউন্ডিং বক্স। পাঁচটি ভিন্নতাই স্কোর করা হয়:

**HH** — পাশাপাশি, কোনো রোটেশন নেই
**VV** — উপর-নিচে, কোনো রোটেশন নেই
**RHH** — উভয় আইটেম ৯০° ঘোরানো, তারপর পাশাপাশি
**RVV** — উভয় আইটেম ৯০° ঘোরানো, তারপর উপর-নিচে
**VRH** — স্কোয়ার লেআউট (প্রস্থ = উচ্চতা = w + gap + h)

---

## API রেফারেন্স

### `getStackSizes(params)`

একটি পেয়ারের জন্য পাঁচটি স্ট্যাক ডাইমেনশন গণনা করে।

### `getRowFitCount(params)`

`CONFIG.PAPER_MAX_SIZE`-এর মধ্যে এক সারিতে কতটি স্ট্যাক ফিট হয় তা গণনা করে।

### `getColsByStack(params)`

প্রতি সারিতে ফিট সংখ্যা এবং মোট পরিমাণ দিয়ে প্রয়োজনীয় সারির সংখ্যা ও বাকি আইটেম গণনা করে।

### `getRecommendedStacks(params)`

`GridLayoutGenerator` দ্বারা কল করা মূল এন্ট্রি পয়েন্ট। সমস্ত স্ট্যাক টাইপ স্কোর করে এবং সর্বোত্তম মেইন + রিমেইন্ডার স্ট্যাক কম্বিনেশন রিটার্ন করে।

**অ্যালগরিদম:**

1. সব পাঁচটি স্ট্যাক টাইপের জন্য `getLayoutInfo` কল করে।
2. `stackOrientation` অনুযায়ী স্ট্যাক টাইপ ফিল্টার করে।
3. প্রতিটি মেইন স্ট্যাককে প্রতিটি রিমেইন্ডার স্ট্যাকের সাথে পেয়ার করে।
4. মোট উচ্চতা দিয়ে প্রতিটি কম্বিনেশন স্কোর করে।
5. `heightPreference` অনুযায়ী সর্ট করে।
6. সর্বোত্তম কম্বিনেশন রিটার্ন করে।

### `requiredDocs(params)`

মোট উচ্চতা Illustrator-এর ২১০ ইঞ্চি ক্যানভাস লিমিট অতিক্রম করলে কলাম সংখ্যাকে ডকুমেন্টে ভাগ করে।

---

## ডিবাগিং

যেকোনো ব্রাউজারে `src/debug/interactive tool/GridCalculatorDebugger.html` খুলুন কাস্টম ডাইমেনশন ও পরিমাণ দিয়ে ইন্টারেক্টিভলি সব স্ট্যাক ক্যালকুলেশন পরীক্ষা করতে।
