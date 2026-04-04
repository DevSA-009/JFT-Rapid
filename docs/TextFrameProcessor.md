<div align="center">

# TextFrameProcessor — Technical Reference

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Purpose

`TextFrameProcessor` handles all text-frame mutation for one placed grid item. It is constructed once per layout pass (when `stack` or `isPaired` changes) and called once per placed `GroupItem` as the grid loop runs.

Its responsibilities:

1. **Identify** which sub-groups inside the placed item carry the `_DYN_` marker.
2. **Match** each child `TextFrame` name against the front row of the player data queue.
3. **Inject** the player's name or number into the matching text frame.
4. **Correct** font size if the new content is much larger or smaller than the original.
5. **Advance** the FIFO data queue by the correct count for the active stack type.
6. **Post-process** rotated text frames with gradient expansion and optional arc warp.
7. **Outline** text frames when `CONFIG.OUTLINE_TEXT` is enabled.

---

## Constructor Parameters

| Field      | Type                        | Description                                                                |
| ---------- | --------------------------- | -------------------------------------------------------------------------- |
| `stack`    | `StackType`                 | Active stack type — controls axis selection and gradient expansion         |
| `isPaired` | `boolean`                   | Whether the current item is a paired set — affects VRH queue advance count |
| `isMixed`  | `boolean`                   | `true` when one item is dynamic and the other is static                    |
| `data`     | `SizeMarkerEntries \| null` | The garment-type-specific player data bucket, passed **by reference**      |

> **Important:** `data` is the exact bucket from `details.DATA[itemType]` — e.g. `details.DATA.SHORT_SLEEVE` for a short-sleeve pass. This guarantees the correct players appear on the correct garment piece.

---

## `process(placedItem)` — Main Entry Point

Called once for each placed `GroupItem` in the grid.

```
process(placedItem)
│
├─ Guard: placedItem must be a GroupItem
├─ Guard: data queue must be non-empty
├─ Reset modifiedTextFrames list
│
└─ for each subGroup in placedItem.pageItems:
    ├─ Skip non-GroupItems
    ├─ Skip if data queue is empty
    ├─ Check for _DYN_ marker in subGroup.name
    │
    ├─ [if isDynamic]
    │   ├─ processSubGroup(subGroup, subItemIndex)
    │   └─ advanceDataQueue()
    │
    └─ [after loop, if needsGradientExpansion && OUTLINE_TEXT]
        └─ expandAppearanceTextFrames()
```

---

## `processSubGroup(subGroup, subItemIndex)`

Iterates all `TextFrame` children of a dynamic sub-group:

```
for each child in subGroup.pageItems:
    ├─ Skip non-TextFrames
    ├─ Look up child.name in currentDataRow
    ├─ Skip if name not found in data row
    │
    ├─ 1. captureSize(textFrame)          → originalSize
    ├─ 2. textFrame.contents = value      → inject player text
    ├─ 3. adjustFontSize(...)             → correct font if needed
    ├─ 4. [if CONFIG.WRAP_TEXT] applyArcWarp
    └─ 5. [if willBeOutlined] textFrame.createOutline()
          else: push to modifiedTextFrames
```

---

## Font Correction (`adjustFontSize`)

After injecting new content the text frame may be wider or taller than expected. The correction decision table:

| Condition                                  | Action                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `new ≤ old + TEXT_MAX_GROW_INCH (1.35 in)` | No change — within acceptable growth                                        |
| `new > old + 1.35 in`                      | **Scale DOWN** to `old + TEXT_TARGET_GROW_INCH (1.0 in)`                    |
| `new ≥ old × TEXT_SHRINK_THRESHOLD (0.5)`  | No change — slight shrink is OK                                             |
| `new < old × 0.5`                          | **Scale UP** closing `TEXT_SHRINK_CLOSE_RATIO (0.35)` of the gap toward old |

The scale is applied via `textFrame.resize(widthPct, 100)` or `textFrame.resize(100, heightPct)` depending on which axis `resolveAxis()` selects.

---

## Axis Selection (`resolveAxis`)

Which dimension (width or height) is compared for font correction depends on the stack type:

| Stack              | Axis used                                                  |
| ------------------ | ---------------------------------------------------------- |
| `RHH` / `RVV`      | `"height"` — items are rotated 90° so width becomes height |
| `VRH`, even index  | `"width"`                                                  |
| `VRH`, odd index   | `"height"`                                                 |
| `HH`, `VV`, `NONE` | `"width"`                                                  |

---

## Data Queue Advancement (`advanceDataQueue`)

After processing one dynamic sub-group, the queue advances by calling `data.shift()`. The advance count depends on the stack type and pair status:

| Stack      | `isPaired` | Shifts per `process()` call |
| ---------- | ---------- | --------------------------- |
| `VRH`      | `true`     | 2                           |
| `VRH`      | `false`    | 4                           |
| All others | any        | 1                           |

### Mixed-Dynamic Deferral (`isMixed = true`)

When one JFT item is dynamic and the other is static, each dynamic sub-group represents only half of a logical player row. The shift is deferred:

- **Odd encounter** → mark as pending (`currentPassed = 2`), do NOT shift yet.
- **Even encounter** → commit the shift, reset `currentPassed = 1`.

This prevents consuming two rows from the queue when only one player's data was actually placed.

---

## Gradient Expansion (`expandAppearanceTextFrames`)

For rotated stacks (RHH, RVV, VRH), gradient fills on text frames need to be "expanded" (flattened to vectors) so they reflect the item's current rotation angle. This is done by:

