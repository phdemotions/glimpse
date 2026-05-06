import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Template, Applicability } from './types'
import { makeRankingSpec } from '../charts/vega'
import { colors, typography } from '../styles/tokens'

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
    width: 1200,
    height: 675,
    title: {
      text: `${numCol.name} by ${geoCol.name}`,
      subtitle: 'Geographic data detected — full world-map render coming after v1',
      subtitleColor: colors.sage[700],
      subtitleFontStyle: 'italic',
      subtitleFont: typography.family.sans,
      subtitleFontSize: 13,
    },
  }
}

function captionFor(
  columns: ReadonlyArray<ColumnInfo>,
): Caption {
  const geoCol = columns.find((c) => c.subtype === 'geographic')!
  const numCol = columns.find((c) => c.type === 'numeric')!
  return {
    eyebrow: 'geographic pattern',
    body: `Ranking ${geoCol.name} by ${numCol.name}. A full map view is coming in a future update.`,
  }
}

const geographicPatternTemplate: Template = {
  id: 'geographic',
  label: 'Geographic Pattern',
  description: 'Ranked bar chart for geographic data — full choropleth map deferred to post-v1.',
  applicability,
  specBuilder,
  captionFor,
}

export { geographicPatternTemplate }
