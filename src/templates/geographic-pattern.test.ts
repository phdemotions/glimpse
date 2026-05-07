import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'

const numCol: ColumnInfo = {
  name: 'sales',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 50,
}

const geoCol: ColumnInfo = {
  name: 'country',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: 'geographic',
  confidence: 'high',
  nullCount: 0,
  cardinality: 30,
}

const plainCat: ColumnInfo = {
  name: 'category',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 10,
}

function getGeo() {
  return TEMPLATES.find((t) => t.id === 'geographic')!
}

describe('geographic-pattern template', () => {
  describe('applicability', () => {
    it('fits when geographic subtype + numeric, score 60', () => {
      const result = getGeo().applicability([geoCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(60)
    })

    it('does not fit when no geographic subtype', () => {
      const result = getGeo().applicability([plainCat, numCol])
      expect(result.fits).toBe(false)
    })

    it('does not fit when geographic but no numeric', () => {
      const result = getGeo().applicability([geoCol])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    const sampleData = [
      { country: 'US', sales: 1000 },
      { country: 'UK', sales: 800 },
      { country: 'DE', sales: 600 },
    ]

    it('emits chart-only dimensions: full canvas width, sub-canvas height', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBeLessThan(675)
    })

    it('preserves ranking transform from makeRankingSpec', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      const transform = spec.transform as unknown[]
      expect(transform).toBeDefined()
      expect(transform.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('frameFor', () => {
    it('returns eyebrow "geographic pattern"', () => {
      const frame = getGeo().frameFor([geoCol, numCol], 'data.csv')
      expect(frame.eyebrow).toBe('geographic pattern')
    })

    it('includes both column names in takeaway', () => {
      const frame = getGeo().frameFor([geoCol, numCol], 'data.csv')
      expect(frame.takeaway).toContain('country')
      expect(frame.takeaway).toContain('sales')
    })

    it('mentions the deferred world-map view', () => {
      const frame = getGeo().frameFor([geoCol, numCol], 'data.csv')
      expect(frame.takeaway).toContain('world-map')
    })
  })
})
