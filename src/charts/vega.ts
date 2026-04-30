import { colors, typography } from '../styles/tokens'

/**
 * Vega-Lite spec types are deliberately loose here — vega-embed accepts plain
 * JSON specs and the runtime validates them. Keeps the layer free of vega-lite
 * package coupling for the build.
 */
export type VegaSpec = Record<string, unknown>

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'
const DEFAULT_HEIGHT = 360

/**
 * Brand-styled Vega config. Applied to every chart spec via the
 * single-renderer architecture (PLAN.md Decision #6). Keeps Quick mode
 * (default specs) and Infographic mode (templates) visually consistent
 * and lets view-source pedagogy show one stable spec language.
 */
export const VEGA_CONFIG = {
  background: 'transparent',
  font: typography.family.serif,
  title: {
    fontSize: 18,
    color: colors.ink[900],
    fontWeight: 600,
    anchor: 'start',
    offset: 12,
  },
  axis: {
    labelFont: typography.family.sans,
    labelFontSize: 12,
    labelColor: colors.ink[600],
    titleFont: typography.family.sans,
    titleFontSize: 13,
    titleColor: colors.ink[700],
    titleFontWeight: 500,
    titlePadding: 12,
    domainColor: colors.ink[200],
    tickColor: colors.ink[200],
    gridColor: colors.ink[100],
    labelPadding: 6,
  },
  view: { stroke: 'transparent' },
  bar: { fill: colors.sage[700], cornerRadiusEnd: 2 },
  line: { stroke: colors.sage[700], strokeWidth: 2 },
  point: { fill: colors.sage[700] },
  range: {
    category: [
      colors.sage[700],
      colors.ink[800],
      '#A88B6A',
      '#5B6B7A',
      '#C97A5C',
    ],
  },
}

type Row = Record<string, unknown>

// ---------- Bar (CP-1, kept) ----------

/**
 * Default Quick-mode bar chart spec. Sorted descending by Y so the dominant
 * categories read first.
 */
export function makeBarSpec(
  data: ReadonlyArray<Row>,
  xField: string,
  yField: string,
  title?: string,
): VegaSpec {
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...data] },
    mark: { type: 'bar' },
    encoding: {
      x: { field: xField, type: 'nominal', sort: '-y', axis: { labelAngle: 0 } },
      y: { field: yField, type: 'quantitative' },
      tooltip: [
        { field: xField, type: 'nominal' },
        { field: yField, type: 'quantitative' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}

// ---------- Line ----------

/**
 * Time-series line chart. `temporal` axis when the X column parses as ISO 8601,
 * `nominal` when it doesn't (US-format dates land here — Vega-Lite struggles
 * to parse `M/D/YYYY` cleanly). The selector passes `temporal: false` for
 * medium-confidence date columns.
 */
export function makeLineSpec(
  data: ReadonlyArray<Row>,
  xField: string,
  yField: string,
  options: { temporal?: boolean; title?: string } = {},
): VegaSpec {
  const { temporal = true, title } = options
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...data] },
    mark: { type: 'line', point: { fill: colors.sage[700], size: 60 } },
    encoding: {
      x: {
        field: xField,
        type: temporal ? 'temporal' : 'nominal',
        axis: { labelAngle: 0 },
      },
      y: { field: yField, type: 'quantitative' },
      tooltip: [
        { field: xField, type: temporal ? 'temporal' : 'nominal' },
        { field: yField, type: 'quantitative' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}

// ---------- Scatter ----------

export function makeScatterSpec(
  data: ReadonlyArray<Row>,
  xField: string,
  yField: string,
  title?: string,
): VegaSpec {
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...data] },
    mark: { type: 'point', filled: true, opacity: 0.7, size: 70 },
    encoding: {
      x: { field: xField, type: 'quantitative' },
      y: { field: yField, type: 'quantitative' },
      tooltip: [
        { field: xField, type: 'quantitative' },
        { field: yField, type: 'quantitative' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}

// ---------- Histogram ----------

/**
 * Histogram of pre-binned data. Receives `[{ bucket, count }]` rows from a
 * DuckDB GROUP BY query (see `src/charts/binning.ts`). Pre-binning in the
 * engine keeps render cost flat for large datasets — Vega-Lite's `bin: true`
 * would ship every row to the renderer.
 */
export function makeHistogramSpec(
  bins: ReadonlyArray<{ bucket: number; count: number }>,
  xField: string,
  title?: string,
): VegaSpec {
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...bins] },
    mark: { type: 'bar', binSpacing: 1 },
    encoding: {
      x: {
        field: 'bucket',
        type: 'quantitative',
        title: xField,
        axis: { labelAngle: 0 },
      },
      y: { field: 'count', type: 'quantitative', title: 'count' },
      tooltip: [
        { field: 'bucket', type: 'quantitative', title: xField },
        { field: 'count', type: 'quantitative' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}

// ---------- Pie ----------

export function makePieSpec(
  data: ReadonlyArray<Row>,
  categoryField: string,
  valueField: string,
  title?: string,
): VegaSpec {
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...data] },
    mark: { type: 'arc', innerRadius: 0, padAngle: 0.01 },
    encoding: {
      theta: { field: valueField, type: 'quantitative', stack: true },
      color: {
        field: categoryField,
        type: 'nominal',
        legend: { title: categoryField },
      },
      tooltip: [
        { field: categoryField, type: 'nominal' },
        { field: valueField, type: 'quantitative' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}

// ---------- Ranking (top-N bar) ----------

/**
 * Top-N bar chart. Window transform explicitly sorts by `yField` descending
 * before assigning ranks — without the sort field the rank tracks data order
 * (Vega-Lite default) which would silently return the first 10 rows instead
 * of the top 10 by measure.
 */
export function makeRankingSpec(
  data: ReadonlyArray<Row>,
  xField: string,
  yField: string,
  limit = 10,
  title?: string,
): VegaSpec {
  return {
    $schema: SCHEMA_URL,
    config: VEGA_CONFIG,
    title,
    data: { values: [...data] },
    transform: [
      {
        window: [{ op: 'rank', as: '_rank' }],
        sort: [{ field: yField, order: 'descending' }],
      },
      { filter: `datum._rank <= ${limit}` },
    ],
    mark: { type: 'bar' },
    encoding: {
      x: { field: xField, type: 'nominal', sort: '-y', axis: { labelAngle: 0 } },
      y: { field: yField, type: 'quantitative' },
      tooltip: [
        { field: xField, type: 'nominal' },
        { field: yField, type: 'quantitative' },
        { field: '_rank', type: 'quantitative', title: 'rank' },
      ],
    },
    width: 'container',
    height: DEFAULT_HEIGHT,
  }
}
