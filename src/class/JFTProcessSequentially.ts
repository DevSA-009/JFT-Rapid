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
 * Optional behavioural flags for `JFTProcessSequentially`.
 */
interface JFTProcessSequentiallyOptions {
  /**
   * Controls the iteration order of sizes and stages.
   *
   * - `false` **(default — stage-first)**:
   *   ```
   *   NECK(s1…sN) → RIB(s1…sN) → SLEEVE(s1…sN) → BODY(s1…sN) → PANT(s1…sN)
   *   ```
   * - `true` **(size-first)**:
   *   ```
   *   s1(NECK→RIB→SLEEVE→BODY→PANT) → s2(…) → …
   *   ```
   */
  readonly perSizeMode?: boolean;
}

/**
 * Parameters forwarded to every `process*Item` method in `JFTGarmentPipeline`.
 */
interface ProcessItemParams {
  readonly jftItem: JFTItem;
  readonly itemType: (typeof JFTCONFKeywords)[keyof typeof JFTCONFKeywords];
  readonly sizeChar: ApparelSize;
}

/** `ProcessItemParams` extended with the active sleeve variant. */
interface ProcessSleeveItemParams extends ProcessItemParams {
  readonly sleeveType: SleeveType;
}

/** `ProcessItemParams` extended with pant variant and face direction. */
interface ProcessPantItemParams extends ProcessItemParams {
  readonly pantType: SleeveType;
  readonly face: "FRONT" | "BACK";
}

/**
 * Pre-resolved DOM lookup table.
 * One entry per `PairObjectMarkers` value — `null` when not found in the document.
 */
type JFTItemCache = Record<string, JFTItem | null>;

// ─────────────────────────────────────────────────────────────────────────────
// CLASS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thin orchestrator that wires `JFTItemResolver`, `JFTGarmentPipeline`, and
 * `JFTStaticProcessor` together and dispatches to the correct processing path.
 *
 * ### How it works — normal mode (`CONFIG.STATIC_MODE = false`)
 *
 * ```
 * 1. Normalise input     → AutomateData (always an object in normal mode)
 * 2. JFTItemResolver     → buildNeckMarkers / ribMarkers / sleeveMarkers / pantMarkers
 *                       → resolveItemCache()  (single DOM scan)
 *                       → buildActiveSizes()
 * 3. JFTGarmentPipeline  → receives all pre-computed data, runs immediately:
 *                          Stage 1 Neck → Stage 2 Rib → Stage 3 Sleeve
 *                          → Stage 4 Body → Stage 5 Pant
 *                          Each stage reads itemCache, looks up SIZES_DETAILS,
 *                          calls new GridLayoutGenerator(...)
 * ```
 *
 * ### How it works — static mode (`CONFIG.STATIC_MODE = true`)
 *
 * ```
 * 1. Normalise input     → string parsed by JFTStaticProcessor.parseStaticModeString()
 *                          into AutomateData where details[size].DATA.length === qty
 * 2. JFTItemResolver     → same setup as normal (marker lists are all empty —
 *                          they are built but never used in static mode)
 * 3. JFTStaticProcessor  → receives details + totalQTY + activeSizes + resolver,
 *                          runs immediately:
 *                          - Scans all visible + unlocked layer items
 *                          - Matches each to a PairObjectMarkers value
 *                          - Forces pair = true on every match
 *                          - Sorts by canonical pipeline order (Neck→…→Pant)
 *                          - Dispatches new GridLayoutGenerator(...) per item/size
 *                          GridLayoutGenerator forces isDynamic=false on both items
 *                          → no text injection → qty always in filename
 * ```
 *
 * ### Key design invariants
 * - DOM is scanned **exactly once** per run (by `JFTItemResolver.resolveItemCache`
 *   in normal mode, or by `JFTStaticProcessor.collectSortedItems` in static mode).
 * - `JFTProcessSequentially` itself contains **no stage logic** — it is purely
 *   a constructor that performs setup and delegates.
 *
 * @example
 * ```typescript
 * // Normal mode — stage-first (default)
 * new JFTProcessSequentially(automateData);
 *
 * // Normal mode — size-first
 * new JFTProcessSequentially(automateData, { perSizeMode: true });
 *
 * // Static mode — compact string input (CONFIG.STATIC_MODE must be true)
 * new JFTProcessSequentially("M=5,L=10,XL=3");
 *
 * // Static mode — pre-built AutomateData also accepted
 * new JFTProcessSequentially(alreadyParsedData);
 * ```
 */
class JFTProcessSequentially {
  /**
   * Stored so `jftItem()` can create a fresh `JFTItemResolver` using the
   * same `details` reference without re-parsing input.
   */
  private readonly details: AutomateData["details"];

