import { describe, expect, it } from 'vitest'
import { detectBeforeAfter } from './shape-detect'
import type { ColumnInfo } from './schema'

function col(overrides: Partial<ColumnInfo> & Pick<ColumnInfo, 'name' | 'type'>): ColumnInfo {
  return {
    duckdbType: 'VARCHAR',
    subtype: null,
    confidence: 'high',
    nullCount: 0,
    cardinality: 10,
    ...overrides,
  }
}

describe('detectBeforeAfter', () => {
  describe('wide shape — two numeric columns with before/after names', () => {
    it('detects "before" + "after" columns', () => {
      const cols = [
        col({ name: 'before', type: 'numeric' }),
        col({ name: 'after', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'wide',
        beforeCol: 'before',
        afterCol: 'after',
      })
    })

    it('detects "q1_a" + "q1_b" columns', () => {
      const cols = [
        col({ name: 'q1_a', type: 'numeric' }),
        col({ name: 'q1_b', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'wide',
        beforeCol: 'q1_a',
        afterCol: 'q1_b',
      })
    })

    it('detects "previous" + "current" columns', () => {
      const cols = [
        col({ name: 'previous', type: 'numeric' }),
        col({ name: 'current', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'wide',
        beforeCol: 'previous',
        afterCol: 'current',
      })
    })

    it('is case-insensitive', () => {
      const cols = [
        col({ name: 'BEFORE', type: 'numeric' }),
        col({ name: 'AFTER', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'wide',
        beforeCol: 'BEFORE',
        afterCol: 'AFTER',
      })
    })
  })

  describe('long shape — categorical with cardinality 2 + numeric', () => {
    it('detects 1 categorical (cardinality=2) + 1 numeric', () => {
      const cols = [
        col({ name: 'group', type: 'string', cardinality: 2 }),
        col({ name: 'score', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'long',
        categoryCol: 'group',
        valueCol: 'score',
      })
    })

    it('detects boolean (cardinality=2) + numeric as long shape', () => {
      const cols = [
        col({ name: 'treated', type: 'boolean', cardinality: 2 }),
        col({ name: 'outcome', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toEqual({
        kind: 'long',
        categoryCol: 'treated',
        valueCol: 'outcome',
      })
    })
  })

  describe('no match', () => {
    it('returns null when 2 numerics have non-matching names', () => {
      const cols = [
        col({ name: 'height', type: 'numeric' }),
        col({ name: 'weight', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toBeNull()
    })

    it('returns null when there are no numeric columns', () => {
      const cols = [
        col({ name: 'name', type: 'string' }),
        col({ name: 'city', type: 'string' }),
      ]
      expect(detectBeforeAfter(cols)).toBeNull()
    })

    it('returns null when categorical has cardinality 3 (not 2)', () => {
      const cols = [
        col({ name: 'group', type: 'string', cardinality: 3 }),
        col({ name: 'score', type: 'numeric' }),
      ]
      expect(detectBeforeAfter(cols)).toBeNull()
    })

    it('returns null when only 1 numeric and no categoricals', () => {
      const cols = [col({ name: 'value', type: 'numeric' })]
      expect(detectBeforeAfter(cols)).toBeNull()
    })
  })
})
