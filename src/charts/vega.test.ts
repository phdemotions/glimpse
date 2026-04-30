import { describe, expect, it } from 'vitest'
import {
  VEGA_CONFIG,
  makeBarSpec,
  makeHistogramSpec,
  makeLineSpec,
  makePieSpec,
  makeRankingSpec,
  makeScatterSpec,
} from './vega'

const SCHEMA = 'https://vega.github.io/schema/vega-lite/v5.json'

describe('makeBarSpec', () => {
  it('produces a bar mark sorted descending by y', () => {
    const spec = makeBarSpec(
      [{ role: 'student', count: 420 }, { role: 'industry', count: 180 }],
      'role',
      'count',
    )
    expect(spec.$schema).toBe(SCHEMA)
    expect(spec.config).toBe(VEGA_CONFIG)
    expect(spec.mark).toMatchObject({ type: 'bar' })
    const encoding = spec.encoding as Record<string, unknown>
    expect(encoding.x).toMatchObject({ field: 'role', sort: '-y' })
    expect(encoding.y).toMatchObject({ field: 'count', type: 'quantitative' })
  })
})

describe('makeLineSpec', () => {
  it('uses temporal axis by default', () => {
    const spec = makeLineSpec(
      [{ month: '2025-01-01', revenue: 42000 }],
      'month',
      'revenue',
    )
    const encoding = spec.encoding as Record<string, Record<string, unknown>>
    expect(encoding.x.type).toBe('temporal')
  })

  it('switches to nominal axis when temporal: false (US dates)', () => {
    const spec = makeLineSpec(
      [{ month: '1/15/2025', revenue: 42000 }],
      'month',
      'revenue',
      { temporal: false },
    )
    const encoding = spec.encoding as Record<string, Record<string, unknown>>
    expect(encoding.x.type).toBe('nominal')
  })
})

describe('makeScatterSpec', () => {
  it('emits a filled point mark with quantitative encoding on both axes', () => {
    const spec = makeScatterSpec(
      [{ income: 50, age: 30 }],
      'income',
      'age',
    )
    expect(spec.mark).toMatchObject({ type: 'point', filled: true })
    const encoding = spec.encoding as Record<string, Record<string, unknown>>
    expect(encoding.x.type).toBe('quantitative')
    expect(encoding.y.type).toBe('quantitative')
  })
})

describe('makeHistogramSpec', () => {
  it('renders pre-binned data as bars with bucket on X and count on Y', () => {
    const spec = makeHistogramSpec(
      [
        { bucket: 0, count: 5 },
        { bucket: 10, count: 12 },
        { bucket: 20, count: 8 },
      ],
      'score',
    )
    expect(spec.mark).toMatchObject({ type: 'bar' })
    const encoding = spec.encoding as Record<string, Record<string, unknown>>
    expect(encoding.x).toMatchObject({ field: 'bucket', type: 'quantitative', title: 'score' })
    expect(encoding.y).toMatchObject({ field: 'count', type: 'quantitative' })
  })

  it('handles empty bin arrays without throwing', () => {
    const spec = makeHistogramSpec([], 'score')
    const data = spec.data as { values: unknown[] }
    expect(data.values).toEqual([])
  })
})

describe('makePieSpec', () => {
  it('emits an arc mark with theta encoding stacked', () => {
    const spec = makePieSpec(
      [{ role: 'student', count: 420 }],
      'role',
      'count',
    )
    expect(spec.mark).toMatchObject({ type: 'arc' })
    const encoding = spec.encoding as Record<string, Record<string, unknown>>
    expect(encoding.theta).toMatchObject({ field: 'count', stack: true })
    expect(encoding.color).toMatchObject({ field: 'role', type: 'nominal' })
  })
})

describe('makeRankingSpec', () => {
  it('sorts the window transform by yField descending', () => {
    const spec = makeRankingSpec(
      [{ country: 'A', pop: 1 }, { country: 'B', pop: 9 }],
      'country',
      'pop',
    )
    const transforms = spec.transform as Array<Record<string, unknown>>
    const windowTransform = transforms.find(
      (t) => Array.isArray(t.window),
    )
    expect(windowTransform).toBeDefined()
    expect(windowTransform!.sort).toEqual([
      { field: 'pop', order: 'descending' },
    ])
    const filterTransform = transforms.find(
      (t) => typeof t.filter === 'string',
    )
    expect(filterTransform!.filter).toContain('_rank <= 10')
  })

  it('honors a custom limit', () => {
    const spec = makeRankingSpec([], 'x', 'y', 5)
    const transforms = spec.transform as Array<{ filter?: string }>
    expect(transforms.find((t) => t.filter)?.filter).toContain('_rank <= 5')
  })
})

describe('all spec functions', () => {
  it('always set $schema and config', () => {
    const specs = [
      makeBarSpec([], 'a', 'b'),
      makeLineSpec([], 'a', 'b'),
      makeScatterSpec([], 'a', 'b'),
      makeHistogramSpec([], 'a'),
      makePieSpec([], 'a', 'b'),
      makeRankingSpec([], 'a', 'b'),
    ]
    for (const spec of specs) {
      expect(spec.$schema).toBe(SCHEMA)
      expect(spec.config).toBe(VEGA_CONFIG)
    }
  })
})