1. Selecting all tracked `modifiedTextFrames`.
2. Executing `app.executeMenuCommand("expandStyle")`.
3. Optionally executing `"outline"` if `CONFIG.OUTLINE_TEXT` is true.

This step is skipped for HH and VV stacks.

---

## Why `data` Must Be the Right Bucket

Before the split-DATA refactor, a single flat array was shared across all garment types in the same size. This caused short-sleeve players to appear on long-sleeve artwork and vice versa.

Now, `TextFrameProcessor` receives only the bucket it needs:

```typescript
// In JFTGarmentPipeline.generateLayoutDoc():
const data = details.DATA[itemType as keyof SizeMarkerData];
// e.g. details.DATA.SHORT_SLEEVE for a short-sleeve pass
// e.g. details.DATA.LONG_SLEEVE  for a long-sleeve pass
```

Each bucket is consumed independently. The SHORT_SLEEVE processor never sees the LONG_SLEEVE player list.

---

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## উদ্দেশ্য

`TextFrameProcessor` একটি রাখা গ্রিড আইটেমের সব টেক্সট-ফ্রেম পরিবর্তন পরিচালনা করে। প্রতিটি লেআউট পাসে একবার কন্সট্রাক্ট হয় এবং গ্রিড লুপ চলার সময় প্রতিটি রাখা `GroupItem`-এর জন্য একবার কল হয়।

এর দায়িত্বসমূহ:

1. রাখা আইটেমের মধ্যে `_DYN_` মার্কারযুক্ত সাব-গ্রুপ **চিহ্নিত** করা।
2. প্রতিটি চাইল্ড `TextFrame`-এর নাম প্লেয়ার ডেটা কিউয়ের সামনের সারির সাথে **মেলানো**।
3. মিলে যাওয়া টেক্সট ফ্রেমে প্লেয়ারের নাম বা নম্বর **ইনজেক্ট** করা।
4. নতুন কন্টেন্ট মূল থেকে অনেক বড় বা ছোট হলে ফন্ট সাইজ **সংশোধন** করা।
5. সক্রিয় স্ট্যাক টাইপ অনুযায়ী সঠিক সংখ্যায় FIFO ডেটা কিউ **এগিয়ে নেওয়া**।
6. রোটেটেড টেক্সট ফ্রেমে গ্রেডিয়েন্ট এক্সপ্যানশন ও ঐচ্ছিক আর্ক ওয়ার্প **প্রয়োগ** করা।
7. `CONFIG.OUTLINE_TEXT` চালু থাকলে টেক্সট ফ্রেম **আউটলাইন** করা।

---

## কন্সট্রাক্টর প্যারামিটার

| ফিল্ড      | টাইপ                        | বর্ণনা                                                                         |
| ---------- | --------------------------- | ------------------------------------------------------------------------------ |
| `stack`    | `StackType`                 | সক্রিয় স্ট্যাক টাইপ — অক্ষ নির্বাচন ও গ্রেডিয়েন্ট এক্সপ্যানশন নিয়ন্ত্রণ করে |
| `isPaired` | `boolean`                   | বর্তমান আইটেম পেয়ারড কিনা — VRH কিউ অ্যাডভান্স কাউন্টকে প্রভাবিত করে          |
| `isMixed`  | `boolean`                   | একটি আইটেম ডায়নামিক ও অন্যটি স্ট্যাটিক হলে `true`                             |
| `data`     | `SizeMarkerEntries \| null` | **রেফারেন্স দ্বারা** পাস করা গার্মেন্ট-টাইপ-নির্দিষ্ট প্লেয়ার ডেটা বাকেট      |

---

## ফন্ট কারেকশন টেবিল

| শর্ত                     | ক্রিয়া                                                  |
| ------------------------ | -------------------------------------------------------- |
| `new ≤ old + ১.৩৫ ইঞ্চি` | কোনো পরিবর্তন নেই                                        |
| `new > old + ১.৩৫ ইঞ্চি` | স্কেল **ডাউন** করে `old + ১.০ ইঞ্চি`-তে নামায়           |
| `new ≥ old × ০.৫`        | কোনো পরিবর্তন নেই                                        |
| `new < old × ০.৫`        | স্কেল **আপ** করে পুরানো মাপের ০.৩৫ ভাগ পার্থক্য বন্ধ করে |

---

## ডেটা কিউ অ্যাডভান্সমেন্ট

| স্ট্যাক | `isPaired` | `process()` প্রতি শিফট |
| ------- | ---------- | ---------------------- |
| `VRH`   | `true`     | ২                      |
| `VRH`   | `false`    | ৪                      |
| বাকি সব | যেকোনো     | ১                      |

---

## কেন `data` সঠিক বাকেট হতে হবে

আগে একটি ফ্ল্যাট অ্যারে একই সাইজের সব গার্মেন্ট টাইপে শেয়ার হতো। এতে শর্ট-স্লিভের খেলোয়াড় লং-স্লিভের আর্টওয়ার্কে দেখা যেত এবং উল্টোটাও।

এখন `TextFrameProcessor` শুধু প্রয়োজনীয় বাকেট পায়:

- শর্ট-স্লিভ পাসে `details.DATA.SHORT_SLEEVE`
- লং-স্লিভ পাসে `details.DATA.LONG_SLEEVE`

প্রতিটি বাকেট স্বাধীনভাবে ব্যবহৃত হয়। SHORT_SLEEVE প্রসেসর কখনো LONG_SLEEVE প্লেয়ার লিস্ট দেখে না।
