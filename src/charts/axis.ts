/**
 * Axis-discipline helper. Templates compose `withAxisDiscipline` into their
 * Vega-Lite encoding axes so we never rely on auto-scale, which produced the
 * Distribution decimal-tick bug, the Trend Story half-empty Y range, and the
 * Top N "97-99.8 across 15-100" overstatement that the CP-3.6 audit flagged.
 *
 * The helper is intentionally small — a thin policy layer, not a full axis
 * builder. Templates still own `axis.title` and orientation; this just hands
 * back the explicit `scale.domain`, `axis.format`, `axis.tickMinStep`, and
 * `axis.tickCount` settings appropriate to the data kind.
 */

export type AxisKind = 'count' | 'currency' | 'percent' | 'year-month' | 'numeric'

type AxisInput = {
  /** Smallest data value the axis must display. Required for `currency` and `numeric`. */
  dataMin?: number
  /** Largest data value the axis must display. Required for `currency` and `numeric`. */
  dataMax?: number
}

export type AxisDiscipline = {
  scale?: { domain?: [number, number] }
  axis: {
    format?: string
    formatType?: string
    tickMinStep?: number
    tickCount?: number
  }
}

/**
 * Round `value` down to the nearest `step` so the axis lower bound lands on a
 * sensible number rather than an arbitrary minimum (e.g. 41,000 → 40,000).
 */
function floorTo(value: number, step: number): number {
  return Math.floor(value / step) * step
}

function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step
}

/**
 * Pick a sensible step size for a data range so axis ticks are readable.
 * Targets ~5-10 ticks across the visible range.
 */
function pickStep(range: number): number {
  if (range <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(range)))
  const normalized = range / magnitude
  if (normalized < 1.5) return magnitude / 5
  if (normalized < 3) return magnitude / 2
  if (normalized < 7) return magnitude
  return magnitude * 2
}

function disciplineCount(): AxisDiscipline {
  return {
    axis: {
      format: 'd',
      tickMinStep: 1,
    },
  }
}

function disciplinePercent(): AxisDiscipline {
  return {
    scale: { domain: [0, 1] },
    axis: {
      format: '.0%',
      tickMinStep: 0.1,
    },
  }
}

function disciplineYearMonth(): AxisDiscipline {
  return {
    axis: {
      formatType: 'time',
      format: '%b %Y',
    },
  }
}

function disciplineCurrency({ dataMin, dataMax }: AxisInput): AxisDiscipline {
  if (dataMin === undefined || dataMax === undefined) {
    return { axis: { format: '$,d' } }
  }
  const step = pickStep(dataMax - dataMin)
  return {
    scale: { domain: [floorTo(dataMin, step), ceilTo(dataMax, step)] },
    axis: {
      format: '$,d',
    },
  }
}

function disciplineNumeric({ dataMin, dataMax }: AxisInput): AxisDiscipline {
  if (dataMin === undefined || dataMax === undefined) {
    return { axis: { format: ',d' } }
  }
  const range = dataMax - dataMin
  const step = pickStep(range)
  return {
    scale: { domain: [floorTo(dataMin, step), ceilTo(dataMax, step)] },
    axis: {
      format: range >= 1000 ? ',d' : '.2f',
    },
  }
}

/**
 * Returns the explicit axis policy for a given data kind. Compose into a
 * Vega-Lite encoding's `scale` and `axis` blocks; templates merge with
 * their own `axis.title` and orientation.
 *
 * Examples (directional, not literal):
 *   withAxisDiscipline('count')                     // integer ticks, no .5/.7 decimals
 *   withAxisDiscipline('currency', { dataMin: 41000, dataMax: 82000 })
 *   withAxisDiscipline('percent')                   // 0–100% stack normalize
 */
export function withAxisDiscipline(
  kind: AxisKind,
  input: AxisInput = {},
): AxisDiscipline {
  switch (kind) {
    case 'count':
      return disciplineCount()
    case 'percent':
      return disciplinePercent()
    case 'year-month':
      return disciplineYearMonth()
    case 'currency':
      return disciplineCurrency(input)
    case 'numeric':
      return disciplineNumeric(input)
  }
}
