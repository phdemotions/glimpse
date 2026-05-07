import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
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
        legend: { title: catCol.name, orient: 'bottom' },
      },
      tooltip: [
        { field: catCol.name, type: 'nominal' },
        { aggregate: 'sum', field: numCol.name, type: 'quantitative' },
      ],
    },
  }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
): Frame {
  const catCol = columns.find(
    (c) =>
      (c.type === 'string' || c.type === 'boolean') &&
      c.cardinality >= 2 &&
      c.cardinality <= 8,
  )!
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'part-to-whole',
    headline: `${numCol.name} by ${catCol.name}`,
    takeaway: `Breaking down ${numCol.name} by ${catCol.name} — each segment shows its share of the total.`,
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
