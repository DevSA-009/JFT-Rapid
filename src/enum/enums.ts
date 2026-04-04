// ─────────────────────────────────────────────────────────────────────────────
// enums.ts
//
// All project-wide enumerations, ordered size maps, and shared constants.
// Also holds test payloads used for manual pipeline validation during
// development.  Do NOT ship production builds with test constants active.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Development test payloads ───────────────────────────────────────────────

/**
 * Full Normal-mode test payload covering all adult sizes XS–5XL.
 *
 * Each size entry has a flat {@link SizeMarkerEntries} `DATA` array.
 * Every player row carries optional `SLEEVE` and `PANT` routing fields so
 * {@link JFTGarmentPipeline.filterAndStripData} can extract only the players
 * that belong to each garment-type pass.  Sizes 2–16 (kids) and XS are
 * included with zero counts to exercise the skip-logic path.
 *
 * @internal — remove or comment out before shipping a production build.
 */
const test =
  '{"basic":{"type":"POLO","sleeve":["LONG","SHORT"],"rib":{"type":"RIB","apply":["LONG","SHORT"]},"pant":["LONG","SHORT"],"total":40},"details":{"2":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"4":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"6":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"8":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"10":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"12":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"14":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"16":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"XS":{"SUMMARY":{"SHORT_SLEEVE":0,"LONG_SLEEVE":0,"SHORT_PANT":0,"LONG_PANT":0,"BODY":0},"DATA":[]},"S":{"SUMMARY":{"SHORT_SLEEVE":2,"LONG_SLEEVE":3,"SHORT_PANT":2,"LONG_PANT":3,"BODY":5},"DATA":[{"NAME":"PLAYER 01","NUMBER":"01","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 02","NUMBER":"02","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 03","NUMBER":"03","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 04","NUMBER":"04","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 05","NUMBER":"05","SLEEVE":"LONG","PANT":"LONG"}]},"M":{"SUMMARY":{"SHORT_SLEEVE":3,"LONG_SLEEVE":2,"SHORT_PANT":3,"LONG_PANT":2,"BODY":5},"DATA":[{"NAME":"PLAYER 06","NUMBER":"06","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 07","NUMBER":"07","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 08","NUMBER":"08","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 09","NUMBER":"09","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 10","NUMBER":"10","SLEEVE":"SHORT","PANT":"SHORT"}]},"L":{"SUMMARY":{"SHORT_SLEEVE":2,"LONG_SLEEVE":3,"SHORT_PANT":3,"LONG_PANT":2,"BODY":5},"DATA":[{"NAME":"PLAYER 11","NUMBER":"11","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 12","NUMBER":"12","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 13","NUMBER":"13","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 14","NUMBER":"14","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 15","NUMBER":"15","SLEEVE":"LONG","PANT":"SHORT"}]},"XL":{"SUMMARY":{"SHORT_SLEEVE":3,"LONG_SLEEVE":2,"SHORT_PANT":2,"LONG_PANT":3,"BODY":5},"DATA":[{"NAME":"PLAYER 16","NUMBER":"16","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 17","NUMBER":"17","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 18","NUMBER":"18","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 19","NUMBER":"19","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 20","NUMBER":"20","SLEEVE":"SHORT","PANT":"LONG"}]},"2XL":{"SUMMARY":{"SHORT_SLEEVE":2,"LONG_SLEEVE":3,"SHORT_PANT":2,"LONG_PANT":3,"BODY":5},"DATA":[{"NAME":"PLAYER 21","NUMBER":"21","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 22","NUMBER":"22","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 23","NUMBER":"23","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 24","NUMBER":"24","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 25","NUMBER":"25","SLEEVE":"LONG","PANT":"LONG"}]},"3XL":{"SUMMARY":{"SHORT_SLEEVE":3,"LONG_SLEEVE":2,"SHORT_PANT":3,"LONG_PANT":2,"BODY":5},"DATA":[{"NAME":"PLAYER 26","NUMBER":"26","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 27","NUMBER":"27","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 28","NUMBER":"28","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 29","NUMBER":"29","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 30","NUMBER":"30","SLEEVE":"SHORT","PANT":"SHORT"}]},"4XL":{"SUMMARY":{"SHORT_SLEEVE":2,"LONG_SLEEVE":3,"SHORT_PANT":3,"LONG_PANT":2,"BODY":5},"DATA":[{"NAME":"PLAYER 31","NUMBER":"31","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 32","NUMBER":"32","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 33","NUMBER":"33","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 34","NUMBER":"34","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 35","NUMBER":"35","SLEEVE":"LONG","PANT":"SHORT"}]},"5XL":{"SUMMARY":{"SHORT_SLEEVE":3,"LONG_SLEEVE":2,"SHORT_PANT":2,"LONG_PANT":3,"BODY":5},"DATA":[{"NAME":"PLAYER 36","NUMBER":"36","SLEEVE":"SHORT","PANT":"LONG"},{"NAME":"PLAYER 37","NUMBER":"37","SLEEVE":"LONG","PANT":"LONG"},{"NAME":"PLAYER 38","NUMBER":"38","SLEEVE":"SHORT","PANT":"SHORT"},{"NAME":"PLAYER 39","NUMBER":"39","SLEEVE":"LONG","PANT":"SHORT"},{"NAME":"PLAYER 40","NUMBER":"40","SLEEVE":"SHORT","PANT":"LONG"}]}}}';

