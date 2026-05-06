import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
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

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const dateCol = columns.find((c) => c.type === 'date' && c.cardinality >= 3)!
  const numCol = columns.find((c) => c.type === 'numeric')!
  const temporal = dateCol.confidence === 'high'

  return {
    $schema: SCHEMA_URL,
    width: 1200,
    height: 675,
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
          x: { field: dateCol.name, type: temporal ? 'temporal' : 'nominal' },
          y: { field: numCol.name, type: 'quantitative' },
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
        mark: {
          type: 'text',
          dy: -15,
          fontSize: 11,
          font: typography.family.sans,
          color: colors.ink[700],
        },
        encoding: {
          x: { field: dateCol.name, type: temporal ? 'temporal' : 'nominal' },
          y: { field: numCol.name, type: 'quantitative' },
          text: { field: numCol.name, type: 'quantitative', format: ',.0f' },
        },
      },
    ],
  }
}

function captionFor(
  columns: ReadonlyArray<ColumnInfo>,
): Caption {
  const dateCol = columns.find((c) => c.type === 'date' && c.cardinality >= 3)!
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'trend story',
    body: `Tracking ${numCol.name} over time in ${dateCol.name} — peaks and dips are called out.`,
  }
}

const trendStoryTemplate: Template = {
  id: 'trend-story',
  label: 'Trend Story',
  description: 'Time-series line chart with automatic peak and trough annotations.',
  applicability,
  specBuilder,
  captionFor,
}

export { trendStoryTemplate }
