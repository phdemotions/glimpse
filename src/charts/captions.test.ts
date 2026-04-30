import { describe, expect, it } from 'vitest'
import type { ChartChoice } from './selector'
import { captionFor } from './captions'

function choice(partial: Partial<ChartChoice> & { kind: ChartChoice['kind'] }): ChartChoice {
  return { reasoning: '', ...partial }
}

describe('captionFor', () => {
  it('line chart caption names dates and numeric column', () => {
    const cap = captionFor(
      choice({ kind: 'line', xField: 'month', yField: 'revenue' }),
    )
    expect(cap.eyebrow).toBe('line chart')
    expect(cap.body).toContain('month')
    expect(cap.body).toContain('revenue')
    expect(cap.body.toLowerCase()).toContain('dates')
  })

  it('bar chart caption names category and numeric column', () => {
    const cap = captionFor(
      choice({ kind: 'bar', xField: 'role', yField: 'count' }),
    )
    expect(cap.eyebrow).toBe('bar chart')
    expect(cap.body).toContain('role')
    expect(cap.body).toContain('count')
  })

  it('ranking caption names the limit and the category', () => {
    const cap = captionFor(
      choice({ kind: 'ranking', xField: 'country', yField: 'pop', limit: 10 }),
    )
    expect(cap.eyebrow).toBe('top 10')
    expect(cap.body).toContain('country')
    expect(cap.body).toContain('top 10')
  })

  it('histogram caption names the only numeric column', () => {
    const cap = captionFor(choice({ kind: 'histogram', xField: 'score' }))
    expect(cap.eyebrow).toBe('histogram')
    expect(cap.body).toContain('score')
    expect(cap.body.toLowerCase()).toContain('numbers')
  })

  it('pie caption mentions parts of a whole', () => {
    const cap = captionFor(
      choice({ kind: 'pie', xField: 'role', yField: 'count' }),
    )
    expect(cap.eyebrow).toBe('pie chart')
    expect(cap.body.toLowerCase()).toContain('parts of a whole')
  })

  it('scatter caption names both numeric columns', () => {
    const cap = captionFor(
      choice({ kind: 'scatter', xField: 'income', yField: 'age' }),
    )
    expect(cap.eyebrow).toBe('scatter plot')
    expect(cap.body).toContain('income')
    expect(cap.body).toContain('age')
  })

  it('none kind caption explains why no chart was possible', () => {
    const cap = captionFor(choice({ kind: 'none' }))
    expect(cap.eyebrow).toBe('no chart')
    expect(cap.body.toLowerCase()).toContain('no numeric')
  })

  it('keeps every body under 200 characters for typical column names', () => {
    const cases: ChartChoice[] = [
      choice({ kind: 'line', xField: 'month', yField: 'revenue' }),
      choice({ kind: 'bar', xField: 'role', yField: 'count' }),
      choice({ kind: 'ranking', xField: 'country', yField: 'pop', limit: 10 }),
      choice({ kind: 'pie', xField: 'category', yField: 'count' }),
      choice({ kind: 'histogram', xField: 'score' }),
      choice({ kind: 'scatter', xField: 'a', yField: 'b' }),
      choice({ kind: 'none' }),
    ]
    for (const c of cases) {
      const cap = captionFor(c)
      expect(cap.body.length).toBeLessThanOrEqual(200)
    }
  })

  it('truncates long column names with an ellipsis', () => {
    const longName = 'a'.repeat(100)
    const cap = captionFor(
      choice({ kind: 'bar', xField: longName, yField: 'count' }),
    )
    // Body should not contain the full 100-char name verbatim.
    expect(cap.body.includes(longName)).toBe(false)
    expect(cap.body).toMatch(/…/)
  })

  it('handles column names with special characters without crashing', () => {
    const cap = captionFor(
      choice({ kind: 'bar', xField: 'col with *spaces*', yField: 'col"quote' }),
    )
    expect(cap.body).toContain('col with *spaces*')
    expect(cap.body).toContain('col"quote')
  })

  it('handles missing xField/yField gracefully', () => {
    const cap = captionFor(choice({ kind: 'bar' }))
    // Should not throw — falls back to empty placeholders.
    expect(cap.body).toBeTruthy()
  })
})
