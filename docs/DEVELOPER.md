<div align="center">

# JFT-Rapid — Developer Documentation

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Overview

This document is for contributors and developers who want to understand, modify, or extend the JFT-Rapid codebase. It covers the project architecture, build system, data flow, class responsibilities, and contribution guidelines.

---

## Tech Stack

| Layer            | Technology                          | Notes                                                 |
| ---------------- | ----------------------------------- | ----------------------------------------------------- |
| Core logic       | **TypeScript → ExtendScript (JSX)** | Compiled to ES5, `noLib: true`                        |
| Panel UI         | **HTML / CSS / JavaScript**         | Runs inside Illustrator via CEP                       |
| CEP Bridge       | **CSInterface.js**                  | Adobe standard library for panel↔script communication |
| ScriptUI dialogs | **Plain JavaScript**                | Native Illustrator dialog windows                     |
| Build            | **TypeScript Compiler (`tsc`)**     | Outputs single `HOST/jft_rapid.jsx` bundle            |
| Config           | **JSON (`jft.conf`)**               | External, editable brand/size config                  |

---

## Project Structure

```
JFT-Rapid/
│
├── CLIENT/                        ← CEP Panel (runs in browser context inside Illustrator)
│   ├── index.html                 ← Panel layout and button definitions
│   ├── main.js                    ← Button handlers; calls csInterface.evalScript()
│   ├── style.css                  ← Panel styling
│   └── CSInterface.js             ← Adobe CEP SDK (do not modify)
│
├── src/
│   ├── index.ts                   ← Entry point: loads config, bootstraps the pipeline
│   │
│   ├── class/                     ← All core business logic
│   │   ├── JFTProcessSequentially.ts   ← Top-level orchestrator + static-mode parser
│   │   ├── JFTItemResolver.ts          ← Scans active AI layer → builds JFTItem cache
│   │   ├── JFTGarmentPipeline.ts       ← 5-stage pipeline driver
│   │   ├── GridLayoutGenerator.ts      ← Per-size grid duplication engine
│   │   ├── GridCalculator.ts           ← Stack geometry & paper-fit mathematics
│   │   ├── ItemsInitiater.ts           ← Resize + stack + group preparation
│   │   ├── TextFrameProcessor.ts       ← Player name/number injection + font correction
│   │   ├── AlignmentHandler.ts         ← Object alignment utilities
│   │   ├── TransActionHandler.ts       ← .aia action-based transforms (masked items)
│   │   ├── ArtboardManager.ts          ← Artboard resize / reposition
│   │   ├── IllustratorDocHandler.ts    ← Document create / save / close
│   │   ├── GroupManager.ts             ← Group / ungroup with z-order preservation
│   │   ├── Organizer.ts               ← High-level layer and selection utilities
│   │   ├── JSONFileHandler.ts          ← File I/O for JSON config files
│   │   └── Utils.ts                   ← Geometry, unit conversion, deep copy, helpers
│   │
│   ├── enum/
│   │   └── enums.ts                   ← All enums, constants, and test data payloads
│   │
│   ├── types/
│   │   ├── custom.d.ts                ← All project-specific type definitions
│   │   ├── es6_extend.d.ts            ← Type declarations for ES6 polyfills
│   │   └── scripts-constants.d.ts     ← Global constant declarations
│   │
│   ├── polyfill/
│   │   ├── es6_extend.ts              ← Array.from, Object.assign, etc. for ES3
│   │   └── json2.js                   ← JSON.parse / JSON.stringify polyfill (JSONSA)
│   │
│   └── scriptUI/
│       ├── automateInfoDialog.js      ← Full player-data input dialog (Normal Mode)
│       ├── staticModeDialog.js        ← Size-quantity input dialog (Static Mode)
│       ├── inputDialog.js             ← Generic single-input dialog
│       ├── progressbarWindow.js       ← Progress bar window
│       └── alertUI.js                 ← Custom alert dialog
│
├── docs/                          ← Developer and feature documentation (this folder)
│   ├── DEVELOPER.md               ← This file
│   ├── GridLayoutGenerator.md     ← Deep-dive: grid layout engine
│   ├── DATA-FORMAT.md             ← Deep dive: Formatting dump data into structured & JSON exports
│   ├── STATIC-MODE.md             ← Deep dive: Static mode syntax, value types, and order flow
│   ├── BUILD.md                   ← Deep dive: Distributing ZXP packages and easy installation using npm
│   ├── INSTALLATION.md            ← Deep dive: Beginner-friendly guide to installing without issues
│   ├── COORDINATE-SYSTEM.md       ← Deep dive: Illustrator UI and ExtendScript Y-axis calculation system
│   ├── GridCalculator.md          ← Deep-dive: stack geometry math
│   └── TextFrameProcessor.md      ← Deep-dive: text injection pipeline
│
├── .debug                         ← Allowed adobe live debug
├── jft.conf                       ← JSON config: brand, paper size, garment dimensions
├── tsconfig.json                  ← TypeScript compiler config
└── README.md                      ← Project overview (bilingual)
```

