/**
 * @file MachineGuard.ts
 * @description Adobe Illustrator device limit utility.
 *
 * Encryption approach - LFSR keystream cipher:
 *   1. The secret key seeds a 16-tap Linear Feedback Shift Register (LFSR).
 *   2. The LFSR produces a deterministic pseudo-random byte stream.
 *   3. Every source character is XOR'd against one LFSR byte.
 *   4. The XOR result is folded into the printable ASCII range [32–126]
 *      via (value mod 95) + 32, so all output characters are safe,
 *      visible, and copy-pasteable.
 *   5. Decryption seeds an identical LFSR and reverses the XOR.
 */

// ─── Secret key ────────────────────────────────────────────────────────────
/** Master secret used to seed the LFSR. Keep this out of version control. */
const SECRET_KEY =
  "453c912cb4c8351f4e96dbdcbacd83e01c1a376b04c71951576e85b90bf4574e";

// ─── LFSR configuration ────────────────────────────────────────────────────
/**
 * Tap positions for the 16-bit Galois LFSR.
 * Taps (16, 15, 13, 4) produce a maximal-length sequence of 65 535 before repeating.
 */
const LFSR_TAPS: readonly number[] = [16, 15, 13, 4];

// ─── MachineGuard class ────────────────────────────────────────────────────

/**
 * @class MachineGuard
 * @description Encrypts, decrypts, and verifies machine hardware IDs so that
 * an Adobe Illustrator script can be locked to a specific device.
 * Supports both Windows (WMI UUID) and macOS (IOPlatformUUID).
 */
class MachineGuard {
  // ── LFSR helpers ──────────────────────────────────────────────────────────

  /**
   * Derives a non-zero 16-bit LFSR seed from the secret key.
   * Every character in the key influences the seed via XOR + prime mixing.
   *
   * @param key - The secret key string.
   * @returns   A non-zero 16-bit integer (1–65 535).
   */
  private static _keyToSeed(key: string): number {
    // Start with a non-zero value so the LFSR never stalls at the all-zero state.
    let seed: number = 0xace1;

    for (let i = 0; i < key.length; i++) {
      // XOR the running seed with the current key character code.
      seed ^= key.charCodeAt(i);
      // Mix further using a prime multiplier to spread bit influence.
      seed = (seed * 31 + key.charCodeAt(i)) & 0xffff;
    }

    // LFSR must never be seeded with 0 - substitute a safe fallback.
    return seed === 0 ? 0x1234 : seed;
  }

  /**
   * Advances a 16-bit Galois LFSR by one step.
   * The LSB is the output bit; when 1, the register is XOR'd with the tap polynomial.
   *
   * @param state - Current 16-bit register value.
   * @returns `{ byte, nextState }` - one keystream byte and the updated register.
   */
  private static _lfsrStep(state: number): {
    bytes: number;
    nextState: number;
  } {
    // The LSB of the current state is this step's output bit.
    const outputBit: number = state & 1;

    // Right-shift the register by one position.
    let nextState: number = state >>> 1;

    // When the output bit is 1, XOR the register with the tap polynomial.
    if (outputBit === 1) {
      // Build the tap bitmask - each tap n contributes bit (n-1).
      let tapMask: number = 0;
      for (const tap of LFSR_TAPS) {
        tapMask |= 1 << (tap - 1);
      }
      nextState ^= tapMask;
    }

    // Use the lower 8 bits of the new state as the keystream byte.
    const bytes: number = nextState & 0xff;

    return { bytes, nextState };
  }

  /**
   * Generates a keystream of `length` bytes seeded from `key`.
   * The LFSR is stepped once per byte; lower 8 bits of each state form the stream.
   *
   * @param key    - Secret key string used to derive the seed.
   * @param length - Number of keystream bytes to generate.
   * @returns Array of `length` pseudo-random bytes (0–255).
   */
  private static _generateKeystream(key: string, length: number): number[] {
    // Derive the initial register state from the secret key.
    let state: number = MachineGuard._keyToSeed(key);

    const stream: number[] = [];

    for (let i = 0; i < length; i++) {
      // Step the LFSR and collect one output byte.
      const { bytes, nextState } = MachineGuard._lfsrStep(state);
      stream.push(bytes);
      // Carry the updated state into the next iteration.
      state = nextState;
    }

    return stream;
  }

