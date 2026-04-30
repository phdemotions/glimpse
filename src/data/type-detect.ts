/**
 * Type-detection helpers — pure functions over column samples + metadata.
 * Each helper returns either a refinement of the column's classification or
 * `null` when the heuristic doesn't fire. The orchestrator in `schema.ts`
 * combines results into the final `ColumnInfo`.
 *
 * All thresholds are tuned for CP-2's 5-CSV test corpus (3 sample CSVs in
 * `public/samples/` + 2 hand-picked external CSVs). Revisit if real-world
 * misclassification reports surface — Decision #28 (no analytics in v1)
 * means our only feedback channel is qualitative.
 */

export type Subtype = 'ordinal' | 'likert' | 'geographic' | null
export type Confidence = 'high' | 'medium' | 'low'

export type DateDetection = {
  type: 'date'
  confidence: Confidence
} | null

export type OrdinalDetection = {
  subtype: 'likert' | 'ordinal'
  confidence: Confidence
} | null

export type GeoDetection = {
  subtype: 'geographic'
  confidence: Confidence
} | null

// ----- Date -----

// ISO 8601 reduced-precision allowed: YYYY-MM, YYYY-MM-DD, plus optional time
// + timezone. Matches the most common date encodings in real-world CSVs.
const ISO_DATE_RE =
  /^\d{4}-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?)?$/
const US_DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}$/

const DATE_MATCH_THRESHOLD = 0.8

/**
 * Classify a string sample as ISO 8601 (high confidence), US `M/D/YYYY`
 * (medium), or not a date. PLAN.md Decision #34 — ISO is unambiguous, US is
 * acknowledged because the lead audience writes US-formatted dates, and the
 * override UI handles the ambiguity flagged by `medium`.
 */
export function detectDateConfidence(samples: unknown[]): DateDetection {
  const strs = samples.filter((v): v is string => typeof v === 'string')
  if (strs.length === 0) return null

  let iso = 0
  let us = 0
  for (const s of strs) {
    if (ISO_DATE_RE.test(s)) iso++
    else if (US_DATE_RE.test(s)) us++
  }

  const total = strs.length
  if (iso / total >= DATE_MATCH_THRESHOLD) {
    return { type: 'date', confidence: 'high' }
  }
  if ((iso + us) / total >= DATE_MATCH_THRESHOLD) {
    return { type: 'date', confidence: 'medium' }
  }
  return null
}

// ----- Ordinal / Likert -----

/**
 * Sentinel "non-response" values that should not count toward the Likert
 * match denominator. A real survey has "Don't know" / "N/A" rows that would
 * otherwise drag the match rate below the 80% threshold.
 */
const SENTINELS = new Set([
  '',
  'n/a',
  'na',
  'none',
  "don't know",
  'dont know',
  'do not know',
  'prefer not to say',
  'no answer',
  '(blank)',
  'unknown',
  '-',
  '--',
])

const LIKERT_LABELS = new Set([
  'strongly agree',
  'agree',
  'neutral',
  'disagree',
  'strongly disagree',
  'always',
  'often',
  'sometimes',
  'rarely',
  'never',
  'very satisfied',
  'satisfied',
  'dissatisfied',
  'very dissatisfied',
  'excellent',
  'good',
  'fair',
  'poor',
])

const LIKERT_MATCH_THRESHOLD = 0.8
const LIKERT_CARD_MIN = 3
const LIKERT_CARD_MAX = 7
const ORDINAL_RATIO_MAX = 0.4

/**
 * Detect ordinal/Likert structure. Two paths:
 *
 * 1. **Likert (medium confidence):** ≥80% of non-sentinel string samples
 *    match a known scale label AND cardinality is 3–7.
 * 2. **Ordinal fallback (low confidence):** all-string + cardinality 3–7 +
 *    cardinality < 40% of non-null rows (small, repeated value set).
 *
 * Returns `null` when neither path fires — the column stays a plain string.
 */
