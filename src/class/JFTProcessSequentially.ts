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
//       JFTGarmentPipeline (normal mode) or JFTStaticProcessor (static mode)
//     - Public jftItem() — external one-off DOM lookup
//
//   This file does NOT own:
//     - DOM scanning / item resolution  → JFTItemResolver
//     - Five-stage pipeline stages      → JFTGarmentPipeline
//     - Static-mode scan + dispatch     → JFTStaticProcessor
//     - Static input string parsing     → JFTStaticProcessor.parseStaticModeString
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared Types ─────────────────────────────────────────────────────────────
//
// Defined here (not in a separate types file) so they are available to all
// three helper classes that are concatenated into the same bundle at build time.

/**
 * One entry in the per-item array built by `JFTItemResolver.itemInfo()`.
 * Carries both the raw `PageItem` reference and all classification flags
 * derived from the item's name at resolution time.
 */
interface ItemInfoEntry {
  /** The raw Illustrator `PageItem`. */
  object: PageItem;
  /**
   * `true` when the item name contains `_DYN_`.
   * Dynamic items receive player-data text injection during grid layout.
   */
  isDynamic: boolean;
  /**
   * `true` when the item is a plain axis-aligned filled rectangle.
   * These items are handled by the fill-rec strip path in `GridLayoutGenerator`.
   */
  isFillRec: boolean;
  /**
   * Direction marker found in the item name (`"FRONT"`, `"BACK"`, `"LEFT"`,
   * `"RIGHT"`) or `""` when none is present.
   */
  direction: keyof typeof DirectionMarkers | "";
}

/**
 * Raw pairing metadata returned by `JFTItemResolver.itemInfo()` before it is
 * wrapped into a `JFTItem`.
 */
interface ItemsInfo {
  /** Whether the two items form a paired set. */
  pair: boolean;
  /** Count label written into the output filename (`SET`, `PCS`, or `CMD`). */
  countType: CountType;
  /** One or two resolved `ItemInfoEntry` records. */
  items: ItemInfoEntry[];
  /**
   * `true` when either item carries `_FSZ_`.
   * Fixed-size items are dispatched once regardless of how many sizes are active.
   */
  fixedSize: boolean;
}

/**
 * Complete resolved descriptor for one garment-part marker.
 * Passed directly to `GridLayoutGenerator` for layout generation.
 */
interface JFTItem {
  /** Enum key name of the matched `PairObjectMarkers` value (e.g. `"BODY"`). */
  order: string;
  /** Pairing and fixed-size metadata — excludes the `items` array. */
  info: Omit<ItemsInfo, "items">;
  /**
   * Exactly two `ItemInfoEntry` records after `itemInfo()` completes.
   * The second entry is always present (auto-duplicated when only one item
   * was found in the document).
   */
  items: ItemInfoEntry[];
}

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

class JFTProcessSequentially {
  private readonly jftItemsCache: JFTItemCache = {} as JFTItemCache;

  constructor(data: AutomateData | string) {
    // ── Step 1: Normalise input to AutomateData ───────────────────────
    // Static mode accepts a compact "M=5,L=10" string in addition to a full
    // AutomateData object.  Parsing is delegated to JFTStaticProcessor so this
    // file stays clean of string-parsing logic.
    const resolvedData: AutomateData = CONFIG.STATIC_MODE
      ? JFTProcessSequentially.createEmptyData(data as string)
      : (JSONSA.parse(data) as AutomateData);

    this.jftItemsCache = JFTItemResolver.getItems();

    if (Utils.isEmptyObject(this.jftItemsCache)) return;

    new JFTGarmentPipeline({
      data: Utils.deepCopy(resolvedData),
      jftItemsCache: this.jftItemsCache,
    });
  }

  static createEmptyData(str: string) {
    const segments = str.trim().split(",");
    const jerseyTypeIndex = segments.findIndex((seg) =>
      seg.includes(`JERSEY_TYPE=`),
    );
    let jerseyType = JerseyType.POLO;
    let ribType = RIBType.NO;

    if (jerseyTypeIndex >= 0) {
      jerseyType = segments[jerseyTypeIndex]
        .toUpperCase()
        .split("=")[1] as JerseyType;
      segments.splice(jerseyTypeIndex, 1);
    }

    const ribTypeIndex = segments.findIndex((seg) => seg.includes(`RIB_TYPE=`));

    if (ribTypeIndex >= 0) {
      ribType = segments[ribTypeIndex].toUpperCase().split("=")[1] as RIBType;
      segments.splice(ribTypeIndex, 1);
    }

    const basic = {
      type: jerseyType,
      sleeve: [SleeveType.SHORT, SleeveType.LONG],
      rib: {
        type: ribType,
        apply: [SleeveType.SHORT, SleeveType.LONG],
      },
      pant: [SleeveType.SHORT, SleeveType.LONG],
      total: 0,
    };

    const foundedSize = segments.reduce(
      (acc, seg) => {
        const nestSeg = seg.toUpperCase().split("=");
        const sizeChar = nestSeg[0] as ApparelSize;
        const qty = parseInt(nestSeg[1]);
        acc[sizeChar] = qty;
        basic.total += qty;
        return acc;
      },
      {} as Record<ApparelSize, number>,
    );

    const fake_details = {} as AutomateData["details"];

    const sizes = Object.keys(SIZE_ORDER_MAP);

    for (const size of sizes) {
      const sizeChar = size as ApparelSize;
      const qty = foundedSize[sizeChar] || 0;
      fake_details[sizeChar] = {
        SUMMARY: {
          BODY: qty,
          LONG_PANT: qty,
          LONG_SLEEVE: qty,
          SHORT_PANT: qty,
          SHORT_SLEEVE: qty,
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
