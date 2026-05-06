import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { colors } from '../styles/tokens'
import { detectBeforeAfter } from '../data/shape-detect'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const shape = detectBeforeAfter(columns)
  if (!shape) return { fits: false, score: 0 }
  return { fits: true, score: 80 }
}

function transposeWide(
  rows: ReadonlyArray<Record<string, unknown>>,
  categoryCol: string,
  beforeCol: string,
  afterCol: string,
): Record<string, unknown>[] {
  const long: Record<string, unknown>[] = []
  for (const row of rows) {
    long.push({ [categoryCol]: row[categoryCol], period: 'Before', value: row[beforeCol] })
    long.push({ [categoryCol]: row[categoryCol], period: 'After', value: row[afterCol] })
  }
  return long
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const shape = detectBeforeAfter(columns)!

  if (shape.kind === 'wide') {
    const categoryCol = columns.find(
      (c) => c.type === 'string' || c.type === 'boolean',
    )
    const categoryField = categoryCol ? categoryCol.name : 'category'
    const prepared = transposeWide([...data], categoryField, shape.beforeCol, shape.afterCol)

    return {
      $schema: SCHEMA_URL,
      width: 1200,
      height: 675,
      config: VEGA_CONFIG,
      data: { values: prepared },
      mark: { type: 'bar' },
      encoding: {
        x: { field: categoryField, type: 'nominal', axis: { labelAngle: 0 } },
        y: { field: 'value', type: 'quantitative' },
        xOffset: { field: 'period', type: 'nominal' },
        color: {
          field: 'period',
          type: 'nominal',
          scale: { domain: ['Before', 'After'], range: [colors.sage[400], colors.sage[900]] },
          legend: { title: null, orient: 'top' },
        },
        tooltip: [
          { field: categoryField, type: 'nominal' },
          { field: 'period', type: 'nominal' },
          { field: 'value', type: 'quantitative' },
        ],
      },
    }
  }

  // Long shape — data already has category + value columns
  const periodCol = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.cardinality === 2,
  )!
  const numCol = columns.find((c) => c.type === 'numeric')!
  const categoryCol = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c !== periodCol,
  )
  const categoryField = categoryCol ? categoryCol.name : periodCol.name

  return {
    $schema: SCHEMA_URL,
    width: 1200,
    height: 675,
    config: VEGA_CONFIG,
    data: { values: [...data] },
    mark: { type: 'bar' },
    encoding: {
      x: { field: categoryField, type: 'nominal', axis: { labelAngle: 0 } },
      y: { field: numCol.name, type: 'quantitative' },
      xOffset: { field: periodCol.name, type: 'nominal' },
      color: {
        field: periodCol.name,
        type: 'nominal',
        legend: { title: null, orient: 'top' },
      },
      tooltip: [
        { field: categoryField, type: 'nominal' },
        { field: periodCol.name, type: 'nominal' },
        { field: numCol.name, type: 'quantitative' },
      ],
    },
  }
}

function captionFor(
  columns: ReadonlyArray<ColumnInfo>,
): Caption {
  const shape = detectBeforeAfter(columns)!

  if (shape.kind === 'wide') {
    return {
      eyebrow: 'before / after',
      body: `Comparing ${shape.beforeCol} vs ${shape.afterCol} side by side.`,
    }
  }

  const periodCol = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.cardinality === 2,
  )!
  return {
    eyebrow: 'before / after',
    body: `Comparing values across ${periodCol.name} side by side.`,
  }
}

const beforeAfterTemplate: Template = {
  id: 'before-after',
  label: 'Before / After',
  description: 'Paired bars comparing two time periods or conditions side by side.',
  applicability,
  specBuilder,
  captionFor,
}

export { beforeAfterTemplate }
