import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { TEMPLATES, getTemplates, applicableTemplates } from './index'
import { AUTO_INFOGRAPHIC_THRESHOLD } from './types'
import type { Template, TemplateId, Applicability } from './types'
import type { ColumnInfo } from '../data/schema'

function fakeTemplate(
  id: TemplateId,
  applicabilityFn: (cols: ReadonlyArray<ColumnInfo>) => Applicability,
): Template {
  return {
    id,
    label: id,
    description: `Test template ${id}`,
    applicability: applicabilityFn,
    specBuilder: () => ({}),
    captionFor: () => ({ eyebrow: '', body: '' }),
  }
}

let savedTemplates: Template[]

beforeEach(() => {
  savedTemplates = [...TEMPLATES]
  TEMPLATES.length = 0
})

afterEach(() => {
  TEMPLATES.length = 0
  TEMPLATES.push(...savedTemplates)
})

describe('AUTO_INFOGRAPHIC_THRESHOLD re-export', () => {
  it('equals 95', () => {
    expect(AUTO_INFOGRAPHIC_THRESHOLD).toBe(95)
  })
})

describe('getTemplates', () => {
  it('returns the templates array', () => {
    expect(getTemplates()).toBe(TEMPLATES)
  })

  it('starts empty', () => {
    expect(getTemplates()).toHaveLength(0)
  })

  it('reflects templates added to TEMPLATES', () => {
    const t = fakeTemplate('big-number', () => ({ fits: true, score: 80 }))
    TEMPLATES.push(t)
    expect(getTemplates()).toContain(t)
  })
})

describe('applicableTemplates', () => {
  const dummyCols: ColumnInfo[] = []

  it('returns empty array when registry is empty', () => {
    expect(applicableTemplates(dummyCols)).toEqual([])
  })

  it('filters out templates where fits is false', () => {
    TEMPLATES.push(
      fakeTemplate('big-number', () => ({ fits: false, score: 90 })),
      fakeTemplate('top-n', () => ({ fits: true, score: 70 })),
    )
    const result = applicableTemplates(dummyCols)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('top-n')
  })

  it('sorts by score descending', () => {
    TEMPLATES.push(
      fakeTemplate('distribution', () => ({ fits: true, score: 60 })),
      fakeTemplate('trend-story', () => ({ fits: true, score: 90 })),
      fakeTemplate('part-to-whole', () => ({ fits: true, score: 75 })),
    )
    const result = applicableTemplates(dummyCols)
    expect(result.map((t) => t.id)).toEqual([
      'trend-story',
      'part-to-whole',
      'distribution',
    ])
  })

  it('attaches applicability_result to each returned template', () => {
    TEMPLATES.push(
      fakeTemplate('big-number', () => ({
        fits: true,
        score: 85,
        reason: 'single numeric column',
      })),
    )
    const result = applicableTemplates(dummyCols)
    expect(result[0].applicability_result).toEqual({
      fits: true,
      score: 85,
      reason: 'single numeric column',
    })
  })

  it('passes columns through to the applicability function', () => {
    const cols: ColumnInfo[] = [
      {
        name: 'revenue',
        duckdbType: 'DOUBLE',
        type: 'numeric',
        subtype: null,
        confidence: 'high',
        nullCount: 0,
        cardinality: 100,
      },
    ]
    TEMPLATES.push(
      fakeTemplate('big-number', (c) => ({
        fits: c.length === 1 && c[0].type === 'numeric',
        score: 95,
      })),
    )
    const result = applicableTemplates(cols)
    expect(result).toHaveLength(1)
    expect(result[0].applicability_result.fits).toBe(true)
  })
})