---

## Build System

**TypeScript → single JSX bundle**

```bash
# Install TypeScript globally (one time)
npm install -g typescript

# Compile the project
tsc
# Output: HOST/jft_rapid.jsx
```

Key `tsconfig.json` settings:

| Option           | Value                | Reason                                                            |
| ---------------- | -------------------- | ----------------------------------------------------------------- |
| `target`         | `ES5`                | ExtendScript runtime is ES3/ES5                                   |
| `noLib`          | `true`               | No TypeScript standard library — ExtendScript has its own globals |
| `outFile`        | `HOST/jft_rapid.jsx` | All files compiled into one bundle                                |
| `removeComments` | `true`               | Keeps the output file smaller                                     |
| `allowJs`        | `true`               | ScriptUI dialogs and polyfills are plain JS                       |

The compiler concatenates all included files in `tsconfig.json` `include` order. This order matters — enums and types must come before the classes that use them.

---

## Data Flow

```
CEP Panel (index.html + main.js)
    │
    │  csInterface.evalScript("automateInfoDialog()")
    │
    ▼
ScriptUI Dialog (automateInfoDialog.js / staticModeDialog.js)
    │  Collects order data from the user
    │
    ▼
JFTProcessSequentially(data)
    │
    ├─ Step 1: Parse/validate AutomateData
    │
    ├─ Step 2: JFTItemResolver.getItems()
    │          Scans active AI layer → name-token matching (_BODY_, _S_SLV_, ...)
    │          Returns: JFTItemCache (keyed by PairObjectMarkers enum key)
    │
    └─ Step 3: new JFTGarmentPipeline({ data, jftItemsCache })
               │
               ├─ Stage 1: collarFlowHandle()    → NECK or PLACKET + COLLAR
               ├─ Stage 2: ribFlowHandler()       → SHORT_SLEEVE_RIB, LONG_SLEEVE_RIB
               ├─ Stage 3: sleeveFlowHandle()     → SHORT_SLEEVE, LONG_SLEEVE
               ├─ Stage 4: bodyFlowHandle()       → BODY
               └─ Stage 5: pantFlowHandle()       → SHORT_PANT, LONG_PANT
                           │
                           └─ generateLayoutDoc(itemType, orientation, sizeRanges)
                                      │
                                      ├─ handleSizeRange() — merge adjacent sizes
                                      │
                                      └─ for each size:
                                           new GridLayoutGenerator({
                                             quantity,
                                             primaryDimension,
                                             data: details.DATA[itemType],  ← typed bucket
                                             jftItem,
                                             ...
                                           })
                                                  │
                                                  ├─ GridCalculator.getRecommendedStacks()
                                                  ├─ ItemsInitiater(items, stack, dimension)
                                                  ├─ createGrid() — duplicate n-up
                                                  ├─ TextFrameProcessor.process()
                                                  └─ IllustratorDocument.save() → EPS
```

---

## Key Concepts

### Item Naming Convention

Artwork layers in Illustrator must follow this naming pattern:

```
<any text>_<MARKER>_<optional flags>

Examples:
  jersey_body_FRONT_BODY_DYN_     ← Body piece, front side, dynamic
  sleeve_L_SLV_BACK_              ← Long sleeve, back side
  collar_CLR_                     ← Collar piece
```

