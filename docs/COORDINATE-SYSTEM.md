<div align="center">

# Illustrator Coordinate System — Developer Reference

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a name="english"></a>

# 🇺🇸 English

## Why This Matters

Adobe Illustrator uses **two different Y-axis directions** depending on which context you are working in. Getting this wrong causes objects to move in the opposite direction or land in the wrong position. Every transformation in JFT-Rapid must account for this.

---

## The Two Coordinate Systems

### System 1 — Illustrator UI (what you see on screen)

```
(0, 0) ── X increases → right
  │
  │  Y increases ↓ downward
  ▼
```

This is what you see in the Illustrator rulers and the Transform panel. The origin `(0, 0)` is at the **top-left** of the artboard. Positive Y moves **down**.

### System 2 — ExtendScript DOM (what the code sees)

```
  ▲
  │  Y increases ↑ upward
  │
(0, 0) ── X increases → right
```

When you read or write `pageItem.position`, `pageItem.translate()`, or `artboard.artboardRect`, the Y-axis is **inverted**. Positive Y moves **up**.

---

## Side-by-Side Comparison

| Operation                        | UI value | ExtendScript value                              |
| -------------------------------- | -------- | ----------------------------------------------- |
| Move object **down** 50 pt       | Y = +50  | `translate(0, -50)`                             |
| Move object **up** 50 pt         | Y = -50  | `translate(0, +50)`                             |
| Top of artboard                  | Y = 0    | Y = 0 (artboardRect[1])                         |
| Bottom of artboard (100 pt tall) | Y = 100  | Y = -100 (artboardRect[3])                      |
| `artboardRect` format            | —        | `[left, top, right, bottom]` where top > bottom |

---

## How JFT-Rapid Handles This

### `Utils.reverseCenterY(value)`

Used when converting a UI Y delta into an ExtendScript delta before calling `TransActionHandler.move()`.

```typescript
// Moving an object 50 pt down in UI terms:
const uiDelta = 50;
const scriptDelta = Utils.reverseCenterY(uiDelta); // → -50
transActionHandler.move({ x: 0, y: scriptDelta });
```

### `ArtboardManager.resize()` and `move()`

`ArtboardManager` stores position in UI coordinates (Y down) and converts internally before writing to `artboardRect`:

```typescript
// Internal conversion inside ArtboardManager:
const centerY = -this.position.y; // UI → ExtendScript
this.artboard.artboardRect = [
  centerX - width / 2, // left
  centerY + height / 2, // top    (larger number)
  centerX + width / 2, // right
  centerY - height / 2, // bottom (smaller number)
];
```

### `AlignmentHandler` — `engine` parameter

The `engine` parameter on alignment calls switches between coordinate modes:

| `engine` value | Y direction used    | When to use                                            |
| -------------- | ------------------- | ------------------------------------------------------ |
| `"script"`     | ExtendScript (Y up) | Standard `translate()` calls                           |
| `"action"`     | UI (Y down)         | `.aia` action-file transforms via `TransActionHandler` |

---

## `geometricBounds` vs `position`

Both give you object coordinates but behave differently:

| Property                   | Returns                      | Y direction                        |
| -------------------------- | ---------------------------- | ---------------------------------- |
| `pageItem.position`        | `[x, y]` of top-left corner  | ExtendScript (Y up)                |
| `pageItem.geometricBounds` | `[left, top, right, bottom]` | ExtendScript (Y up) — top > bottom |
| `pageItem.visibleBounds`   | Same as geometricBounds      | ExtendScript (Y up)                |

JFT-Rapid uses `geometricBounds` exclusively via `Utils.getObjectBounds()` which normalises the result into a `BoundsObject` with named fields (`left`, `top`, `right`, `bottom`).

---

## Quick Rule to Remember

> **If you are using `translate()`, `.position`, or `artboardRect` — negate Y.**
> **If you are building an `.aia` action file — use UI Y (do not negate).**

---

## External Reference

For a deeper dive into Illustrator's coordinate system, Adobe's official ExtendScript documentation covers this in the **Coordinate Systems** section of the Illustrator Scripting Guide:

