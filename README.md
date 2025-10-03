# 📘 JFT Rapid Script – Documentation

**JFT Rapid Script** is an automation tool built for **Jersey Designers** working with Adobe Illustrator.
It helps automate repetitive tasks such as:

* Laying out **Front, Back & Pant** body items on print sheets
* Applying **player names & numbers** automatically
* Managing **sizes & tokens** for multiple companies
* Handling **opacity masks** via pre-recorded actions

---

## 🚀 Features

1. **Interactive CEP Panel**

   * Custom icons with an interactive button panel.

2. **Layout Modes**

   * `FB` → Front & Back processed together
   * `B` → Front & Back processed separately *(default)*
   * `PANT` → Pant-only process

3. **Size Container Management**

   * Stores company-specific size sets (Mens & Baby sizes supported).

4. **Automatic Size Token Renaming**

   * Replaces `SIZE_TKN` text with target sizes (e.g., M, L, XL).

5. **Manual & Automatic Layouting**

   * Manual → Layout by quantity
   * Automatic (NANO) → Layout by JSON data + size container

6. **Automatic Text Assignment**

   * Applies values (e.g., `NAME`, `NO`) to text objects.

7. **Opacity Mask Handling**

   * Uses pre-recorded actions from `JFT-Rapid` action set:

     * `OM-SA` → Apply opacity mask only
     * `OMI-SA` → Apply opacity mask with invert

8. **Document Layout Options**

   * Set max column per document
   * Distribute gaps between items

9. **Text Outline Option**

   * Converts automatically applied text into outlines if required.

10. **Flexible Orientations**

    * `Auto` → Detects best paper usage *(recommended)*
    * `V` → Vertical (All-over)
    * `H` → Horizontal (Rotated 90°)
    * `L` → Special cube-like layout (Front vertical + Back horizontal + 180° mirrored)

11. **Smart Dialog UI**

    * Built with `ScriptUI` (native GUI)
    * Displays size containers, orientation, modes, and options

12. **Additional Tools**

    * Tweak, move, marker, and checking buttons
    * Special loader to show processing status

13. **Configuration via `jft.conf`**

    * Stores size containers, company sizes, and user settings

---

## ⚠️ Important Notes

* **Measurement unit:** Only **inch** supported.
* **Configuration file required:**
  Must exist at:

  ```
  C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep\jft.conf
  ```
* **Minimum setup:** At least one size container must exist.
* **Automatic data:** Input must be in **minified JSON** format.
* **Tweak buttons:** Require selected objects.
* **Marking objects:**

  * Example: To mark Front → Select object → Click "Front" icon.
* **Opacity mask:**

  * Requires actions `OM-SA` & `OMI-SA` in `JFT-Rapid` action set
  * Items must be grouped with names `OM-SA` or `OMI-SA` before processing
* **Max paper size:** `63.25"` (can be changed in `scripts.js` → `CONFIG.PAPER_MAX_SIZE`)

---

## 🛠 How It Works

### 1. Modes

* **B (Default):** Processes **Front** & **Back** separately.
* **FB:** Processes **Front + Back** together in one file.
* **PANT:** Processes only **Pant** items *(single size only)*.

---

### 2. Orientation

* **Auto (Default):** Automatically chooses orientation that saves the most paper.
* **V (Vertical):** All-over layout.
* **H (Horizontal):** Rotated 90°.
* **L (Cube Layout):** Front vertical + Back horizontal + mirrored 180°.

---

### 3. Size Management

* **Dialog UI** → Choose:

  * **Size Container** → Company name (e.g., JFT)
  * **Target Size** → Size values (M, L, XL, 2XL etc.)
  * **Mens / Baby sizes** → Example: Baby sizes (2, 4, 6, 8 etc.)

* **Size Tokens**

  * Must exist as a text frame named `SIZE_TKN` inside `Front` or `Back` group
  * Will be replaced by actual size name during processing

---

### 4. Opacity Mask Workflow

1. Group all objects that require masking → Name group `OM-SA` or `OMI-SA`.
2. Ensure groups are **unmasked before processing**.
3. After items are centered, the script finds these groups → Runs recorded actions.

---

### 5. Automatic (NANO) vs Manual Layout

#### Automatic NANO Layout (with JSON data)

* Each **Text Frame** inside `Front`, `Back`, or `Pant` must be named same as JSON property.
* Example JSON structure:

```json
{
  "M": [
    {
      "NAME": "DEV-SA",
      "NO": "009"
    }
  ],
  "L": [],
  "XL": []
}
```

➡️ In this case:

* `NAME` text frame = `DEV-SA`
* `NO` text frame = `009`

#### Manual Layout (by Quantity)

* User selects size, orientation, and quantity manually.

---

## 📥 Installation

### 1. Place Extension

Copy the extension into:

```
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\JFT-Rapid
```

**OR**

```
C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep
```

---

### 2. Enable Debug Mode (Windows)

1. Press `Win + R` → Type `regedit` → Enter.
2. Navigate to:

   ```
   Computer\HKEY_CURRENT_USER\Software\Adobe\CSXS.<version>
   ```
3. Add new **String Value** → `PlayerDebugMode` → Value = `1`.

---

### 3. Directory Structure

```
com.jftrapid.cep
│- CLIENT
│   ├─ CSInterface.js
│   ├─ index.html
│   ├─ main.js
│   ├─ style.css
│
│- CSXS
│   └─ manifest.xml
│
│- HOST
│   └─ script.js   (compiled from TypeScript)
│
│- .debug
│- jft.conf
```

---

## 🤝 Contribution

For development & contribution:

* Read **[Coordinate System Reference](docs/COORDINATE-SYSTEM.md)** for Illustrator UI & ExtendScript details.