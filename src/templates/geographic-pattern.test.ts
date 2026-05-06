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

    it('returns spec with width=1200 and height=675', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBe(675)
    })

    it('title includes deferral subtitle', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      const title = spec.title as Record<string, unknown>
      expect(title.subtitle).toBeDefined()
      expect(typeof title.subtitle).toBe('string')
    })

    it('subtitle mentions "world-map render coming after v1"', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      const title = spec.title as Record<string, unknown>
      expect(title.subtitle).toContain('world-map render coming after v1')
    })

    it('preserves ranking transform from makeRankingSpec', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      const transform = spec.transform as unknown[]
      expect(transform).toBeDefined()
      expect(transform.length).toBeGreaterThanOrEqual(1)
    })

    it('title text includes column names', () => {
      const spec = getGeo().specBuilder(sampleData, [geoCol, numCol]) as Record<string, unknown>
      const title = spec.title as Record<string, unknown>
      expect(title.text).toBe('sales by country')
    })
  })

  describe('captionFor', () => {
    it('returns eyebrow "geographic pattern"', () => {
      const caption = getGeo().captionFor([geoCol, numCol])
      expect(caption.eyebrow).toBe('geographic pattern')
    })

    it('includes both column names in body', () => {
      const caption = getGeo().captionFor([geoCol, numCol])
      expect(caption.body).toContain('country')
      expect(caption.body).toContain('sales')
    })

    it('mentions future map view', () => {
      const caption = getGeo().captionFor([geoCol, numCol])
      expect(caption.body).toContain('full map view')
    })
  })
})
