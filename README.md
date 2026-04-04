<div align="center">

# JFT-Rapid

**Automated Sportswear Layout Generator for Adobe Illustrator**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Adobe Illustrator](https://img.shields.io/badge/Adobe%20Illustrator-CC%202024%2B-orange)](https://www.adobe.com/products/illustrator.html)
[![ExtendScript](https://img.shields.io/badge/ExtendScript-ES5-yellow)](https://extendscript.docsforadobe.dev/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)](https://github.com/)

**Switch Language:**[🇧🇩 বাংলা](README_BD.md)

</div>

---

## What is JFT-Rapid?

JFT-Rapid is a free, open-source Adobe Illustrator extension built specifically for **sportswear printing businesses**. If your team takes orders for jerseys, polo shirts, or sports pants — and you spend hours manually duplicating and arranging artwork for each player size — JFT-Rapid automates all of that for you.

You give it the player data (names, numbers, sizes). It takes your artwork layers, resizes them to the correct garment dimensions, arranges them on print-ready documents, and injects each player's name and number into the right text frames — automatically, for every size, every sleeve type, every garment part.

**In short:** What used to take hours now takes minutes.

---

## Who Is This For?

JFT-Rapid is made for:

- 🧵 **Sportswear & jersey printing shops** that handle bulk custom orders
- 🎨 **Graphic designers** who manually lay out garment artwork in Illustrator
- 🏭 **Small-to-medium print production teams** looking to reduce repetitive work
- 🔁 **Anyone** who prints the same garment design across multiple sizes with custom player details

You do **not** need to be a developer to use this tool. If you can use Adobe Illustrator, you can use JFT-Rapid.

---

## Recommended Adobe Version

| Software          | Minimum Version | Recommended                |
| ----------------- | --------------- | -------------------------- |
| Adobe Illustrator | CC 2020 (v24)   | **CC 2024 (v28) or newer** |
| Operating System  | Windows 10      | Windows 10 / 11            |

> **Note:** JFT-Rapid is designed and tested primarily on **Windows**. macOS support may work but is not officially tested.

---

## Features

### ⚡ Automated Layout Generation

Stop duplicating artwork by hand. JFT-Rapid reads your order data and automatically generates print-ready EPS documents — one per garment part, per size group.

### 👕 Full Garment Pipeline

Handles the complete garment layout in one run:

- **Collar / Neck** — Polo collars, plackets, and T-shirt neckbands
- **Rib / Cuff** — Sleeve ribs and cuffs (quantity doubled automatically for CUFF type)
- **Short & Long Sleeves** — Both sleeve types processed independently
- **Body** — Main jersey body pieces
- **Short & Long Pants** — Front and back pant pieces

### 🔤 Dynamic Player Text Injection

Text frames named `NAME` and `NUMBER` inside your artwork are automatically filled with each player's data. Each player row in your order data can carry an optional `SLEEVE` field (`"SHORT"` or `"LONG"`) and an optional `PANT` field (`"SHORT"` or `"LONG"`) — the pipeline uses these to route each player to the correct garment piece automatically. Font sizes are auto-corrected if a long name would overflow the frame.

### 📐 Smart Stack Layout Engine

JFT-Rapid tests five different stacking arrangements (HH, VV, RHH, RVV, VRH) and automatically picks the one that uses your paper width most efficiently.

### 📏 Size Range Merging

Adjacent sizes with identical dimensions (e.g. XS+S, M+L) are grouped together on the same document, saving paper and reducing file count.

### 🖥️ Two Modes of Operation

**Normal Mode (NA/NO):** Full automation with player names and numbers. You provide a complete order in JSON format and every player's name and number is injected into the correct garment piece.

**Static / Grid Mode:** No player data needed. Just tell it the size quantities (e.g. `M=10,L=8,2XL=3`) and it generates layout grids for each garment part automatically.

### 📋 Preparing Your Data

Player order data for Normal Mode follows this format per line:

SIZE---NAME---NUMBER---SLEEVE---RIB---PANT

To learn how to format data correctly, handle messy or unstructured orders, use AI tools to reformat raw data, or understand the full JSON structure — see the **[Data Format Guide](docs/DATA-FORMAT.md)**

### 📦 CEP Panel Interface

A clean panel UI inside Illustrator gives you one-click access to all features — no need to run scripts manually.

### 🛠️ Utility Tools

The panel also includes helper tools for common Illustrator tasks:

- Add stroke outlines to clip paths
- Check and repair opacity masks
- Reset object names
- Arrange and select objects by tag name
- Generate and destroy object keys

---

## How It Works (Simple Overview)

1. **Open your artwork** in Adobe Illustrator. Each garment piece must be on the active layer and named with the correct marker tag (e.g. a body piece should have `_BODY_` in its name).

2. **Open the JFT-Rapid panel** from the Window menu.

3. **Click "Auto NA/NO"** (Normal Mode) or **"Grid Layout"** (Static Mode).

4. **Enter your order data** in the dialog that opens.

5. **Click Run.** JFT-Rapid processes all garment parts, sizes, and players automatically — saving EPS files to the same folder as your source document.

---

## Supported Garment Types

| Type   | Sleeves              | Rib               | Pant                 |
| ------ | -------------------- | ----------------- | -------------------- |
| POLO   | Short, Long, or Both | RIB / CUFF / None | Short, Long, or Both |
| TSHIRT | Short, Long, or Both | RIB / CUFF / None | Short, Long, or Both |

**Adult Sizes:** XS · S · M · L · XL · 2XL · 3XL · 4XL · 5XL

**Kids Sizes:** 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16

---

## Installation

For full installation instructions including all supported paths, enabling unsigned extensions, and troubleshooting — see the **[Installation Guide](docs/INSTALLATION.md)**.

**Quick steps:**

1. Download the latest release from the [Releases](../../releases) page.
2. Copy the `com.jftrapid.cep` folder to one of these locations:
   - **Windows (all users):** `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`
   - **Windows (current user):** `C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\`
   - **macOS (all users):** `/Library/Application Support/Adobe/CEP/extensions/`
3. Enable unsigned extensions via the Windows Registry (one-time setup — [see the full guide](docs/INSTALLATION.md#step-4--enable-unsigned-extensions-first-time-only)).
4. Restart Adobe Illustrator.
5. Open the panel from **Window → Extensions → JFT Rapid**.

> The `jft.conf` file inside the extension folder contains garment dimensions per size. Edit it if your brand uses different measurements.

---

## Project Structure (For the Curious)

```
JFT-Rapid/
├── CLIENT/          ← Panel UI (HTML/CSS/JS shown inside Illustrator)
├── src/
│   ├── class/       ← All core logic classes (TypeScript)
│   ├── enum/        ← Enums, constants, and test data
│   ├── types/       ← TypeScript type definitions
│   ├── polyfill/    ← ES6 polyfills for the ES3 ExtendScript runtime
│   └── scriptUI/    ← ScriptUI dialog windows
├── jft.conf         ← Brand/size configuration file
└── tsconfig.json    ← Compiles TypeScript → single .jsx file
```

---

## Open Source & Contributing

JFT-Rapid is **open source** and welcomes contributions from anyone — developers, designers, and print professionals alike.

Whether you want to:

- 🐛 Report a bug
- 💡 Suggest a new feature
- 🔧 Fix something in the code
- 📖 Improve the documentation
- 🌐 Add support for a new language

...all contributions are welcome. Please read the [Developer Documentation](docs/DEVELOPER.md) before contributing.

---

## Credits

JFT-Rapid was created and is maintained by **[DevSA-009](https://github.com/DevSA-009)**.

Special thanks to everyone in the sportswear printing community whose workflow challenges inspired this tool.

---

## License

This project is licensed under the **MIT License**

You are free to use, modify, and distribute this software for any purpose, including commercial use, as long as the original copyright notice is preserved.

---
