import { describe, expect, it } from 'vitest'
import {
  detectDateConfidence,
  detectGeographic,
  detectOrdinalLikert,
} from './type-detect'

describe('detectDateConfidence', () => {
  it('returns high confidence for ISO 8601 dates', () => {
    const samples = ['2025-01-01', '2025-02-15', '2024-12-31']
    expect(detectDateConfidence(samples)).toEqual({
      type: 'date',
      confidence: 'high',
    })
  })

  it('returns high confidence for ISO 8601 reduced-precision YYYY-MM', () => {
    const samples = ['2025-01', '2025-02', '2024-12']
    expect(detectDateConfidence(samples)).toEqual({
      type: 'date',
      confidence: 'high',
    })
  })

  it('returns high confidence for ISO timestamps with timezone', () => {
    const samples = [
      '2025-01-01T12:30:00Z',
      '2025-02-15T08:00:00.123Z',
      '2024-12-31T23:59:59-05:00',
    ]
    expect(detectDateConfidence(samples)).toEqual({
      type: 'date',
      confidence: 'high',
    })
  })

  it('returns medium confidence for US M/D/YYYY dates', () => {
    const samples = ['1/15/2025', '2/3/2025', '12/31/2024']
    expect(detectDateConfidence(samples)).toEqual({
      type: 'date',
      confidence: 'medium',
    })
  })

  it('returns medium confidence for mixed ISO + US (combined ≥80%)', () => {
    const samples = ['2025-01-01', '1/15/2025', '2/3/2025', '2025-02-15']
    expect(detectDateConfidence(samples)).toEqual({
      type: 'date',
      confidence: 'medium',
    })
  })

  it('returns null when fewer than 80% of samples match any date format', () => {
    const samples = ['hello', 'world', '2025-01-01', '2025-02-15']
    expect(detectDateConfidence(samples)).toBeNull()
  })

  it('returns null on empty samples', () => {
    expect(detectDateConfidence([])).toBeNull()
  })

  it('ignores non-string samples', () => {
    expect(detectDateConfidence([42, true, null])).toBeNull()
  })

  it('does not classify 4-digit year ints as dates', () => {
    // The detector only sees strings; numeric years from getSampleRows arrive
    // as Numbers, not strings, and so are filtered upstream.
    expect(detectDateConfidence([2024, 2025, 2026])).toBeNull()
  })
})

describe('detectOrdinalLikert', () => {
  it('detects Likert at medium confidence with anchor labels', () => {
    const samples = [
      'Strongly Agree',
      'Agree',
      'Neutral',
      'Disagree',
      'Strongly Disagree',
    ]
    expect(detectOrdinalLikert(samples, 5, 100)).toEqual({
      subtype: 'likert',
      confidence: 'medium',
    })
  })

  it('detects Likert with N/A sentinels filtered out', () => {
    const samples = [
      'Strongly Agree',
      'Agree',
      'Neutral',
      'Disagree',
      "Don't know",
      'N/A',
      'Strongly Agree',
    ]
    expect(detectOrdinalLikert(samples, 5, 100)).toEqual({
      subtype: 'likert',
      confidence: 'medium',
    })
  })

  it('detects satisfaction-scale Likert', () => {
    const samples = [
      'Very Satisfied',
      'Satisfied',
      'Neutral',
      'Dissatisfied',
      'Very Dissatisfied',
    ]
    expect(detectOrdinalLikert(samples, 5, 100)).toEqual({
      subtype: 'likert',
      confidence: 'medium',
    })
  })

  it('detects frequency-scale Likert', () => {
    const samples = ['Always', 'Often', 'Sometimes', 'Rarely', 'Never']
    expect(detectOrdinalLikert(samples, 5, 100)).toEqual({
      subtype: 'likert',
      confidence: 'medium',
    })
  })

  it('falls back to ordinal at low confidence for repeating string columns', () => {
    const samples = ['low', 'medium', 'high', 'medium', 'low', 'high']
    expect(detectOrdinalLikert(samples, 3, 100)).toEqual({
      subtype: 'ordinal',
      confidence: 'low',
    })
  })

  it('returns null when cardinality is outside 3–7', () => {
    const samples = ['a', 'b', 'a']
    expect(detectOrdinalLikert(samples, 2, 100)).toBeNull()
    expect(detectOrdinalLikert(samples, 8, 100)).toBeNull()
  })

  it('returns null when string column has too many unique values to be ordinal', () => {
    const samples = ['alice', 'bob', 'charlie', 'dana']
    // cardinality 4 within range, but ratio 4/4 == 1.0 means every value is
    // unique — that's a name column, not an ordinal scale.
    expect(detectOrdinalLikert(samples, 4, 4)).toBeNull()
  })

  it('returns null on empty or all-non-string samples', () => {
    expect(detectOrdinalLikert([], 5, 100)).toBeNull()
    expect(detectOrdinalLikert([1, 2, 3], 3, 100)).toBeNull()
  })

  it('returns null when only sentinel values remain after filter', () => {
    const samples = ['N/A', "Don't know", '(blank)', 'N/A']
    expect(detectOrdinalLikert(samples, 3, 100)).toBeNull()
  })
})

describe('detectGeographic', () => {
  it('detects medium confidence when name and values both match', () => {
    expect(
      detectGeographic('country', ['United States', 'France', 'Japan']),
    ).toEqual({ subtype: 'geographic', confidence: 'medium' })
  })

  it('detects medium confidence with ISO alpha-2 codes', () => {
    expect(detectGeographic('country', ['US', 'FR', 'JP', 'DE'])).toEqual({
      subtype: 'geographic',
      confidence: 'medium',
    })
  })

  it('returns low confidence when name matches but values do not', () => {
    expect(detectGeographic('state', ['active', 'pending', 'closed'])).toEqual({
      subtype: 'geographic',
      confidence: 'low',
    })
  })

  it('returns low confidence with no samples but a matching name', () => {
    expect(detectGeographic('country', [])).toEqual({
      subtype: 'geographic',
      confidence: 'low',
    })
  })

  it('returns null when name does not match any geographic regex', () => {
    expect(detectGeographic('username', ['alice', 'bob'])).toBeNull()
    expect(detectGeographic('product_id', ['A', 'B', 'C'])).toBeNull()
  })

  it('case-insensitive name matching', () => {
    expect(detectGeographic('Country', ['US'])).toEqual({
      subtype: 'geographic',
      confidence: 'medium',
    })
    expect(detectGeographic('LATITUDE', [])).toEqual({
      subtype: 'geographic',
      confidence: 'low',
    })
  })

  it('matches "lat" and "lng" suffix forms', () => {
    expect(detectGeographic('user_lat', [])).toEqual({
      subtype: 'geographic',
      confidence: 'low',
    })
    expect(detectGeographic('lng_value', [])).toEqual({
      subtype: 'geographic',
      confidence: 'low',
    })
  })
})
