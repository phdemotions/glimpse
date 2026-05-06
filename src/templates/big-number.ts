import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
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

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const numCol = columns.find((c) => c.type === 'numeric')!
  const rows = [...data]

  let raw: number
  if (rows.length === 1) {
    raw = Number(rows[0][numCol.name]) || 0
  } else {
    raw = rows.reduce((sum, r) => sum + (Number(r[numCol.name]) || 0), 0)
  }

  const formattedValue = formatHeadline(raw)
  const contextLine =
    rows.length === 1
      ? ''
      : `Sum of ${rows.length} rows`

  return {
    $schema: SCHEMA_URL,
    width: 1200,
    height: 675,
    config: { ...VEGA_CONFIG, axis: { ...VEGA_CONFIG.axis, grid: false } },
    view: { stroke: null },
    data: {
      values: [
        {
          _value: formattedValue,
          _label: numCol.name,
          _context: contextLine,
        },
      ],
    },
    layer: [
      {
        mark: {
          type: 'text',
          font: typography.family.sans,
          fontSize: 16,
          fontStyle: 'italic',
          color: colors.sage[700],
        },
        encoding: {
          text: { field: '_label', type: 'nominal' },
          x: { datum: 600 },
          y: { datum: 260 },
        },
      },
      {
        mark: {
          type: 'text',
          font: typography.family.serif,
          fontSize: 72,
          fontWeight: 600,
          color: colors.ink[900],
        },
        encoding: {
          text: { field: '_value', type: 'nominal' },
          x: { datum: 600 },
          y: { datum: 340 },
        },
      },
      {
        mark: {
          type: 'text',
          font: typography.family.sans,
          fontSize: 14,
          color: colors.ink[500],
        },
        encoding: {
          text: { field: '_context', type: 'nominal' },
          x: { datum: 600 },
          y: { datum: 400 },
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
    eyebrow: 'big number',
    body: `Showing ${numCol.name} as a headline figure on a clean canvas.`,
  }
}

const bigNumberTemplate: Template = {
  id: 'big-number',
  label: 'Big Number',
  description: 'A single headline number on a clean canvas — ideal for one key metric.',
  applicability,
  specBuilder,
  captionFor,
}

export { bigNumberTemplate, formatHeadline }
