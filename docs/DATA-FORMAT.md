<div align="center">

# JFT-Rapid — Data Format Guide

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Overview

JFT-Rapid accepts player order data in two formats:

| Format                                                        | Mode           | Used when                                         |
| ------------------------------------------------------------- | -------------- | ------------------------------------------------- |
| **Order Text** (`SIZE---NAME---NUMBER---SLEEVE---RIB---PANT`) | Normal (NA/NO) | You have a list of players with names and numbers |
| **Static String** (`M=10,L=8,2XL=3`)                          | Static / Grid  | You only need quantity per size, no player names  |

This guide covers both formats and how to prepare your data correctly.

---

## Format 1 — Order Text (Normal Mode)

### Syntax

Each player is one line in this exact order:

```
SIZE---NAME---NUMBER---SLEEVE---RIB---PANT
```

| Field    | Required | Valid Values                                                                      | Description                   |
| -------- | -------- | --------------------------------------------------------------------------------- | ----------------------------- |
| `SIZE`   | ✅       | `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL` `2` `4` `6` `8` `10` `12` `14` `16` | Garment size                  |
| `NAME`   | ✅       | Any text                                                                          | Player's name                 |
| `NUMBER` | ✅       | Any text                                                                          | Jersey number                 |
| `SLEEVE` | ✅       | `SHORT` or `LONG`                                                                 | Sleeve length for this player |
| `RIB`    | ✅       | `RIB` `CUFF` or `NO`                                                              | Rib/cuff type                 |
| `PANT`   | ✅       | `SHORT` or `LONG`                                                                 | Pant length for this player   |

> **Separator:** Three hyphens `---` between every field. No spaces around them.

### Rules

- One player per line.
- Blank lines between size groups are **allowed** and recommended for readability — they are ignored by the parser.
- Field order is **fixed** — do not rearrange.
- Values are **case-insensitive** — `short`, `SHORT`, and `Short` all work.
- Adult sizes: `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL`
- Kids sizes: `2` `4` `6` `8` `10` `12` `14` `16`

---

### Sample Data

This is real test data from the script. Copy it to test your setup:

```
S---PLAYER 01---01---LONG---RIB---LONG
S---PLAYER 02---02---SHORT---RIB---SHORT
S---PLAYER 03---03---LONG---RIB---SHORT
S---PLAYER 04---04---SHORT---RIB---LONG
S---PLAYER 05---05---LONG---RIB---LONG

M---PLAYER 06---06---SHORT---RIB---SHORT
M---PLAYER 07---07---LONG---RIB---SHORT
M---PLAYER 08---08---SHORT---RIB---LONG
M---PLAYER 09---09---LONG---RIB---LONG
M---PLAYER 10---10---SHORT---RIB---SHORT

L---PLAYER 11---11---LONG---RIB---SHORT
L---PLAYER 12---12---SHORT---RIB---LONG
L---PLAYER 13---13---LONG---RIB---LONG
L---PLAYER 14---14---SHORT---RIB---SHORT
L---PLAYER 15---15---LONG---RIB---SHORT

XL---PLAYER 16---16---SHORT---RIB---LONG
XL---PLAYER 17---17---LONG---RIB---LONG
XL---PLAYER 18---18---SHORT---RIB---SHORT
XL---PLAYER 19---19---LONG---RIB---SHORT
XL---PLAYER 20---20---SHORT---RIB---LONG

2XL---PLAYER 21---21---LONG---RIB---LONG
2XL---PLAYER 22---22---SHORT---RIB---SHORT
2XL---PLAYER 23---23---LONG---RIB---SHORT
2XL---PLAYER 24---24---SHORT---RIB---LONG
2XL---PLAYER 25---25---LONG---RIB---LONG

3XL---PLAYER 26---26---SHORT---RIB---SHORT
3XL---PLAYER 27---27---LONG---RIB---SHORT
3XL---PLAYER 28---28---SHORT---RIB---LONG
3XL---PLAYER 29---29---LONG---RIB---LONG
3XL---PLAYER 30---30---SHORT---RIB---SHORT

4XL---PLAYER 31---31---LONG---RIB---SHORT
4XL---PLAYER 32---32---SHORT---RIB---LONG
4XL---PLAYER 33---33---LONG---RIB---LONG
4XL---PLAYER 34---34---SHORT---RIB---SHORT
4XL---PLAYER 35---35---LONG---RIB---SHORT

5XL---PLAYER 36---36---SHORT---RIB---LONG
5XL---PLAYER 37---37---LONG---RIB---LONG
5XL---PLAYER 38---38---SHORT---RIB---SHORT
5XL---PLAYER 39---39---LONG---RIB---SHORT
5XL---PLAYER 40---40---SHORT---RIB---LONG
```

