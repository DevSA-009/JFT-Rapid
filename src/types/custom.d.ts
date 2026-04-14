// ─────────────────────────────────────────────────────────────────────────────
// custom.d.ts
//
// Global type declarations shared across the entire JFT-Rapid ExtendScript
// codebase.  All interfaces, type aliases, and utility generics live here so
// every compiled file can reference them without an explicit import.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Runtime configuration ────────────────────────────────────────────────────

/**
 * Global runtime configuration object populated from `jft.conf` and the
 * active automate session.  Stored in the `CONFIG` constant at the entry point.
 */
interface JFTRapid_Config {
  /** Maximum printable paper width in inches. */
  PAPER_MAX_SIZE: number;
  /** Raw parsed content of the `jft.conf` file. */
  JFT_CONF: PersistConfig;
  /** Shorthand alias for {@link PersistConfig.config}. */
  CONFIG: PersistConfig["config"];
  /** Per-size garment dimensions loaded from the active brand config block. */
  SIZES_DETAILS: SizesDetails;
  /** Minimum gap in inches between distributed items on the artboard. */
  DIST_ITEMS_GAP: number;
  /** Preferred stack orientation: `"auto"` | `"vertical"` | `"horizontal"`. */
  ORIENTATION: StackOrientation;
  /** Maximum items per generated document; `0` means no cap. */
  PER_DOC: number;
  /** Active brand key used to look up dimensions in {@link SIZES_DETAILS}. */
  BRAND: string;
  /** When `true`, text frames are outlined after dynamic content injection. */
  OUTLINE_TEXT: boolean;
  /** Transformation execution engine: `"script"` (default) or `"action"`. */
  THREAD_ENGINE: ThreadEngine;
  /** When `true`, text frames receive an arc-warp effect after injection. */
  WRAP_TEXT: boolean;
  /** When `true`, the pipeline runs without player name/number data. */
  STATIC_MODE: boolean;
  /** When `true`, adjacent sizes are merged into shared dimension ranges. */
  DIMENSION_RANGE: boolean;
  /**
   * When `true`, non-dynamic items fill the full paper width in a single row
   * per document (CMD mode).  Each doc gets `fitRow` copies side-by-side;
   * total docs = `ceil(qty / fitRow)`.  Remainder items use their own CMD doc.
   */
  FILL_X_AXIS: boolean;
  /**
   * When `true`, long-sleeve items are processed with the full-sleeve tweak:
   * both pieces are rotated and paired into a composed unit (matching
   * `Organizer.fSlv2SetInit`), then laid out in fill-X-axis CMD mode.
   * Automatically implies `FILL_X_AXIS` for the long-sleeve stage.
   */
  LONG_SLV_TWEAK: boolean;
}

// ─── Illustrator DOM helpers ──────────────────────────────────────────────────

/**
 * Flat array of `PageItem` objects currently selected in Illustrator.
 * Mirrors the runtime type of `app.activeDocument.selection`.
 */
type Selection = PageItem[];

/**
 * Snapshot of the items immediately before and after a given `PageItem`
 * in the document's z-order.
 */
type PrevNextItems = {
  /** Item directly before `current` in z-order, or `null` when at the front. */
  prev: PageItem | GroupItem | null;
  /** The item under inspection. */
  current: PageItem;
  /** Item directly after `current` in z-order, or `null` when at the back. */
  next: PageItem | null;
};

// ─── Geometry ─────────────────────────────────────────────────────────────────

/** Cardinal edge identifiers used for positional alignment. */
type BasePositions = "L" | "R" | "T" | "B";

/** Valid rotation angles supported by the transformation pipeline. */
type RotateDegrees = 90 | -90 | 180 | 0 | -180;

/**
 * All valid alignment positions accepted by {@link AlignmentHandler}.
 *
 * - Single letter  → align to one edge (L, R, T, B).
 * - Two letters    → align to an edge midpoint (LC = left-center, etc.).
 * - `"C"` / `"CX"` / `"CY"` → center on both, x-axis only, y-axis only.
 */
