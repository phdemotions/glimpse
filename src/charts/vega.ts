import { colors, typography } from '../styles/tokens'

/**
 * Vega-Lite spec types are deliberately loose here — vega-embed accepts plain
 * JSON specs and the runtime validates them. Keeps the layer free of vega-lite
 * package coupling for the build, while CP-2 can tighten with proper types
 * once we own a richer spec authoring layer.
 */
export type VegaSpec = Record<string, unknown>

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

/**
 * Default Quick-mode bar chart spec. CP-1 only emits this shape; CP-2 will
 * branch on detected data types to choose bar vs line vs scatter vs distribution.
 */
export function makeBarSpec(
  data: ReadonlyArray<Record<string, unknown>>,
  xField: string,
  yField: string,
  title?: string,
): VegaSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
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
    height: 360,
  }
}
