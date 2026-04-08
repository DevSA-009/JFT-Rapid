// ─────────────────────────────────────────────────────────────────────────────
// JFTProcessSequentially.ts
//
// Responsibility:
//   Pure orchestrator — thin constructor that wires the two helper classes
//   together and dispatches to the correct processing path.
//
//   This file owns:
//     - All shared types and interfaces (ItemInfoEntry, JFTItem, etc.)
//     - Constructor: pre-compute via JFTItemResolver, dispatch to either
//       JFTGarmentPipeline (normal mode) or static mode via createEmptyData
//     - Static createEmptyData() — parses the compact static-mode input string
//
//   This file does NOT own:
//     - DOM scanning / item resolution  → JFTItemResolver
//     - Five-stage pipeline stages      → JFTGarmentPipeline
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared Types ─────────────────────────────────────────────────────────────

/**
 * Parameters forwarded to every `process*Item` method in `JFTGarmentPipeline`.
 */
interface ProcessItemParams {
  readonly jftItem: JFTItem;
  readonly itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  readonly sizeChar: ApparelSize;
}

/**
 * Pre-resolved DOM lookup table.
 * One entry per `PairObjectMarkers` value — `null` when not found in the document.
 */
type JFTItemCache = {
  -readonly [key in keyof typeof PairObjectMarkers]: JFTItem;
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Top-level orchestrator that resolves layer items and dispatches the garment
 * layout pipeline for one print job.
 *
 * @remarks
 * Accepts either a full `AutomateData` JSON string (normal mode) or a compact
 * key=value string (static mode). In static mode, {@link createEmptyData}
 * builds the required `AutomateData` structure from the compact string before
 * the pipeline is started.
 */
class JFTProcessSequentially {
  /** Pre-resolved item cache — populated by {@link JFTItemResolver.getItems}. */
  private readonly jftItemsCache: JFTItemCache = {} as JFTItemCache;

  /**
   * Normalises input, resolves layer items, and runs the garment pipeline.
   *
   * @param data - `AutomateData` JSON string in normal mode, or a compact
   *               key=value string in static mode (see {@link createEmptyData}).
   * @throws {Error} When static mode is active but `data` is not a non-empty string.
   * @throws {Error} When normal mode is active but `data` is falsy.
   * @throws {Error} When the resolved data has no size details to process.
   */
  constructor(data: AutomateData | string) {
    // ── Step 1: Normalise input to AutomateData ───────────────────────
    // Static mode accepts a compact "M=5,L=10" string in addition to a full
    // AutomateData object. Parsing is delegated to createEmptyData so this
    // constructor stays clean of string-parsing logic.

    // In static mode the caller must pass a non-empty string
    if (CONFIG.STATIC_MODE && (typeof data !== "string" || !data.trim()))
      throw new Error("Static mode requires a non-empty input string.");

    // In normal mode the caller must pass a non-empty JSON string or object
    if (!CONFIG.STATIC_MODE && !data)
      throw new Error("AutomateData or a JSON string is required.");

    const resolvedData: AutomateData = CONFIG.STATIC_MODE
      ? JFTProcessSequentially.createEmptyData(data as string)
      : (JSONSA.parse(data) as AutomateData);

    // Parsed data must contain a details map — empty means nothing to process
    if (
      !resolvedData ||
      !resolvedData.details ||
      Utils.isEmptyObject(resolvedData.details)
    )
      throw new Error(
        "Resolved data has no size details — nothing to process.",
      );

    // ── Step 2: Resolve layer items ───────────────────────────────────
    this.jftItemsCache = JFTItemResolver.getItems();

    // Nothing found in the layer — abort silently
    if (Utils.isEmptyObject(this.jftItemsCache)) return;

    // ── Step 3: Run the five-stage garment pipeline ───────────────────
    const pipeline = new JFTGarmentPipeline({
      data: Utils.deepCopy(resolvedData),
      jftItemsCache: this.jftItemsCache,
    });

    // ── Step 4: Show run summary ──────────────────────────────────────
    // Display after the pipeline completes so the user sees what was
    // processed and which expected markers were absent from the layer.
    alertDialogSA(pipeline.buildSummary(), true);
  }

  /**
   * Parses a compact static-mode input string into a full `AutomateData` object.
   *
   * ### Format
   * A single comma-separated line. All keys are case-insensitive.
   *
   * **Global keys** (appear anywhere in the string, all optional):
   * ```
   * TYPE=POLO        jersey type: POLO | TSHIRT              (default: POLO)
   * RIB=NO           rib type:    NO | RIB | CUFF            (default: NO)
   * SLV=S.L          active sleeve types, dot-separated      (default: S.L)
   * PANT=S.L         active pant types,   dot-separated      (default: S.L)
   * ```
   *
   * **Size entries** — `SIZE=qty` with optional dot-separated per-size overrides:
   * ```
   * SS<n>  short sleeve qty  (default: qty)
   * LS<n>  long sleeve qty   (default: qty)
   * SP<n>  short pant qty    (default: qty)
   * LP<n>  long pant qty     (default: qty)
   * ```
   *
   * ### Examples
   * ```
   * TYPE=TSHIRT,RIB=CUFF,SLV=S,XS=3,M=10.SS5.LS5,L=8.SP2.LP2
   * XS=5,M=10,L=8,2XL=3
   * TYPE=POLO,SLV=S.L,PANT=S,XS=3,S=5.SS2.LS1,M=10.SS5.LS5.SP2.LP2
   * ```
   *
   * @param str - Raw static-mode input string.
   * @returns Fully populated `AutomateData` with empty `DATA` arrays.
   * @throws {Error} When `str` is blank.
   */
  static createEmptyData(str: string): AutomateData {
    // Reject blank input before attempting to parse any segments
    if (!str || !str.trim())
      throw new Error("createEmptyData: input string must not be empty.");

    // Split on commas; trim each segment to remove accidental whitespace
    const rawSegments = str.trim().split(",");
    const segments: string[] = [];
    for (let s = 0; s < rawSegments.length; s++) {
      const trimmed = rawSegments[s].trim();
      if (trimmed) segments.push(trimmed);
    }

    // ── Parse global config keys ─────────────────────────────────────────

    let jerseyType: JerseyType = JerseyType.POLO;
    let ribType: RIBType = RIBType.NO;
    let activeSleeve: SleeveType[] = [SleeveType.SHORT, SleeveType.LONG];
    let activePant: SleeveType[] = [SleeveType.SHORT, SleeveType.LONG];

    // Indices of config segments — collected so they can be removed before size parsing
    const configIndices: number[] = [];

    for (let i = 0; i < segments.length; i++) {
      const upper = segments[i].toUpperCase();

      if (upper.indexOf("TYPE=") === 0) {
        // e.g. TYPE=TSHIRT
        jerseyType = upper.split("=")[1] as JerseyType;
        configIndices.push(i);
      } else if (upper.indexOf("RIB=") === 0) {
        // e.g. RIB=CUFF
        ribType = upper.split("=")[1] as RIBType;
        configIndices.push(i);
      } else if (upper.indexOf("SLV=") === 0) {
        // e.g. SLV=S.L  or  SLV=S  or  SLV=L
        const slvVal = upper.split("=")[1];
        const parts = slvVal.split(".");
        activeSleeve = [];
        for (let p = 0; p < parts.length; p++) {
          if (parts[p] === "S") activeSleeve.push(SleeveType.SHORT);
          if (parts[p] === "L") activeSleeve.push(SleeveType.LONG);
        }
        configIndices.push(i);
      } else if (upper.indexOf("PANT=") === 0) {
        // e.g. PANT=S  or  PANT=S.L
        const pantVal = upper.split("=")[1];
        const parts = pantVal.split(".");
        activePant = [];
        for (let p = 0; p < parts.length; p++) {
          if (parts[p] === "S") activePant.push(SleeveType.SHORT);
          if (parts[p] === "L") activePant.push(SleeveType.LONG);
        }
        configIndices.push(i);
      }
    }

    // Remove config segments in reverse order so splice indices stay valid
    for (let r = configIndices.length - 1; r >= 0; r--) {
      segments.splice(configIndices[r], 1);
    }

    // ── Build basic block ────────────────────────────────────────────────

    const basic: AutomateData["basic"] = {
      type: jerseyType,
      sleeve: activeSleeve,
      rib: {
        type: ribType,
        apply: activeSleeve,
      },
      pant: activePant,
      total: 0,
    };

    // ── Parse size entries ────────────────────────────────────────────────
    //
    // Each remaining segment has the form:
    //   SIZE=qty[.SS<n>][.LS<n>][.SP<n>][.LP<n>]
    //
    // e.g.  M=10          → BODY=10, all sleeves/pants default to 10
    //       M=10.SS5.LS5  → BODY=10, SHORT_SLEEVE=5, LONG_SLEEVE=5, pants=10
    //       L=8.SP2.LP2   → BODY=8,  sleeves=8, SHORT_PANT=2, LONG_PANT=2

    // Holds parsed qty data keyed by size character string
    const sizeEntries: Record<
      string,
      {
        body: number;
        ss: number; // SHORT_SLEEVE
        ls: number; // LONG_SLEEVE
        sp: number; // SHORT_PANT
        lp: number; // LONG_PANT
      }
    > = {};

    for (let i = 0; i < segments.length; i++) {
      const upper = segments[i].toUpperCase();

      // First dot-part contains SIZE=qty; remaining parts are optional overrides
      const dotParts = upper.split(".");

      // First part must follow SIZE=qty pattern
      const eqParts = dotParts[0].split("=");
      if (eqParts.length !== 2) continue;

      const sizeChar = eqParts[0] as ApparelSize;
      const bodyQty = parseInt(eqParts[1]) || 0;

      // Skip unrecognised size keys
      if (!(sizeChar in SIZE_ORDER_MAP)) continue;

      // Default all per-type counts to bodyQty; override tokens replace individual values
      let ss = bodyQty;
      let ls = bodyQty;
      let sp = bodyQty;
      let lp = bodyQty;

      // Parse optional override tokens: SS<n>, LS<n>, SP<n>, LP<n>
      for (let d = 1; d < dotParts.length; d++) {
        const token = dotParts[d];
        if (token.indexOf("SS") === 0) ss = parseInt(token.substring(2)) || 0;
        else if (token.indexOf("LS") === 0)
          ls = parseInt(token.substring(2)) || 0;
        else if (token.indexOf("SP") === 0)
          sp = parseInt(token.substring(2)) || 0;
        else if (token.indexOf("LP") === 0)
          lp = parseInt(token.substring(2)) || 0;
      }

      sizeEntries[sizeChar] = { body: bodyQty, ss, ls, sp, lp };

      // Accumulate total from BODY qty only
      basic.total += bodyQty;
    }

    // ── Build details map for all known sizes ────────────────────────────

    const fake_details = {} as AutomateData["details"];
    const allSizes = Object.keys(SIZE_ORDER_MAP);

    for (let s = 0; s < allSizes.length; s++) {
      const sizeChar = allSizes[s] as ApparelSize;
      const entry = sizeEntries[sizeChar];

      // Sizes absent from the input get zero counts
      const body = entry ? entry.body : 0;
      const ss = entry ? entry.ss : 0;
      const ls = entry ? entry.ls : 0;
      const sp = entry ? entry.sp : 0;
      const lp = entry ? entry.lp : 0;

      // Static mode carries no player names or numbers — DATA stays empty.
      // The filter step in generateLayoutDoc is a no-op on an empty array.
      fake_details[sizeChar] = {
        SUMMARY: {
          BODY: body,
          SHORT_SLEEVE: ss,
          LONG_SLEEVE: ls,
          SHORT_PANT: sp,
          LONG_PANT: lp,
        },
        DATA: [],
      };
    }

    const data: AutomateData = {
      basic,
      details: fake_details,
    };

    return data;
  }
}
