import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { colors } from '../styles/tokens'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const numerics = columns.filter((c) => c.type === 'numeric')
  if (numerics.length === 0) return { fits: false, score: 0 }

  const hasNonNumeric = columns.some(
    (c) => c.type === 'string' || c.type === 'boolean' || c.type === 'date',
  )
  if (!hasNonNumeric) return { fits: true, score: 100 }
  return { fits: true, score: 50 }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const numCol = columns.find((c) => c.type === 'numeric')!

  return {
    $schema: SCHEMA_URL,
    width: 1200,
    height: 675,
    config: VEGA_CONFIG,
    data: { values: [...data] },
    layer: [
      {
        mark: { type: 'bar', color: colors.sage[700] },
        encoding: {
          x: { bin: true, field: numCol.name, type: 'quantitative' },
          y: { aggregate: 'count', type: 'quantitative' },
        },
      },
      {
        mark: { type: 'rule', color: colors.sage[900], strokeWidth: 2 },
        encoding: {
          x: { aggregate: 'mean', field: numCol.name, type: 'quantitative' },
        },
      },
      {
        mark: { type: 'rule', color: colors.sage[700], strokeWidth: 2, strokeDash: [4, 4] },
        encoding: {
          x: { aggregate: 'median', field: numCol.name, type: 'quantitative' },
        },
      },
    ],
  }
}

function captionFor(
  columns: ReadonlyArray<ColumnInfo>,
): Caption {
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'distribution',
    body: `Showing how ${numCol.name} values are spread — solid line marks the mean, dashed marks the median.`,
  }
}

const distributionTemplate: Template = {
  id: 'distribution',
  label: 'Distribution at a Glance',
  description: 'Histogram with mean and median rule lines — shows how a numeric variable is spread.',
  applicability,
  specBuilder,
  captionFor,
}

export { distributionTemplate }