  // ── ASCII-safe encoding ───────────────────────────────────────────────────

  /**
   * Maps any integer into the printable ASCII range [32–126].
   * Formula: (value mod 95 + 95) mod 95 + 32  - handles negatives safely.
   *
   * @param value - Any integer (typically the result of an XOR operation).
   * @returns A character code in [32, 126].
   */
  private static _toAsciiCode(value: number): number {
    // 95 printable ASCII characters span codes 32 (space) through 126 (~).
    const PRINTABLE_COUNT = 95;
    // Double-mod pattern ensures negative values also land in [0, 94].
    return (
      (((value % PRINTABLE_COUNT) + PRINTABLE_COUNT) % PRINTABLE_COUNT) + 32
    );
  }

  /**
   * Reverses `_toAsciiCode` by stripping the +32 ASCII offset.
   *
   * @param charCode - A character code in [32, 126].
   * @returns The intermediate value before the +32 offset was applied.
   */
  private static _fromAsciiCode(charCode: number): number {
    // Undo the +32 shift applied during encoding.
    return charCode - 32;
  }

  // ── Public encrypt / decrypt ──────────────────────────────────────────────

  /**
   * Encodes one XOR byte (0–255) as two printable ASCII characters.
   * High nibble maps to [32–47], low nibble maps to [48–63] - both fully printable.
   * Output is always 2 chars per input byte, making decoding unambiguous.
   *
   * @param b - A byte value in [0, 255].
   * @returns  Two-character ASCII string.
   */
  private static _encodeByte(b: number): string {
    // Split the byte into two 4-bit nibbles.
    const hi: number = (b >>> 4) & 0xf; // upper 4 bits → value 0–15
    const lo: number = b & 0xf; // lower 4 bits → value 0–15

    // Offset each nibble into a distinct printable ASCII band.
    return String.fromCharCode(hi + 32) + String.fromCharCode(lo + 48);
  }

  /**
   * Reverses `_encodeByte` - reads two chars and recovers the original byte.
   *
   * @param a - First char (encodes high nibble, offset 32).
   * @param b - Second char (encodes low nibble, offset 48).
   * @returns  The original byte value in [0, 255].
   */
  private static _decodeByte(a: string, b: string): number {
    // Undo the offsets applied in _encodeByte.
    const hi: number = a.charCodeAt(0) - 32; // recover high nibble
    const lo: number = b.charCodeAt(0) - 48; // recover low nibble

    // Reconstruct the original byte.
    return ((hi & 0xf) << 4) | (lo & 0xf);
  }

  /**
   * Encrypts a plaintext string into a printable ASCII ciphertext string.
   *
   * Per character: cipherChar = toAsciiCode( plainChar XOR keystreamByte )
   *
   * @param plaintext - The string to encrypt (e.g. a hardware UUID).
   * @param key       - Secret key; defaults to SECRET_KEY.
   * @returns Printable ASCII ciphertext of the same length, or "" on bad input.
   */
  static encrypt(plaintext: string, key: string = SECRET_KEY): string {
    if (!plaintext || !key) return "";

    const keystream: number[] = MachineGuard._generateKeystream(
      key,
      plaintext.length,
    );

    let ciphertext: string = "";
    for (let i = 0; i < plaintext.length; i++) {
      // XOR the plaintext char code with its keystream byte.
      const xorResult: number = plaintext.charCodeAt(i) ^ keystream[i];

      // Encode the full 0–255 XOR result losslessly as 2 ASCII chars.
      ciphertext += MachineGuard._encodeByte(xorResult);
    }

    return ciphertext;
  }