/**
 * Alternative flat-string test payload used by the legacy static-mode parser.
 *
 * Format per line: `SIZE---NAME---NUMBER---SLEEVE_TYPE---RIB_TYPE---PANT_TYPE`
 * Blank lines separate size groups.
 *
 * @internal — remove or comment out before shipping a production build.
 */
const test2 = `S---PLAYER 01---01---LONG---RIB---LONG
S---PLAYER 02---02---SHORT---RIB---SHORT
S---PLAYER 03---03---LONG---RIB---SHORT
S---PLAYER 04---04---SHORT---RIB---LONG
S---PLAYER 05---05---LONG---RIB---LONG

M---PLAYER 06---06---SHORT---RIB---SHORT
M---PLAYER 07---07---LONG---RIB---SHORT
M---PLAYER 08---08---SHORT---RIB---LONG
M---PLAYER 09---09---LONG---RIB---LONG
M---PLAYER 10---10---SHORT---RIB---SHORT

L---PLAYER 11---11---LONG---RIB---SHORT
L---PLAYER 12---12---SHORT---RIB---LONG
L---PLAYER 13---13---LONG---RIB---LONG
L---PLAYER 14---14---SHORT---RIB---SHORT
L---PLAYER 15---15---LONG---RIB---SHORT

XL---PLAYER 16---16---SHORT---RIB---LONG
XL---PLAYER 17---17---LONG---RIB---LONG
XL---PLAYER 18---18---SHORT---RIB---SHORT
XL---PLAYER 19---19---LONG---RIB---SHORT
XL---PLAYER 20---20---SHORT---RIB---LONG

2XL---PLAYER 21---21---LONG---RIB---LONG
2XL---PLAYER 22---22---SHORT---RIB---SHORT
2XL---PLAYER 23---23---LONG---RIB---SHORT
2XL---PLAYER 24---24---SHORT---RIB---LONG
2XL---PLAYER 25---25---LONG---RIB---LONG

3XL---PLAYER 26---26---SHORT---RIB---SHORT
3XL---PLAYER 27---27---LONG---RIB---SHORT
3XL---PLAYER 28---28---SHORT---RIB---LONG
3XL---PLAYER 29---29---LONG---RIB---LONG
3XL---PLAYER 30---30---SHORT---RIB---SHORT

4XL---PLAYER 31---31---LONG---RIB---SHORT
4XL---PLAYER 32---32---SHORT---RIB---LONG
4XL---PLAYER 33---33---LONG---RIB---LONG
4XL---PLAYER 34---34---SHORT---RIB---SHORT
4XL---PLAYER 35---35---LONG---RIB---SHORT

5XL---PLAYER 36---36---SHORT---RIB---LONG
5XL---PLAYER 37---37---LONG---RIB---LONG
5XL---PLAYER 38---38---SHORT---RIB---SHORT
5XL---PLAYER 39---39---LONG---RIB---SHORT
5XL---PLAYER 40---40---SHORT---RIB---LONG
`;