📖 [Adobe Illustrator Scripting Guide (PDF)](https://helpx.adobe.com/pdf/illustrator_reference.pdf)

---

---

<a name="বাংলা"></a>

# 🇧🇩 বাংলা

## কেন এটি গুরুত্বপূর্ণ

Adobe Illustrator **দুটি ভিন্ন Y-অক্ষ দিকনির্দেশনা** ব্যবহার করে কাজের প্রসঙ্গ অনুযায়ী। এটি ভুল হলে অবজেক্ট উল্টো দিকে সরে যায় বা ভুল জায়গায় পড়ে। JFT-Rapid-এর প্রতিটি ট্রান্সফর্মেশনে এটি বিবেচনা করা হয়।

---

## দুটি কোঅর্ডিনেট সিস্টেম

### সিস্টেম ১ — Illustrator UI (স্ক্রিনে যা দেখেন)

```
(0, 0) ── X বাড়ে → ডানে
  │
  │  Y বাড়ে ↓ নিচে
  ▼
```

Illustrator-এর রুলার ও Transform প্যানেলে এটাই দেখা যায়। অরিজিন `(0, 0)` আর্টবোর্ডের **উপরের বাঁয়ে**। ধনাত্মক Y মানে **নিচে**।

### সিস্টেম ২ — ExtendScript DOM (কোড যা দেখে)

```
  ▲
  │  Y বাড়ে ↑ উপরে
  │
(0, 0) ── X বাড়ে → ডানে
```

`pageItem.position`, `pageItem.translate()`, বা `artboard.artboardRect` পড়বা বা লেখার সময় Y-অক্ষ **উল্টো** থাকে। ধনাত্মক Y মানে **উপরে**।

---

## পাশাপাশি তুলনা

| অপারেশন                       | UI মান  | ExtendScript মান           |
| ----------------------------- | ------- | -------------------------- |
| অবজেক্ট **নিচে** ৫০ pt সরানো  | Y = +50 | `translate(0, -50)`        |
| অবজেক্ট **উপরে** ৫০ pt সরানো  | Y = -50 | `translate(0, +50)`        |
| আর্টবোর্ডের উপর               | Y = 0   | Y = 0 (artboardRect[1])    |
| আর্টবোর্ডের নিচ (১০০ pt উঁচু) | Y = 100 | Y = -100 (artboardRect[3]) |

---

## JFT-Rapid কীভাবে এটি সামলায়

### `Utils.reverseCenterY(value)`

UI Y ডেল্টাকে ExtendScript ডেল্টায় রূপান্তর করতে ব্যবহৃত হয়:

```typescript
const uiDelta = 50;
const scriptDelta = Utils.reverseCenterY(uiDelta); // → -50
transActionHandler.move({ x: 0, y: scriptDelta });
```

### `ArtboardManager`

UI কোঅর্ডিনেটে (Y নিচে) পজিশন সংরক্ষণ করে, `artboardRect`-এ লেখার আগে ভেতরে কনভার্ট করে।

### `AlignmentHandler` — `engine` প্যারামিটার

| `engine` মান | Y দিক                 | কখন ব্যবহার                            |
| ------------ | --------------------- | -------------------------------------- |
| `"script"`   | ExtendScript (Y উপরে) | স্ট্যান্ডার্ড `translate()` কল         |
| `"action"`   | UI (Y নিচে)           | `TransActionHandler`-এর `.aia` অ্যাকশন |

---

## মনে রাখার সহজ নিয়ম

> **`translate()`, `.position`, বা `artboardRect` ব্যবহার করলে — Y নেগেট করুন।**
> **`.aia` অ্যাকশন ফাইল তৈরি করলে — UI Y ব্যবহার করুন (নেগেট করবেন না)।**

---

## বাইরের রেফারেন্স

Illustrator-এর কোঅর্ডিনেট সিস্টেম সম্পর্কে আরো জানতে Adobe-র অফিশিয়াল Scripting Guide দেখুন:

📖 [Adobe Illustrator Scripting Guide (PDF)](https://helpx.adobe.com/pdf/illustrator_reference.pdf)
