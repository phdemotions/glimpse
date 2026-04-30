import type { ColumnInfo, ColumnType } from '../data/schema'

export type ChartKind =
  | 'bar'
  | 'line'
  | 'scatter'
  | 'histogram'
  | 'pie'
  | 'ranking'
  | 'none'

export type ChartChoice = {
  kind: ChartKind
  xField?: string
  yField?: string
  sortDesc?: boolean
  limit?: number
  reasoning: string
}

// Cardinality cutoffs — tuned for the lead audience (students reading data
// at a glance). Inclusive boundaries. PIE_MAX = 5 because pie charts past 5
// slices get hard to read; the plan's decision sketch said ≤6 but its unit
// test scenarios called for bar at cardinality 6 — bar wins on legibility.
const PIE_MAX = 5
const BAR_MAX = 12
const RANKING_LIMIT = 10
const LINE_MIN_DISTINCT_DATES = 3

function applyOverrides(
  columns: ReadonlyArray<ColumnInfo>,
  overrides: Record<string, ColumnType>,
): ColumnInfo[] {
  return columns.map((c) =>
    overrides[c.name]
      ? {
          ...c,
          type: overrides[c.name]!,
          subtype: null,
          confidence: 'high' as const,
        }
      : c,
  )
}

/**
 * Pure function: map a column descriptor (plus user overrides) to a chart
 * choice. No I/O, no side effects, deterministic for identical inputs.
 *
 * Decision tree (highest priority first):
 *   1. No numeric column → none
 *   2. Single numeric, no categoricals/dates → histogram
 *   3. Date with ≥3 distinct values + numeric → line (else bar with date as X)
 *   4. ≥2 numerics, no dates/categoricals → scatter
 *   5. Categorical × numeric:
 *        cardinality ≤ 6 → pie
 *        cardinality ≤ 12 → bar
 *        cardinality > 12 → ranking (top 10 by measure)
 *   6. Otherwise → none
 *
 * `reasoning` populates the view-source "why this chart" panel and the
 * caption template. Keep each branch's reasoning under 240 chars.
 */
export function selectChart(
  columns: ReadonlyArray<ColumnInfo>,
  overrides: Record<string, ColumnType> = {},
): ChartChoice {
  if (columns.length === 0) {
    return { kind: 'none', reasoning: 'No columns to plot.' }
  }

  const cols = applyOverrides(columns, overrides)
  const numerics = cols.filter((c) => c.type === 'numeric')
  const dates = cols.filter((c) => c.type === 'date')
  const categoricals = cols.filter(
    (c) => c.type === 'string' || c.type === 'boolean',
  )

  if (numerics.length === 0) {
    return {
      kind: 'none',
      reasoning:
        "We couldn't pick a chart automatically — your data has no numeric column to plot.",
    }
  }

  // Histogram: single numeric column, nothing to group by.
  if (
    numerics.length === 1 &&
    categoricals.length === 0 &&
    dates.length === 0
  ) {
    return {
      kind: 'histogram',
      xField: numerics[0].name,
      reasoning: `Showing a histogram because ${numerics[0].name} is the only column with numbers and there's nothing to group by.`,
    }
  }

  // Line: date with ≥3 distinct values + at least one numeric measure.
  if (dates.length >= 1) {
    const date = dates[0]
    const num = numerics[0]
    if (date.cardinality >= LINE_MIN_DISTINCT_DATES) {
      return {
        kind: 'line',
        xField: date.name,
        yField: num.name,
        reasoning: `Showing a line chart because your data has ${date.cardinality} dates in ${date.name} and one number to track in ${num.name}.`,
      }
    }
    return {
      kind: 'bar',
      xField: date.name,
      yField: num.name,
      reasoning: `Showing a bar chart because ${date.name} has only ${date.cardinality} ${date.cardinality === 1 ? 'date' : 'dates'} — a line needs at least ${LINE_MIN_DISTINCT_DATES} points to show a trend.`,
    }
  }

  // Scatter: two or more numerics, no dates or categoricals.
  if (numerics.length >= 2 && categoricals.length === 0) {
    return {
      kind: 'scatter',
      xField: numerics[0].name,
      yField: numerics[1].name,
      reasoning: `Showing a scatter plot because both ${numerics[0].name} and ${numerics[1].name} are numbers.`,
    }
  }

  // Categorical × numeric.
  if (categoricals.length >= 1) {
    const cat = categoricals[0]
    const num = numerics[0]

    if (cat.cardinality <= PIE_MAX) {
      return {
        kind: 'pie',
        xField: cat.name,
        yField: num.name,
        reasoning: `Showing a pie chart because ${cat.name} has ${cat.cardinality} categories — small enough to compare as parts of a whole.`,
      }
    }

    if (cat.cardinality <= BAR_MAX) {
      return {
        kind: 'bar',
        xField: cat.name,
        yField: num.name,
        reasoning: `Showing a bar chart because your data has ${cat.cardinality} categories in ${cat.name} and one number to compare in ${num.name}.`,
      }
    }

    return {
      kind: 'ranking',
      xField: cat.name,
      yField: num.name,
      sortDesc: true,
      limit: RANKING_LIMIT,
      reasoning: `Showing the top ${RANKING_LIMIT} because ${cat.name} has ${cat.cardinality} values — too many to read at a glance.`,
    }
  }

  return {
    kind: 'none',
    reasoning:
      "We couldn't pick a chart automatically — try the manual picker.",
  }
}
