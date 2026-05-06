import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'
import { colors } from '../styles/tokens'

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

const dateCol: ColumnInfo = {
  name: 'date',
  duckdbType: 'DATE',
  type: 'date',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 30,
}

function getDistribution() {
  return TEMPLATES.find((t) => t.id === 'distribution')!
}

describe('distribution template', () => {
  describe('applicability', () => {
    it('fits with score 100 when 1 numeric only', () => {
      const result = getDistribution().applicability([numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(100)
    })

    it('fits with score 50 when numeric plus categoricals', () => {
      const result = getDistribution().applicability([numCol, catCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(50)
    })

    it('fits with score 50 when numeric plus dates', () => {
      const result = getDistribution().applicability([numCol, dateCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(50)
    })

    it('does not fit when no numeric columns', () => {
      const result = getDistribution().applicability([catCol, dateCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { count: 10 },
      { count: 20 },
      { count: 15 },
      { count: 30 },
      { count: 25 },
    ]

    it('returns spec with 3 layers (histogram + mean rule + median rule)', () => {
      const spec = getDistribution().specBuilder(sampleData, [numCol]) as Record<string, unknown>
      const layer = spec.layer as unknown[]
      expect(layer).toHaveLength(3)
    })

    it('first layer is a bar (histogram)', () => {
      const spec = getDistribution().specBuilder(sampleData, [numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const mark = layer[0].mark as Record<string, unknown>
      expect(mark.type).toBe('bar')
    })

    it('mean rule is solid (no strokeDash)', () => {
      const spec = getDistribution().specBuilder(sampleData, [numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const meanMark = layer[1].mark as Record<string, unknown>
      expect(meanMark.type).toBe('rule')
      expect(meanMark.strokeDash).toBeUndefined()
    })

    it('median rule is dashed', () => {
      const spec = getDistribution().specBuilder(sampleData, [numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const medianMark = layer[2].mark as Record<string, unknown>
      expect(medianMark.type).toBe('rule')
      expect(medianMark.strokeDash).toEqual([4, 4])
    })

    it('uses infographic dimensions', () => {
      const spec = getDistribution().specBuilder(sampleData, [numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBe(675)
    })
  })

  describe('captionFor', () => {
    it('returns eyebrow "distribution"', () => {
      const caption = getDistribution().captionFor([numCol])
      expect(caption.eyebrow).toBe('distribution')
    })

    it('includes column name in body', () => {
      const caption = getDistribution().captionFor([numCol])
      expect(caption.body).toContain('count')
    })
  })
})
