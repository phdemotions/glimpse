import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
import { colors, typography } from '../styles/tokens'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function formatHeadline(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const m = value / 1_000_000
    return (Number.isInteger(m) ? m.toFixed(0) : m.toFixed(1)) + 'M'
  }
  if (abs >= 1_000) {
    const k = value / 1_000
    return (Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)) + 'K'
  }
  return value.toLocaleString()
}

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const numerics = columns.filter((c) => c.type === 'numeric')
  if (numerics.length === 0) return { fits: false, score: 0 }
  const hasOneRow = numerics.some((c) => c.cardinality <= 1)
  if (numerics.length === 1 && hasOneRow) return { fits: true, score: 100 }
  return { fits: true, score: 80 }
}

function aggregateValue(
  data: ReadonlyArray<Record<string, unknown>>,
  numCol: ColumnInfo,
): { raw: number; isAggregate: boolean } {
  const rows = [...data]
  if (rows.length === 1) {
    return { raw: Number(rows[0][numCol.name]) || 0, isAggregate: false }
  }
  const raw = rows.reduce(
    (sum, r) => sum + (Number(r[numCol.name]) || 0),
    0,
  )
  return { raw, isAggregate: true }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const numCol = columns.find((c) => c.type === 'numeric')!
  const { raw } = aggregateValue(data, numCol)
  const formattedValue = formatHeadline(raw)

  const centerX = CHART_REGION.width / 2
  const centerY = CHART_REGION.height / 2

  return {
    $schema: SCHEMA_URL,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    config: { ...VEGA_CONFIG, axis: { ...VEGA_CONFIG.axis, grid: false } },
    view: { stroke: null },
    data: { values: [{ _value: formattedValue }] },
    layer: [
      {
        mark: {
          type: 'text',
          font: typography.family.serif,
          fontSize: 120,
          fontWeight: 600,
          color: colors.ink[900],
          align: 'center',
          baseline: 'middle',
        },
        encoding: {
          text: { field: '_value', type: 'nominal' },
          x: { value: centerX },
          y: { value: centerY },
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
    eyebrow: 'big number',
    headline: numCol.name,
    takeaway: `Showing ${numCol.name} as a single headline figure.`,
    source: fileName,
  }
}

const bigNumberTemplate: Template = {
  id: 'big-number',
  label: 'Big Number',
  description: 'A single headline number on a clean canvas — ideal for one key metric.',
  applicability,
  specBuilder,
  frameFor,
}

export { bigNumberTemplate, formatHeadline }
