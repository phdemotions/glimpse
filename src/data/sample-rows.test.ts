import { describe, expect, it } from 'vitest'
import { transposeRows } from './sample-rows'

describe('transposeRows', () => {
  it('transposes a row-oriented sample into per-column buckets', () => {
    const rows = [
      { role: 'student', count: 420 },
      { role: 'industry', count: 180 },
      { role: 'researcher', count: 90 },
    ]
    const out = transposeRows(rows, ['role', 'count'])
    expect(out.role).toEqual(['student', 'industry', 'researcher'])
    expect(out.count).toEqual([420, 180, 90])
  })

  it('caps each bucket at `perColumn`', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ x: i }))
    const out = transposeRows(rows, ['x'], 10)
    expect(out.x).toHaveLength(10)
    expect(out.x[0]).toBe(0)
    expect(out.x[9]).toBe(9)
  })

  it('skips null and undefined values without consuming bucket slots', () => {
    const rows = [
      { x: 'a' },
      { x: null },
      { x: undefined },
      { x: 'b' },
    ]
    const out = transposeRows(rows, ['x'])
    expect(out.x).toEqual(['a', 'b'])
  })

  it('returns empty arrays for columns absent from the rows', () => {
    const rows = [{ a: 1 }, { a: 2 }]
    const out = transposeRows(rows, ['a', 'b'])
    expect(out.a).toEqual([1, 2])
    expect(out.b).toEqual([])
  })

  it('returns initialized empty arrays when given no rows', () => {
    expect(transposeRows([], ['x', 'y'])).toEqual({ x: [], y: [] })
  })

  it('coerces BigInt values to Number on the way in', () => {
    const rows = [{ n: BigInt(7) }, { n: BigInt(11) }]
    const out = transposeRows(rows, ['n'])
    expect(out.n).toEqual([7, 11])
    expect(typeof out.n[0]).toBe('number')
  })

  it('coerces Date values to ISO strings', () => {
    const rows = [{ created: new Date('2025-01-15T00:00:00.000Z') }]
    const out = transposeRows(rows, ['created'])
    expect(out.created).toEqual(['2025-01-15T00:00:00.000Z'])
  })

  it('stops scanning once every bucket is full', () => {
    let visited = 0
    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < 1000; i++) {
      rows.push(
        new Proxy(
          { x: i },
          {
            get(target, prop) {
              if (prop === 'x') visited++
              return Reflect.get(target, prop)
            },
          },
        ) as Record<string, unknown>,
      )
    }
    transposeRows(rows, ['x'], 5)
    // We're not guaranteed exactly 5 — Proxy hits depend on ordering — but we
    // should never visit more than the first cluster of rows.
    expect(visited).toBeLessThanOrEqual(10)
  })

  it('handles column names with special characters safely', () => {
    const rows = [{ 'col with spaces': 1, 'col"quote': 2 }]
    const out = transposeRows(rows, ['col with spaces', 'col"quote'])
    expect(out['col with spaces']).toEqual([1])
    expect(out['col"quote']).toEqual([2])
  })
})
