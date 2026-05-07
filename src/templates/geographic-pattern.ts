import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Template, Applicability } from './types'
import { makeRankingSpec } from '../charts/vega'
import { CHART_REGION, type Frame } from '../charts/infographic-frame'

function applicability(
  columns: ReadonlyArray<ColumnInfo>,
): Applicability {
  const geo = columns.find((c) => c.subtype === 'geographic')
  const num = columns.find((c) => c.type === 'numeric')
  if (!geo || !num) return { fits: false, score: 0 }
  return { fits: true, score: 60 }
}

function specBuilder(
  data: ReadonlyArray<Record<string, unknown>>,
  columns: ReadonlyArray<ColumnInfo>,
): VegaSpec {
  const geoCol = columns.find((c) => c.subtype === 'geographic')!
  const numCol = columns.find((c) => c.type === 'numeric')!

  const base = makeRankingSpec([...data], geoCol.name, numCol.name, 15) as Record<string, unknown>
  return {
    ...base,
    width: CHART_REGION.width,
    height: CHART_REGION.height,
  }
}

function frameFor(
  columns: ReadonlyArray<ColumnInfo>,
  fileName: string,
): Frame {
  const geoCol = columns.find((c) => c.subtype === 'geographic')!
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'geographic pattern',
    headline: `${numCol.name} by ${geoCol.name}`,
    takeaway: `Ranking ${geoCol.name} by ${numCol.name}. A full world-map view is coming after v1.`,
    source: fileName,
  }
}

const geographicPatternTemplate: Template = {
  id: 'geographic',
  label: 'Geographic Pattern',
  description: 'Ranked bar chart for geographic data — full choropleth map deferred to post-v1.',
  applicability,
  specBuilder,
  frameFor,
}

export { geographicPatternTemplate }
