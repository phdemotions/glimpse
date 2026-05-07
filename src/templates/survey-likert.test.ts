import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'
import { colors } from '../styles/tokens'
import { buildSignExpression, getLikertSortOrder, buildLikertColorScale } from './survey-likert'

const numCol: ColumnInfo = {
  name: 'count',
  duckdbType: 'INTEGER',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 50,
}

const likertCol: ColumnInfo = {
  name: 'satisfaction',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: 'likert',
  confidence: 'high',
  nullCount: 0,
  cardinality: 5,
}

const catCol: ColumnInfo = {
  name: 'category',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 4,
}

function getSurveyLikert() {
  return TEMPLATES.find((t) => t.id === 'survey-likert')!
}

describe('survey-likert template', () => {
  describe('applicability', () => {
    it('fits with score 95 when likert subtype + numeric', () => {
      const result = getSurveyLikert().applicability([likertCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(95)
    })

    it('does not fit when no likert column', () => {
      const result = getSurveyLikert().applicability([catCol, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when likert column but no numeric', () => {
      const result = getSurveyLikert().applicability([likertCol, catCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { satisfaction: 'Strongly Disagree', count: 5 },
      { satisfaction: 'Disagree', count: 10 },
      { satisfaction: 'Neutral', count: 20 },
      { satisfaction: 'Agree', count: 30 },
      { satisfaction: 'Strongly Agree', count: 15 },
    ]

    it('has transform with signed value calculation', () => {
      const spec = getSurveyLikert().specBuilder(sampleData, [likertCol, numCol]) as Record<string, unknown>
      const transforms = spec.transform as Record<string, unknown>[]
      expect(transforms).toHaveLength(1)
      expect(transforms[0].as).toBe('_signed_value')
      expect(typeof transforms[0].calculate).toBe('string')
    })

    it('uses diverging color scale with danger and sage', () => {
      const spec = getSurveyLikert().specBuilder(sampleData, [likertCol, numCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      const color = encoding.color as Record<string, unknown>
      const scale = color.scale as Record<string, unknown>
      const range = scale.range as string[]
      expect(range).toContain(colors.danger)
      expect(range).toContain(colors.sage[700])
      expect(range).toContain(colors.ink[300])
    })

    it('mark type is bar', () => {
      const spec = getSurveyLikert().specBuilder(sampleData, [likertCol, numCol]) as Record<string, unknown>
      const mark = spec.mark as Record<string, unknown>
      expect(mark.type).toBe('bar')
    })

    it('emits chart-only dimensions: full canvas width, sub-canvas height', () => {
      const spec = getSurveyLikert().specBuilder(sampleData, [likertCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBeLessThan(675)
    })
  })

  describe('frameFor', () => {
    it('returns eyebrow "survey results"', () => {
      const frame = getSurveyLikert().frameFor([likertCol, numCol], 'data.csv')
      expect(frame.eyebrow).toBe('survey results')
    })

    it('includes likert column name in takeaway', () => {
      const frame = getSurveyLikert().frameFor([likertCol, numCol], 'data.csv')
      expect(frame.takeaway).toContain('satisfaction')
    })
  })

  describe('buildSignExpression', () => {
    it('returns a string expression referencing the likert and value fields', () => {
      const expr = buildSignExpression('rating', 'count')
      expect(expr).toContain("datum['rating']")
      expect(expr).toContain("datum['count']")
    })
  })

  describe('getLikertSortOrder', () => {
    it('returns labels in canonical order filtered to data', () => {
      const data = [
        { rating: 'Agree' },
        { rating: 'Disagree' },
        { rating: 'Neutral' },
      ]
      const order = getLikertSortOrder(data, 'rating')
      expect(order).toEqual(['disagree', 'neutral', 'agree'])
    })
  })

  describe('buildLikertColorScale', () => {
    it('maps negative labels to danger, neutral to ink, positive to sage', () => {
      const data = [
        { rating: 'Disagree' },
        { rating: 'Neutral' },
        { rating: 'Agree' },
      ]
      const scale = buildLikertColorScale(data, 'rating')
      expect(scale).toEqual([colors.danger, colors.ink[300], colors.sage[700]])
    })
  })
})