**Marker tokens** (from `PairObjectMarkers` enum):

| Token         | Garment Part     |
| ------------- | ---------------- |
| `_BODY_`      | Jersey body      |
| `_S_SLV_`     | Short sleeve     |
| `_L_SLV_`     | Long sleeve      |
| `_NCK_`       | Neck (T-shirt)   |
| `_CLR_`       | Collar (Polo)    |
| `_PLK_`       | Placket (Polo)   |
| `_S_PANT_`    | Short pant       |
| `_L_PANT_`    | Long pant        |
| `_S_SLV_RIB_` | Short sleeve rib |
| `_L_SLV_RIB_` | Long sleeve rib  |

**Behavior tokens:**

| Token    | Meaning                                       |
| -------- | --------------------------------------------- |
| `_DYN_`  | Item receives player name/number injection    |
| `_PAIR_` | Force-pairs a mixed dynamic+static set        |
| `_SKP_`  | Item is placed but skipped for text injection |

**Direction tokens** (control front/back ordering):

| Token     | Meaning                    |
| --------- | -------------------------- |
| `_FRONT_` | Front face — placed first  |
| `_BACK_`  | Back face — placed second  |
| `_LEFT_`  | Left side — placed first   |
| `_RIGHT_` | Right side — placed second |

---

### Stack Types

The layout engine arranges each garment pair into a "stack" before tiling across the paper. Five stacks are evaluated:

| Stack  | Description                                  | Best for                      |
| ------ | -------------------------------------------- | ----------------------------- |
| `HH`   | Side-by-side, no rotation                    | Wide items                    |
| `VV`   | Stacked vertically, no rotation              | Tall items                    |
| `RHH`  | Both rotated 90°, then side-by-side          | Items that fit better rotated |
| `RVV`  | Both rotated 90°, then stacked vertically    | Items that fit better rotated |
| `VRH`  | Square layout (width = width + gap + height) | Items close to square         |
| `NONE` | No arrangement — group as-is                 | Special cases                 |

`GridCalculator` scores every stack and recommends the one that maximises how many pairs fit per row within `CONFIG.PAPER_MAX_SIZE`.

---

### Player Data Routing — `SLEEVE` and `PANT` fields

`DATA` is a single flat array for each size. Each player entry carries optional routing fields that tell the pipeline which garment piece that player belongs to:

```typescript
// DATA is always a flat array:
details.DATA = [
  { NAME: "PLAYER 01", NUMBER: "01", SLEEVE: "SHORT", PANT: "SHORT" },
  { NAME: "PLAYER 02", NUMBER: "02", SLEEVE: "SHORT", PANT: "SHORT" },
  { NAME: "PLAYER 03", NUMBER: "03", SLEEVE: "LONG", PANT: "LONG" },
  { NAME: "PLAYER 04", NUMBER: "04" }, // no routing — goes to BODY and all non-routed passes
];
```

When `generateLayoutDoc` runs for a specific garment type, it calls `filterAndStripData(details.DATA, itemType)` which:

1. **Filters** — keeps only rows matching the current pass (e.g. `SLEEVE: "SHORT"` for a short-sleeve pass; rows with no `SLEEVE` key also pass through)
2. **Strips** — removes `SLEEVE` and `PANT` from every kept row so `GridLayoutGenerator` always receives clean `{ NAME, NUMBER }` objects

```typescript
// What GridLayoutGenerator receives after filter+strip:
[
  { NAME: "PLAYER 01", NUMBER: "01" },
  { NAME: "PLAYER 02", NUMBER: "02" },
];
```

`BODY`, `COLLAR`, `NECK`, `PLACKET`, and rib passes receive all rows unfiltered (no routing key applies to them).

---

### `jft.conf` Configuration File

The config file drives all garment dimensions. Structure:

```json
{
  "config": {
    "brand": "JFT",
    "paperMaxWidth": 63.5
  },
  "sizes": {
    "JFT": {
      "S": {
        "BODY":        { "width": 12.5, "height": 16 },
        "SHORT_SLEEVE": { "width": 10.5, "height": 5.5 },
        "LONG_SLEEVE":  { "width": 10.0, "height": 13.5 },
        ...
      }
    }
  }
}
```