  // ─── Constructor ──────────────────────────────────────────────────────────

  /**
   * Pre-computes all shared data and immediately triggers the correct
   * processing path.
   *
   * ### Mode selection table
   * | `CONFIG.STATIC_MODE` | `data` type    | Processing path       |
   * |----------------------|----------------|-----------------------|
   * | `false`              | `AutomateData` | `JFTGarmentPipeline`  |
   * | `true`               | `string`       | `JFTStaticProcessor`  |
   * | `true`               | `AutomateData` | `JFTStaticProcessor`  |
   *
   * @param data    - Full `AutomateData` payload **or** a compact `"M=5,L=10"`
   *                  string (string only valid when `CONFIG.STATIC_MODE = true`).
   * @param options - Optional pipeline flags; all default to `false`.
   */
  constructor(
    data: AutomateData | string,
    options: JFTProcessSequentiallyOptions = {},
  ) {
    // ── Step 1: Normalise input to AutomateData ───────────────────────
    // Static mode accepts a compact "M=5,L=10" string in addition to a full
    // AutomateData object.  Parsing is delegated to JFTStaticProcessor so this
    // file stays clean of string-parsing logic.
    const resolvedData: AutomateData =
      CONFIG.STATIC_MODE && typeof data === "string"
        ? JFTStaticProcessor.parseStaticModeString(data)
        : (JSONSA.parse(data) as AutomateData);

    // Store details so the public jftItem() method can use it later
    this.details = resolvedData.details;

    // ── Step 2: Build the shared item resolver ───────────────────────
    // JFTItemResolver owns all DOM scanning and itemInfo() logic.
    // Constructed here so it can be shared with JFTStaticProcessor if needed.
    const resolver = new JFTItemResolver(resolvedData.details);

    // ── Step 3: Pre-compute marker lists ─────────────────────────────
    // These four lists drive both the DOM scan (resolveItemCache) and the
    // stage iteration in JFTGarmentPipeline.
    // In static mode they will be empty/default — they exist but are unused.
    const neckMarkers = resolver.buildNeckMarkers(resolvedData.basic.type);
    const ribMarkers = resolver.buildRibMarkers(
      resolvedData.basic.rib,
      resolvedData.basic.sleeve,
    );
    const sleeveMarkers = resolver.buildSleeveMarkers(
      resolvedData.basic.sleeve,
    );
    const pantMarkers = resolver.buildPantMarkers(resolvedData.basic.pant);

    // ── Step 4: Single-pass DOM resolution ───────────────────────────
    // After this call itemCache[markerValue] is JFTItem | null for every
    // marker that was needed.  No further DOM traversal occurs at stage time.
    const itemCache = resolver.resolveItemCache(
      neckMarkers,
      ribMarkers,
      sleeveMarkers,
      pantMarkers,
    );

    // ── Step 5: Filter to active sizes ───────────────────────────────
    // Sizes with no DATA rows and all-zero SUMMARY counts are excluded
    // so no pipeline stage ever receives empty input.
    const activeSizes = resolver.buildActiveSizes(resolvedData.details);

    // ── Step 6: Dispatch ─────────────────────────────────────────────
    if (CONFIG.STATIC_MODE) {
      // Static mode: flat document scan → sorted dispatch, no stage pipeline
      new JFTStaticProcessor(
        resolvedData.details,
        resolvedData.basic.total,
        activeSizes,
        resolver,
      ).run();
      return;
    }

    // Normal mode: five-stage garment pipeline
    new JFTGarmentPipeline({
      rib: resolvedData.basic.rib,
      totalQTY: resolvedData.basic.total,
      details: resolvedData.details,
      perSizeMode: options.perSizeMode === true,
      activeSizes,
      itemCache,
      neckMarkers,
      ribMarkers,
      sleeveMarkers,
      pantMarkers,
    });
  }

  // ─── Public: one-off item lookup ─────────────────────────────────────────

  /**
   * Performs a fresh DOM scan to resolve a single `order` marker.
   *
   * **For external callers only** — CEP panels, ad-hoc lookups, testing.
   * During pipeline execution all lookups go through the pre-built `itemCache`
   * inside `JFTGarmentPipeline` — this method is never called per-size at
   * runtime.
   *
   * @param order - A `PairObjectMarkers` value to search for (e.g. `"BODY"`).
   * @returns Resolved `JFTItem`, or `null` if not found.
   */
  public jftItem(order: string): JFTItem | null {
    return new JFTItemResolver(this.details).lookupItem(order);
  }
}
