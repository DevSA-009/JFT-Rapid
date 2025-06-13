> [!IMPORTANT]  
> ## **Coordinate System Reference**
> For more information about the coordinate systems used in Illustrator UI and ExtendScript, please refer to the detailed explanation in [COORDINATE SYSTEM](docs/COORDINATE-SYSTEM.md)

---

# Enabling Debug Mode for Adobe CEP Extensions (Windows)

To enable Debug Mode for Adobe CEP extensions, follow these steps:

### Step 1: Store the CEP Extension
1. Make sure your CEP extension is located in the following folder:

   `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\JFT-Rapid`

### Or

   `C:\Users<YourUsername>\AppData\Roaming\Adobe\CEP\extensions\com.jftrapid.cep`

### Step 2: Enable Debug Mode via the Registry Editor
1. Press `Win + R` to open the **Run** dialog box.
2. Type `regedit` and press **Enter** to open the **Registry Editor**.
3. In the Registry Editor, navigate to the following path:

   `Computer\HKEY_CURRENT_USER\Software\Adobe\CXSXVersion`

4. Create a new entry:
   - Right-click in the right pane, select **New > String Value**.
   - Name the new value **PlayerDebugMode**.
   - Set its value to **1**.