// ─── Apparel size maps ────────────────────────────────────────────────────────

/**
 * Numeric ordering for adult apparel sizes.
 *
 * Lower values represent smaller sizes.  Used by {@link Utils.sortSizes} and
 * {@link Utils.getActiveDataSizes} to produce consistent ascending/descending
 * size sequences without string comparisons.
 */
const ADULT_SIZES = {
  XS: 0,
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  "2XL": 5,
  "3XL": 6,
  "4XL": 7,
  "5XL": 8,
} as const;

/**
 * Numeric ordering for children's apparel sizes.
 *
 * Values continue from {@link ADULT_SIZES} (9–16) so that adult and kids
 * sizes can coexist in a single ordered map without collisions.
 */
const KIDS_SIZES = {
  "2": 9,
  "4": 10,
  "6": 11,
  "8": 12,
  "10": 13,
  "12": 14,
  "14": 15,
  "16": 16,
} as const;

/**
 * Unified size-order map combining {@link ADULT_SIZES} and {@link KIDS_SIZES}.
 *
 * Used throughout the codebase wherever sizes must be compared or sorted.
 * A lower numeric value always means a physically smaller garment.
 */
const SIZE_ORDER_MAP = { ...ADULT_SIZES, ...KIDS_SIZES } as const;

// ─── Illustrator DOM type identifiers ────────────────────────────────────────

/**
 * String literals that match the `typename` property of Illustrator
 * `PageItem` subclasses.
 *
 * Using an enum instead of raw strings prevents typos and enables
 * exhaustive-switch checking in TypeScript.
 */
enum PageItemType {
  /** A live text frame (`TextFrame`). */
  TextFrame = "TextFrame",
  /** A simple vector path (`PathItem`). */
  PathItem = "PathItem",
  /** A grouped collection of items (`GroupItem`). */
  GroupItem = "GroupItem",
  /** A compound path made of multiple sub-paths (`CompoundPathItem`). */
  CompoundPathItem = "CompoundPathItem",
  /** A linked or embedded file placed into the document (`PlacedItem`). */
  PlacedItem = "PlacedItem",
  /** A rasterized bitmap image (`RasterItem`). */
  RasterItem = "RasterItem",
  /** An Illustrator layer (`Layer`). */
  Layer = "Layer",
}

// ─── Transform reference points ──────────────────────────────────────────────

/**
 * Hex-encoded reference-point identifiers used when building `.aia` action
 * files inside {@link TransActionHandler}.
 *
 * Each entry pairs a human-readable label with its hex-encoded ASCII name and
 * its zero-based index value as expected by Illustrator's Action Manager.
 */
const ReferencePoints = {
  /** Top-left corner of the bounding box. */
  TOPLEFT: { name: "546f70204c656674", value: 0 },
  /** Top edge center of the bounding box. */
  TOPMIDDLE: { name: "546f70204d6964646c65", value: 1 },
  /** Top-right corner of the bounding box. */
  TOPRIGHT: { name: "546f70205269676874", value: 2 },
  /** Left edge center of the bounding box. */
  MIDDLELEFT: { name: "4d6964646c65204c656674", value: 3 },
  /** Geometric center of the bounding box. */
  CENTER: { name: "43656e746572", value: 4 },
  /** Right edge center of the bounding box. */
  MIDDLERIGHT: { name: "4d6964646c65205269676874", value: 5 },
  /** Bottom-left corner of the bounding box. */
  BOTTOMLEFT: { name: "426f74746f6d204c656674", value: 6 },
  /** Bottom edge center of the bounding box. */
  BOTTOMMIDDLE: { name: "426f74746f6d204d6964646c65", value: 7 },
  /** Bottom-right corner of the bounding box. */
  BOTTOMRIGHT: { name: "426f74746f6d205269676874", value: 8 },
};

