import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { makeRankingSpec } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'
import { colors } from '../styles/tokens'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const cat = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.cardinality >= 5 && c.cardinality <= 50,
  )
  const num = columns.find((c) => c.type === 'numeric')
  if (!cat || !num) return { fits: false, score: 0 }
  return { fits: true, score: cat.cardinality > 12 ? 100 : 60 }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const cat = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.cardinality >= 5 && c.cardinality <= 50,
  )!
  const num = columns.find((c) => c.type === 'numeric')!

  const base = makeRankingSpec([...data], cat.name, num.name, 10) as Record<string, unknown>
  const baseEncoding = base.encoding as Record<string, unknown>

  return {
    ...base,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
    encoding: {
      ...baseEncoding,
      color: {
        condition: { test: 'datum._rank <= 3', value: colors.sage[900] },
        value: colors.sage[400],
      },
    },
  }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
): Frame {
  const cat = columns.find(
    (c) => (c.type === 'string' || c.type === 'boolean') && c.cardinality >= 5 && c.cardinality <= 50,
  )!
  const num = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'top 10',
    headline: `Top ${cat.name} by ${num.name}`,
    takeaway: `Ranking ${cat.name} by ${num.name} — the top 3 are highlighted.`,
    source: fileName,
  }
}

const topNRankingTemplate: Template = {
  id: 'top-n',
  label: 'Top N Ranking',
  description: 'Horizontal bar chart highlighting the top entries in a ranked list.',
  applicability,
  specBuilder,
  frameFor,
}

export { topNRankingTemplate }
