import { describe, expect, it } from 'vitest'
import { coerceRow, toJsValue } from './coerce'

describe('toJsValue', () => {
  it('passes through primitives untouched', () => {
    expect(toJsValue('hello')).toBe('hello')
    expect(toJsValue(42)).toBe(42)
    expect(toJsValue(true)).toBe(true)
    expect(toJsValue(null)).toBe(null)
    expect(toJsValue(undefined)).toBe(undefined)
  })

  it('narrows BigInt to Number', () => {
    expect(toJsValue(BigInt(42))).toBe(42)
    expect(typeof toJsValue(BigInt(42))).toBe('number')
  })

  it('handles BigInt past 2^53 without throwing (precision loss accepted)', () => {
    const huge = BigInt('9007199254740993') // 2^53 + 1
    const result = toJsValue(huge)
    expect(typeof result).toBe('number')
    // Number can't represent 2^53 + 1 precisely, so we just confirm coercion
    // ran rather than threw.
    expect(Number.isFinite(result as number)).toBe(true)
  })

  it('serializes Date to ISO string', () => {
    const d = new Date('2025-01-15T00:00:00.000Z')
    expect(toJsValue(d)).toBe('2025-01-15T00:00:00.000Z')
  })
})

describe('coerceRow', () => {
  it('coerces every value in a row', () => {
    const row = {
      name: 'alice',
      count: BigInt(7),
      created: new Date('2025-01-15T00:00:00.000Z'),
    }
    expect(coerceRow(row)).toEqual({
      name: 'alice',
      count: 7,
      created: '2025-01-15T00:00:00.000Z',
    })
  })

  it('returns a fresh object — does not mutate input', () => {
    const row = { count: BigInt(1) }
    const out = coerceRow(row)
    expect(out).not.toBe(row)
    expect(typeof row.count).toBe('bigint')
  })

  it('handles empty rows', () => {
    expect(coerceRow({})).toEqual({})
  })
})
