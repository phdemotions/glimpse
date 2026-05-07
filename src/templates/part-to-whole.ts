import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG, categoricalScale } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const cat = columns.find(
    (c) =>
      (c.type === 'string' || c.type === 'boolean') &&
      c.cardinality >= 2 &&
      c.cardinality <= 8,
  )
  const num = columns.find((c) => c.type === 'numeric')
  if (!cat || !num) return { fits: false, score: 0 }
  return { fits: true, score: 70 }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const catCol = columns.find(
    (c) =>
      (c.type === 'string' || c.type === 'boolean') &&
      c.cardinality >= 2 &&
      c.cardinality <= 8,
  )!
  const numCol = columns.find((c) => c.type === 'numeric')!

  return {
    $schema: SCHEMA_URL,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    config: VEGA_CONFIG,
    data: { values: [...data] },
    mark: { type: 'bar' },
    encoding: {
      x: {
        aggregate: 'sum',
        field: numCol.name,
        type: 'quantitative',
        stack: 'normalize',
        axis: { format: '%', title: null },
      },
      color: {
        field: catCol.name,
        type: 'nominal',
        scale: { range: categoricalScale(catCol.cardinality) },
        legend: { title: catCol.name, orient: 'bottom' },
      },
      tooltip: [
        { field: catCol.name, type: 'nominal' },
        { aggregate: 'sum', field: numCol.name, type: 'quantitative' },
      ],
    },
  }
}

function leadingShare(
  rows: ReadonlyArray<Record<string, unknown>>,
  catField: string,
  numField: string,
): { name: string; share: number } | null {
  if (rows.length === 0) return null
  const totals = new Map<string, number>()
  let grand = 0
  for (const row of rows) {
    const v = Number(row[numField])
    if (!Number.isFinite(v)) continue
    const key = String(row[catField] ?? '')
    totals.set(key, (totals.get(key) ?? 0) + v)
    grand += v
  }
  if (grand <= 0) return null
  let best: { name: string; total: number } | null = null
  for (const [name, total] of totals) {
    if (!best || total > best.total) best = { name, total }
  }
  if (!best) return null
  return { name: best.name, share: best.total / grand }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
  rows: ReadonlyArray<Record<string, unknown>> = [],
): Frame {
  const catCol = columns.find(
    (c) =>
      (c.type === 'string' || c.type === 'boolean') &&
      c.cardinality >= 2 &&
      c.cardinality <= 8,
  )!
  const numCol = columns.find((c) => c.type === 'numeric')!

  const leader = leadingShare(rows, catCol.name, numCol.name)

  let headline = `${numCol.name} by ${catCol.name}`
  if (leader && leader.name && leader.name.length <= 40) {
    const pct = Math.round(leader.share * 100)
    headline = `${leader.name} leads with ${pct}% of ${numCol.name}`
  }
  if (headline.length > 60) {
    headline = `${numCol.name} by ${catCol.name}`
  }

  const takeaway = leader
    ? `Across ${catCol.cardinality} ${catCol.name} categories — each segment shows its share of the total.`
    : `Breaking down ${numCol.name} by ${catCol.name} — each segment shows its share of the total.`

  return {
    eyebrow: 'part-to-whole',
    headline,
    takeaway,
    source: fileName,
  }
}

const partToWholeTemplate: Template = {
  id: 'part-to-whole',
  label: 'Part-to-Whole',
  description: 'Horizontal stacked bar normalized to 100% — shows how categories divide the total.',
  applicability,
  specBuilder,
  frameFor,
}

export { partToWholeTemplate }
