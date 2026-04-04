// ─────────────────────────────────────────────────────────────────────────────
// index.ts — JFT-Rapid entry point
//
// This is the last file compiled into the output bundle.  It runs once when
// the ExtendScript host loads jft_rapid.jsx.  Responsibilities:
//   1. Resolve the jft.conf path and parse it into a PersistConfig object.
//   2. Build the global CONFIG constant used by every class in the project.
//   3. Expose jftProcessSeqWrapper so ScriptUI dialogs can start a run.
//   4. (Dev only) Kick off a test run immediately using the `test` payload.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Config file paths ────────────────────────────────────────────────────────

/**
 * Absolute path to `jft.conf` in the installed CEP extension folder.
 * This is the path used when the script runs inside the production panel.
 */
const JFT_CONF_PRODUCTION_PATH =
  "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\com.jftrapid.cep\\jft.conf";

/**
 * Absolute path to `jft.conf` on the developer's local machine.
 * Swap this into `JSONFileHandler` below during local development.
 */
const JFT_CONF_DEV_PATH = "H:\\JFT-Rapid\\jft.conf";

// ─── Config loading ───────────────────────────────────────────────────────────

/**
 * File handler that reads and parses `jft.conf` from disk on startup.
 * Uses the production path; change to {@link JFT_CONF_DEV_PATH} for local dev.
 */
const JFTPersistConfigFetch = new JSONFileHandler(JFT_CONF_PRODUCTION_PATH);

// Global progress-bar window (disabled — uncomment when needed):
// const progressWindow = createProgressWindow();

/**
 * Parsed content of `jft.conf`.
 * Cast to {@link PersistConfig} — the shape is validated implicitly by usage.
 */
const JFT_CONF = JFTPersistConfigFetch.read() as PersistConfig;

// ─── Global runtime configuration ─────────────────────────────────────────────

/**
 * Singleton runtime configuration object shared across the entire codebase.
 *
 * Initialised from `jft.conf` values and sensible defaults.  Individual
 * pipeline stages and ScriptUI dialogs mutate relevant fields (e.g.
 * `STATIC_MODE`, `ORIENTATION`) before starting a run.
 *
 * @remarks
 * `SIZES_DETAILS` is set twice: once here with a placeholder brand key
 * `"JFT"`, then immediately overridden below using the brand stored in the
 * config itself.  This handles the case where the conf file specifies a
 * different brand key at runtime.
 */
const CONFIG: JFTRapid_Config = {
  /** Gap in inches between distributed items on the artboard. */
  DIST_ITEMS_GAP: 0.1,
  /** Merge adjacent sizes into shared dimension ranges when `true`. */
  DIMENSION_RANGE: false,
  /** Outline all text frames after player-data injection when `true`. */
  OUTLINE_TEXT: false,
  /** Maximum printable paper width in inches (from jft.conf paperSize). */
  PAPER_MAX_SIZE: 63.25,
  /** Full parsed jft.conf object. */
  JFT_CONF,
  /** Shorthand alias for JFT_CONF.config. */
  CONFIG: JFT_CONF.config,
  /** Initial size-dimension table — overridden below using the active brand. */
  SIZES_DETAILS: JFT_CONF.sizes["JFT"] as unknown as SizesDetails,
  /** Active brand key read from jft.conf.config.brand. */
  BRAND: JFT_CONF.config.brand,
  /** `true` when the job includes kids-size inventory. */
  KIDSINV: false,
  /** Maximum items per generated document; 0 = no cap. */
  PER_DOC: 0,
  /** Transformation execution engine: "script" or "action". */
  THREAD_ENGINE: "script",
  /** Preferred stack orientation: "auto", "vertical", or "horizontal". */
  ORIENTATION: "auto",
  /** Apply arc-warp effect to text frames when `true`. */
  WRAP_TEXT: false,
  /** Run without player-data injection when `true` (Static Mode). */
  STATIC_MODE: false,
};

// Override SIZES_DETAILS using the brand declared in the config file.
// This ensures the correct garment dimensions are loaded even when the brand
// key differs from the hardcoded "JFT" placeholder used above.
CONFIG.SIZES_DETAILS = CONFIG.JFT_CONF["sizes"][
  CONFIG.BRAND
] as unknown as SizesDetails;

// ─── Public pipeline wrapper ──────────────────────────────────────────────────

/**
 * Thin wrapper around {@link JFTProcessSequentially} exposed to ScriptUI
 * dialogs and the CEP panel.
 *
 * Accepts either a full {@link AutomateData} object (Normal Mode) or a
 * compact static-mode string (e.g. `"M=10,L=8,2XL=3"`).
 *
 * @param data - Automate payload or static-mode input string.
 */
const jftProcessSeqWrapper = (data: AutomateData | string) => {
  new JFTProcessSequentially(data as unknown as AutomateData);
};

// ─── Development entry point ──────────────────────────────────────────────────

// Launch a test run immediately using the built-in `test` payload.
// Comment this line out (or wrap in a condition) before shipping a
// production build — it will run against whatever document is open.
// automateInfoDialog();
new JFTProcessSequentially(test as unknown as AutomateData);
