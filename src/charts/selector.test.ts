import { describe, expect, it } from 'vitest'
import type { ColumnInfo } from '../data/schema'
import { selectChart } from './selector'

function col(partial: Partial<ColumnInfo> & { name: string }): ColumnInfo {
  return {
    duckdbType: 'VARCHAR',
    type: 'string',
    subtype: null,
    confidence: 'high',
    nullCount: 0,
    cardinality: 1,
    ...partial,
  }
}

describe('selectChart — happy paths', () => {
  it('picks line for a date column with 12 distinct values + numeric measure', () => {
    const result = selectChart([
      col({ name: 'month', type: 'date', cardinality: 12, nullCount: 0 }),
      col({ name: 'revenue', type: 'numeric', cardinality: 12, nullCount: 0 }),
    ])
    expect(result.kind).toBe('line')
    expect(result.xField).toBe('month')
    expect(result.yField).toBe('revenue')
    expect(result.reasoning.length).toBeGreaterThan(0)
  })

  it('picks bar for a 6-cardinality category + numeric measure', () => {
    const result = selectChart([
      col({ name: 'role', type: 'string', cardinality: 6 }),
      col({ name: 'count', type: 'numeric', cardinality: 6 }),
    ])
    expect(result.kind).toBe('bar')
    expect(result.xField).toBe('role')
    expect(result.yField).toBe('count')
  })

  it('picks ranking when categorical cardinality exceeds 12', () => {
    const result = selectChart([
      col({ name: 'country', type: 'string', cardinality: 25 }),
      col({ name: 'population', type: 'numeric', cardinality: 25 }),
    ])
    expect(result.kind).toBe('ranking')
    expect(result.sortDesc).toBe(true)
    expect(result.limit).toBe(10)
  })

  it('picks pie for a 4-cardinality category + numeric measure', () => {
    const result = selectChart([
      col({ name: 'role', type: 'string', cardinality: 4 }),
      col({ name: 'count', type: 'numeric', cardinality: 4 }),
    ])
    expect(result.kind).toBe('pie')
  })

  it('picks histogram for a single numeric column with no categorical', () => {
    const result = selectChart([
      col({ name: 'score', type: 'numeric', cardinality: 80 }),
    ])
    expect(result.kind).toBe('histogram')
    expect(result.xField).toBe('score')
  })

  it('picks scatter for two numeric columns and no usable date', () => {
    const result = selectChart([
      col({ name: 'income', type: 'numeric', cardinality: 50 }),
      col({ name: 'age', type: 'numeric', cardinality: 50 }),
    ])
    expect(result.kind).toBe('scatter')
  })
})

describe('selectChart — line-chart guard', () => {
  it('falls back from line to bar when fewer than 3 distinct dates', () => {
    const result = selectChart([
      col({ name: 'year', type: 'date', cardinality: 2 }),
      col({ name: 'value', type: 'numeric', cardinality: 2 }),
    ])
    expect(result.kind).toBe('bar')
    expect(result.reasoning.toLowerCase()).toContain('only 2')
  })
})

describe('selectChart — overrides', () => {
  it('honors a date → string override and falls back from line to bar', () => {
    const result = selectChart(
      [
        col({ name: 'month', type: 'date', cardinality: 12 }),
        col({ name: 'revenue', type: 'numeric', cardinality: 12 }),
      ],
      { month: 'string' },
    )
    expect(result.kind).toBe('bar')
    expect(result.xField).toBe('month')
  })

  it('honors a numeric → string override and falls back from scatter to none', () => {
    const result = selectChart(
      [
        col({ name: 'a', type: 'numeric', cardinality: 50 }),
        col({ name: 'b', type: 'numeric', cardinality: 50 }),
      ],
      { a: 'string', b: 'string' },
    )
    // Both numerics overridden — no measure to plot.
    expect(result.kind).toBe('none')
  })
})

describe('selectChart — fallback', () => {
  it('returns kind: none when there is no numeric measure', () => {
    const result = selectChart([
      col({ name: 'first_name', type: 'string', cardinality: 100 }),
      col({ name: 'last_name', type: 'string', cardinality: 100 }),
    ])
    expect(result.kind).toBe('none')
    expect(result.reasoning.toLowerCase()).toContain('no numeric')
  })

  it('returns kind: none when columns array is empty', () => {
    expect(selectChart([]).kind).toBe('none')
  })
})

describe('selectChart — determinism + reasoning', () => {
  it('returns the same result for identical inputs', () => {
    const cols = [
      col({ name: 'role', type: 'string', cardinality: 6 }),
      col({ name: 'count', type: 'numeric', cardinality: 6 }),
    ]
    expect(selectChart(cols)).toEqual(selectChart(cols))
  })

  it('every kind has a non-empty reasoning string under 240 chars', () => {
    const cases: ColumnInfo[][] = [
      [col({ name: 'm', type: 'date', cardinality: 12 }), col({ name: 'r', type: 'numeric', cardinality: 12 })],
      [col({ name: 'c', type: 'string', cardinality: 6 }), col({ name: 'n', type: 'numeric', cardinality: 6 })],
      [col({ name: 'c', type: 'string', cardinality: 25 }), col({ name: 'n', type: 'numeric', cardinality: 25 })],
      [col({ name: 'c', type: 'string', cardinality: 4 }), col({ name: 'n', type: 'numeric', cardinality: 4 })],
      [col({ name: 's', type: 'numeric', cardinality: 50 })],
      [col({ name: 'a', type: 'numeric', cardinality: 50 }), col({ name: 'b', type: 'numeric', cardinality: 50 })],
      [col({ name: 'x', type: 'string', cardinality: 1 })],
    ]
    for (const cols of cases) {
      const r = selectChart(cols)
      expect(r.reasoning).toBeTruthy()
      expect(r.reasoning.length).toBeLessThanOrEqual(240)
    }
  })
})