---

### Easy Data Formatting Tool

If you already have your player data in the `SIZE---NAME---NUMBER---SLEEVE---RIB---PANT` format, use the online formatter to validate and clean it instantly:

**🔗 [JFT Data Formatter](https://devsa-009.github.io/jft-data-formatter/)**

---

## Format 2 — Static String (Grid / Static Mode)

No player names needed. Just specify how many pieces per size.

### Syntax

```
[GLOBAL_KEYS,] SIZE=qty[.SS<n>][.LS<n>][.SP<n>][.LP<n>]
```

### Examples

```
XS=3,M=10,L=8,2XL=3
TYPE=TSHIRT,RIB=CUFF,SLV=S,XS=3,M=10.SS5.LS5,L=8
```

See `STATIC-MODE-REFERENCE.MD` for full static mode documentation.

---

## Tips — Preparing Unstructured or Raw Data

If your data comes from a spreadsheet, WhatsApp message, handwritten list, or any other unorganized source, follow these tips to convert it to the correct format.

### Tip 1 — Fix the separator first

Your data must use `---` (three hyphens) between fields. If your source uses commas, tabs, or single hyphens, do a find-and-replace in any text editor before pasting.

### Tip 2 — Check field order

The order must always be: `SIZE---NAME---NUMBER---SLEEVE---RIB---PANT`

If your data has fields in a different order (e.g. name comes before size), reorder the columns in a spreadsheet first, then export as plain text.

### Tip 3 — Group by size

Sort or group your rows by size before pasting. The script processes sizes in order — mixing sizes randomly still works but makes the output harder to review.

### Tip 4 — Use the formatter tool

Paste your formatted text into **[JFT Data Formatter](https://devsa-009.github.io/jft-data-formatter/)** to instantly detect and highlight invalid rows before running the script.

### Tip 5 — Use AI to reformat messy data

If your data is badly structured (e.g. copied from a chat, PDF, or spreadsheet with missing fields), use an AI assistant to reformat it. **ChatGPT is recommended**, but any AI works.

---

### AI Prompt 1 — Raw / Basic Version

> Use this when your data is messy and you just need it converted quickly. Recommended: **ChatGPT**.

```
format each in one line with --- as separator
(NOTE 1) if line has serial order number then skip it.
(NOTE 2) if any line found after separator (full | long | full slv | long slv | full sleeve | long sleeve) case-insensitive then remove the word and at the end of founded line add another word "LONG" after separator. if any or anyone not found any slv type then make all is "SHORT".
(NOTE 3) add founded line add another word "RIB". default value is "NO". until mentioned about which item should RIB type or not. the RIB value is (CUFF | RIB | NO).
(NOTE 4) add founded line add another word "PANT". default value is "NO". until mentioned about which item should PANT type or not. the PANT value is (SHORT | LONG | NO).
(NOTE 5) always format data as structure order [SIZE,NAME,NO,SLV,RIB,PANT].
(NOTE 6) If any field (NAME, NO) is missing, leave it empty but keep separators.
(NOTE 7) If any line at the end with (GK), then that item name value concatenated with (name (GK)).

[PASTE YOUR RAW DATA BELOW THIS LINE]
```

---

### AI Prompt 2 — Improved / Detailed Version

> Use this when the basic prompt gives inconsistent or wrong results. More explicit rules help the AI produce consistent output. Recommended: **ChatGPT**.

```
You are a data formatter. Convert the raw garment order data below into structured lines.

OUTPUT FORMAT — one player per line, fields separated by ---:
SIZE---NAME---NUMBER---SLEEVE---RIB---PANT

RULES:
1. Skip any line that starts with a serial/order number (e.g. "1.", "2.", "#1").
2. SLEEVE field:
   - If the line contains any of these words (case-insensitive): "full", "long", "full slv", "long slv", "full sleeve", "long sleeve" — remove that word from the name/line and set SLEEVE = LONG.
   - If none of those words are found for a player, set SLEEVE = SHORT.
3. RIB field: Default = NO. Only change to RIB or CUFF if the source data explicitly mentions it for that player or group.
   Valid values: CUFF | RIB | NO
4. PANT field: Default = NO. Only change to SHORT or LONG if the source data explicitly mentions pant type for that player or group.
   Valid values: SHORT | LONG | NO
5. Output column order must always be: SIZE---NAME---NUMBER---SLEEVE---RIB---PANT
6. If NAME or NUMBER is missing from the source, leave that field empty but keep the --- separators.
   Example of missing number: M---JOHN DOE------SHORT---NO---NO
7. If a line ends with "(GK)", append " (GK)" to the player's NAME field.
   Example: S---RAHMAN (GK)---01---SHORT---NO---NO

OUTPUT ONLY the formatted lines. No explanations, no headers, no extra text.

[PASTE YOUR RAW DATA BELOW THIS LINE]
```

---

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## ওভারভিউ

JFT-Rapid দুটি ফরম্যাটে প্লেয়ার অর্ডার ডেটা গ্রহণ করে:

| ফরম্যাট                                                          | মোড               | কখন ব্যবহার করবেন                        |
| ---------------------------------------------------------------- | ----------------- | ---------------------------------------- |
| **অর্ডার টেক্সট** (`SIZE---NAME---NUMBER---SLEEVE---RIB---PANT`) | নরমাল (NA/NO)     | প্লেয়ারের নাম ও নম্বরসহ তালিকা থাকলে    |
| **স্ট্যাটিক স্ট্রিং** (`M=10,L=8,2XL=3`)                         | স্ট্যাটিক / গ্রিড | শুধু সাইজ অনুযায়ী পরিমাণ দরকার, নাম নেই |

---

## ফরম্যাট ১ — অর্ডার টেক্সট (নরমাল মোড)

### সিনট্যাক্স

প্রতিটি প্লেয়ার একটি লাইনে এই ক্রমে:

```
SIZE---NAME---NUMBER---SLEEVE---RIB---PANT
```

| ফিল্ড    | আবশ্যক | বৈধ মান                                                                           | বর্ণনা                          |
| -------- | ------ | --------------------------------------------------------------------------------- | ------------------------------- |
| `SIZE`   | ✅     | `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL` `5XL` `2` `4` `6` `8` `10` `12` `14` `16` | গার্মেন্ট সাইজ                  |
| `NAME`   | ✅     | যেকোনো টেক্সট                                                                     | প্লেয়ারের নাম                  |
| `NUMBER` | ✅     | যেকোনো টেক্সট                                                                     | জার্সি নম্বর                    |
| `SLEEVE` | ✅     | `SHORT` বা `LONG`                                                                 | এই প্লেয়ারের স্লিভের দৈর্ঘ্য   |
| `RIB`    | ✅     | `RIB` `CUFF` বা `NO`                                                              | রিব/কাফ টাইপ                    |
| `PANT`   | ✅     | `SHORT` বা `LONG`                                                                 | এই প্লেয়ারের প্যান্টের দৈর্ঘ্য |

> **সেপারেটর:** প্রতিটি ফিল্ডের মধ্যে তিনটি হাইফেন `---`। আগে বা পরে স্পেস দেবেন না।

### নিয়মাবলী

- এক লাইনে একজন প্লেয়ার।
- সাইজ গ্রুপের মধ্যে খালি লাইন **রাখা যাবে** — পার্সার এটি উপেক্ষা করে।
- ফিল্ডের ক্রম **পরিবর্তন করা যাবে না**।
- মান **কেস-ইনসেন্সিটিভ** — `short`, `SHORT`, `Short` সবই কাজ করে।

---

### স্যাম্পল ডেটা

এটি স্ক্রিপ্টের রিয়েল টেস্ট ডেটা। সেটআপ পরীক্ষা করতে কপি করুন:

```
S---PLAYER 01---01---LONG---RIB---LONG
S---PLAYER 02---02---SHORT---RIB---SHORT
S---PLAYER 03---03---LONG---RIB---SHORT
S---PLAYER 04---04---SHORT---RIB---LONG
S---PLAYER 05---05---LONG---RIB---LONG

M---PLAYER 06---06---SHORT---RIB---SHORT
M---PLAYER 07---07---LONG---RIB---SHORT
M---PLAYER 08---08---SHORT---RIB---LONG
M---PLAYER 09---09---LONG---RIB---LONG
M---PLAYER 10---10---SHORT---RIB---SHORT

L---PLAYER 11---11---LONG---RIB---SHORT
L---PLAYER 12---12---SHORT---RIB---LONG
L---PLAYER 13---13---LONG---RIB---LONG
L---PLAYER 14---14---SHORT---RIB---SHORT
L---PLAYER 15---15---LONG---RIB---SHORT

XL---PLAYER 16---16---SHORT---RIB---LONG
XL---PLAYER 17---17---LONG---RIB---LONG
XL---PLAYER 18---18---SHORT---RIB---SHORT
XL---PLAYER 19---19---LONG---RIB---SHORT
XL---PLAYER 20---20---SHORT---RIB---LONG

2XL---PLAYER 21---21---LONG---RIB---LONG
2XL---PLAYER 22---22---SHORT---RIB---SHORT
2XL---PLAYER 23---23---LONG---RIB---SHORT
2XL---PLAYER 24---24---SHORT---RIB---LONG
2XL---PLAYER 25---25---LONG---RIB---LONG

3XL---PLAYER 26---26---SHORT---RIB---SHORT
3XL---PLAYER 27---27---LONG---RIB---SHORT
3XL---PLAYER 28---28---SHORT---RIB---LONG
3XL---PLAYER 29---29---LONG---RIB---LONG
3XL---PLAYER 30---30---SHORT---RIB---SHORT

4XL---PLAYER 31---31---LONG---RIB---SHORT
4XL---PLAYER 32---32---SHORT---RIB---LONG
4XL---PLAYER 33---33---LONG---RIB---LONG
4XL---PLAYER 34---34---SHORT---RIB---SHORT
4XL---PLAYER 35---35---LONG---RIB---SHORT

5XL---PLAYER 36---36---SHORT---RIB---LONG
5XL---PLAYER 37---37---LONG---RIB---LONG
5XL---PLAYER 38---38---SHORT---RIB---SHORT
5XL---PLAYER 39---39---LONG---RIB---SHORT
5XL---PLAYER 40---40---SHORT---RIB---LONG
```

---

### সহজ ডেটা ফরম্যাটিং টুল

আপনার ডেটা `SIZE---NAME---NUMBER---SLEEVE---RIB---PANT` ফরম্যাটে থাকলে এই অনলাইন টুল দিয়ে তাৎক্ষণিকভাবে ভ্যালিডেট ও ক্লিন করুন:

**🔗 [JFT Data Formatter](https://devsa-009.github.io/jft-data-formatter/)**

---

## ফরম্যাট ২ — স্ট্যাটিক স্ট্রিং (গ্রিড / স্ট্যাটিক মোড)

প্লেয়ারের নাম দরকার নেই। শুধু প্রতিটি সাইজে কতটি পিস লাগবে বলুন।

```
XS=3,M=10,L=8,2XL=3
```

বিস্তারিত: `STATIC-MODE-REFERENCE.MD` দেখুন।

---

## টিপস — অসংগঠিত বা কাঁচা ডেটা সংশোধন

আপনার ডেটা স্প্রেডশিট, হোয়াটসঅ্যাপ মেসেজ, হাতে লেখা তালিকা বা অন্য কোনো অসংগঠিত উৎস থেকে এলে নিচের টিপস অনুসরণ করুন।

### টিপ ১ — সেপারেটর আগে ঠিক করুন

ডেটায় `---` (তিনটি হাইফেন) সেপারেটর থাকতে হবে। কমা, ট্যাব বা একটি হাইফেন থাকলে যেকোনো টেক্সট এডিটরে Find & Replace করে ঠিক করুন।

### টিপ ২ — ফিল্ডের ক্রম চেক করুন

ক্রম সবসময়: `SIZE---NAME---NUMBER---SLEEVE---RIB---PANT`

ডেটার ক্রম ভিন্ন হলে স্প্রেডশিটে কলাম পুনর্বিন্যস্ত করে প্লেইন টেক্সটে এক্সপোর্ট করুন।

### টিপ ৩ — সাইজ অনুযায়ী গ্রুপ করুন

পেস্ট করার আগে সাইজ অনুযায়ী সাজান। এলোমেলো সাইজেও কাজ করবে, তবে আউটপুট রিভিউ করা কঠিন হবে।

### টিপ ৪ — ফরম্যাটার টুল ব্যবহার করুন

**[JFT Data Formatter](https://devsa-009.github.io/jft-data-formatter/)**-এ টেক্সট পেস্ট করে স্ক্রিপ্ট রান করার আগেই ইনভ্যালিড রো ধরুন।

### টিপ ৫ — অগোছালো ডেটার জন্য AI ব্যবহার করুন

চ্যাট, PDF বা স্প্রেডশিট থেকে কপি করা অগোছালো ডেটা রিফরম্যাট করতে AI ব্যবহার করুন। **ChatGPT প্রস্তাবিত**, তবে যেকোনো AI কাজ করবে।

---

### AI প্রম্পট ১ — র‍্যা / বেসিক ভার্সন

> অগোছালো ডেটা দ্রুত কনভার্ট করতে এটি ব্যবহার করুন। প্রস্তাবিত: **ChatGPT**।

```
format each in one line with --- as separator
(NOTE 1) if line has serial order number then skip it.
(NOTE 2) if any line found after separator (full | long | full slv | long slv | full sleeve | long sleeve) case-insensitive then remove the word and at the end of founded line add another word "LONG" after separator. if any or anyone not found any slv type then make all is "SHORT".
(NOTE 3) add founded line add another word "RIB". default value is "NO". until mentioned about which item should RIB type or not. the RIB value is (CUFF | RIB | NO).
(NOTE 4) add founded line add another word "PANT". default value is "NO". until mentioned about which item should PANT type or not. the PANT value is (SHORT | LONG | NO).
(NOTE 5) always format data as structure order [SIZE,NAME,NO,SLV,RIB,PANT].
(NOTE 6) If any field (NAME, NO) is missing, leave it empty but keep separators.
(NOTE 7) If any line at the end with (GK), then that item name value concatenated with (name (GK)).

[এখানে আপনার কাঁচা ডেটা পেস্ট করুন]
```

---

### AI প্রম্পট ২ — উন্নত / বিস্তারিত ভার্সন

> বেসিক প্রম্পট অসামঞ্জস্যপূর্ণ ফলাফল দিলে এটি ব্যবহার করুন। বিস্তারিত নিয়মাবলী AI-কে সঠিক আউটপুট দিতে সাহায্য করে। প্রস্তাবিত: **ChatGPT**।

```
You are a data formatter. Convert the raw garment order data below into structured lines.

OUTPUT FORMAT — one player per line, fields separated by ---:
SIZE---NAME---NUMBER---SLEEVE---RIB---PANT

RULES:
1. Skip any line that starts with a serial/order number (e.g. "1.", "2.", "#1").
2. SLEEVE field:
   - If the line contains any of these words (case-insensitive): "full", "long", "full slv", "long slv", "full sleeve", "long sleeve" — remove that word from the name/line and set SLEEVE = LONG.
   - If none of those words are found for a player, set SLEEVE = SHORT.
3. RIB field: Default = NO. Only change to RIB or CUFF if the source data explicitly mentions it for that player or group.
   Valid values: CUFF | RIB | NO
4. PANT field: Default = NO. Only change to SHORT or LONG if the source data explicitly mentions pant type for that player or group.
   Valid values: SHORT | LONG | NO
5. Output column order must always be: SIZE---NAME---NUMBER---SLEEVE---RIB---PANT
6. If NAME or NUMBER is missing from the source, leave that field empty but keep the --- separators.
   Example of missing number: M---JOHN DOE------SHORT---NO---NO
7. If a line ends with "(GK)", append " (GK)" to the player's NAME field.
   Example: S---RAHMAN (GK)---01---SHORT---NO---NO

OUTPUT ONLY the formatted lines. No explanations, no headers, no extra text.

[এখানে আপনার কাঁচা ডেটা পেস্ট করুন]
```