  /**
   * Decrypts a ciphertext produced by `encrypt` back to the original plaintext.
   * The LFSR is seeded identically, so the same keystream is reproduced exactly.
   *
   * @param ciphertext - The encrypted string returned by `encrypt`.
   * @param key        - Secret key; defaults to SECRET_KEY.
   * @returns Original plaintext string, or "" on bad input.
   */
  static decrypt(ciphertext: string, key: string = SECRET_KEY): string {
    if (!ciphertext || !key) return "";

    // Each plaintext char produces exactly 2 ciphertext chars.
    const plaintextLength: number = ciphertext.length / 2;
    const keystream: number[] = MachineGuard._generateKeystream(
      key,
      plaintextLength,
    );

    let plaintext: string = "";
    for (let i = 0; i < plaintextLength; i++) {
      // Read the pair of chars that encode one XOR byte.
      const xorResult: number = MachineGuard._decodeByte(
        ciphertext[i * 2],
        ciphertext[i * 2 + 1],
      );

      // XOR with the same keystream byte to recover the original char code.
      plaintext += String.fromCharCode(xorResult ^ keystream[i]);
    }

    return plaintext;
  }

  // ── Device verification ───────────────────────────────────────────────────

  /**
   * Verifies the current machine's hardware ID against a stored encrypted ID.
   *
   * Steps:
   *   1. Read the live hardware ID from the OS (Windows or macOS).
   *   2. Decrypt the stored encrypted ID with the provided key.
   *   3. Compare both IDs case-insensitively.
   *   4. Show an `alertDialogSA` message for every outcome.
   *
   * @param storedEncryptedID - Ciphertext produced when the device was authorised.
   * @param key         - Secret key used during the original encryption.
   * @returns `true` if the current machine matches the authorised machine.
   */
  verifyDevice(storedEncryptedID: string, key: string = SECRET_KEY): boolean {
    // Both arguments are required - abort early if either is missing.
    if (!storedEncryptedID || !key) {
      alertDialogSA("Auth failed: missing ID or key.");
      return false;
    }

    try {
      // Step 1 - Read the live hardware ID from this machine's OS.
      const currentID: string = MachineGuard.readHardwareID();

      // Abort if the OS query returned nothing usable.
      if (currentID === "Not Found" || currentID.trim().length < 10) {
        alertDialogSA("Auth failed: unable to read hardware ID.");
        return false;
      }

      // Step 2 - Decrypt the stored ciphertext to recover the authorised ID.
      const decryptedID: string = MachineGuard.decrypt(storedEncryptedID, key);

      // Step 3 - Compare trimmed, uppercased IDs (UUIDs are case-insensitive).
      const isMatch: boolean =
        decryptedID.trim().toUpperCase() === currentID.trim().toUpperCase();

      // Step 4 - Report the result via dialog.
      if (isMatch) {
        alertDialogSA("Device authorised.");
      } else {
        alertDialogSA("Auth failed: device not authorised.");
      }

      return isMatch;
    } catch (e: any) {
      // Surface any unexpected runtime error concisely.
      alertDialogSA("Auth error: " + e.message);
      return false;
    }
  }

  // ── Hardware ID reader ────────────────────────────────────────────────────

  /**
   * Reads the unique hardware ID of the current machine.
   * Dispatches to the correct OS-specific implementation automatically.
   *
   * - Windows : queries `Win32_ComputerSystemProduct.UUID` via PowerShell + WMI.
   * - macOS   : queries `IOPlatformUUID` via `system_profiler SPHardwareDataType`.
   *
   * @returns The raw hardware ID string, or `"Not Found"` on failure.
   */
  static readHardwareID(): string {
    const os: string = $.os.toLowerCase();

    if (os.includes("windows")) {
      // Delegate to the Windows-specific WMI reader.
      return MachineGuard._readWindowsUUID();
    } else if (os.includes("mac") || os.includes("darwin")) {
      // Delegate to the macOS-specific IOKit reader.
      return MachineGuard._readMacUUID();
    } else {
      // Unsupported OS - inform and return sentinel.
      alertDialogSA("Unsupported OS.");
      return "Not Found UUID";
    }
  }

