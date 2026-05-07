import { describe, expect, it } from 'vitest'
import { withAxisDiscipline } from './axis'

describe('withAxisDiscipline', () => {
  describe("kind: 'count'", () => {
    it('emits integer formatting with tickMinStep=1', () => {
      const out = withAxisDiscipline('count')
      expect(out.axis.format).toBe('d')
      expect(out.axis.tickMinStep).toBe(1)
    })

    it('still returns integer ticks even when input dataMin/dataMax are decimals', () => {
      // Defends against the Distribution-template "0.3 to 2.0" decimal-tick bug.
      const out = withAxisDiscipline('count', { dataMin: 0.3, dataMax: 2.0 })
      expect(out.axis.tickMinStep).toBe(1)
      expect(out.axis.format).toBe('d')
    })
  })

  describe("kind: 'currency'", () => {
    it('rounds the lower bound to a sensible step below dataMin', () => {
      const out = withAxisDiscipline('currency', {
        dataMin: 41000,
        dataMax: 82000,
      })
      expect(out.scale?.domain).toBeDefined()
      const [lo, hi] = out.scale!.domain!
      expect(lo).toBeLessThanOrEqual(41000)
      expect(lo).toBeGreaterThanOrEqual(35000)
      expect(hi).toBeGreaterThanOrEqual(82000)
    })

    it('formats as $,d', () => {
      const out = withAxisDiscipline('currency', {
        dataMin: 100,
        dataMax: 999,
      })
      expect(out.axis.format).toBe('$,d')
    })

    it('still returns a sensible format when dataMin/dataMax are not provided', () => {
      const out = withAxisDiscipline('currency')
      expect(out.axis.format).toBe('$,d')
      expect(out.scale).toBeUndefined()
    })
  })

  describe("kind: 'percent'", () => {
    it('locks the domain to 0..1 and uses percent format', () => {
      const out = withAxisDiscipline('percent')
      expect(out.scale?.domain).toEqual([0, 1])
      expect(out.axis.format).toBe('.0%')
      expect(out.axis.tickMinStep).toBe(0.1)
    })
  })

  describe("kind: 'year-month'", () => {
    it('emits a time formatType with month-year format', () => {
      const out = withAxisDiscipline('year-month')
      expect(out.axis.formatType).toBe('time')
      expect(out.axis.format).toBe('%b %Y')
    })
  })

  describe("kind: 'numeric'", () => {
    it('does not expand the domain to zero for close-clustered values', () => {
      // Defends against the Top-N "97 to 99.8 displayed across 15 to 100" bug.
      const out = withAxisDiscipline('numeric', {
        dataMin: 97,
        dataMax: 99.8,
      })
      expect(out.scale?.domain).toBeDefined()
      const [lo] = out.scale!.domain!
      expect(lo).toBeGreaterThan(50)
    })

    it('uses ,d format for ranges above 1000', () => {
      const out = withAxisDiscipline('numeric', {
        dataMin: 1000,
        dataMax: 5000,
      })
      expect(out.axis.format).toBe(',d')
    })

    it('uses .2f format for small-magnitude ranges', () => {
      const out = withAxisDiscipline('numeric', {
        dataMin: 0.1,
        dataMax: 9.5,
      })
      expect(out.axis.format).toBe('.2f')
    })
  })
})