type AlignPosition =
  | BasePositions
  | "LC"
  | "RC"
  | "TC"
  | "BC"
  | "C"
  | "CX"
  | "CY";

/**
 * Axis-aligned bounding box expressed as four absolute coordinates in points.
 * Matches the layout of `PageItem.geometricBounds` after coordinate
 * normalisation.
 */
type BoundsObject = {
  /** Left edge x-coordinate in points. */
  left: number;
  /** Top edge y-coordinate in points. */
  top: number;
  /** Right edge x-coordinate in points. */
  right: number;
  /** Bottom edge y-coordinate in points. */
  bottom: number;
};

/** Width/height pair used throughout dimension calculations. */
type DimensionObject = { width: number; height: number };

// ─── Garment configuration ────────────────────────────────────────────────────

/**
 * Per-size dimension map for a single brand.
 *
 * Keyed by {@link ApparelSize}, each entry holds a {@link DimensionObject}
 * for every garment-part marker plus the four pant-face variants.
 */
type SizesDetails = {
  [key in ApparelSize]: {
    [key in keyof typeof PairObjectMarkers]: DimensionObject;
  } & Readonly<
    Record<
      | "SHORT_PANT_FRONT"
      | "SHORT_PANT_BACK"
      | "LONG_PANT_FRONT"
      | "LONG_PANT_BACK",
      DimensionObject
    >
  >;
};

/** Top-level map from brand key to its full size-dimension table. */
interface SizeContainer {
  [key: string]: SizesDetails;
}

/**
 * Tuple of four `PageItem` references for the pant-face artwork pieces:
 * `[SHORT_FRONT, SHORT_BACK, LONG_FRONT, LONG_BACK]`.
 */
type PantItems = [PageItem, PageItem, PageItem, PageItem];

/**
 * Parsed content of the `jft.conf` file.
 * Consumed by {@link JSONFileHandler} and stored on `CONFIG.JFT_CONF`.
 */
interface PersistConfig {
  /** Scalar settings for the active session. */
  config: {
    /** Active brand identifier, e.g. `"JFT"`. */
    brand: string;
    /** Maximum paper width in inches. */
    paperMaxWidth: number;
  };
  /**
   * Brand-keyed size dimension tables.
   * Accessed as `sizes[brand][size][partMarker]`.
   */
  sizes: {
    [key: string]: SizeContainer;
  };
}

// ─── Stack / layout types ──────────────────────────────────────────────────────

/**
 * All valid stacking patterns for the grid layout engine.
 *
 * | Value  | Meaning                                                       |
 * |--------|---------------------------------------------------------------|
 * | `HH`   | Side-by-side, no rotation                                     |
 * | `VV`   | Stacked vertically, no rotation                               |
 * | `RHH`  | Both items rotated 90°, then placed side-by-side              |
 * | `RVV`  | Both items rotated 90°, then stacked vertically               |
 * | `VRH`  | Square layout — primary item only, width equals height        |
 * | `NONE` | Pass-through grouping — items grouped as-is, no rearrangement |
 */
type StackType = "HH" | "VV" | "RHH" | "RVV" | "VRH" | "NONE";

/**
 * Dimensions keyed by every real layout stack type.
 * `"NONE"` is intentionally excluded — it carries no measurable dimension.
 */
type StackSizes = Record<Exclude<StackType, "NONE">, DimensionObject>;

/**
 * Union of single-key records, one per {@link StackType}.
 * Useful when a function returns the dimension for exactly one stack.
 */
type StackSize = {
  [K in StackType]: Record<K, DimensionObject>;
}[StackType];

/** Recommended stack type together with its computed width in inches. */
type RecommendedStack = {
  /** The stack type that maximises paper-width usage. */
  type: StackType;
  /** Computed width in inches for the recommended stack. */
  width: number;
};

