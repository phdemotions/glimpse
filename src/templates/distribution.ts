import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
import { withAxisDiscipline } from '../charts/axis'
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

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const numCol = columns.find((c) => c.type === 'numeric')!

  const extent = numericExtent(data, numCol.name)
  // X axis: discipline based on the data's actual range so the format matches
  // (currency for monetary columns, integer for integer-only data).
  const xKind = numCol.duckdbType === 'INTEGER' || numCol.duckdbType === 'BIGINT'
    ? 'count'
    : 'numeric'
  const xDiscipline = withAxisDiscipline(
    xKind,
    extent ? { dataMin: extent.min, dataMax: extent.max } : {},
  )

  // Y axis: count of records — must be integer ticks (kills the audit's
  // "0.3 to 2.0" decimal-tick regression).
  const yDiscipline = withAxisDiscipline('count')

  return {
    $schema: SCHEMA_URL,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    config: VEGA_CONFIG,
    data: { values: [...data] },
    layer: [
      {
        mark: { type: 'bar', color: colors.sage[700], cornerRadiusEnd: 0 },
        encoding: {
          x: {
            bin: { maxbins: 10 },
            field: numCol.name,
            type: 'quantitative',
            // Only apply the axis half of the discipline — binning computes
            // its own bin boundaries; explicit scale.domain conflicts.
            axis: {
              ...xDiscipline.axis,
              title: numCol.name,
              labelAngle: 0,
            },
          },
          y: {
            aggregate: 'count',
            type: 'quantitative',
            axis: { ...yDiscipline.axis, title: 'count' },
          },
        },
      },
      {
        mark: { type: 'rule', color: colors.ink[900], strokeWidth: 2 },
        encoding: {
          x: { aggregate: 'mean', field: numCol.name, type: 'quantitative' },
        },
      },
      {
        mark: { type: 'rule', color: colors.ink[700], strokeWidth: 1.5, strokeDash: [4, 4] },
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
  rows: ReadonlyArray<Record<string, unknown>> = [],
): Frame {
  const numCol = columns.find((c) => c.type === 'numeric')!

  const extent = numericExtent(rows, numCol.name)
  let takeaway: string
  if (extent && rows.length > 1) {
    takeaway = `${numCol.name} ranges from ${extent.min.toLocaleString()} to ${extent.max.toLocaleString()} across ${rows.length} entries — solid rule marks the mean, dashed marks the median.`
  } else {
    takeaway = `Showing how ${numCol.name} values are spread — solid rule marks the mean, dashed marks the median.`
  }
  if (takeaway.length > 200) {
    takeaway = `Distribution of ${numCol.name} — solid rule marks the mean, dashed marks the median.`
  }

  return {
    eyebrow: 'distribution',
    headline: `How ${numCol.name} is spread`,
    takeaway,
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