  /**
   * Windows implementation: reads the hardware UUID via a hidden PowerShell call.
   *
   * Mechanism:
   *   1. Writes a tiny VBScript to the OS temp folder.
   *   2. VBScript launches PowerShell with `-WindowStyle Hidden` (no console flash).
   *   3. PowerShell queries WMI and writes the UUID to a second temp file.
   *   4. After an 8-second wait the result file is read then both files are deleted.
   *
   * @returns Raw UUID string from WMI, or `"Not Found"` on failure.
   */
  private static _readWindowsUUID(): string {
    // Temp file paths inside the OS temp folder.
    const vbsFile: File = new File(Folder.temp + "/mg_uid_query.vbs");
    const resultFile: File = new File(Folder.temp + "/mg_uid_result.txt");

    // VBScript: runs PowerShell silently and redirects UUID output to resultFile.
    const vbsContent: string =
      `Set WshShell = CreateObject("WScript.Shell")\r\n` +
      `WshShell.Run "powershell.exe -NoProfile -WindowStyle Hidden ` +
      `-ExecutionPolicy Bypass -Command ` +
      `""Get-CimInstance Win32_ComputerSystemProduct | ` +
      `Select-Object -ExpandProperty UUID"" > ${resultFile.fsName}", 0, False`;

    // Write the VBScript to disk.
    vbsFile.open("w");
    vbsFile.writeln(vbsContent);
    vbsFile.close();

    // Brief user notice - PowerShell needs a few seconds to respond.
    alertDialogSA("Verifying device - please wait ~8 s.");

    // Launch the VBScript (PowerShell runs in the background).
    vbsFile.execute();

    // Wait for PowerShell to finish writing the result file.
    $.sleep(8000);

    // Read the UUID from the result file, then clean up both temp files.
    let uuid: string = "Not Found";
    if (resultFile.exists) {
      resultFile.open("r");
      uuid = resultFile.read();
      resultFile.close();

      // Remove temp files - leave no trace on disk.
      resultFile.remove();
      vbsFile.remove();
    }

    return uuid;
  }

  /**
   * macOS implementation: reads `IOPlatformUUID` via a shell script.
   *
   * Mechanism:
   *   1. Writes a tiny shell script to the OS temp folder.
   *   2. The script calls `system_profiler SPHardwareDataType`, greps for
   *      `IOPlatformUUID`, and writes the value to a result file.
   *   3. After a 4-second wait (system_profiler is fast) the result is read
   *      and both temp files are deleted.
   *
   * @returns Raw IOPlatformUUID string, or `"Not Found"` on failure.
   */
  private static _readMacUUID(): string {
    // Temp file paths inside the OS temp folder.
    const shFile: File = new File(Folder.temp + "/mg_uid_query.sh");
    const resultFile: File = new File(Folder.temp + "/mg_uid_result.txt");

    // Shell script: extract only the UUID value and write it to resultFile.
    // `awk -F': '` splits on ': ' so field 2 is the bare UUID string.
    const shContent: string =
      `#!/bin/sh\n` +
      `system_profiler SPHardwareDataType ` +
      `| grep "Hardware UUID" ` +
      `| awk -F': ' '{print $2}' ` +
      `> "${resultFile.fsName}"`;

    // Write the shell script to disk.
    shFile.open("w");
    shFile.writeln(shContent);
    shFile.close();

    // Make the script executable (chmod +x) via a second shell call.
    // Illustrator's File.execute() on macOS runs the file through the shell.
    const chmodFile: File = new File(Folder.temp + "/mg_chmod.sh");
    chmodFile.open("w");
    chmodFile.writeln(
      `#!/bin/sh\nchmod +x "${shFile.fsName}"\n"${shFile.fsName}"`,
    );
    chmodFile.close();

    // Brief user notice - faster than Windows but still needs a moment.
    alertDialogSA("Verifying device - please wait ~4 s.");

    // Execute the chmod+run wrapper.
    chmodFile.execute();

    // Wait for system_profiler to finish.
    $.sleep(4000);

    // Read the UUID from the result file, then clean up all temp files.
    let uuid: string = "Not Found";
    if (resultFile.exists) {
      resultFile.open("r");
      uuid = resultFile.read();
      resultFile.close();

      // Remove all three temp files.
      resultFile.remove();
      shFile.remove();
      chmodFile.remove();
    }

    return uuid;
  }
}
