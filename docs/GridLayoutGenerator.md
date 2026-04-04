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
├─ 2. Duplicate source artwork from active layer
├─ 3. Remove white-fill placeholder rectangles (unless skipStack)
├─ 4. Apply forcePair / NECK single-side special cases
│
├─ [skipStack path]
│   ├─ ItemsInitiater(stack = "NONE")  → composedReferenceItem
│   ├─ createGrid(rows=1, cols=quantity)
│   └─ RETURN
│
├─ 5. [fixedSize + isFillRec path]  → fillRecStripLayout()
│
└─ 6. [normal path]
    ├─ GridCalculator.getRecommendedStacks()  → stackRecommendation
    ├─ ItemsInitiater(stack = mainStack)       → composedReferenceItem
    ├─ mainLayoutPass()
    │   ├─ createLayoutDoc(rows, cols, reqDocs)
    │   └─ for each document:
    │       ├─ createGrid(rows, cols, maxCol, doc, item)
    │       ├─ TextFrameProcessor.process() per placed item
    │       └─ IllustratorDocument.save() → EPS
    │
    └─ [if remainder]
        ├─ ItemsInitiater(stack = remainderStack) → composedReferenceItem
        └─ remainderLayoutPass()
            └─ (same as main pass)
```

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

### Fill-Rectangle Strip Path

When `jftItem.info.fixedSize && jftItem.items[x].isFillRec`, the item is a plain colored rectangle. Instead of the normal grid, a vertical strip document is generated up to `FILL_REC_STRIP_HEIGHT_INCH` (20 inches) tall.

---

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

**ফিল-রেক্টাঙ্গেল স্ট্রিপ পাথ:** সাদা রেক্টাঙ্গেল আইটেমের জন্য ২০ ইঞ্চি পর্যন্ত ভার্টিক্যাল স্ট্রিপ ডকুমেন্ট তৈরি হয়।
