import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'
import { formatHeadline } from './big-number'

const numCol: ColumnInfo = {
  name: 'revenue',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 100,
}

const strCol: ColumnInfo = {
  name: 'country',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 25,
}

function getBigNumber() {
  return TEMPLATES.find((t) => t.id === 'big-number')!
}

describe('big-number template', () => {
  describe('applicability', () => {
    it('fits with score 100 when single numeric column with 1-row cardinality', () => {
      const col: ColumnInfo = { ...numCol, cardinality: 1 }
      const result = getBigNumber().applicability([col])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fits with score 80 when multiple rows of summable numerics', () => {
      const result = getBigNumber().applicability([numCol, strCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(80)
    })

    it('does not fit when no numeric columns', () => {
      const result = getBigNumber().applicability([strCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    it('returns chart-only spec with a single text-mark layer at the new architecture', () => {
      const data = [{ revenue: 42000 }]
      const spec = getBigNumber().specBuilder(data, [numCol]) as Record<string, unknown>
      const layer = spec.layer as unknown[]
      expect(layer).toHaveLength(1)
      expect((layer[0] as Record<string, unknown>).mark).toHaveProperty('type', 'text')
    })

    it('formats headline value with commas for large numbers', () => {
      const data = [{ revenue: 1234567 }]
      const spec = getBigNumber().specBuilder(data, [numCol]) as Record<string, unknown>
      const dataValues = (spec.data as Record<string, unknown>).values as Record<string, unknown>[]
      expect(dataValues[0]._value).toBe('1.2M')
    })

    it('sums multiple rows', () => {
      const data = [{ revenue: 500 }, { revenue: 700 }]
      const spec = getBigNumber().specBuilder(data, [numCol]) as Record<string, unknown>
      const dataValues = (spec.data as Record<string, unknown>).values as Record<string, unknown>[]
      expect(dataValues[0]._value).toBe('1.2K')
    })

    it('emits chart-only dimensions matching CHART_REGION (frame is composed by wrapWithFrame)', () => {
      const data = [{ revenue: 100 }]
      const spec = getBigNumber().specBuilder(data, [numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      // Chart region height < canvas height because header + footer reserve space.
      expect(spec.height).toBeLessThan(675)
    })
  })

  describe('frameFor', () => {
    it('returns eyebrow "big number"', () => {
      const frame = getBigNumber().frameFor([numCol], 'revenue.csv')
      expect(frame.eyebrow).toBe('big number')
    })

    it('uses the column name as headline', () => {
      const frame = getBigNumber().frameFor([numCol], 'revenue.csv')
      expect(frame.headline).toBe('revenue')
    })

    it('uses the supplied filename as the source line', () => {
      const frame = getBigNumber().frameFor([numCol], 'revenue.csv')
      expect(frame.source).toBe('revenue.csv')
    })

    it('mentions the column name in the takeaway', () => {
      const frame = getBigNumber().frameFor([numCol], 'revenue.csv')
      expect(frame.takeaway).toContain('revenue')
    })
  })

  describe('formatHeadline', () => {
    it('formats millions with M suffix', () => {
      expect(formatHeadline(2_500_000)).toBe('2.5M')
    })

    it('formats thousands with K suffix', () => {
      expect(formatHeadline(45_000)).toBe('45K')
    })

    it('formats exact millions without decimal', () => {
      expect(formatHeadline(3_000_000)).toBe('3M')
    })

    it('formats exact thousands without decimal', () => {
      expect(formatHeadline(7_000)).toBe('7K')
    })

    it('uses locale string for small numbers', () => {
      expect(formatHeadline(42)).toBe('42')
    })
  })
})