All dimensions are in **inches**. To add a new brand, add a new key alongside `"JFT"` in `sizes`.

---

## Adding a New Feature

### Adding a new pipeline stage

1. Add your new garment-part marker to `PairObjectMarkers` in `enums.ts`.
2. Add the corresponding key to `SizeMarkerData` in `custom.d.ts`.
3. Add the corresponding key to `FlatSummary` in `custom.d.ts` if it needs a quantity count.
4. Add dimensions for every size to `jft.conf`.
5. Write a new private `xxxFlowHandle()` method in `JFTGarmentPipeline.ts`.
6. Call it from `run()` in the correct order.

### Adding a new stack type

1. Add the new stack key to the `StackType` union in `custom.d.ts`.
2. Add its geometry calculation to `GridCalculator.getStackSizes()`.
3. Add it to `stackTypesTuple` in `enums.ts`.
4. Handle it in `ItemsInitiater` (the method named after the stack key).

### Toggling Fill-Wide and Long-Sleeve Tweak

Both features are controlled by `CONFIG` flags and default to `false`:

```typescript
CONFIG.FILL_X_AXIS = true; // enable CMD fill-wide mode for non-dynamic items
CONFIG.LONG_SLV_TWEAK = true; // enable full-sleeve tweak for LONG_SLEEVE items
```

`FILL_X_AXIS` is safe to enable in production. `LONG_SLV_TWEAK` has a known visual inconsistency bug and should remain `false` until resolved — see `docs/GridLayoutGenerator.md` for details.

---

## Coding Standards

- **Language:** English only inside all code files (comments, identifiers, strings).
- **Docs:** TSDoc on every public and protected method, property, interface, and type.
- **Comments:** Inline comments on every non-obvious statement.
- **DRY:** Extract repeated logic into private helpers; avoid copy-pasting.
- **Immutability:** Mark constructor-set fields `readonly`. Never mutate `this.data`.
- **Error messages:** Clear, specific, include the method name: `"methodName: reason."`.
- **No `any`:** Use proper types. If a type is unknown, narrow it with a guard.
- **ES3 safe:** No `for...of` on non-arrays, no template literals in output code (polyfilled), no `const`/`let` at top level (use `var` in compiled output — TypeScript handles this).

---

## Running Tests

There is currently no automated test runner. Testing is done by:

1. Opening `src/debug/interactive tool/GridCalculatorDebugger.html` in a browser to visually test stack geometry calculations.
2. Running the script inside Illustrator with the `test` payload in `enums.ts` to verify the full pipeline.

If you add new features, please update the `test` payload in `enums.ts` to cover your case.

---

## Installation & Setup

Before contributing, make sure the extension is installed and running correctly. See the **[Installation Guide](INSTALLATION.md)** for full instructions.

