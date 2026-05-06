import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'
import { colors } from '../styles/tokens'

const catCol: ColumnInfo = {
  name: 'country',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 25,
}

const numCol: ColumnInfo = {
  name: 'revenue',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 100,
}

function getTopN() {
  return TEMPLATES.find((t) => t.id === 'top-n')!
}

describe('top-n-ranking template', () => {
  describe('applicability', () => {
    it('fits with score 100 when categorical cardinality > 12 plus numeric', () => {
      const result = getTopN().applicability([catCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fits with score 60 when categorical cardinality 5..12', () => {
      const lowCard: ColumnInfo = { ...catCol, cardinality: 8 }
      const result = getTopN().applicability([lowCard, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(60)
    })

    it('does not fit when no categorical column', () => {
      const result = getTopN().applicability([numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when categorical cardinality too low', () => {
      const tooLow: ColumnInfo = { ...catCol, cardinality: 3 }
      const result = getTopN().applicability([tooLow, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when no numeric column', () => {
      const result = getTopN().applicability([catCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { country: 'US', revenue: 1000 },
      { country: 'UK', revenue: 800 },
      { country: 'DE', revenue: 600 },
    ]

    it('returns spec with width=1200 and height=675', () => {
      const spec = getTopN().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBe(675)
    })

    it('has color condition for top-3 emphasis', () => {
      const spec = getTopN().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      const color = encoding.color as Record<string, unknown>
      expect(color.condition).toEqual({
        test: 'datum._rank <= 3',
        value: colors.sage[900],
      })
      expect(color.value).toBe(colors.sage[400])
    })

    it('preserves ranking transform from makeRankingSpec', () => {
      const spec = getTopN().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      const transform = spec.transform as unknown[]
      expect(transform).toBeDefined()
      expect(transform.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('captionFor', () => {
    it('returns eyebrow "top 10"', () => {
      const caption = getTopN().captionFor([catCol, numCol])
      expect(caption.eyebrow).toBe('top 10')
    })

    it('includes both column names in body', () => {
      const caption = getTopN().captionFor([catCol, numCol])
      expect(caption.body).toContain('country')
      expect(caption.body).toContain('revenue')
    })
  })
})