// ─── Garment enumerations ─────────────────────────────────────────────────────

/**
 * Top-level garment style that controls which collar/neck pieces the pipeline
 * generates in Stage 1.
 */
enum JerseyType {
  /** Polo-style jersey — generates COLLAR + PLACKET pieces. */
  POLO = "POLO",
  /** T-shirt style — generates a single NECK piece. */
  TSHIRT = "TSHIRT",
}

/**
 * Sleeve length variant.  Used in {@link AutomateData.basic.sleeve} and
 * {@link AutomateData.basic.rib.apply} to declare which sleeve types are
 * active for a given print job.
 */
enum SleeveType {
  /** Short-sleeve garment piece. */
  SHORT = "SHORT",
  /** Long-sleeve garment piece. */
  LONG = "LONG",
}

/**
 * User-facing stack-orientation preference forwarded to
 * {@link GridCalculator.getRecommendedStacks}.
 *
 * Mapped to the {@link StackOrientation} type alias via a template-literal type.
 */
enum StackOrientations {
  /** Let the calculator choose the best orientation automatically. */
  "Auto" = "auto",
  /** Restrict candidates to HH and VV (no rotation). */
  "Horizontal" = "horizontal",
  /** Restrict candidates to RHH and RVV (90° rotation). */
  "Vertical" = "vertical",
}

/**
 * Rib / cuff configuration for sleeve ends.
 *
 * Controls whether rib pieces are generated in Stage 2 and how quantities
 * are calculated.
 */
enum RIBType {
  /** No rib or cuff — Stage 2 is skipped entirely. */
  NO = "NO",
  /** Standard rib — one piece per sleeve ordered. */
  RIB = "RIB",
  /** Cuff — short-sleeve rib quantity is automatically doubled. */
  CUFF = "CUFF",
}

/**
 * All real layout stack variants evaluated by {@link GridCalculator}.
 *
 * `"NONE"` is intentionally excluded — it is a pass-through grouping used
 * by {@link ItemsInitiater}, not a measurable layout stack.
 */
const stackTypesTuple: StackType[] = ["HH", "VV", "RHH", "RVV", "VRH"];

/**
 * Quantity-label type used in output EPS filenames.
 *
 * | Value | Meaning |
 * |-------|---------|
 * | `SET` | Paired items counted as one set (front + back) |
 * | `PCS` | Unpaired items counted individually |
 * | `CMD` | Reserved for combined/special-case counts |
 */
enum CountType {
  /** Paired set — front and back count as one unit. */
  SET = "SET",
  /** Individual pieces — each item counted separately. */
  PCS = "PCS",
  /** Combined/special count mode. */
  CMD = "CMD",
}

// ─── Artwork item name tokens ─────────────────────────────────────────────────

/**
 * Marker tokens embedded in Illustrator item names to identify each
 * garment-part type.
 *
 * {@link JFTItemResolver} scans the active layer for items whose names
 * contain `_<value>_` and maps matches to the corresponding enum key.
 *
 * @example
 * An item named `jersey_BODY_FRONT_DYN_` matches {@link PairObjectMarkers.BODY}.
 */
enum PairObjectMarkers {
  /** Main jersey body piece. */
  BODY = "BODY",
  /** Short-sleeve piece. */
  SHORT_SLEEVE = "S_SLV",
  /** Long-sleeve piece. */
  LONG_SLEEVE = "L_SLV",
  /** T-shirt neckband piece. */
  NECK = "NCK",
  /** Polo collar piece. */
  COLLAR = "CLR",
  /** Polo front-placket piece. */
  PLACKET = "PLK",
  /** Short-pant piece (front or back). */
  SHORT_PANT = "S_PANT",
  /** Long-pant piece (front or back). */
  LONG_PANT = "L_PANT",
  /** Short-sleeve rib/cuff piece. */
  SHORT_SLEEVE_RIB = "S_SLV_RIB",
  /** Long-sleeve rib/cuff piece. */
  LONG_SLEEVE_RIB = "L_SLV_RIB",
}

