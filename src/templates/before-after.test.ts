import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'
import type { ColumnInfo } from '../data/schema'
import { colors } from '../styles/tokens'

const numCol: ColumnInfo = {
  name: 'sales',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 50,
}

const beforeCol: ColumnInfo = {
  name: 'before',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 10,
}

const afterCol: ColumnInfo = {
  name: 'after',
  duckdbType: 'DOUBLE',
  type: 'numeric',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 10,
}

const catCol: ColumnInfo = {
  name: 'team',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 2,
}

const labelCol: ColumnInfo = {
  name: 'department',
  duckdbType: 'VARCHAR',
  type: 'string',
  subtype: null,
  confidence: 'high',
  nullCount: 0,
  cardinality: 5,
}

function getBA() {
  return TEMPLATES.find((t) => t.id === 'before-after')!
}

describe('before-after template', () => {
  describe('applicability', () => {
    it('fits wide shape (columns named before + after, numeric) with score 80', () => {
      const result = getBA().applicability([labelCol, beforeCol, afterCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(80)
    })

    it('fits long shape (1 cat with cardinality 2 + 1 numeric) with score 80', () => {
      const result = getBA().applicability([catCol, numCol])
      expect(result.fits).toBe(true)
      expect(result.score).toBe(80)
    })

    it('does not fit when no matching shape', () => {
      const onlyNum: ColumnInfo = { ...numCol, cardinality: 50 }
      const highCard: ColumnInfo = { ...catCol, cardinality: 10 }
      const result = getBA().applicability([highCard, onlyNum])
      expect(result.fits).toBe(false)
    })
  })

  describe('specBuilder', () => {
    it('transposes wide data to long format and produces grouped bar spec', () => {
      const wideData = [
        { department: 'Eng', before: 5, after: 8 },
        { department: 'Sales', before: 3, after: 6 },
      ]
      const spec = getBA().specBuilder(wideData, [labelCol, beforeCol, afterCol]) as Record<string, unknown>
      const data = spec.data as { values: Record<string, unknown>[] }
      expect(data.values).toHaveLength(4)
      expect(data.values[0]).toEqual({ department: 'Eng', period: 'Before', value: 5 })
      expect(data.values[1]).toEqual({ department: 'Eng', period: 'After', value: 8 })
    })

    it('uses data directly for long shape', () => {
      const longData = [
        { team: '2023', sales: 10 },
        { team: '2024', sales: 15 },
      ]
      const spec = getBA().specBuilder(longData, [catCol, numCol]) as Record<string, unknown>
      const data = spec.data as { values: Record<string, unknown>[] }
      expect(data.values).toHaveLength(2)
    })

    it('has xOffset for grouping', () => {
      const wideData = [{ department: 'Eng', before: 5, after: 8 }]
      const spec = getBA().specBuilder(wideData, [labelCol, beforeCol, afterCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      expect(encoding.xOffset).toBeDefined()
    })

    it('wide shape color scale has Before/After domain', () => {
      const wideData = [{ department: 'Eng', before: 5, after: 8 }]
      const spec = getBA().specBuilder(wideData, [labelCol, beforeCol, afterCol]) as Record<string, unknown>
      const encoding = spec.encoding as Record<string, unknown>
      const color = encoding.color as Record<string, unknown>
      const scale = color.scale as { domain: string[]; range: string[] }
      expect(scale.domain).toEqual(['Before', 'After'])
      expect(scale.range).toEqual([colors.sage[400], colors.sage[900]])
    })

    it('returns width=1200 and height=675', () => {
      const wideData = [{ department: 'Eng', before: 5, after: 8 }]
      const spec = getBA().specBuilder(wideData, [labelCol, beforeCol, afterCol]) as Record<string, unknown>
      expect(spec.width).toBe(1200)
      expect(spec.height).toBe(675)
    })

    it('handles single category (1 group of paired bars)', () => {
      const singleRow = [{ department: 'Eng', before: 5, after: 8 }]
      const spec = getBA().specBuilder(singleRow, [labelCol, beforeCol, afterCol]) as Record<string, unknown>
      const data = spec.data as { values: Record<string, unknown>[] }
      expect(data.values).toHaveLength(2)
      expect(spec.width).toBe(1200)
    })
  })

  describe('captionFor', () => {
    it('returns eyebrow "before / after"', () => {
      const caption = getBA().captionFor([labelCol, beforeCol, afterCol])
      expect(caption.eyebrow).toBe('before / after')
    })

    it('includes column names in body for wide shape', () => {
      const caption = getBA().captionFor([labelCol, beforeCol, afterCol])
      expect(caption.body).toContain('before')
      expect(caption.body).toContain('after')
    })

    it('includes period column name in body for long shape', () => {
      const caption = getBA().captionFor([catCol, numCol])
      expect(caption.body).toContain('team')
    })
  })
})
