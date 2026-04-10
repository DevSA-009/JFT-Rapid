<div align="center">

# GridLayoutGenerator — Technical Reference

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Purpose

`GridLayoutGenerator` is the main production engine. For a single garment-part type at a single size (or merged size range), it:

1. Duplicates the source artwork from the active layer.
2. Prepares a composed reference group via `ItemsInitiater`.
3. Tiles that group across one or more Illustrator documents in a grid.
4. Injects player text into each placed copy via `TextFrameProcessor`.
5. Saves each document as an EPS file.

One `GridLayoutGenerator` instance handles exactly one size's worth of one garment part. It is constructed and destroyed by `JFTGarmentPipeline.generateLayoutDoc()` in a loop.

---

## Full Constructor Pipeline

```
new GridLayoutGenerator(params)
│
├─ 1. Validate + store params
├─ 2. openTempDoc()  →  TEMP-<order> document created (e.g. TEMP-S_SLV)
├─ 3. Duplicate source artwork into temp doc (originals in main doc untouched)
├─ 4. Remove white-fill placeholder rectangles (unless skipStack)
├─ 5. Apply forcePair / NECK single-side special cases
│
├─ [LONG_SLV_TWEAK + non-dynamic path]
│   ├─ runLongSlvTweak() — compose sleeve unit, set skipStack + update qty
│   └─ falls through to skipStack path below
│
├─ [skipStack path]
│   ├─ ItemsInitiater(stack = "NONE")  → composedReferenceItem  (in temp doc)
│   ├─ processDynamicPass() → one EPS per qty
│   ├─ composedReferenceItem.remove()
│   ├─ closeTempDoc()
│   └─ RETURN
│
├─ [isFillRec path]
│   ├─ saveFillRecStrips()  →  resizes + saves EPS strip
│   ├─ closeTempDoc()
│   └─ RETURN
│
└─ [normal path]
    ├─ GridCalculator.getRecommendedStacks()  → stackRecommendation
    ├─ ItemsInitiater(stack = mainStack)       → composedReferenceItem (temp doc)
    ├─ mainLayoutPass()
    │   └─ for each document:
    │       ├─ createGrid() — duplicates items inside output EPS doc
    │       ├─ TextFrameProcessor.process() per placed item
    │       └─ IllustratorDocument.save() → EPS
    │
    ├─ composedReferenceItem.remove()
    │
    ├─ [if remainder]  — reuses same temp doc, no new temp doc opened
    │   ├─ ItemsInitiater(stack = remainderStack) → composedReferenceItem
    │   └─ remainderLayoutPass()
    │
    ├─ closeTempDoc()
    └─ RETURN
```

### Temp Doc Pattern

Every `GridLayoutGenerator` run creates one temporary Illustrator document named `TEMP-<order>` (e.g. `TEMP-S_SLV`, `TEMP-BODY`). All artwork duplication and composed reference groups live in this doc. When passes finish the temp doc is closed without saving, keeping the main artwork document clean.

- The **remainder pass reuses the same temp doc** — no second temp doc is opened.
- `closeTempDoc()` is called at every exit path including early returns.
- Surviving `composedReferenceItem` and unused `artworkItems` are removed before the close.

---

## Key State Fields

| Field                   | Type                              | Description                                         |
| ----------------------- | --------------------------------- | --------------------------------------------------- |
| `quantity`              | `number`                          | Remaining items to place; decremented across passes |
| `isPaired`              | `boolean`                         | Whether the two source items form a pair            |
| `isSingleItem`          | `boolean`                         | `true` when only one source item was found          |
| `composedReferenceItem` | `GroupItem \| null`               | The stacked reference group used for duplication    |
| `stackRecommendation`   | `RecommendedStacksResult \| null` | Full output of `GridCalculator`                     |
| `layoutPassTracker`     | `LayoutPassTracker`               | Mutable state for the active pass                   |
| `data`                  | `SizeMarkerEntries \| null`       | FIFO player queue for this garment-type + size      |
| `outputFileIndex`       | `number`                          | 1-based index for EPS output filenames              |

---

## Layout Pass Detail

Each layout pass (main or remainder) does the following:

```
createLayoutDoc(rows, cols, reqDocs)
│
└─ for docIndex in 0..docsNeeded:
    ├─ Create new Illustrator document (207×207 inch canvas)
    ├─ Copy composedReferenceItem into the new document
    │
    └─ createGrid(rows, cols, maxCol, doc, item)
        │
        └─ for col in 0..cols:
            └─ for row in 0..rows:
                ├─ Stop if placedQty >= targetQty
                ├─ Duplicate item
                ├─ AlignmentHandler.moveObjectAfter() → position in grid
                ├─ TextFrameProcessor.process(placedItem)  ← inject player data
                └─ placedQty++
```

