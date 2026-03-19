// ─────────────────────────────────────────────────────────────────────────────
// JFTStaticProcessor.ts
//
// Responsibility:
//   Everything specific to CONFIG.STATIC_MODE = true:
//
//   1. parseStaticModeString()   — parse "M=5,L=10" → AutomateData skeleton
//   2. run()                     — entry point called by JFTProcessSequentially
//   3. collectSortedItems()      — scan visible layer items, match markers,
//                                  deduplicate pairs, sort by pipeline order
//   4. dispatchItem()            — per-item SIZES_DETAILS dimension lookup
//                                  + GridLayoutGenerator dispatch
//   5. dispatchLayout()          — thin single-call wrapper for GridLayoutGenerator
//
// Sorting order mirrors the normal garment pipeline:
//   NECK (NCK/CLR/PLK) → RIB (S_RIB/L_RIB) → SLEEVE (S_SLV/L_SLV)
//   → BODY → PANT (S_PANT/L_PANT)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Canonical sort order for static-mode processing.
 * Mirrors the five-stage garment pipeline executed in normal mode:
 *   Neck → Rib → Sleeve → Body → Pant
 *
 * Lower index = processed first.  Markers absent from this list receive
 * index `Infinity` and are appended at the end.
 */
const STATIC_MARKER_ORDER: Record<string, number> = {
  // Stage 1 — Neck area
  [PairObjectMarkers.NECK]: 0,
  [PairObjectMarkers.PLACKET]: 1,
  [PairObjectMarkers.COLLAR]: 2,
  // Stage 2 — Rib
  [PairObjectMarkers.SHORT_SLV_RIB]: 3,
  [PairObjectMarkers.LONG_SLV_RIB]: 4,
  // Stage 3 — Sleeve
  [PairObjectMarkers.SHORT_SLV]: 5,
  [PairObjectMarkers.LONG_SLV]: 6,
  // Stage 4 — Body
  [PairObjectMarkers.BODY]: 7,
  // Stage 5 — Pant
  [PairObjectMarkers.SHORT_PANT]: 8,
  [PairObjectMarkers.LONG_PANT]: 9,
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drives the static-mode layout pass when `CONFIG.STATIC_MODE` is `true`.
 *
 * ### What "static mode" means
 * In normal mode the pipeline is data-driven: it reads `AutomateData.basic`
 * to know which garment parts exist and then looks them up in the document.
 * In static mode the document itself is the source of truth — every visible,
 * unlocked item in the active layer is a candidate for layout generation,
 * and the input is a simple size=quantity string instead of full order data.
 *
 * ### Core differences from the normal pipeline
 * | Normal mode | Static mode |
 * |---|---|
 * | Items discovered by stage (neck→body→pant) | All items discovered in one flat scan |
 * | `pair` comes from name markers | `pair` always forced to `true` |
 * | Text frames injected with player data | No text injection — `isDynamic` forced false |
 * | Quantity from `DATA.length` / `SUMMARY` | Quantity from parsed size=qty string |
 * | Output filename may omit qty (dynamic docs) | Output filename always includes qty |
 * | Stage order determined by pipeline config | Sort order mirrors pipeline canonical order |
 *
 * ### Quantity per size — important
 * `parseStaticModeString("M=5,L=10")` stores qty=5 for M and qty=10 for L by
 * filling `details[size].DATA` with that many empty placeholder rows.
 * `DATA.length` therefore equals the per-size quantity — the same lookup path
 * used by the normal neck/body stages — so no interface change is required.
 *
 * ### Sort order
 * Items are sorted by {@link STATIC_MARKER_ORDER} after collection so output
 * files are always generated in the same canonical garment-part order regardless
 * of where the items happen to sit in the document z-stack.
 */
class JFTStaticProcessor {
  // ─── Private state ────────────────────────────────────────────────────────

  /** Per-size quantity and summary data (from the parsed input string). */
  private readonly details: AutomateData["details"];

  /** Sum of all per-size quantities. */
  private readonly totalQTY: number;

  /** Only sizes that have at least one DATA row (i.e. qty > 0). */
  private readonly activeSizes: ApparelSize[];

  /**
   * Shared resolver used to convert raw PageItems → structured JFTItems.
   * Reuses the same `itemInfo` / `resolveItem` logic as the normal pipeline.
   */
  private readonly resolver: JFTItemResolver;

  // ─── Constructor ──────────────────────────────────────────────────────────

  /**
   * @param details     - Parsed per-size detail map (from `parseStaticModeString`).
   * @param totalQTY    - Sum of all parsed quantities.
   * @param activeSizes - Pre-filtered list of sizes with qty > 0.
   * @param resolver    - Shared `JFTItemResolver` instance.
   */
  constructor(
    details: AutomateData["details"],
    totalQTY: number,
    activeSizes: ApparelSize[],
    resolver: JFTItemResolver,
  ) {
    this.details = details;
    this.totalQTY = totalQTY;
    this.activeSizes = activeSizes;
    this.resolver = resolver;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Entry point — called by `JFTProcessSequentially` when `CONFIG.STATIC_MODE`
   * is `true`.
   *
   * Scans the active layer, matches items to recognised markers, sorts them
   * in pipeline order, then dispatches `GridLayoutGenerator` for each item
   * across all active sizes.
   */
  run(): void {
    // Collect and sort all resolved items in one pass
    const sortedItems = this.collectSortedItems();

    // Dispatch layout generation for each item
    for (let i = 0; i < sortedItems.length; i++) {
      const { jftItem, markerVal } = sortedItems[i];
      this.dispatchItem(jftItem, markerVal);
    }
  }

  // ─── Static factory ───────────────────────────────────────────────────────

  /**
   * Parses a compact size=quantity string into a full `AutomateData` skeleton
   * ready for static-mode grid layout generation.
   *
   * ### Input format
   * ```
   * "M=5, L=10, XL=3"
   * ```
   * - Comma-separated entries.
   * - Each entry is `<ApparelSize>=<positiveInteger>`.
   * - All whitespace is stripped before parsing.
   * - Trailing commas are tolerated (empty tokens are skipped).
   *
   * ### Per-size quantity encoding
   * The parsed quantity for each size is stored as `DATA.length` — the
   * `details[size].DATA` array is filled with `qty` empty placeholder
   * objects.  This means:
   * - `"M=5"` → `details["M"].DATA` has 5 rows → `DATA.length === 5`
   * - The existing `DATA.length` quantity lookup in the dispatch methods
   *   returns the correct per-size value without any interface changes.
   *
   * ### Returned object defaults
   * | Field | Value | Reason |
   * |---|---|---|
   * | `basic.type` | `JerseyType.TSHIRT` | Irrelevant — pipeline is bypassed |
   * | `basic.sleeve` | `[]` | No sleeve stage in static mode |
   * | `basic.rib` | `{ type: NO, apply: [] }` | No rib stage |
   * | `basic.pant` | `[]` | No pant stage |
   * | `basic.total` | Sum of all qtys | Used as fallback quantity |
   * | `details[s].SUMMARY` | All zeros | Not read in static mode |
   *
   * @param input - Raw size=quantity string (e.g. `"M=5,L=10,XL=3"`).
   * @returns A fully structured `AutomateData` object.
   * @throws {Error} When `input` is empty, malformed, or contains non-positive quantities.
   *
   * @example
   * ```typescript
   * const data = JFTStaticProcessor.parseStaticModeString("M=5, L=10");
   * // data.basic.total       === 15
   * // data.details["M"].DATA.length === 5
   * // data.details["L"].DATA.length === 10
   * ```
   */
  static parseStaticModeString(input: string): AutomateData {
    // ── 1. Guard: reject blank input ────────────────────────────────────
    if (!input || !input.replace(/\s/g, "")) {
      throw new Error(
        'parseStaticModeString: input is empty. Expected format: "M=5,L=10"',
      );
    }

    // ── 2. Strip ALL whitespace — handles "M = 5 , L = 10" gracefully ───
    const cleaned = input.replace(/\s/g, "");

    // ── 3. Split into "SIZE=QTY" tokens ─────────────────────────────────
    const tokens = cleaned.split(",");

    const details = {} as AutomateData["details"];
    let totalQty = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Skip empty tokens (trailing comma edge case)
      if (!token) continue;

      // Find the first "=" — handles size keys like "2XL", "4XL"
      const eqIndex = token.indexOf("=");

      if (eqIndex === -1) {
        throw new Error(
          `parseStaticModeString: malformed token "${token}". Expected "SIZE=QTY".`,
        );
      }

      const sizeKey = token.substring(0, eqIndex) as ApparelSize;
      const qtyStr = token.substring(eqIndex + 1);
      const qty = parseInt(qtyStr, 10);

      if (isNaN(qty) || qty <= 0) {
        throw new Error(
          `parseStaticModeString: invalid quantity "${qtyStr}" for size "${sizeKey}". Must be a positive integer.`,
        );
      }

      totalQty += qty;

      // Fill DATA with `qty` empty placeholder rows so DATA.length === qty.
      // This lets the normal "DATA.length" quantity lookup return the correct
      // per-size value without any interface changes to AutomateData.
      const dataRows: AutomateData["details"][ApparelSize]["DATA"] = [];
      for (let r = 0; r < qty; r++) {
        // Empty placeholder — no frame names to inject in static mode
        dataRows.push({} as any);
      }

      details[sizeKey] = {
        DATA: dataRows,
        SUMMARY: {
          SLEEVE: {
            [SleeveType.SHORT]: 0,
            [SleeveType.LONG]: 0,
          } as Record<SleeveType.LONG | SleeveType.SHORT, number>,
          PANT: {
            [SleeveType.SHORT]: 0,
            [SleeveType.LONG]: 0,
          } as Record<SleeveType.LONG | SleeveType.SHORT, number>,
        },
      };
    }

    // ── 4. Guard: at least one valid entry ───────────────────────────────
    if (totalQty === 0) {
      throw new Error(
        "parseStaticModeString: no valid size/quantity pairs found in input.",
      );
    }

    // ── 5. Assemble full AutomateData skeleton ───────────────────────────
    return {
      basic: {
        type: JerseyType.TSHIRT, // default — irrelevant in static mode
        sleeve: [], // no sleeve stage
        rib: { type: RIBType.NO, apply: [] }, // no rib stage
        pant: [], // no pant stage
        total: totalQty,
      },
      details,
    };
  }

  // ─── Private: Item collection ─────────────────────────────────────────────

  /**
   * Scans the active layer for visible, unlocked items, matches each against
   * `PairObjectMarkers`, deduplicates pairs, resolves `JFTItem` metadata, forces
   * `pair = true`, and returns the results sorted in canonical pipeline order.
   *
   * ### Sort order
   * Results are sorted by {@link STATIC_MARKER_ORDER}:
   * `Neck → Rib → Sleeve → Body → Pant`
   *
   * This guarantees that output files are always generated in the same order
   * regardless of the document z-stack order.
   *
   * @returns Array of `{ jftItem, markerVal }` pairs in canonical sort order.
   * @private
   */
  private collectSortedItems(): Array<{ jftItem: JFTItem; markerVal: string }> {
    // ── 1. Fetch all visible + unlocked items ────────────────────────────
    const allPageItems = Organizer.pageItemsToArray(
      app.activeDocument.activeLayer.pageItems,
    );

    const visibleItems: PageItem[] = [];
    for (let i = 0; i < allPageItems.length; i++) {
      const item = allPageItems[i];
      // Include only items the operator can see and interact with
      if (!item.hidden && !item.locked) {
        visibleItems.push(item);
      }
    }

    if (!visibleItems.length) return [];

    // ── 2. Match items to PairObjectMarkers — deduplicate pairs ──────────
    // Pairs share the same marker value — we only call resolveItem() once
    // per marker so itemInfo() receives both items together (1-or-2 collect).
    const processedMarkers: Record<string, boolean> = {};
    const collected: Array<{ jftItem: JFTItem; markerVal: string }> = [];

    const markerKeys = ES6_SA.objectKeys(
      PairObjectMarkers,
    ) as (keyof typeof PairObjectMarkers)[];

    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];

      // Search the item name for a recognised marker value (_MARKER_ pattern)
      let matchedMarkerVal: string | null = null;

      for (let m = 0; m < markerKeys.length; m++) {
        const markerVal = PairObjectMarkers[markerKeys[m]];
        if (ES6_SA.stringIncludes(item.name, `_${markerVal}_`)) {
          matchedMarkerVal = markerVal;
          break;
        }
      }

      // Skip items with no recognised marker in their name
      if (!matchedMarkerVal) continue;

      // Skip markers already resolved — the paired sibling shares the marker
      if (processedMarkers[matchedMarkerVal]) continue;
      processedMarkers[matchedMarkerVal] = true;

      // Resolve up to 2 items for this marker using the shared resolver
      const jftItem = this.resolver.resolveItem(matchedMarkerVal, visibleItems);
      if (!jftItem) continue;

      // ── 3. Force pair = true ─────────────────────────────────────────────
      // Static mode always treats items as paired sets regardless of dynamic /
      // PAIR marker presence in the item name.
      (jftItem.info as { pair: boolean }).pair = true;

      collected.push({ jftItem, markerVal: matchedMarkerVal });
    }

    // ── 4. Sort by canonical pipeline order ──────────────────────────────
    // Items not present in STATIC_MARKER_ORDER go to the end (Infinity).
    collected.sort((a, b) => {
      const orderA =
        STATIC_MARKER_ORDER[a.markerVal] !== undefined
          ? STATIC_MARKER_ORDER[a.markerVal]
          : Infinity;
      const orderB =
        STATIC_MARKER_ORDER[b.markerVal] !== undefined
          ? STATIC_MARKER_ORDER[b.markerVal]
          : Infinity;
      return orderA - orderB;
    });

    return collected;
  }

  // ─── Private: Per-item dispatch ───────────────────────────────────────────

  /**
   * Iterates over `activeSizes` for one resolved `JFTItem` and calls
   * {@link dispatchLayout} with the correct dimension from `CONFIG.SIZES_DETAILS`.
   *
   * ### Dimension lookup paths (mirrors normal pipeline stages exactly)
   * | Marker(s)             | `SIZES_DETAILS` path                    |
   * |-----------------------|-----------------------------------------|
   * | `BODY`                | `[size].BODY`                           |
   * | `NCK` / `CLR` / `PLK`| `[size].NECK_AREA[itemType]`            |
   * | `S_SLV` / `L_SLV`    | `[size].SLEEVE[sleeveType].SIZE`        |
   * | `S_RIB` / `L_RIB`    | `[size].SLEEVE[sleeveType].RIB`         |
   * | `S_PANT` / `L_PANT`  | `[size].PANT[pantType].FRONT` + `.BACK` |
   *
   * Pant markers dispatch **twice** per size (FRONT then BACK).
   *
   * ### Quantity
   * `details[sizeChar].DATA.length` equals the per-size qty encoded by
   * `parseStaticModeString` — no special-casing needed here.
   *
   * @param jftItem   - Resolved, pair-forced `JFTItem`.
   * @param markerVal - Raw `PairObjectMarkers` value (e.g. `"BODY"`, `"S_SLV"`).
   * @private
   */
  private dispatchItem(jftItem: JFTItem, markerVal: string): void {
    const { fixedSize } = jftItem.info;

    // Fixed-size items use size "L" and total quantity — same as normal pipeline
    // Non-fixed items iterate every active size using per-size DATA.length
    const sizes: ApparelSize[] = fixedSize
      ? (["L"] as ApparelSize[])
      : this.activeSizes;

    for (let s = 0; s < sizes.length; s++) {
      const sizeChar = sizes[s];

      // Per-size quantity: DATA.length was set to qty by parseStaticModeString
      // Falls back to totalQTY for fixedSize items (DATA is empty for "L" key
      // when the string only contains other sizes)
      const quantity =
        this.details[sizeChar] && this.details[sizeChar].DATA.length
          ? this.details[sizeChar].DATA.length
          : this.totalQTY;

      if (!quantity) continue;

      // ── BODY ──────────────────────────────────────────────────────────
      if (markerVal === PairObjectMarkers.BODY) {
        this.dispatchLayout(
          jftItem,
          sizeChar,
          quantity,
          CONFIG.SIZES_DETAILS[sizeChar].BODY,
        );
        continue;
      }

      // ── NECK AREA: NCK, CLR, PLK ──────────────────────────────────────
      // Map PairObjectMarkers value → NECK_AREA sub-key via JFTCONFKeywords
      const neckAreaMap: Partial<Record<string, keyof typeof JFTCONFKeywords>> =
        {
          [PairObjectMarkers.NECK]: "NECK",
          [PairObjectMarkers.COLLAR]: "COLLAR",
          [PairObjectMarkers.PLACKET]: "PLACKET",
        };

      if (neckAreaMap[markerVal] !== undefined) {
        const itemTypeKey = neckAreaMap[markerVal]!;
        // JFTCONFKeywords value matches the NECK_AREA property name exactly
        const neckKey = JFTCONFKeywords[
          itemTypeKey
        ] as keyof SizesDetails[ApparelSize]["NECK_AREA"];
        const sizeInfo = CONFIG.SIZES_DETAILS[sizeChar].NECK_AREA;
        this.dispatchLayout(jftItem, sizeChar, quantity, sizeInfo[neckKey]);
        continue;
      }

      // ── SLEEVE SIZE: S_SLV, L_SLV ────────────────────────────────────
      const slvSizeMap: Partial<Record<string, SleeveType>> = {
        [PairObjectMarkers.SHORT_SLV]: SleeveType.SHORT,
        [PairObjectMarkers.LONG_SLV]: SleeveType.LONG,
      };

      if (slvSizeMap[markerVal] !== undefined) {
        const slvType = slvSizeMap[markerVal]!;
        this.dispatchLayout(
          jftItem,
          sizeChar,
          quantity,
          CONFIG.SIZES_DETAILS[sizeChar].SLEEVE[slvType].SIZE,
        );
        continue;
      }

      // ── SLEEVE RIB: S_RIB, L_RIB ─────────────────────────────────────
      const ribMap: Partial<Record<string, SleeveType>> = {
        [PairObjectMarkers.SHORT_SLV_RIB]: SleeveType.SHORT,
        [PairObjectMarkers.LONG_SLV_RIB]: SleeveType.LONG,
      };

      if (ribMap[markerVal] !== undefined) {
        const slvType = ribMap[markerVal]!;
        this.dispatchLayout(
          jftItem,
          sizeChar,
          quantity,
          CONFIG.SIZES_DETAILS[sizeChar].SLEEVE[slvType].RIB,
        );
        continue;
      }

      // ── PANT: S_PANT, L_PANT — FRONT then BACK ───────────────────────
      // Mirrors processPantItem() which dispatches GridLayoutGenerator twice
      const pantMap: Partial<Record<string, SleeveType>> = {
        [PairObjectMarkers.SHORT_PANT]: SleeveType.SHORT,
        [PairObjectMarkers.LONG_PANT]: SleeveType.LONG,
      };

      if (pantMap[markerVal] !== undefined) {
        const pantType = pantMap[markerVal]!;

        // FRONT face
        this.dispatchLayout(
          jftItem,
          sizeChar,
          quantity,
          CONFIG.SIZES_DETAILS[sizeChar].PANT[pantType]["FRONT"],
        );

        // BACK face
        this.dispatchLayout(
          jftItem,
          sizeChar,
          quantity,
          CONFIG.SIZES_DETAILS[sizeChar].PANT[pantType]["BACK"],
        );
      }

      // Unrecognised marker — no SIZES_DETAILS path exists, silently skip
    }
  }

  /**
   * Thin wrapper that creates one `GridLayoutGenerator` instance.
   *
   * `data` is always `null` — no dynamic text injection in static mode.
   * `GridLayoutGenerator` will additionally force both `isDynamic` flags to
   * `false` when it detects `CONFIG.STATIC_MODE = true`.
   *
   * @param jftItem   - Resolved, pair-forced `JFTItem`.
   * @param sizeChar  - Active apparel size.
   * @param quantity  - Number of items to generate.
   * @param dimension - Width × height in **inches** from `SIZES_DETAILS`.
   * @private
   */
  private dispatchLayout(
    jftItem: JFTItem,
    sizeChar: ApparelSize,
    quantity: number,
    dimension: DimensionObject,
  ): void {
    new GridLayoutGenerator({
      dimension,
      quantity,
      sizeChar,
      jftItem,
      orientation: CONFIG.ORIENTATION,
      data: null, // static mode — no player text injection
    });
  }
}
