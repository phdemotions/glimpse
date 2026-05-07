import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'

const numCol: ColumnInfo = {
  name: 'count',
  duckdbType: 'INTEGER',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 50,
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

const catCol2: ColumnInfo = {
  name: 'region',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 2,
}

function getPartToWhole() {
  return TEMPLATES.find((t) => t.id === 'part-to-whole')!
}

describe('part-to-whole template', () => {
  describe('applicability', () => {
    it('fits with score 70 when 4 categories + numeric', () => {
      const result = getPartToWhole().applicability([catCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(70)
    })

    it('fits when 2 categories + numeric', () => {
      const result = getPartToWhole().applicability([catCol2, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(70)
    })

    it('does not fit when cardinality > 8', () => {
      const highCard: ColumnInfo = { ...catCol, cardinality: 9 }
      const result = getPartToWhole().applicability([highCard, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when cardinality < 2', () => {
      const lowCard: ColumnInfo = { ...catCol, cardinality: 1 }
      const result = getPartToWhole().applicability([lowCard, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when no categorical column', () => {
      const result = getPartToWhole().applicability([numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when no numeric column', () => {
      const result = getPartToWhole().applicability([catCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { category: 'A', count: 30 },
      { category: 'B', count: 20 },
      { category: 'C', count: 35 },
      { category: 'D', count: 15 },
    ]

    it('encoding uses stack normalize', () => {
      const spec = getPartToWhole().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      const x = encoding.x as Record<string, unknown>
      expect(x.stack).toBe('normalize')
    })

    it('mark type is bar', () => {
      const spec = getPartToWhole().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      const mark = spec.mark as Record<string, unknown>
      expect(mark.type).toBe('bar')
    })

    it('color encoding uses categorical field', () => {
      const spec = getPartToWhole().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      const color = encoding.color as Record<string, unknown>
      expect(color.field).toBe('category')
    })

    it('emits chart-only dimensions: full canvas width, sub-canvas height', () => {
      const spec = getPartToWhole().specBuilder(sampleData, [catCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBeLessThan(675)
    })
  })

  describe('frameFor', () => {
    it('returns eyebrow "part-to-whole"', () => {
      const frame = getPartToWhole().frameFor([catCol, numCol], 'data.csv')
      expect(frame.eyebrow).toBe('part-to-whole')
    })

    it('includes both column names in takeaway', () => {
      const frame = getPartToWhole().frameFor([catCol, numCol], 'data.csv')
      expect(frame.takeaway).toContain('count')
      expect(frame.takeaway).toContain('category')
    })
  })
})
