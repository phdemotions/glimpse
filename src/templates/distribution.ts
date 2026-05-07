import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
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
    width: CHART_REGION.width,
    height: CHART_REGION.height,
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

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
): Frame {
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'distribution',
    headline: `How ${numCol.name} is spread`,
    takeaway: `Showing how ${numCol.name} values are spread — solid line marks the mean, dashed marks the median.`,
    source: fileName,
  }
}

const distributionTemplate: Template = {
  id: 'distribution',
  label: 'Distribution at a Glance',
  description: 'Histogram with mean and median rule lines — shows how a numeric variable is spread.',
  applicability,
  specBuilder,
  frameFor,
}

export { distributionTemplate }