---

## Filename Convention

Output EPS files follow this naming pattern:

```
{index}_{sizeTkn}_{brand}_{countType}_{qty}_{garmentPart}.eps

Examples:
  001_S-M_JFT_SET_10_S_SLV.eps      ← Sizes S+M merged, 10 sets, short sleeve
  002_L_JFT_PCS_3_BODY.eps           ← Size L, 3 pieces, body
  003_ALL_JFT_SET_40_L_SLV.eps       ← All sizes, 40 sets, long sleeve
```

---

## `resolveMixedEntries()`

Returns non-null when the `JFTItem` pair has one dynamic entry and one static entry. Used by `TextFrameProcessor` to apply deferred-shift logic — the data queue advances only every second dynamic sub-group, not every one.

---

## `modifyTextFramesInItem(placedItem)`

Delegates to `TextFrameProcessor.process()`. This is the bridge between the grid duplication loop and the text injection engine.

---

## Special Cases

### NECK Single-Side

If a NECK item has no pairable counterpart, `isPaired` is forced to `false` and `isSingleItem` is `true`. The item is laid out as a single (not mirrored).

### Low-Quantity Forced Pair

When `quantity < 3` and the item is naturally unpaired (`PCS` count type), `isPaired` is upgraded to `true` to avoid generating a single-item document.