The critical step for development is enabling unsigned extensions — without it the panel will not load. Jump directly to: [Enable Unsigned Extensions](INSTALLATION.md#step-4--enable-unsigned-extensions-first-time-only).

## Coordinate System

JFT-Rapid manipulates Illustrator objects programmatically. Illustrator uses **two different Y-axis directions** depending on context (UI vs ExtendScript DOM), and getting this wrong causes objects to move in the wrong direction.

Before writing any code that touches `translate()`, `position`, `artboardRect`, or `TransActionHandler`, read the **[Coordinate System Reference](COORDINATE-SYSTEM.md)**.

---

## Build & Distribution

To package the extension as a signed `.zxp` and install it into the Adobe CEP folder, see the **[Build & Install Guide](BUILD.md)**.

It covers: signing certificate setup, `npm run build_zxp`, `npm run install_zxp`, and the required project folder structure.

---

## Contribution Guidelines

1. **Fork** the repository and create a feature branch: `git checkout -b feature/my-feature`
2. Follow the **Coding Standards** above.
3. **Do not break** existing functionality — test with the sample `.ai` file in `src/debug/resources/`.
4. Update or add **TSDoc** for any method you modify.
5. Update this documentation if your change affects architecture or data flow.
6. Submit a **pull request** with a clear description of what you changed and why.

---

## Contact

For questions, bugs, or feature requests, open an issue on GitHub or contact **[DevSA-009](https://github.com/DevSA-009)**.

---

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## ওভারভিউ

এই ডকুমেন্টটি সেসব কন্ট্রিবিউটর ও ডেভেলপারদের জন্য যারা JFT-Rapid কোডবেস বুঝতে, পরিবর্তন করতে বা এক্সটেন্ড করতে চান। এখানে প্রজেক্ট আর্কিটেকচার, বিল্ড সিস্টেম, ডেটা ফ্লো, ক্লাসের দায়িত্ব এবং কন্ট্রিবিউশন গাইডলাইন আলোচনা করা হয়েছে।

---

## টেক স্ট্যাক

| স্তর             | প্রযুক্তি                           | নোট                                                       |
| ---------------- | ----------------------------------- | --------------------------------------------------------- |
| কোর লজিক         | **TypeScript → ExtendScript (JSX)** | ES5-এ কম্পাইল, `noLib: true`                              |
| প্যানেল UI       | **HTML / CSS / JavaScript**         | CEP মাধ্যমে Illustrator-এর ভেতরে রান হয়                  |
| CEP ব্রিজ        | **CSInterface.js**                  | প্যানেল↔স্ক্রিপ্ট যোগাযোগের Adobe স্ট্যান্ডার্ড লাইব্রেরি |
| ScriptUI ডায়ালগ | **প্লেইন JavaScript**               | নেটিভ Illustrator ডায়ালগ উইন্ডো                          |
| বিল্ড            | **TypeScript Compiler (`tsc`)**     | একটি `HOST/jft_rapid.jsx` বান্ডেলে আউটপুট দেয়            |
| কনফিগ            | **JSON (`jft.conf`)**               | এক্সটার্নাল, এডিটযোগ্য ব্র্যান্ড/সাইজ কনফিগ               |

---

## প্রজেক্ট স্ট্রাকচার

ইংরেজি সেকশনের প্রজেক্ট স্ট্রাকচার দেখুন — ফোল্ডার ও ফাইলের নাম একই থাকে।

---

## বিল্ড সিস্টেম

**TypeScript → একক JSX বান্ডেল**

```bash
# TypeScript গ্লোবালি ইনস্টল করুন (একবারই করতে হবে)
npm install -g typescript

# প্রজেক্ট কম্পাইল করুন
tsc
# আউটপুট: HOST/jft_rapid.jsx
```

গুরুত্বপূর্ণ `tsconfig.json` সেটিং:

| অপশন             | মান                  | কারণ                                                                        |
| ---------------- | -------------------- | --------------------------------------------------------------------------- |
| `target`         | `ES5`                | ExtendScript রানটাইম ES3/ES5                                                |
| `noLib`          | `true`               | TypeScript স্ট্যান্ডার্ড লাইব্রেরি নেই — ExtendScript-এর নিজস্ব গ্লোবাল আছে |
| `outFile`        | `HOST/jft_rapid.jsx` | সব ফাইল একটি বান্ডেলে কম্পাইল হয়                                           |
| `removeComments` | `true`               | আউটপুট ফাইল ছোট রাখে                                                        |
| `allowJs`        | `true`               | ScriptUI ডায়ালগ এবং পলিফিল প্লেইন JS                                       |

---

## ডেটা ফ্লো

ইংরেজি সেকশনের বিস্তারিত ডেটা ফ্লো ডায়াগ্রাম দেখুন।

সংক্ষেপে:

1. **CEP প্যানেল** → ব্যবহারকারীর বাটন ক্লিক
2. **ScriptUI ডায়ালগ** → অর্ডার ডেটা সংগ্রহ
3. **JFTProcessSequentially** → ডেটা পার্স + লেয়ার স্ক্যান
4. **JFTGarmentPipeline** → ৫-স্তরের পাইপলাইন (কলার → রিব → স্লিভ → বডি → প্যান্ট)
5. **GridLayoutGenerator** → প্রতিটি সাইজের জন্য গ্রিড তৈরি
6. **TextFrameProcessor** → প্লেয়ার নাম/নম্বর ইনজেকশন
7. **IllustratorDocument** → EPS ফাইল সেভ

---

## মূল ধারণাসমূহ

### আইটেম নামকরণ কনভেনশন

Illustrator লেয়ারের আর্টওয়ার্ক আইটেমের নাম অবশ্যই এই প্যাটার্ন অনুসরণ করতে হবে:

```
<যেকোনো টেক্সট>_<MARKER>_<ঐচ্ছিক ফ্ল্যাগ>

উদাহরণ:
  jersey_body_FRONT_BODY_DYN_     ← বডি পিস, সামনের দিক, ডায়নামিক
  sleeve_L_SLV_BACK_              ← লং স্লিভ, পিছনের দিক
  collar_CLR_                     ← কলার পিস
```

**মার্কার টোকেন** (`PairObjectMarkers` এনাম থেকে):

| টোকেন      | গার্মেন্ট পার্ট |
| ---------- | --------------- |
| `_BODY_`   | জার্সি বডি      |
| `_S_SLV_`  | শর্ট স্লিভ      |
| `_L_SLV_`  | লং স্লিভ        |
| `_NCK_`    | নেক (টি-শার্ট)  |
| `_CLR_`    | কলার (পোলো)     |
| `_PLK_`    | প্লাকেট (পোলো)  |
| `_S_PANT_` | শর্ট প্যান্ট    |
| `_L_PANT_` | লং প্যান্ট      |

**বিহেভিয়ার টোকেন:**

| টোকেন    | অর্থ                                                |
| -------- | --------------------------------------------------- |
| `_DYN_`  | আইটেমটি প্লেয়ার নাম/নম্বর ইনজেকশন পাবে             |
| `_PAIR_` | মিক্সড ডায়নামিক+স্ট্যাটিক সেট ফোর্স-পেয়ার করে     |
| `_SKP_`  | আইটেম প্লেস হবে কিন্তু টেক্সট ইনজেকশন থেকে বাদ যাবে |

---

### প্লেয়ার ডেটা রাউটিং — `SLEEVE` এবং `PANT` ফিল্ড

প্রতিটি সাইজের `DATA` একটি ফ্ল্যাট অ্যারে। প্রতিটি প্লেয়ার এন্ট্রিতে ঐচ্ছিক রাউটিং ফিল্ড থাকতে পারে যা পাইপলাইনকে বলে কোন গার্মেন্ট পিসে এই প্লেয়ার যাবে:

```typescript
details.DATA = [
  { NAME: "PLAYER 01", NUMBER: "01", SLEEVE: "SHORT", PANT: "SHORT" },
  { NAME: "PLAYER 02", NUMBER: "02", SLEEVE: "LONG", PANT: "LONG" },
  { NAME: "PLAYER 03", NUMBER: "03" }, // কোনো রাউটিং নেই — BODY-তে যাবে
];
```

`generateLayoutDoc` প্রতিটি গার্মেন্ট টাইপের জন্য `filterAndStripData(details.DATA, itemType)` কল করে যা:

1. **ফিল্টার** করে — শুধু সেই রো রাখে যা বর্তমান পাসের সাথে মেলে
2. **স্ট্রিপ** করে — `SLEEVE` ও `PANT` ফিল্ড সরিয়ে `GridLayoutGenerator`-কে শুধু `{ NAME, NUMBER }` পাঠায়

---

## নতুন ফিচার যোগ করা

### নতুন পাইপলাইন স্টেজ যোগ করা

1. `enums.ts`-এ `PairObjectMarkers`-এ নতুন গার্মেন্ট পার্ট মার্কার যোগ করুন।
2. `custom.d.ts`-এ `SizeMarkerData`-এ সংশ্লিষ্ট কী যোগ করুন।
3. পরিমাণ গণনা দরকার হলে `custom.d.ts`-এ `FlatSummary`-তেও যোগ করুন।
4. `jft.conf`-এ প্রতিটি সাইজের ডাইমেনশন যোগ করুন।
5. `JFTGarmentPipeline.ts`-এ একটি নতুন প্রাইভেট `xxxFlowHandle()` মেথড লিখুন।
6. সঠিক ক্রমে `run()`-এ কল করুন।

### FILL_X_AXIS এবং LONG_SLV_TWEAK টগল করা

উভয় ফিচার `CONFIG` ফ্ল্যাগ দিয়ে নিয়ন্ত্রিত, ডিফল্ট `false`:

`FILL_X_AXIS` প্রোডাকশনে নিরাপদে চালু করা যায়। `LONG_SLV_TWEAK`-এ পরিচিত ভিজ্যুয়াল বাগ আছে — সমাধান না হওয়া পর্যন্ত `false` রাখুন।

---

## কোডিং স্ট্যান্ডার্ড

- **ভাষা:** সব কোড ফাইলের ভেতরে শুধুমাত্র ইংরেজি (কমেন্ট, আইডেন্টিফায়ার, স্ট্রিং)।
- **ডকস:** প্রতিটি পাবলিক/প্রটেক্টেড মেথড, প্রপার্টি, ইন্টারফেস এবং টাইপে TSDoc।
- **কমেন্ট:** প্রতিটি অ-স্পষ্ট স্টেটমেন্টে ইনলাইন কমেন্ট।
- **DRY:** বারবার ব্যবহৃত লজিক প্রাইভেট হেল্পারে নিয়ে যান।
- **ইমিউটেবিলিটি:** কন্সট্রাক্টরে সেট হওয়া ফিল্ড `readonly` করুন।
- **এরর মেসেজ:** স্পষ্ট, নির্দিষ্ট, মেথডের নামসহ।

---

## ইনস্টলেশন ও সেটআপ

কন্ট্রিবিউট করার আগে এক্সটেনশন সঠিকভাবে ইনস্টল ও রান হচ্ছে কিনা নিশ্চিত করুন। সম্পূর্ণ নির্দেশিকার জন্য: **[ইনস্টলেশন গাইড](INSTALLATION.md)**।

ডেভেলপমেন্টের জন্য সবচেয়ে গুরুত্বপূর্ণ ধাপ হলো আনসাইনড এক্সটেনশন চালু করা — এটি ছাড়া প্যানেল লোড হবে না। সরাসরি যান: [Unsigned Extension চালু করুন](INSTALLATION.md#ধাপ-৪--unsigned-extension-চালু-করুন-প্রথমবার-শুধু)।

## কোঅর্ডিনেট সিস্টেম

JFT-Rapid প্রোগ্রামেটিকভাবে Illustrator অবজেক্ট পরিচালনা করে। Illustrator প্রসঙ্গ অনুযায়ী **দুটি ভিন্ন Y-অক্ষ দিক** ব্যবহার করে — এটি ভুল হলে অবজেক্ট ভুল দিকে সরে যায়।

`translate()`, `position`, `artboardRect`, বা `TransActionHandler` স্পর্শ করে এমন যেকোনো কোড লেখার আগে পড়ুন: **[Coordinate System Reference](COORDINATE-SYSTEM.md)**।

---

## বিল্ড ও ডিস্ট্রিবিউশন

এক্সটেনশনটি সাইনড `.zxp` হিসেবে প্যাকেজ করে Adobe CEP ফোল্ডারে ইনস্টল করতে দেখুন: **[Build & Install Guide](BUILD.md)**।

সার্টিফিকেট সেটআপ, `npm run build_zxp`, `npm run install_zxp` এবং প্রজেক্ট ফোল্ডার স্ট্রাকচার সেখানে বিস্তারিত আছে।

---

## কন্ট্রিবিউশন গাইডলাইন

1. রিপোজিটরি **ফর্ক** করুন এবং ফিচার ব্রাঞ্চ তৈরি করুন: `git checkout -b feature/my-feature`
2. উপরের **কোডিং স্ট্যান্ডার্ড** অনুসরণ করুন।
3. `src/debug/resources/`-এর স্যাম্পল `.ai` ফাইল দিয়ে টেস্ট করুন।
4. পরিবর্তিত যেকোনো মেথডে **TSDoc** আপডেট বা যোগ করুন।
5. স্পষ্ট বর্ণনাসহ **পুল রিকোয়েস্ট** সাবমিট করুন।

---

## যোগাযোগ

প্রশ্ন, বাগ বা ফিচার রিকোয়েস্টের জন্য GitHub-এ ইস্যু খুলুন বা **[DevSA-009](https://github.com/DevSA-009)**-এর সাথে যোগাযোগ করুন।