/**
 * Garment-part keyword tokens used as keys in the `jft.conf` size-dimension
 * tables.
 *
 * These are distinct from {@link PairObjectMarkers} — they map the config
 * file's dimension keys to garment families rather than to individual items.
 */
enum JFTCONFKeywords {
  /** Sleeve family (short or long). */
  SLEEVE = "SLEEVE",
  /** Body piece. */
  BODY = "BODY",
  /** Collar piece. */
  COLLAR = "COLLAR",
  /** Placket piece. */
  PLACKET = "PLACKET",
  /** Neck piece. */
  NECK = "NECK",
  /** Pant piece. */
  PANT = "PANT",
}

/**
 * Behavior-modifier tokens embedded in Illustrator item names.
 *
 * Multiple tokens may appear in a single item name.  The resolver reads
 * them independently; order does not matter.
 */
enum BasicMarkers {
  /**
   * Text-frame name token matched against player-data keys during injection.
   * A text frame named exactly `"NAME"` receives the player's name.
   */
  NAME = "NAME",
  /**
   * Text-frame name token for the player's jersey number.
   * A text frame named exactly `"NUMBER"` receives the player's number.
   */
  NUMBER = "NUMBER",
  /**
   * Item-name token that marks a sub-group as dynamic.
   * Dynamic sub-groups receive player-data text injection from
   * {@link TextFrameProcessor}.
   */
  DYNAMIC = "DYN",
  /**
   * Item-name token that force-pairs a mixed dynamic+static item set.
   * Without this token, a mixed set would be treated as individual pieces
   * (`PCS`) rather than paired sets (`SET`).
   */
  PAIR = "PAIR",
  /**
   * Item-name token that excludes the item from text injection while still
   * including it in the grid layout.
   */
  SKIP = "SKP",
}

/**
 * Directional tokens embedded in Illustrator item names.
 *
 * Used by {@link JFTItemResolver.itemInfo} to determine the front/back or
 * left/right ordering of a garment pair.  The item with the lower-priority
 * direction (FRONT / LEFT) is always placed first in the pair.
 */
enum DirectionMarkers {
  /** Front face of the garment — placed first in the pair. */
  FRONT = "FRONT",
  /** Back face of the garment — placed second in the pair. */
  BACK = "BACK",
  /** Left side of the garment — placed first in the pair. */
  LEFT = "LEFT",
  /** Right side of the garment — placed second in the pair. */
  RIGHT = "RIGHT",
}

// ─── Text-frame placeholder constants ────────────────────────────────────────

/**
 * Name of the special text frame that displays the current size token
 * (e.g. `"S-M"`, `"XL"`, `"ALL"`).
 *
 * Any text frame in the artwork named exactly `SIZE_TKN` is replaced with
 * the resolved size label during {@link ItemsInitiater.updateSizeTokens}.
 */
const SIZE_TKN = "SIZE_TKN";

/**
 * Font family name applied to {@link SIZE_TKN} text frames.
 *
 * The font must be installed on the production machine.  If it is missing,
 * Illustrator falls back to the document default font and logs a warning.
 */
const SIZE_TKN_FONT = "Sakana-Regular";

// ─── Pairing shortcuts ────────────────────────────────────────────────────────

/**
 * The two garment-part markers that form the standard "face" pair used when
 * validating collar-body pairing relationships.
 *
 * Order matters: BODY is always index 0, COLLAR is index 1.
 */
const faceBasePair = [PairObjectMarkers.BODY, PairObjectMarkers.COLLAR];