**Fill-Rectangle Strip Path:** Creates a vertical strip (max 20").

- `pair = true` → dimensions are combined (add if secondary exists, else double)
- `fitRow` → items per row
- `rows = ceil(qty / fitRow)`
- `height = dimension.height × rows`
- if limit is exceeded → split into multiple documents (divider added)

---

### Fill-Wide (CMD) Mode — `CONFIG.FILL_X_AXIS`

When `CONFIG.FILL_X_AXIS = true`, non-dynamic items bypass the normal stack calculation. Instead, a single row is filled across the full paper width per document:

- `fitRow` = how many composed stacks fit horizontally within `PAPER_MAX_SIZE`.
- Each document holds `fitRow` side-by-side copies.
- Total documents = `ceil(qty / fitRow)`.
- Filename uses `N CMD` suffix (e.g. `3 CMD` for 3 docs).
- Remainder items (when `qty % fitRow > 0`) get their own document using only the leftover count.
- Dynamic items are **not** affected — they fall through to the normal grid path so text injection works correctly.

### Long-Sleeve Tweak — `CONFIG.LONG_SLV_TWEAK`

> ⚠️ **Known issue — recommended to keep disabled (`false`) in production until resolved.**
>
> The transformation sequence (resize → rotate → shift) produces inconsistent visual results depending on the source sleeve dimensions. The sleeve unit composition itself works correctly, but the resulting layout may misalign in certain dimension combinations.

When `CONFIG.LONG_SLV_TWEAK = true` and the item is `LONG_SLEEVE` and **non-dynamic**:

1. Both sleeve pieces are duplicated and resized to `primaryDimension`.
2. Item 2 is placed to the right of item 1, rotated 180°, then shifted left by a width-proportional offset.
3. Both pieces are tilted −7.5° and re-aligned vertically.
4. A fine-tune horizontal shift is applied to set the final gap.
5. Both pieces are grouped into one "full sleeve unit".
6. `fitRow` is calculated for the unit width.
7. If `fitRow < 2` — unit is too wide; tweak is aborted and normal layout continues.
8. If `fitRow >= 2` — `skipStack = true`, `quantity = ceil(qty / fitRow)`, `artworkItems = [unit, unit_copy]`. The skipStack path then handles document creation.

**Single-item support:** When only one sleeve item exists in the layer, a duplicate is created automatically to form the pair.

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## উদ্দেশ্য

`GridLayoutGenerator` হলো মূল প্রোডাকশন ইঞ্জিন। একটি নির্দিষ্ট গার্মেন্ট পার্ট টাইপের একটি সাইজের জন্য এটি:

1. অ্যাক্টিভ লেয়ার থেকে সোর্স আর্টওয়ার্ক ডুপ্লিকেট করে।
2. `ItemsInitiater` মাধ্যমে একটি কম্পোজড রেফারেন্স গ্রুপ তৈরি করে।
3. সেই গ্রুপকে এক বা একাধিক Illustrator ডকুমেন্টে গ্রিডে টাইল করে।
4. `TextFrameProcessor` মাধ্যমে প্রতিটি রাখা কপিতে প্লেয়ার টেক্সট ইনজেক্ট করে।
5. প্রতিটি ডকুমেন্ট EPS ফাইল হিসেবে সেভ করে।

---

## মূল কন্সট্রাক্টর পাইপলাইন (সংক্ষেপে)

1. প্যারামস ভ্যালিডেট ও স্টোর করা
2. অ্যাক্টিভ লেয়ার থেকে সোর্স আর্টওয়ার্ক ডুপ্লিকেট করা
3. হোয়াইট-ফিল প্লেসহোল্ডার রেক্টাঙ্গেল সরানো
4. `forcePair` ও বিশেষ কেস প্রয়োগ করা
5. `GridCalculator.getRecommendedStacks()` থেকে স্ট্যাক সুপারিশ পাওয়া
6. `ItemsInitiater` দিয়ে রেফারেন্স গ্রুপ তৈরি করা
7. মেইন লেআউট পাস: গ্রিড তৈরি + প্লেয়ার ডেটা ইনজেক্ট + EPS সেভ
8. রিমেইন্ডার পাস (যদি থাকে)

---

## ফাইলনাম কনভেনশন

```
{index}_{sizeTkn}_{brand}_{countType}_{qty}_{garmentPart}.eps

উদাহরণ:
  001_S-M_JFT_SET_10_S_SLV.eps   ← S+M সাইজ মার্জ, ১০ সেট, শর্ট স্লিভ
  002_L_JFT_PCS_3_BODY.eps        ← L সাইজ, ৩ পিস, বডি
```

---

## বিশেষ কেস

**NECK সিঙ্গেল-সাইড:** NECK আইটেমের কোনো পেয়ার না থাকলে সিঙ্গেল লেআউটে প্রসেস হয়।

**লো-কোয়ান্টিটি ফোর্স পেয়ার:** পরিমাণ ৩-এর কম হলে আনপেয়ার্ড আইটেম স্বয়ংক্রিয়ভাবে পেয়ারড হয়।

**ফিল-রেক্টাঙ্গেল স্ট্রিপ পাথ:** ২০ ইঞ্চি পর্যন্ত ভার্টিক্যাল স্ট্রিপ তৈরি হয়।

- `pair = true` → dimension combine হয় (secondary থাকলে যোগ, না থাকলে দ্বিগুণ)
- `fitRow` → প্রতি রোতে আইটেম সংখ্যা
- `rows = ceil(qty / fitRow)`
- `height = dimension.height × rows`
- limit ছাড়ালে → একাধিক ডকুমেন্টে ভাগ হয় (divider যোগ হয়)

**টেম্প ডক প্যাটার্ন:** প্রতিটি `GridLayoutGenerator` রান-এ `TEMP-<order>` নামে একটি অস্থায়ী Illustrator ডকুমেন্ট তৈরি হয়। সব আর্টওয়ার্ক ডুপ্লিকেট এবং কম্পোজড রেফারেন্স গ্রুপ এই ডকে থাকে। সব পাস শেষে ডকটি সেভ ছাড়াই বন্ধ হয়।

**ফিল-ওয়াইড (CMD) মোড — `CONFIG.FILL_X_AXIS`:**
`true` হলে non-dynamic আইটেম পেপার জুড়ে এক সারিতে সাজানো হয়। প্রতিটি ডকুমেন্টে `fitRow` টি কপি পাশাপাশি থাকে। মোট ডকুমেন্ট = `ceil(qty / fitRow)`। ফাইলনামে `N CMD` থাকে। Dynamic আইটেম এই পাথ bypass করে স্বাভাবিক গ্রিড পাথে যায়।

**লং-স্লিভ টুইক — `CONFIG.LONG_SLV_TWEAK`:**

> ⚠️ **পরিচিত সমস্যা — প্রোডাকশনে `false` রাখার পরামর্শ দেওয়া হচ্ছে যতক্ষণ না সমাধান হয়।**
>
> ট্রান্সফর্মেশন সিকোয়েন্স (resize → rotate → shift) সোর্স স্লিভ ডাইমেনশন ভেদে অসামঞ্জস্যপূর্ণ ফলাফল দেয়।

`true` এবং আইটেম `LONG_SLEEVE` এবং non-dynamic হলে: উভয় স্লিভ পিস রিসাইজ, ঘুরানো এবং কম্পোজ করে একটি "full sleeve unit" তৈরি হয়। `fitRow < 2` হলে টুইক বাতিল হয়। `fitRow >= 2` হলে `skipStack = true` এবং `quantity = ceil(qty / fitRow)` আপডেট হয়।