export function detectOrdinalLikert(
  samples: unknown[],
  cardinality: number,
  totalNonNull: number,
): OrdinalDetection {
  const strs = samples.filter((v): v is string => typeof v === 'string')
  if (strs.length === 0) return null

  const real = strs.filter((s) => !SENTINELS.has(s.toLowerCase().trim()))
  if (real.length === 0) return null

  if (cardinality >= LIKERT_CARD_MIN && cardinality <= LIKERT_CARD_MAX) {
    const matches = real.filter((s) =>
      LIKERT_LABELS.has(s.toLowerCase().trim()),
    ).length
    if (matches / real.length >= LIKERT_MATCH_THRESHOLD) {
      return { subtype: 'likert', confidence: 'medium' }
    }
  }

  if (
    cardinality >= LIKERT_CARD_MIN &&
    cardinality <= LIKERT_CARD_MAX &&
    totalNonNull > 0 &&
    cardinality / totalNonNull < ORDINAL_RATIO_MAX
  ) {
    return { subtype: 'ordinal', confidence: 'low' }
  }

  return null
}

// ----- Geographic -----

const GEO_NAME_RE =
  /(country|countries|nation|state|province|region|lat|lng|longitude|latitude|geo)/i

/**
 * Most-recognizable country names + ISO 3166 alpha-2 codes for the most
 * populated / commonly referenced countries. Not exhaustive — geographic
 * detection only bumps to `medium` when ≥50% of samples match this list.
 * Below that, the column is geographic-by-name-only at `low` confidence.
 */
const KNOWN_COUNTRIES = new Set([
  // Anglosphere + EU heavy hitters
  'united states', 'usa', 'us', 'united kingdom', 'uk', 'canada', 'australia',
  'new zealand', 'ireland', 'germany', 'france', 'italy', 'spain',
  'netherlands', 'belgium', 'sweden', 'norway', 'denmark', 'finland',
  'iceland', 'portugal', 'greece', 'switzerland', 'austria', 'poland',
  // Asia-Pacific
  'japan', 'china', 'india', 'south korea', 'korea', 'singapore',
  'malaysia', 'indonesia', 'thailand', 'vietnam', 'philippines',
  'taiwan', 'hong kong', 'pakistan', 'bangladesh',
  // Americas
  'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru',
  // MENA + Africa
  'south africa', 'egypt', 'nigeria', 'kenya', 'morocco', 'turkey',
  'saudi arabia', 'united arab emirates', 'uae', 'israel',
  // Eastern Europe
  'russia', 'ukraine', 'czech republic', 'hungary', 'romania', 'estonia',
  'latvia', 'lithuania', 'bulgaria', 'croatia', 'slovakia',
  // ISO alpha-2 codes (lowercased)
  'us', 'gb', 'ca', 'au', 'nz', 'ie', 'de', 'fr', 'it', 'es', 'nl', 'be',
  'se', 'no', 'dk', 'fi', 'is', 'pt', 'gr', 'ch', 'at', 'pl', 'jp', 'cn',
  'in', 'kr', 'sg', 'my', 'id', 'th', 'vn', 'ph', 'tw', 'hk', 'pk', 'bd',
  'mx', 'br', 'ar', 'cl', 'co', 'pe', 'za', 'eg', 'ng', 'ke', 'ma', 'tr',
  'sa', 'ae', 'il', 'ru', 'ua', 'cz', 'hu', 'ro', 'ee', 'lv', 'lt', 'bg',
  'hr', 'sk',
])

const GEO_VALUE_MATCH_THRESHOLD = 0.5

/**
 * Geographic detection — name regex first, value match second. Conservative
 * by design: a column named `state` could be order-state or US-state, so
 * name-only matches stay at `low` confidence and only bump to `medium` when
 * the values actually look geographic.
 */
export function detectGeographic(
  name: string,
  samples: unknown[],
): GeoDetection {
  if (!GEO_NAME_RE.test(name)) return null

  const strs = samples.filter((v): v is string => typeof v === 'string')
  if (strs.length === 0) {
    return { subtype: 'geographic', confidence: 'low' }
  }

  const matches = strs.filter((s) =>
    KNOWN_COUNTRIES.has(s.trim().toLowerCase()),
  ).length
  if (matches / strs.length >= GEO_VALUE_MATCH_THRESHOLD) {
    return { subtype: 'geographic', confidence: 'medium' }
  }
  return { subtype: 'geographic', confidence: 'low' }
}
