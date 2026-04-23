<div align="center">

# JFT-Rapid — Installation Guide

**Switch Language / ভাষা পরিবর্তন করুন:**
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a name="english"></a>

# 🇺🇸 English

## What You Are Installing

JFT-Rapid is a **CEP (Common Extensibility Platform) extension** for Adobe Illustrator. It runs as a panel inside Illustrator — you install it by placing the extension folder in the correct location on your computer.

---

## Supported Adobe Illustrator Versions

| Version       | Support        |
| ------------- | -------------- |
| CC 2020 (v24) | ✅ Minimum     |
| CC 2021 (v25) | ✅             |
| CC 2022 (v26) | ✅             |
| CC 2023 (v27) | ✅             |
| CC 2024 (v28) | ✅             |
| CC 2025+      | ✅ Recommended |

> JFT-Rapid is tested primarily on **Windows**. macOS may work but is not officially supported.

---

## Step 1 — Download

Download the latest release package from the [Releases page](https://github.com/DevSA-009/JFT-Rapid/releases).

The downloaded file will be a `.zip` archive. Extract it — you will get a folder named:

```
com.jftrapid.cep
```

---

## Step 2 — Choose Your Installation Path

Adobe allows CEP extensions to be stored in **two locations**. Choose one:

### Option A — System-wide (All Users)

This installs the extension for **every user** on the computer. Requires Administrator permission.

| OS      | Path                                                        |
| ------- | ----------------------------------------------------------- |
| Windows | `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\` |
| macOS   | `/Library/Application Support/Adobe/CEP/extensions/`        |

### Option B — Current User Only

This installs the extension for **only your Windows account**. No Administrator permission needed.

| OS      | Path                                                            |
| ------- | --------------------------------------------------------------- |
| Windows | `C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\` |
| macOS   | `~/Library/Application Support/Adobe/CEP/extensions/`           |

> **Windows tip:** `AppData` is a hidden folder. To see it, open File Explorer → View → check **Hidden items**.

---

## Step 3 — Place the Extension Folder

Copy the `com.jftrapid.cep` folder into your chosen path from Step 2.

Your final folder structure should look like this:

```
Adobe/
└── CEP/
    └── extensions/
        └── com.jftrapid.cep/
            ├── CSXS/
            │   └── manifest.xml
            ├── CLIENT/
            │   └── index.html
            ├── HOST/
            │   └── jft_rapid.jsx
            └── jft.conf
```

---

## Step 4 — Enable Unsigned Extensions (First Time Only)

Adobe blocks unsigned CEP extensions by default. You must enable them once via the Windows Registry.

1. Press `Win + R`, type `regedit`, press Enter.
2. Navigate to:
   ```
   HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11
   ```
   > The number after `CSXS.` matches your Illustrator version. Try `CSXS.11` for CC 2024, `CSXS.10` for CC 2023, etc. Create the key if it does not exist.
3. Right-click → **New → String Value**
4. Name: `PlayerDebugMode`
5. Value: `1`
6. Click OK and close Registry Editor.

> **macOS alternative:** Run this in Terminal:
>
> ```bash
> defaults write com.adobe.CSXS.11 PlayerDebugMode 1
> ```

---

## Step 5 — Restart Illustrator

Close Adobe Illustrator completely and reopen it.

---

## Step 6 — Open the Panel

In Illustrator, go to:

**Window → Extensions → JFT Rapid**

The JFT-Rapid panel will open as a dockable panel.

---

## Configuration File (`jft.conf`)

The `jft.conf` file inside the extension folder controls garment dimensions per size. It is a standard JSON file you can edit with any text editor.

Location after installation:

```
com.jftrapid.cep/jft.conf
```

If you use a different brand with different measurements, edit the `sizes` block in `jft.conf` to match your dimensions (all values are in **inches**).

---

## Troubleshooting

| Problem                                  | Solution                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Panel not visible in Window → Extensions | Check the folder is named exactly `com.jftrapid.cep` and is in the correct path |
| Panel shows but script does nothing      | Make sure `PlayerDebugMode` registry key is set to `1`                          |
| "No document is open" error              | Open an Illustrator `.ai` file before using the panel                           |
| `jft.conf` not found error               | Confirm `jft.conf` exists inside the `com.jftrapid.cep` folder                  |

---

---

<a name="বাংলা"></a>

# 🇧🇩 বাংলা

## আপনি কী ইনস্টল করছেন

JFT-Rapid একটি **CEP (Common Extensibility Platform) এক্সটেনশন** Adobe Illustrator-এর জন্য। এটি Illustrator-এর ভেতরে একটি প্যানেল হিসেবে চলে — ইনস্টল করতে এক্সটেনশন ফোল্ডারটি সঠিক জায়গায় রাখতে হয়।

---

## সাপোর্টেড Adobe Illustrator ভার্সন

| ভার্সন        | সাপোর্ট       |
| ------------- | ------------- |
| CC 2020 (v24) | ✅ সর্বনিম্ন  |
| CC 2021 (v25) | ✅            |
| CC 2022 (v26) | ✅            |
| CC 2023 (v27) | ✅            |
| CC 2024 (v28) | ✅            |
| CC 2025+      | ✅ প্রস্তাবিত     |

> JFT-Rapid মূলত **Windows**-এ টেস্ট করা। macOS কাজ করতে পারে কিন্তু অফিশিয়ালি সাপোর্টেড নয়।

---

## ধাপ ১ — ডাউনলোড

[Releases পেজ](https://github.com/DevSA-009/JFT-Rapid/releases) থেকে সর্বশেষ রিলিজ ডাউনলোড করুন।

ডাউনলোড হওয়া `.zip` ফাইলটি এক্সট্র্যাক্ট করুন। নিচের নামে একটি ফোল্ডার পাবেন:

```
com.jftrapid.cep
```

---

## ধাপ ২ — ইনস্টলেশন পাথ বেছে নিন

Adobe দুটি জায়গায় CEP এক্সটেনশন রাখার অনুমতি দেয়:

### অপশন A — সিস্টেম-ওয়াইড (সব ইউজার)

কম্পিউটারের **সব ইউজারের জন্য** ইনস্টল হবে। Administrator পারমিশন লাগবে।

| OS      | পাথ                                                         |
| ------- | ----------------------------------------------------------- |
| Windows | `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\` |
| macOS   | `/Library/Application Support/Adobe/CEP/extensions/`        |

### অপশন B — শুধু বর্তমান ইউজার

শুধু **আপনার Windows অ্যাকাউন্টের জন্য**। Administrator পারমিশন লাগবে না।

| OS      | পাথ                                                          |
| ------- | ------------------------------------------------------------ |
| Windows | `C:\Users\<আপনার নাম>\AppData\Roaming\Adobe\CEP\extensions\` |
| macOS   | `~/Library/Application Support/Adobe/CEP/extensions/`        |

> **Windows টিপস:** `AppData` একটি লুকানো ফোল্ডার। দেখতে: File Explorer → View → **Hidden items** চেক করুন।

---

## ধাপ ৩ — এক্সটেনশন ফোল্ডার রাখুন

`com.jftrapid.cep` ফোল্ডারটি ধাপ ২-এ বেছে নেওয়া পাথে কপি করুন।

ইনস্টলের পর ফোল্ডার স্ট্রাকচার এরকম হবে:

```
Adobe/
└── CEP/
    └── extensions/
        └── com.jftrapid.cep/
            ├── CSXS/
            │   └── manifest.xml
            ├── CLIENT/
            │   └── index.html
            ├── HOST/
            │   └── jft_rapid.jsx
            └── jft.conf
```

---

## ধাপ ৪ — Unsigned Extension চালু করুন (প্রথমবার শুধু)

Adobe ডিফল্টে আনসাইনড CEP এক্সটেনশন ব্লক করে। একবার Windows Registry-তে চালু করতে হবে:

1. `Win + R` চাপুন, `regedit` টাইপ করুন, Enter চাপুন।
2. এখানে যান:
   ```
   HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11
   ```
   > `CSXS.`-এর পরের নম্বরটি Illustrator ভার্সন অনুযায়ী। CC 2024 = `CSXS.11`, CC 2023 = `CSXS.10`। কী না থাকলে তৈরি করুন।
3. Right-click → **New → String Value**
4. নাম: `PlayerDebugMode`
5. মান: `1`
6. OK ক্লিক করুন।

> **macOS:** Terminal-এ রান করুন:
>
> ```bash
> defaults write com.adobe.CSXS.11 PlayerDebugMode 1
> ```

---

## ধাপ ৫ — Illustrator রিস্টার্ট করুন

Adobe Illustrator সম্পূর্ণ বন্ধ করে আবার খুলুন।

---

## ধাপ ৬ — প্যানেল খুলুন

Illustrator-এ যান:

**Window → Extensions → JFT Rapid**

JFT-Rapid প্যানেল একটি ডকেবল প্যানেল হিসেবে খুলবে।

---

## কনফিগারেশন ফাইল (`jft.conf`)

এক্সটেনশন ফোল্ডারের ভেতরে `jft.conf` ফাইলটি প্রতিটি সাইজের গার্মেন্ট ডাইমেনশন নিয়ন্ত্রণ করে। এটি একটি সাধারণ JSON ফাইল যা যেকোনো টেক্সট এডিটরে এডিট করা যায়।

ইনস্টলের পর লোকেশন:

```
com.jftrapid.cep/jft.conf
```

আপনার ব্র্যান্ডের মাপ আলাদা হলে `jft.conf`-এর `sizes` ব্লক এডিট করুন (সব মান **ইঞ্চিতে**)।

---

## সমস্যা সমাধান

| সমস্যা                                        | সমাধান                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Window → Extensions-এ প্যানেল নেই             | ফোল্ডারের নাম ঠিক `com.jftrapid.cep` এবং সঠিক পাথে আছে কিনা চেক করুন |
| প্যানেল দেখা যায় কিন্তু স্ক্রিপ্ট কাজ করে না | `PlayerDebugMode` রেজিস্ট্রি কী `1` সেট আছে কিনা দেখুন               |
| "No document is open" এরর                     | প্যানেল ব্যবহারের আগে একটি `.ai` ফাইল খুলুন                          |
| `jft.conf` not found এরর                      | `com.jftrapid.cep` ফোল্ডারে `jft.conf` আছে কিনা নিশ্চিত করুন         |