/** User-facing orientation preference forwarded to {@link GridCalculator}. */
type StackOrientation = `${StackOrientations}`;

// ─── Units / measurement ──────────────────────────────────────────────────────

/** All length units supported by {@link Utils.convertLength}. */
type LengthUnit = "mm" | "cm" | "inch" | "pt";

/** Controls whether the layout engine prefers shorter or taller output. */
type HeightPreference = "Less" | "More";

/** Which axis a measurement or font-correction operation targets. */
type DimensionType = "width" | "height";

// ─── Engine / threading ───────────────────────────────────────────────────────

/**
 * Selects the execution engine for geometric transformations.
 *
 * - `"script"` — standard ExtendScript `translate` / `resize` calls.
 * - `"action"` — temporary `.aia` action-file workaround used when standard
 *   calls misbehave on opacity-masked or compound-path objects.
 */
type ThreadEngine = "script" | "action";

// ─── Apparel sizes ────────────────────────────────────────────────────────────

/** Union of all valid adult and kids apparel size keys. */
type ApparelSize = keyof typeof ADULT_SIZES | keyof typeof KIDS_SIZES;

/**
 * Merged size-range label used in output filenames.
 * Examples: `"ALL"`, `"XS-S"`, `"M-L"`, `"XL-2XL"`.
 */
type ApparelSizeRange = "ALL" | `${ApparelSize}-${ApparelSize}`;

// ─── Illustrator document helpers ─────────────────────────────────────────────

/** Parameters accepted by {@link Organizer.selectItemsInDoc}. */
interface SelectItemsInDocParams {
  /** Target Illustrator document. */
  doc: Document;
  /** Items to select. */
  items: Selection;
  /** When `true`, clears any existing selection before selecting. */
  clear?: boolean;
}

// ─── Automate data — player entries ──────────────────────────────────────────

/**
 * A single player record inside the flat {@link SizeMarkerEntries} array.
 *
 * `NAME` and `NUMBER` are required — they map directly to text-frame names
 * inside the artwork and are injected by {@link TextFrameProcessor}.
 *
 * The optional routing fields `SLEEVE` and `PANT` are used **only** by
 * {@link JFTGarmentPipeline} to filter which players belong to each garment
 * pass.  They are **stripped** before the entry reaches
 * {@link GridLayoutGenerator}, so the injection engine always receives a
 * clean `{ NAME, NUMBER }` object.
 *
 * | Field    | Required | Values                  | Purpose                         |
 * |----------|----------|-------------------------|---------------------------------|
 * | `NAME`   | yes      | `"PLAYER 01"`           | Injected into NAME text frames  |
 * | `NUMBER` | yes      | `"01"`                  | Injected into NUMBER frames     |
 * | `SLEEVE` | no       | `"SHORT"` \| `"LONG"`  | Routes player to sleeve pass    |
 * | `PANT`   | no       | `"SHORT"` \| `"LONG"`  | Routes player to pant pass      |
 */
type PlayerEntry = Record<BasicMarkers.NAME | BasicMarkers.NUMBER, string> &
  Partial<Record<"SLEEVE" | "PANT", string>> &
  Record<string, string>;

/**
 * Flat ordered array of all {@link PlayerEntry} rows for one apparel size.
 *
 * All players across every garment type live in this single array.  Each
 * pipeline stage filters by the relevant routing key (`SLEEVE` or `PANT`)
 * to get only its own players, then strips the routing fields before
 * forwarding `{ NAME, NUMBER }` entries to {@link GridLayoutGenerator}.
 *
 * Consumed sequentially (FIFO) by {@link TextFrameProcessor}.
 */
type SizeMarkerEntries = PlayerEntry[];

/**
 * Quantity summary for every garment-part type within a single size.
 * Drives how many artwork copies each pipeline stage must produce.
 */
