<div align="center">

# 🎨 JFT Rapid Script

> ⚠️ **Deprecated Notice**
>
> This version of JFT Rapid Script is **no longer actively maintained**.
> Please use the latest **2.0 version** for new features, improvements, and bug fixes.
>
> 👉 [🚀 Go to JFT Rapid Script v2.0](https://github.com/DevSA-009/JFT-Rapid)

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Navigation

[Overview](#overview) · [Features](#features) · [Installation](#installation) · [Markers](#markers) · [Data Format](#data-format) · [Workflow](#workflow) · [Configuration](#configuration) · [Limitations](#limitations)

---

<div align="center">

[![Download Latest Release](https://img.shields.io/badge/⬇%20Download%20Release-v1.0-blue?style=for-the-badge)](../../releases/latest)

</div>

---

<a id="overview"></a>

## Overview

JFT Rapid Script automates jersey layout for Adobe Illustrator — arranging front, back, and pant components across printing paper and applying player names, numbers, and other text automatically.

**Platform:** Windows · **Units:** Inches only · **CEP:** Required

---

<a id="features"></a>

## Features

### Layout Modes

| Mode | Description |
|------|-------------|
| **B** *(default)* | Front and Back processed separately — saved in different files |
| **FB** | Front and Back processed together — saved in one file |
| **PANT** | Pant items only (single size) |

### Orientation Options

| Option | Description |
|--------|-------------|
| **Auto** *(recommended)* | Picks the orientation that uses the least paper |
| **V** | Vertical layout |
| **H** | Horizontal with 90° rotation |
| **L** | L-shaped: Front vertical, Back horizontal — then both copied, rotated 180° to form a cube with empty center |

### Text Automation

- Text frames are matched by **name** to data property names.
- `NAME`, `NO`, or any custom field — if the frame name matches, the value is applied.
- **`SIZE_TKN`** — special frame inside body groups that receives the selected size (e.g. `M`, `L`, `2XL`).
- Optional text outline after injection.

### Other

- Configurable max columns per document and item gap.
- Opacity mask support via pre-recorded actions: `OM-SA` (mask only) or `OMI-SA` (mask + invert).
- Marker system for identifying object roles before processing.

---

<a id="installation"></a>

## Installation

### Enable Debug Mode (one-time)

1. Press `Win + R`, type `regedit`, press **Enter**.
2. Navigate to `HKEY_CURRENT_USER\Software\Adobe\CSXS\Version`.
3. Create a new **String Value** → Name: `PlayerDebugMode` → Value: `1`.

### Place the Extension

Copy the `com.jftrapid.cep` folder to one of:

```
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.jftrapid.cep\
C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep\
```

Required structure inside the folder:

```
com.jftrapid.cep/
├── CLIENT/
│   ├── CSInterface.js
│   ├── index.html
│   ├── main.js
│   └── style.css
├── CSXS/
│   └── manifest.xml
├── HOST/
│   └── script.js
└── jft.conf
```

Restart Adobe Illustrator after placing the folder.

---

<a id="markers"></a>

## Markers

Objects must be marked before processing so the script can identify their role. Select an object, then click the corresponding marker button in the panel.

| Marker | Purpose |
|--------|---------|
| **FRONT** | Marks the front-body artwork |
| **BACK** | Marks the back-body artwork |
| **PANT** | Marks the full pant artwork (front + back combined as a single grouped item) |
| **PANT_F_L** | Pant front left |
| **PANT_F_R** | Pant front right |
| **PANT_B_L** | Pant back left |
| **PANT_B_R** | Pant back right |

### PANT Marker Rules

- Each pant part must be marked individually using the correct marker.
- If using a combined pant layout, use `PANT` marker on the grouped artwork.
- For detailed control (recommended), use:
  - `PANT_F_L`, `PANT_F_R`, `PANT_B_L`, `PANT_B_R`

### Pant Text Handling (Important)

- Text frames (e.g., pant numbers) must be:
  - Inside the pant group OR
  - At the top level of the pant group

Do NOT place text inside deeply nested groups — the script will not detect it.

### Pant Text Scaling

- Pant text size is automatically adjusted based on:
  - `PANT_F_L` (Pant Front Left) dimension

This part acts as the reference for scaling all pant text.

> **Tip:** `SIZE_TKN` is a required text frame for both Front and Back artwork.
>
> - The text frame name must be exactly `SIZE_TKN`.
> - It must be placed at the **top level inside the body group** (not inside nested groups).
> - This frame will automatically receive the selected size (e.g., `M`, `L`, `2XL`).

### Opacity Mask Markers (Important)

Some artwork uses transparency clipping paths. Since Illustrator ExtendScript cannot reliably process transparency clip paths directly, they must be handled using pre-recorded actions.

| Marker | Purpose |
|--------|--------|
| **OM-SA** | Apply Opacity Mask (non-inverted) |
| **OMI-SA** | Apply Opacity Mask with Invert enabled |

### How It Works

- When a group is marked with `OM-SA` or `OMI-SA`, the script detects the group name.
- During layout processing, if this marker is found, the engine automatically runs the corresponding pre-recorded action.
- These actions must already exist inside the JFT Rapid Script CEP setup.

### Workflow Requirement

1. Select artwork that requires transparency clipping.
2. Group the elements properly before marking.
3. Apply:
   - `OM-SA` → normal opacity mask action
   - `OMI-SA` → opacity mask + invert enabled
4. Ensure the required pre-recorded actions exist in Illustrator:
   - `OM-SA` action
   - `OMI-SA` action

⚠️ Without pre-recorded actions, masking will not work.

---

<a id="data-format"></a>

## Data Format (Automatic Layout)

### Format Guide

Open the local tool to validate and preview your data:
👉 Open Data Formatter `format-data.html`

### Syntax

Each player is one line:

```
SIZE---NAME---NO---SLEEVE---PANT
```

| Field | Required | Values |
|-------|----------|--------|
| `SIZE` | ✅ | `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL` `2` `4` `6` `8` `10` `12` `14` `16` |
| `NAME` | ✅ | Player name (any text) |
| `NO` | ✅ | Jersey number |
| `SLEEVE` | ✅ | `FULL` or `HALF` |
| `PANT` | ✅ | `SHORT` `LONG` or `NO` |

**Rules:**
- One player per line. Blank lines between size groups are ignored.
- Field order is fixed — do not rearrange.
- Values are case-insensitive.
- Missing `NAME` or `NO` — leave field blank but keep the `---` separators.

### Sample Data

```
S---PLAYER 01---01---HALF---NO
S---PLAYER 02---02---FULL---NO
S---PLAYER 03---03---HALF---SHORT

M---PLAYER 04---04---FULL---NO
M---PLAYER 05---05---HALF---NO

L---PLAYER 06---06---FULL---LONG
L---PLAYER 07---07---HALF---NO
```

### JSON Format (legacy)

The older version also accepted minified JSON directly in the data field:

```json
{
  "S": [{"NAME": "PLAYER 01", "NO": "01"}],
  "M": [{"NAME": "PLAYER 02", "NO": "02"}],
  "L": []
}
```

Each size key maps to an array of player objects. Text frame names must match the property keys exactly.

---

### Preparing Unstructured Data with AI

If your data comes from a chat, spreadsheet, or handwritten list, use an AI to reformat it. **ChatGPT is recommended.**

#### AI Prompt — Basic Version

```
format each in one line with --- as separator

(NOTE 1) if line has serial order number then skip it.

(NOTE 2) if any line found after separator (full | long | full slv | long slv | full sleeve | long sleeve) case-insensitive then remove the word and at the end of founded line add another word "FULL" after separator. if any or anyone not found any slv type then make all is HALF.

(NOTE 3) add at the end of founded line add another word "PANT". default value is "NO". until mentioned about which item should pant or not.

(NOTE 4) always format data as structure order [SIZE,NAME,NO,SLV,PANT].

(NOTE 5) If any field (NAME, NO) is missing, leave it empty but keep separators.

[PASTE YOUR RAW DATA BELOW THIS LINE]
```

#### AI Prompt — Improved Version

```
You are a data formatter. Convert the raw garment order data below into structured lines.

OUTPUT FORMAT — one player per line, fields separated by ---:
SIZE---NAME---NO---SLEEVE---PANT

RULES:
1. Skip any line that starts with a serial/order number (e.g. "1.", "2.", "#1").
2. SLEEVE field:
   - If the line contains any of these words (case-insensitive): "full", "long", "full slv", "long slv", "full sleeve", "long sleeve" — remove that word from the name and set SLEEVE = FULL.
   - If none of those words are found for a player, set SLEEVE = HALF.
3. PANT field: Default = NO. Only change to SHORT or LONG if the source data explicitly mentions pant type for that player or group.
4. Output column order must always be: SIZE---NAME---NO---SLEEVE---PANT
5. If NAME or NO is missing from the source, leave that field empty but keep the --- separators.
   Example of missing number: M---JOHN DOE------HALF---NO
6. OUTPUT ONLY the formatted lines. No explanations, no headers, no extra text.

[PASTE YOUR RAW DATA BELOW THIS LINE]
```

---

<a id="workflow"></a>

## Workflow

1. Mark objects using marker buttons in the panel.
2. Set up `SIZE_TKN` text frame inside body groups.
3. Configure opacity mask groups if needed (`OM-SA` or `OMI-SA`).
4. Select layout mode (B / FB / PANT) and orientation (Auto / V / H / L).
5. Choose Size Container (company) and Target Size.
6. For automatic mode: paste formatted player data.
7. For manual mode: input quantity.
8. Run the process.

---

<a id="configuration"></a>

## Configuration

`jft.conf` in the extension folder stores size containers and paper size settings. Edit with any text editor.

```javascript
// To change max paper size at runtime:
CONFIG.PAPER_MAX_SIZE = 63.25; // inches
```

Default: **63.25"**

---

<a id="limitations"></a>

## Known Limitations

| Item | Detail |
|------|--------|
| Units | Inches only |
| PANT mode | Single size only |
| Masked items | Already-masked items cannot be transformed (ExtendScript limitation) |

---

<div align="center">

**Version:** 1.0 · **Platform:** Windows · **Requires:** Adobe Illustrator with CEP

Made with ❤️ for Jersey Designers

</div>

---

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

> ⚠️ **ডিপ্রিকেটেড নোটিশ**
>
> JFT Rapid Script এর এই ভার্সনটি এখন আর আপডেট করা হয় না।
> নতুন ফিচার, উন্নতি এবং বাগ ফিক্সের জন্য অনুগ্রহ করে সর্বশেষ **2.0 ভার্সন** ব্যবহার করুন।
>
> 👉 [🚀 JFT Rapid Script v2.0 এ যান](https://github.com/DevSA-009/JFT-Rapid)

## নেভিগেশন

[সংক্ষিপ্ত বিবরণ](#সংক্ষিপ্ত-বিবরণ) · [ফিচারসমূহ](#ফিচারসমূহ) · [ইনস্টলেশন](#ইনস্টলেশন) · [মার্কার](#মার্কার) · [ডেটা ফরম্যাট](#ডেটা-ফরম্যাট) · [ওয়ার্কফ্লো](#ওয়ার্কফ্লো) · [কনফিগারেশন](#কনফিগারেশন) · [সীমাবদ্ধতা](#সীমাবদ্ধতা)

---

<div align="center">

[![সর্বশেষ রিলিজ ডাউনলোড করুন](https://img.shields.io/badge/⬇%20রিলিজ%20ডাউনলোড-v1.0-blue?style=for-the-badge)](../../releases/latest)

</div>

---

<a id="সংক্ষিপ্ত-বিবরণ"></a>

## সংক্ষিপ্ত বিবরণ

JFT Rapid Script Adobe Illustrator-এ জার্সি লেআউট স্বয়ংক্রিয় করে — প্রিন্টিং পেপারে ফ্রন্ট, ব্যাক এবং প্যান্ট পার্ট সাজায় এবং প্লেয়ারের নাম, নম্বর ও অন্যান্য টেক্সট স্বয়ংক্রিয়ভাবে প্রয়োগ করে।

**প্ল্যাটফর্ম:** Windows · **একক:** শুধু ইঞ্চি · **CEP:** প্রয়োজন

---

<a id="ফিচারসমূহ"></a>

## ফিচারসমূহ

### লেআউট মোড

| মোড | বিবরণ |
|-----|-------|
| **B** *(ডিফল্ট)* | ফ্রন্ট ও ব্যাক আলাদাভাবে প্রসেস — আলাদা ফাইলে সেভ |
| **FB** | ফ্রন্ট ও ব্যাক একসাথে প্রসেস — একটি ফাইলে সেভ |
| **PANT** | শুধু প্যান্ট আইটেম (একটি সাইজ) |

### অরিয়েন্টেশন

| অপশন | বিবরণ |
|------|-------|
| **Auto** *(প্রস্তাবিত)* | সবচেয়ে কম পেপার ব্যবহার করে এমন অরিয়েন্টেশন বেছে নেয় |
| **V** | ভার্টিক্যাল লেআউট |
| **H** | ৯০° ঘোরানো হরিজন্টাল লেআউট |
| **L** | L-আকৃতি: ফ্রন্ট ভার্টিক্যাল, ব্যাক হরিজন্টাল — তারপর ১৮০° ঘুরিয়ে কপি করা হয় |

### টেক্সট অটোমেশন

- টেক্সট ফ্রেম **নাম** দিয়ে ডেটা প্রপার্টির সাথে মেলানো হয়।
- `NAME`, `NO` বা যেকোনো কাস্টম ফিল্ড — ফ্রেমের নাম মিললে মান প্রয়োগ হয়।
- **`SIZE_TKN`** — বডি গ্রুপের ভেতরে বিশেষ ফ্রেম যেটি নির্বাচিত সাইজ পায় (যেমন `M`, `L`, `2XL`)।

---

<a id="ইনস্টলেশন"></a>

## ইনস্টলেশন

### ডিবাগ মোড চালু করুন (একবার)

1. `Win + R` চাপুন, `regedit` লিখুন, **Enter** চাপুন।
2. `HKEY_CURRENT_USER\Software\Adobe\CSXS\Version`-এ যান।
3. নতুন **String Value** তৈরি করুন → নাম: `PlayerDebugMode` → মান: `1`।

### এক্সটেনশন রাখুন

`com.jftrapid.cep` ফোল্ডারটি এর যেকোনো একটিতে কপি করুন:

```
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.jftrapid.cep\
C:\Users\<আপনার নাম>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep\
```

ইনস্টলের পরে Adobe Illustrator রিস্টার্ট করুন।

---

<a id="মার্কার"></a>

## মার্কার

প্রসেস করার আগে অবজেক্টগুলোকে মার্ক করতে হবে যাতে স্ক্রিপ্ট তাদের ভূমিকা চিনতে পারে। অবজেক্ট সিলেক্ট করুন, তারপর প্যানেলে সংশ্লিষ্ট মার্কার বাটনে ক্লিক করুন।

| মার্কার | উদ্দেশ্য |
|--------|---------|
| **FRONT** | ফ্রন্ট-বডি আর্টওয়ার্ক চিহ্নিত করে |
| **BACK** | ব্যাক-বডি আর্টওয়ার্ক চিহ্নিত করে |
| **PANT** | সম্পূর্ণ প্যান্ট (ফ্রন্ট + ব্যাক একসাথে একটি গ্রুপ) |
| **PANT_F_L** | প্যান্ট ফ্রন্ট বাম |
| **PANT_F_R** | প্যান্ট ফ্রন্ট ডান |
| **PANT_B_L** | প্যান্ট ব্যাক বাম |
| **PANT_B_R** | প্যান্ট ব্যাক ডান |

### PANT মার্কার নিয়ম

- প্রতিটি প্যান্ট অংশ আলাদাভাবে সঠিক মার্কার দিয়ে সেট করতে হবে।
- যদি একটি গ্রুপে পুরো প্যান্ট থাকে, তাহলে `PANT` ব্যবহার করা যাবে।
- বিস্তারিত কন্ট্রোলের জন্য ব্যবহার করুন:
  - `PANT_F_L`, `PANT_F_R`, `PANT_B_L`, `PANT_B_R`

### প্যান্ট টেক্সট ব্যবস্থাপনা (গুরুত্বপূর্ণ)

- টেক্সট ফ্রেম (যেমন নাম্বার) থাকতে হবে:
  - প্যান্ট গ্রুপের ভিতরে অথবা
  - প্যান্ট গ্রুপের টপ-লেভেলে

গভীর nested group এর ভিতরে রাখবেন না — স্ক্রিপ্ট টেক্সট খুঁজে পাবে না।

### প্যান্ট টেক্সট সাইজ

- প্যান্ট টেক্সট সাইজ নির্ভর করে:
  - `PANT_F_L` (প্যান্ট ফ্রন্ট বাম) এর ডাইমেনশন

এটি সব প্যান্ট টেক্সট স্কেল করার রেফারেন্স হিসেবে কাজ করে।

> **টিপস:** `SIZE_TKN` ফ্রন্ট এবং ব্যাক উভয় আর্টওয়ার্কের জন্য বাধ্যতামূলক একটি টেক্সট ফ্রেম।
>
> - টেক্সট ফ্রেমের নাম অবশ্যই `SIZE_TKN` হতে হবে।
> - এটি বডি গ্রুপের **টপ-লেভেলে থাকতে হবে** (nested গ্রুপের ভিতরে নয়)।
> - এই ফ্রেমে স্বয়ংক্রিয়ভাবে নির্বাচিত সাইজ (যেমন `M`, `L`, `2XL`) বসবে।

### Opacity Mask মার্কার (গুরুত্বপূর্ণ)

কিছু ডিজাইনে transparency / clipping path ব্যবহার করা হয়। ExtendScript সরাসরি Illustrator-এর transparency clipping path ঠিকভাবে handle করতে পারে না। তাই pre-recorded action ব্যবহার করা আবশ্যক।

| মার্কার | কাজ |
|--------|------|
| **OM-SA** | সাধারণ Opacity Mask প্রয়োগ করবে |
| **OMI-SA** | Opacity Mask + Invert সক্রিয় করবে |

### এটি কীভাবে কাজ করে

- যেসব গ্রুপে `OM-SA` বা `OMI-SA` মার্ক করা থাকবে, স্ক্রিপ্ট তা detect করবে।
- লেআউট প্রসেস চলাকালীন এই মার্কার পেলে স্বয়ংক্রিয়ভাবে pre-recorded action চালানো হবে।

### প্রয়োজনীয় সেটআপ

1. transparency/clip থাকা অবজেক্টগুলো আগে গ্রুপ করুন।
2. সঠিকভাবে মার্কার দিন:
   - `OM-SA` → সাধারণ mask
   - `OMI-SA` → invert mask
3. Illustrator-এ pre-recorded action থাকতে হবে:
   - `OM-SA`
   - `OMI-SA`

⚠️ action না থাকলে mask কাজ করবে না।

---

<a id="ডেটা-ফরম্যাট"></a>

## ডেটা ফরম্যাট (অটোমেটিক লেআউট)

### ফরম্যাট গাইড

ডেটা ভ্যালিডেট ও প্রিভিউ করতে লোকাল টুল খুলুন:
👉 ডেটা ফরম্যাটার খুলুন `format-data.html`

### সিনট্যাক্স

প্রতিটি প্লেয়ার একটি লাইনে:

```
SIZE---NAME---NO---SLEEVE---PANT
```

| ফিল্ড | আবশ্যক | বৈধ মান |
|-------|--------|---------|
| `SIZE` | ✅ | `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL` `2` `4` `6` `8` `10` `12` `14` `16` |
| `NAME` | ✅ | প্লেয়ারের নাম |
| `NO` | ✅ | জার্সি নম্বর |
| `SLEEVE` | ✅ | `FULL` বা `HALF` |
| `PANT` | ✅ | `SHORT` `LONG` বা `NO` |

### স্যাম্পল ডেটা

```
S---PLAYER 01---01---HALF---NO
S---PLAYER 02---02---FULL---NO
M---PLAYER 03---03---HALF---SHORT
M---PLAYER 04---04---FULL---NO
```

### অগোছালো ডেটার জন্য AI ব্যবহার

চ্যাট, স্প্রেডশিট বা হাতে লেখা তালিকা থেকে ডেটা রিফরম্যাট করতে AI ব্যবহার করুন। **ChatGPT প্রস্তাবিত।**

#### AI প্রম্পট — বেসিক ভার্সন

```
format each in one line with --- as separator

(NOTE 1) if line has serial order number then skip it.

(NOTE 2) if any line found after separator (full | long | full slv | long slv | full sleeve | long sleeve) case-insensitive then remove the word and at the end of founded line add another word "FULL" after separator. if any or anyone not found any slv type then make all is HALF.

(NOTE 3) add at the end of founded line add another word "PANT". default value is "NO". until mentioned about which item should pant or not.

(NOTE 4) always format data as structure order [SIZE,NAME,NO,SLV,PANT].

(NOTE 5) If any field (NAME, NO) is missing, leave it empty but keep separators.

[এখানে আপনার কাঁচা ডেটা পেস্ট করুন]
```

#### AI প্রম্পট — উন্নত ভার্সন

```
You are a data formatter. Convert the raw garment order data below into structured lines.

OUTPUT FORMAT — one player per line, fields separated by ---:
SIZE---NAME---NO---SLEEVE---PANT

RULES:
1. Skip any line that starts with a serial/order number (e.g. "1.", "2.", "#1").
2. SLEEVE field:
   - If the line contains any of these words (case-insensitive): "full", "long", "full slv", "long slv", "full sleeve", "long sleeve" — remove that word from the name and set SLEEVE = FULL.
   - If none of those words are found for a player, set SLEEVE = HALF.
3. PANT field: Default = NO. Only change to SHORT or LONG if the source data explicitly mentions it.
4. Output column order must always be: SIZE---NAME---NO---SLEEVE---PANT
5. If NAME or NO is missing, leave that field empty but keep the --- separators.
6. OUTPUT ONLY the formatted lines. No explanations, no headers, no extra text.

[এখানে আপনার কাঁচা ডেটা পেস্ট করুন]
```

---

<a id="ওয়ার্কফ্লো"></a>

## ওয়ার্কফ্লো

1. প্যানেলের মার্কার বাটন দিয়ে অবজেক্ট মার্ক করুন।
2. বডি গ্রুপের ভেতরে `SIZE_TKN` টেক্সট ফ্রেম সেটআপ করুন।
3. প্রয়োজনে অপাসিটি মাস্ক গ্রুপ কনফিগার করুন (`OM-SA` বা `OMI-SA`)।
4. লেআউট মোড (B / FB / PANT) ও অরিয়েন্টেশন (Auto / V / H / L) বেছে নিন।
5. Size Container (কোম্পানি) ও Target Size বেছে নিন।
6. অটোমেটিক মোডে: ফরম্যাট করা প্লেয়ার ডেটা পেস্ট করুন।
7. ম্যানুয়াল মোডে: পরিমাণ ইনপুট দিন।
8. প্রসেস চালু করুন।

---

<a id="কনফিগারেশন"></a>

## কনফিগারেশন

এক্সটেনশন ফোল্ডারের `jft.conf` ফাইলে সাইজ কন্টেইনার ও পেপার সাইজ সেটিংস সংরক্ষিত। যেকোনো টেক্সট এডিটরে এডিট করা যাবে।

ডিফল্ট সর্বোচ্চ পেপার সাইজ: **৬৩.২৫"**

---

<a id="সীমাবদ্ধতা"></a>

## পরিচিত সীমাবদ্ধতা

| বিষয় | বিবরণ |
|------|-------|
| একক | শুধু ইঞ্চি |
| PANT মোড | একটি সাইজ সাপোর্ট |
| মাস্কড আইটেম | ইতিমধ্যে মাস্কড আইটেম ট্রান্সফর্ম করা যায় না (ExtendScript সীমাবদ্ধতা) |

---

<div align="center">

**ভার্সন:** ১.০ · **প্ল্যাটফর্ম:** Windows · **প্রয়োজন:** Adobe Illustrator with CEP

জার্সি ডিজাইনারদের জন্য ❤️ দিয়ে তৈরি

</div>