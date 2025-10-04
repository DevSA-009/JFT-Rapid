# 🎨 JFT Rapid Script

## 📋 Overview

JFT Rapid Script is an automation tool designed for jersey designers working in Adobe Illustrator. It streamlines the process of laying out jersey components (Front, Back, and Pant parts) based on printing paper size, and automates the application of player names, numbers, and other text elements.

---

## ✨ Key Features

### 🖥️ **User Interface**
- Custom CEP panel with intuitive icon-based interactive buttons
- Native GUI dialog built with ScriptUI for option selection
- Custom loader to display process progress

### 📐 **Layout Modes**
- **B (Both Separate)**: Process Front and Back parts separately and save them in different files
- **FB (Front & Back)**: Process both Front and Back simultaneously and save in a single file
- **PANT**: Process only pant items (currently supports single size only)

### 🔄 **Orientation Options**
- **Auto**: Automatically determines the most efficient orientation that uses the least paper *(recommended)*
- **V (Vertical/Allover)**: Vertical layout
- **H (Horizontal)**: Horizontal layout with 90° rotation
- **L (L-Shape)**: Special layout where Front is vertical, Back is horizontal, then both are copied, rotated 180°, and positioned to create a cube shape with an empty center

### 📏 **Size Management**
- **Size Container**: Dropdown field displaying company names (e.g., "JFT", "Nike", "Adidas")
- **Target Size**: Dropdown field showing all available sizes from the selected container
  - Mixed sizes including MENS (M, L, XL, 2XL, 3XL, etc.)
  - And BABY sizes (2, 4, 6, 8, 10, 12, 14, 16)
- Automatic size token value application for body items

### 🎯 **Layout Methods**

#### 🤖 Automatic NANO Layout
- Automates text application based on JSON data structure
- Automatically matches data fields with text frame object names
- Supports multiple players/people per size
- Applies property values when text frame names match data field names

#### ✍️ Manual Layout
- Layout by quantity input
- Supports size selection and other customization options

### 📝 **Text Automation**
- Automatic application of text values to NAME, NUMBER, and other text objects
- Text frame object names must match data property names for value application
- Optional outline creation for changed text in automatic mode
- **SIZE_TKN**: Special text frame object that receives the selected Target Size value (e.g., M, L, XL, 2, 4, 6)

### 🎭 **Opacity Mask Handling**
- Supports pre-recorded actions from "JFT-Rapid" action set:
  - **OM-SA**: Creates opacity mask only
  - **OMI-SA**: Creates opacity mask with invert
- Applies masks after document items are centered on the artboard

### 🛠️ **Additional Tools**
- Configurable maximum columns per document
- Adjustable item distribution gap
- Utility buttons: Move After, Tweak, Marker, Checking
- Item validation before processing
- Alert dialogs with appropriate messages

