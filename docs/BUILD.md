<div align="center">

# JFT-Rapid — CEP Extension Build & Install Tools

**Switch Language / ভাষা পরিবর্তন করুন:**  
[🇺🇸 English](#english) · [🇧🇩 বাংলা](#বাংলা)

</div>

---

<a id="english"></a>

# 🇺🇸 English

## Overview

This toolset builds and installs the `com.jftrapid.cep` Adobe CEP extension using `ZXPSignCmd.exe` and PowerShell. Both scripts are launched via `.cmd` wrappers so npm can call them without any execution-policy issues.

---

## Project Structure

```
project-root/
├── build/
│   └── com.jftrapid.cep.zxp          <- generated output
├── tools/
│   ├── build_extension.cmd           <- npm calls this
│   ├── build_extension.ps1           <- actual build logic
│   ├── install_extensions.cmd        <- npm calls this
│   ├── install_extensions.ps1        <- actual install logic
│   ├── selft-sign-certificate.p12    <- your signing certificate
│   └── ZXPSignCmd.exe                <- Adobe signing tool
├── CLIENT/
├── CSXS/
├── HOST/
└── jft.conf
```

---

## Setup

### 1. Set the certificate password

Open `tools\build_extension.ps1`. Line 8 contains the password variable.
Use **single quotes** so PowerShell treats special characters (`$`, `*`, etc.) as plain text:

```powershell
$CERT_PASSWORD = 'your-password-here'
```

**Default password:** `NPn$8CDqg*YEt95`

> This default matches the password used when `selft-sign-certificate.p12` was generated.
> If you generated the certificate with a different password, replace it here.

### 2. Add npm scripts

In your `package.json`:

```json
"scripts": {
  "build_zxp":   "cmd /c \"tools\\build_extension.cmd\"",
  "install_zxp": "cmd /c \"tools\\install_extensions.cmd\""
}
```

---

## Usage

### Build the ZXP

```bash
npm run build_zxp
```

**What it does:**

1. Validates that `ZXPSignCmd.exe`, the certificate, and all source folders exist.
2. Creates the `build\` directory if it does not exist.
3. Deletes any existing `com.jftrapid.cep.zxp` in `build\`.
4. Copies `CLIENT\`, `CSXS\`, `HOST\`, and `jft.conf` into a temporary staging folder.
5. Signs using `ZXPSignCmd.exe` with the DigiCert timestamp server.
6. Waits for `ZXPSignCmd` to fully finish before cleaning up the temp folder.
7. Outputs `build\com.jftrapid.cep.zxp`.

---

### Install the ZXP

```bash
npm run install_zxp
```

> **Run your terminal as Administrator** — writing to `Program Files` requires elevated privileges.

**What it does:**

1. Looks for `.zxp` files in `build\`.
2. Removes any existing installation from the Adobe CEP extensions folder.
3. Extracts the ZXP into:
   ```
   C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.jftrapid.cep\
   ```
4. Restart your Adobe application after install to load the extension.

---

## Reference

| Item                  | Detail                                                     |
| --------------------- | ---------------------------------------------------------- |
| Default cert password | `JFT-Rapid-CEP-2026`                                       |
| CEP extensions path   | `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions` |
| Timestamp server      | `http://timestamp.digicert.com`                            |
| Signing tool          | `tools\ZXPSignCmd.exe`                                     |
| Certificate           | `tools\selft-sign-certificate.p12`                         |

---

<a id="বাংলা"></a>

# 🇧🇩 বাংলা

## সংক্ষিপ্ত বিবরণ

এই টুলসেটটি `ZXPSignCmd.exe` এবং PowerShell ব্যবহার করে `com.jftrapid.cep` Adobe CEP এক্সটেনশন বিল্ড ও ইনস্টল করে। দুটি স্ক্রিপ্টই `.cmd` র‍্যাপারের মাধ্যমে চালানো হয়, যাতে npm কোনো execution-policy সমস্যা ছাড়াই কল করতে পারে।

---

## প্রজেক্ট স্ট্রাকচার

```
project-root/
├── build/
│   └── com.jftrapid.cep.zxp          <- তৈরি হওয়া আউটপুট
├── tools/
│   ├── build_extension.cmd           <- npm এটি কল করে
│   ├── build_extension.ps1           <- মূল বিল্ড লজিক
│   ├── install_extensions.cmd        <- npm এটি কল করে
│   ├── install_extensions.ps1        <- মূল ইনস্টল লজিক
│   ├── selft-sign-certificate.p12    <- সাইনিং সার্টিফিকেট
│   └── ZXPSignCmd.exe                <- Adobe সাইনিং টুল
├── CLIENT/
├── CSXS/
├── HOST/
└── jft.conf
```

---

## সেটআপ

### ১. সার্টিফিকেট পাসওয়ার্ড সেট করুন

`tools\build_extension.ps1` খুলুন। ৮ নম্বর লাইনে পাসওয়ার্ড ভেরিয়েবল আছে।
PowerShell যেন বিশেষ চরিত্র (`$`, `*` ইত্যাদি) সাধারণ টেক্সট হিসেবে নেয় তার জন্য **সিঙ্গেল কোট** ব্যবহার করুন:

```powershell
$CERT_PASSWORD = 'your-password-here'
```

**ডিফল্ট পাসওয়ার্ড:** `JFT-Rapid-CEP-2026`

> এই ডিফল্ট পাসওয়ার্ডটি `selft-sign-certificate.p12` তৈরির সময় ব্যবহৃত পাসওয়ার্ডের সাথে মেলে।
> ভিন্ন পাসওয়ার্ড দিয়ে সার্টিফিকেট তৈরি করে থাকলে এখানে পরিবর্তন করুন।

### ২. npm স্ক্রিপ্ট যোগ করুন

আপনার `package.json`-এ:

```json
"scripts": {
  "build_zxp":   "cmd /c \"tools\\build_extension.cmd\"",
  "install_zxp": "cmd /c \"tools\\install_extensions.cmd\""
}
```

---

## ব্যবহার

### ZXP বিল্ড করুন

```bash
npm run build_zxp
```

**কী করে:**

1. `ZXPSignCmd.exe`, সার্টিফিকেট এবং সোর্স ফোল্ডারগুলো আছে কিনা যাচাই করে।
2. `build\` ডিরেক্টরি না থাকলে তৈরি করে।
3. `build\`-এ আগের `com.jftrapid.cep.zxp` থাকলে মুছে ফেলে।
4. `CLIENT\`, `CSXS\`, `HOST\` এবং `jft.conf` একটি অস্থায়ী ফোল্ডারে কপি করে।
5. DigiCert টাইমস্ট্যাম্প সার্ভার সহ `ZXPSignCmd.exe` দিয়ে সাইন করে।
6. অস্থায়ী ফোল্ডার মুছে ফেলার আগে `ZXPSignCmd` সম্পূর্ণ শেষ হওয়া পর্যন্ত অপেক্ষা করে।
7. `build\com.jftrapid.cep.zxp` আউটপুট দেয়।

---

### ZXP ইনস্টল করুন

```bash
npm run install_zxp
```

> **টার্মিনাল Administrator হিসেবে চালান** — `Program Files`-এ লেখার জন্য উন্নত অনুমতি প্রয়োজন।

**কী করে:**

1. `build\` ডিরেক্টরি থেকে `.zxp` ফাইল খোঁজে।
2. Adobe CEP এক্সটেনশন ফোল্ডার থেকে পুরনো ইনস্টলেশন মুছে ফেলে।
3. ZXP ফাইলটি নিচের পাথে এক্সট্র্যাক্ট করে:
   ```
   C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.jftrapid.cep\
   ```
4. ইনস্টলের পরে এক্সটেনশন লোড করতে Adobe অ্যাপ্লিকেশন রিস্টার্ট করুন।

---

## তথ্যসারণি

| বিষয়                         | বিবরণ                                                      |
| ----------------------------- | ---------------------------------------------------------- |
| ডিফল্ট সার্টিফিকেট পাসওয়ার্ড | `JFT-Rapid-CEP-2026`                                       |
| CEP এক্সটেনশন পাথ             | `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions` |
| টাইমস্ট্যাম্প সার্ভার         | `http://timestamp.digicert.com`                            |
| সাইনিং টুল                    | `tools\ZXPSignCmd.exe`                                     |
| সার্টিফিকেট                   | `tools\selft-sign-certificate.p12`                         |
