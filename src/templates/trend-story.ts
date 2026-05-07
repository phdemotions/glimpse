import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
import { withAxisDiscipline } from '../charts/axis'
import { colors, typography } from '../styles/tokens'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const dateCol = columns.find((c) => c.type === 'date' && c.cardinality >= 3)
  const numCol = columns.find((c) => c.type === 'numeric')
  if (!dateCol || !numCol) return { fits: false, score: 0 }
  return { fits: true, score: 90 }
}

function numericExtent(
  rows: ReadonlyArray<Record<string, unknown>>,
  field: string,
): { min: number; max: number } | null {
  let min = Infinity
  let max = -Infinity
  let seen = false
  for (const row of rows) {
    const raw = Number(row[field])
    if (!Number.isFinite(raw)) continue
    seen = true
    if (raw < min) min = raw
    if (raw > max) max = raw
  }
  return seen ? { min, max } : null
}

function formatCurrencyShort(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${Math.round(value)}`
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const dateCol = columns.find((c) => c.type === 'date' && c.cardinality >= 3)!
  const numCol = columns.find((c) => c.type === 'numeric')!
  const temporal = dateCol.confidence === 'high'

  const extent = numericExtent(data, numCol.name)
  const yDiscipline = withAxisDiscipline(
    'currency',
    extent ? { dataMin: extent.min, dataMax: extent.max } : {},
  )

  return {
    $schema: SCHEMA_URL,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    padding: { left: 40, right: 60, top: 12, bottom: 30 },
    config: VEGA_CONFIG,
    data: { values: [...data] },
    layer: [
      {
        mark: {
          type: 'line',
          point: { fill: colors.sage[700], size: 60 },
          stroke: colors.sage[700],
          strokeWidth: 2,
        },
        encoding: {
          x: {
            field: dateCol.name,
            type: temporal ? 'temporal' : 'nominal',
            ...(temporal
              ? {
                  axis: { format: '%b %Y', formatType: 'time', labelAngle: 0 },
                }
              : { axis: { labelAngle: 0 } }),
          },
          y: {
            field: numCol.name,
            type: 'quantitative',
            ...yDiscipline,
            axis: { ...yDiscipline.axis, title: numCol.name },
          },
        },
      },
      {
        transform: [
          {
            window: [
              { op: 'lag', field: numCol.name, param: 1, as: '_prev' },
              { op: 'lead', field: numCol.name, param: 1, as: '_next' },
            ],
            sort: [{ field: dateCol.name, order: 'ascending' }],
          },
          {
            calculate: `datum['${numCol.name}'] > datum._prev && datum['${numCol.name}'] > datum._next ? 'peak' : (datum['${numCol.name}'] < datum._prev && datum['${numCol.name}'] < datum._next ? 'trough' : null)`,
            as: '_extremum',
          },
          { filter: 'datum._extremum !== null' },
        ],
        layer: [
          {
            mark: {
              type: 'rule',
              stroke: colors.ink[300],
              strokeWidth: 1,
              y2: { expr: 'height' },
            },
            encoding: {
              x: { field: dateCol.name, type: temporal ? 'temporal' : 'nominal' },
              y: { field: numCol.name, type: 'quantitative' },
            },
          },
          {
            mark: {
              type: 'text',
              dy: -16,
              fontSize: 12,
              fontWeight: 600,
              font: typography.family.sans,
              color: colors.ink[800],
            },
            encoding: {
              x: { field: dateCol.name, type: temporal ? 'temporal' : 'nominal' },
              y: { field: numCol.name, type: 'quantitative' },
              text: { field: numCol.name, type: 'quantitative', format: ',.0f' },
            },
          },
        ],
      },
    ],
  }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
  rows: ReadonlyArray<Record<string, unknown>> = [],
): Frame {
  const dateCol = columns.find((c) => c.type === 'date' && c.cardinality >= 3)!
  const numCol = columns.find((c) => c.type === 'numeric')!

  const extent = numericExtent(rows, numCol.name)
  const firstDate = rows.length > 0 ? String(rows[0][dateCol.name] ?? '').slice(0, 7) : ''
  const lastDate =
    rows.length > 0 ? String(rows[rows.length - 1][dateCol.name] ?? '').slice(0, 7) : ''

  let headline = `${numCol.name} over time`
  if (extent && extent.min > 0 && rows.length >= 2) {
    const change = Math.round(((extent.max - extent.min) / extent.min) * 100)
    if (change > 0) {
      headline = `${numCol.name} grew ${change}% across ${dateCol.cardinality} ${dateCol.name}s`
    }
  }

  let takeaway = `Tracking ${numCol.name} across ${dateCol.cardinality} ${dateCol.name}s — peaks and dips are called out.`
  if (extent && firstDate && lastDate) {
    takeaway = `From ${formatCurrencyShort(extent.min)} (${firstDate}) to ${formatCurrencyShort(extent.max)} (${lastDate}) — peaks and dips are called out.`
  }

  if (headline.length > 60) {
    headline = `${numCol.name} over time`
  }

  return {
    eyebrow: 'trend story',
    headline,
    takeaway,
    source: fileName,
  }
}

const trendStoryTemplate: Template = {
  id: 'trend-story',
  label: 'Trend Story',
  description: 'Time-series line chart with automatic peak and trough annotations.',
  applicability,
  specBuilder,
  frameFor,
}

export { trendStoryTemplate }
