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

function getLikertSortOrder(
  data: ReadonlyArray<Record<string, unknown>>,
  likertField: string,
): string[] {
  const CANONICAL_ORDER = [
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
  const seen = new Set(
    data.map((r) => String(r[likertField] ?? '').toLowerCase()),
  )
  return CANONICAL_ORDER.filter((label) => seen.has(label))
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
    if (NEGATIVE.has(label)) return colors.danger
    if (NEUTRAL.has(label)) return colors.ink[300]
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
): Frame {
  const likertCol = columns.find((c) => c.subtype === 'likert')!
  return {
    eyebrow: 'survey results',
    headline: `${likertCol.name} responses`,
    takeaway: `Showing responses from ${likertCol.name} — agreement pulls right, disagreement pulls left.`,
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
