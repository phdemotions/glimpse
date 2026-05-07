import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { VEGA_CONFIG } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
import { colors } from '../styles/tokens'

const SCHEMA_URL = 'https://vega.github.io/schema/vega-lite/v5.json'

function buildSignExpression(likertField: string, valueField: string): string {
  return [
    `lower(datum['${likertField}']) === 'strongly disagree' ? -datum['${valueField}'] * 2`,
    `lower(datum['${likertField}']) === 'disagree' ? -datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'neutral' ? 0`,
    `lower(datum['${likertField}']) === 'agree' ? datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'strongly agree' ? datum['${valueField}'] * 2`,
    `lower(datum['${likertField}']) === 'negative' ? -datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'positive' ? datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'low' ? -datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'high' ? datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'bad' ? -datum['${valueField}']`,
    `lower(datum['${likertField}']) === 'ok' ? 0`,
    `lower(datum['${likertField}']) === 'good' ? datum['${valueField}']`,
    '0',
  ].join(' : ')
}

const CANONICAL_LIKERT_ORDER = [
  'strongly disagree',
  'disagree',
  'neutral',
  'agree',
  'strongly agree',
  'negative',
  'positive',
  'low',
  'medium',
  'high',
  'bad',
  'ok',
  'good',
]

/**
 * Returns the Likert labels actually present in the data, sorted by canonical
 * Likert order, preserving the original casing from the rows. Lowercased
 * labels would mismatch Vega-Lite's case-sensitive scale matching when the
 * source data is capitalized (e.g. "Strongly Disagree"), causing the sort to
 * fall through to Vega's alphabetical default and inverting the diverging
 * color encoding.
 */
function getLikertSortOrder(
  data: ReadonlyArray<Record<string, unknown>>,
  likertField: string,
): string[] {
  const presentByLower = new Map<string, string>()
  for (const row of data) {
    const raw = String(row[likertField] ?? '')
    const lower = raw.toLowerCase()
    if (!presentByLower.has(lower) && raw) {
      presentByLower.set(lower, raw)
    }
  }
  return CANONICAL_LIKERT_ORDER
    .filter((label) => presentByLower.has(label))
    .map((label) => presentByLower.get(label)!)
}

function buildLikertColorScale(
  data: ReadonlyArray<Record<string, unknown>>,
  likertField: string,
): string[] {
  const order = getLikertSortOrder(data, likertField)
  const NEGATIVE = new Set([
    'strongly disagree',
    'disagree',
    'negative',
    'low',
    'bad',
  ])
  const NEUTRAL = new Set(['neutral', 'medium', 'ok'])

  return order.map((label) => {
    const lower = label.toLowerCase()
    if (NEGATIVE.has(lower)) return colors.danger
    if (NEUTRAL.has(lower)) return colors.ink[300]
    return colors.sage[700]
  })
}

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const likert = columns.find((c) => c.subtype === 'likert')
  const num = columns.find((c) => c.type === 'numeric')
  if (!likert || !num) return { fits: false, score: 0 }
  return { fits: true, score: 95 }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const likertCol = columns.find((c) => c.subtype === 'likert')!
  const numCol = columns.find((c) => c.type === 'numeric')!

  return {
    $schema: SCHEMA_URL,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    config: VEGA_CONFIG,
    data: { values: [...data] },
    transform: [
      {
        calculate: buildSignExpression(likertCol.name, numCol.name),
        as: '_signed_value',
      },
    ],
    mark: { type: 'bar' },
    encoding: {
      x: {
        field: '_signed_value',
        type: 'quantitative',
        axis: { title: numCol.name },
      },
      color: {
        field: likertCol.name,
        type: 'nominal',
        sort: getLikertSortOrder(data, likertCol.name),
        scale: { range: buildLikertColorScale(data, likertCol.name) },
      },
      tooltip: [
        { field: likertCol.name, type: 'nominal' },
        { field: numCol.name, type: 'quantitative' },
      ],
    },
  }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
  rows: ReadonlyArray<Record<string, unknown>> = [],
): Frame {
  const likertCol = columns.find((c) => c.subtype === 'likert')!
  // Look for a grouping column (e.g. 'question', 'feature') that may add
  // context — anything string/text that isn't the Likert column itself.
  const groupCol = columns.find(
    (c) =>
      c !== likertCol &&
      (c.type === 'string' || c.type === 'boolean') &&
      c.cardinality >= 2 &&
      c.cardinality <= 20,
  )

  // Avoid "response responses" when the Likert column is itself called
  // "response" or "responses".
  const subject = /respons/i.test(likertCol.name)
    ? groupCol?.name ?? 'survey items'
    : `${likertCol.name} responses`

  const headline = groupCol
    ? `Survey responses across ${groupCol.cardinality} ${groupCol.name} ${groupCol.cardinality === 1 ? 'item' : 'items'}`
    : `${subject.charAt(0).toUpperCase()}${subject.slice(1)}`

  const totalCount = rows.reduce((sum, r) => {
    const numCol = columns.find((c) => c.type === 'numeric')
    if (!numCol) return sum
    const v = Number(r[numCol.name])
    return Number.isFinite(v) ? sum + v : sum
  }, 0)

  const takeaway = totalCount > 0
    ? `${totalCount.toLocaleString()} responses — agreement pulls right, disagreement pulls left.`
    : `Showing ${subject} — agreement pulls right, disagreement pulls left.`

  return {
    eyebrow: 'survey results',
    headline: headline.length <= 70 ? headline : `Survey responses`,
    takeaway,
    source: fileName,
  }
}

const surveyLikertTemplate: Template = {
  id: 'survey-likert',
  label: 'Survey Results',
  description: 'Diverging stacked bar for Likert-scale responses — agreement vs. disagreement at a glance.',
  applicability,
  specBuilder,
  frameFor,
}

export { surveyLikertTemplate, buildSignExpression, getLikertSortOrder, buildLikertColorScale }