### ⚙️ **Configuration**
- `jft.conf` file stores settings and size containers
- Configurable paper size (maximum: 63.25")
- Measurement support in inches only

---

## 💾 Installation

### 🔓 Prerequisites

**Enable Debug Mode for Adobe CEP Extensions (Windows):**

1. Press `Win + R`, type `regedit`, and press **Enter** to open Registry Editor
2. Navigate to: `HKEY_CURRENT_USER\Software\Adobe\CSXS\Version`
3. Create a new **String Value** named `PlayerDebugMode`
4. Set its value to `1`

### 📁 Directory Structure

Place the extension in one of the following locations:

**Option 1:**
```
C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\JFT-Rapid
```

**Option 2 (Recommended):**
```
C:\Users\<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep
```

**Required Directory Structure:**
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
├── .debug
└── jft.conf
```

---

## ⚠️ Important Requirements

### 📄 Configuration File
> **Required**: `jft.conf` must exist in the CEP extensions directory and contain at least one size container with sizes.

### 🏷️ Size Token Setup
- Body items (Front, Back, Pant) must be group items with **uppercase names** at the top level
- Front and Back groups must contain a text frame object named **`SIZE_TKN`**
- `SIZE_TKN` must be directly inside the group (not nested or outside)
- **`SIZE_TKN` value is automatically populated with the selected Target Size** (e.g., M, L, XL, 2, 4, 6)

### 🎭 Opacity Mask Setup
> ⚠️ **Important**: Items to be masked must be ungrouped before processing

- Create groups named either `OM-SA` or `OMI-SA` containing items to be masked
- Pre-record corresponding actions in the "JFT-Rapid" action set before use
- Masks are applied after items are centered on the artboard

### 🔖 Marker System
- Objects must be marked using marker buttons for identification
- Select objects and click the appropriate marker button (e.g., Front icon) before processing

### ✏️ Text Automation Requirements
- Text frame objects for automation must be directly inside body/pant groups (not nested or outside)
- **Text frame object names must exactly match data property names** for value application
- Empty property values will apply empty text
- Unmatched field names are safely bypassed without errors

---

## 📊 Data Structure for Automatic NANO Layout

The data should be in **minified JSON format** with the following structure:

```json
{
  "2": [],
  "4": [],
  "6": [],
  "8": [],
  "10": [],
  "12": [],
  "14": [],
  "16": [],
  "XS": [],
  "S": [],
  "M": [
    {
      "NAME": "DEV-SA",
      "NO": "009"
    }
  ],
  "L": [],
  "XL": [],
  "2XL": [],
  "3XL": [],
  "4XL": [],
  "5XL": [],
  "GK": {
    "2": [],
    "4": [],
    "5XL": []
  }
}
```

### 🔍 How it works:

- Each size (M, L, XL, 2, 4, 6, etc.) contains an array of player/person data
- Each data object contains properties like `NAME`, `NO`, or any custom field
- **Text frame objects with names matching data properties** will have the corresponding values applied
- Empty arrays mean no data for that size
- If a property value is empty, empty text is applied
- The selected **Target Size value is automatically applied to `SIZE_TKN`** text frame objects

---

## 🚀 Workflow

### 1️⃣ **Mode Selection**
| Mode | Description |
|------|-------------|
| **B** *(Default)* | Front and Back are processed and saved separately; front filename includes quantity |
| **FB** | Front and Back are processed together and saved in one file |
| **PANT** | Only handles pant items (single size support only) |

### 2️⃣ **Orientation Selection**
| Orientation | Description |
|-------------|-------------|
| **Auto** *(Recommended)* | Analyzes all orientations and selects the one using least paper |
| **V** | Vertical layout |
| **H** | Horizontal layout with 90° rotation |
| **L** | L-shaped layout creating cube pattern |

### 3️⃣ **Size Selection**
1. **Size Container**: Select company name from dropdown (e.g., "JFT", "Nike")
2. **Target Size**: Select specific size from dropdown
   - Shows mixed sizes: 2, 4, 6, 8, 10, 12, 14, 16, M, L, XL, 2XL, 3XL, 4XL, 5XL
   - Selected size is automatically applied to `SIZE_TKN` text frame objects

> 💡 **Note**: Size selection applies to body items only (not pants)

### 4️⃣ **Processing Steps**

1. ✅ Mark objects using appropriate marker buttons
2. 🏷️ Set up `SIZE_TKN` text frame objects in body groups
3. 🎭 Configure opacity mask groups if needed (OM-SA or OMI-SA)
4. 📐 Select layout mode and orientation
5. 📏 Choose Size Container (company) and Target Size
6. 🤖 For automatic mode: prepare JSON data with matching property names
7. ✍️ For manual mode: input quantity
8. ▶️ Run the process

---

## 🔧 Configuration

### 📄 Maximum Paper Size
Default maximum paper size is **63.25"**. To modify:

```javascript
// Edit script.js file
CONFIG.PAPER_MAX_SIZE = 63.25; // Change this value
```

---

## 👨‍💻 For Contributors

> 📚 **Documentation**: For detailed information about the coordinate systems used in Illustrator UI and ExtendScript, please refer to [COORDINATE SYSTEM](docs/COORDINATE-SYSTEM.md)

---

## ⚠️ Known Limitations

| Limitation | Details |
|------------|---------|
| 📏 Measurement | Inches only |
| 👖 PANT Mode | Single size support only |
| 🎭 Masked Items | Cannot transform already-masked items (ExtendScript limitation) |

---

## 📞 Support

For issues, questions, or feature requests, please refer to the project documentation or contact the development team.

---

<div align="center">

**Version**: 1.0  
**Compatibility**: Adobe Illustrator with CEP support  
**Platform**: Windows

---

Made with ❤️ for Jersey Designers

</div>