type FlatSummary = {
  /** Number of short-sleeve pieces ordered for this size. */
  SHORT_SLEEVE: number;
  /** Number of long-sleeve pieces ordered for this size. */
  LONG_SLEEVE: number;
  /** Number of short-pant pieces ordered for this size. */
  SHORT_PANT: number;
  /** Number of long-pant pieces ordered for this size. */
  LONG_PANT: number;
  /** Number of body pieces ordered for this size. */
  BODY: number;
};

/**
 * Complete data entry for one apparel size within an {@link AutomateData} job.
 *
 * `SUMMARY` drives how many copies of each garment part are produced.
 * `DATA` is a flat array of all players for this size — each entry may carry
 * `SLEEVE` / `PANT` routing fields that the pipeline uses to filter players
 * to the correct garment-type pass before stripping those fields.
 */
type SizeDetailEntry = {
  /**
   * Quantity breakdown by garment-part type for this size.
   * All counts default to `0` when a part is not ordered.
   */
  SUMMARY: FlatSummary;

  /**
   * Flat list of all players for this size.
   *
   * Optional routing fields on each entry:
   * - `SLEEVE: "SHORT" | "LONG"` — selects which sleeve pass this player goes to.
   * - `PANT: "SHORT" | "LONG"`   — selects which pant pass this player goes to.
   *
   * The pipeline filters and strips these fields before passing the array to
   * {@link GridLayoutGenerator}, which only needs `NAME` and `NUMBER`.
   */
  DATA: SizeMarkerEntries;
};

// ─── Top-level automate payload ───────────────────────────────────────────────

/**
 * Root payload passed to {@link JFTProcessSequentially} for a single print job.
 *
 * Consumed in two modes:
 * - **Normal mode** — full JSON including player names and numbers per size.
 * - **Static mode** — compact `"SIZE=qty"` string; `DATA` arrays are empty.
 */
interface AutomateData {
  /** Global job settings shared across all sizes. */
  basic: {
    /** Jersey style: `POLO` or `TSHIRT`. */
    type: JerseyType;
    /** Which sleeve lengths are active for this job. */
    sleeve: SleeveType[];
    /** Rib/cuff configuration. */
    rib: { type: RIBType; apply: SleeveType[] };
    /** Which pant lengths are active for this job. */
    pant: SleeveType[];
    /** Total garment sets across all sizes. */
    total: number;
  };
  /**
   * Per-size detail map.
   * Only sizes with a non-zero `SUMMARY.BODY` count are processed by the
   * pipeline.
   */
  details: {
    [key in ApparelSize]: SizeDetailEntry;
  };
}

// ─── TypeScript utility generics (ExtendScript-safe replacements) ─────────────
// ExtendScript targets ES3; the TypeScript standard library is excluded via
// `"noLib": true` in tsconfig.json.  The generics below replicate the
// most commonly needed built-in utilities.

/**
 * Infers the return type of a function type `T`.
 *
 * @example
 * ```ts
 * type R = ReturnType<() => number>; // number
 * ```
 */
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

/**
 * Constructs a type by removing keys `K` from `T`.
 * Accepts any key type (less strict than {@link StrictOmit}).
 */
type Omit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

/**
 * Excludes from `T` those types assignable to `U`.
 *
 * @example
 * ```ts
 * type A = "a" | "b" | "c";
 * type B = Exclude<A, "b">; // "a" | "c"
 * ```
 */
type Exclude<T, U> = T extends U ? never : T;

/**
 * Extracts from `T` those types assignable to `U`.
 *
 * @example
 * ```ts
 * type A = "a" | "b" | "c";
 * type B = Extract<A, "a" | "c">; // "a" | "c"
 * ```
 */
type Extract<T, U> = T extends U ? T : never;

/**
 * Constructs a type by removing keys `K` from `T`.
 * Stricter than {@link Omit}: `K` must be an actual key of `T`.
 */
type StrictOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

/** Primitive types valid as object index signatures. */
type PropertyKey = string | number | symbol;
