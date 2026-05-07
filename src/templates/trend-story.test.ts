import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'

const dateCol: ColumnInfo = {
  name: 'month',
  duckdbType: 'VARCHAR',
  type: 'date',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 12,
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

const strCol: ColumnInfo = {
  name: 'country',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 25,
}

function getTrendStory() {
  return TEMPLATES.find((t) => t.id === 'trend-story')!
}

describe('trend-story template', () => {
  describe('applicability', () => {
    it('fits with score 90 when date column cardinality >= 3 plus numeric', () => {
      const result = getTrendStory().applicability([dateCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(90)
    })

    it('does not fit when date column cardinality < 3', () => {
      const lowCard: ColumnInfo = { ...dateCol, cardinality: 2 }
      const result = getTrendStory().applicability([lowCard, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when no date column', () => {
      const result = getTrendStory().applicability([strCol, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when no numeric column', () => {
      const result = getTrendStory().applicability([dateCol, strCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { month: '2024-01', revenue: 100 },
      { month: '2024-02', revenue: 250 },
      { month: '2024-03', revenue: 180 },
      { month: '2024-04', revenue: 300 },
      { month: '2024-05', revenue: 220 },
    ]

    it('returns 2-layer spec (line + annotation)', () => {
      const spec = getTrendStory().specBuilder(sampleData, [dateCol, numCol]) as Record<string, unknown>
      const layer = spec.layer as unknown[]
      expect(layer).toHaveLength(2)
    })

    it('first layer is a line mark', () => {
      const spec = getTrendStory().specBuilder(sampleData, [dateCol, numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const mark = layer[0].mark as Record<string, unknown>
      expect(mark.type).toBe('line')
    })

    it('annotation layer has lag/lead window transform', () => {
      const spec = getTrendStory().specBuilder(sampleData, [dateCol, numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const transforms = layer[1].transform as Record<string, unknown>[]
      const windowTransform = transforms[0] as Record<string, unknown>
      const windowOps = windowTransform.window as Record<string, unknown>[]
      const ops = windowOps.map((w) => w.op)
      expect(ops).toContain('lag')
      expect(ops).toContain('lead')
    })

    it('uses temporal encoding when confidence is high', () => {
      const spec = getTrendStory().specBuilder(sampleData, [dateCol, numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const encoding = layer[0].encoding as Record<string, unknown>
      const x = encoding.x as Record<string, unknown>
      expect(x.type).toBe('temporal')
    })

    it('uses nominal encoding when confidence is not high', () => {
      const medCol: ColumnInfo = { ...dateCol, confidence: 'medium' }
      const spec = getTrendStory().specBuilder(sampleData, [medCol, numCol]) as Record<string, unknown>
      const layer = spec.layer as Record<string, unknown>[]
      const encoding = layer[0].encoding as Record<string, unknown>
      const x = encoding.x as Record<string, unknown>
      expect(x.type).toBe('nominal')
    })

    it('emits chart-only dimensions: full canvas width, sub-canvas height', () => {
      const spec = getTrendStory().specBuilder(sampleData, [dateCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBeLessThan(675)
    })
  })

  describe('frameFor', () => {
    it('returns eyebrow "trend story"', () => {
      const frame = getTrendStory().frameFor([dateCol, numCol], 'revenue.csv')
      expect(frame.eyebrow).toBe('trend story')
    })

    it('includes both column names in takeaway', () => {
      const frame = getTrendStory().frameFor([dateCol, numCol], 'revenue.csv')
      expect(frame.takeaway).toContain('revenue')
      expect(frame.takeaway).toContain('month')
    })

    it('passes the supplied filename through as source', () => {
      const frame = getTrendStory().frameFor([dateCol, numCol], 'revenue.csv')
      expect(frame.source).toBe('revenue.csv')
    })
  })
})
