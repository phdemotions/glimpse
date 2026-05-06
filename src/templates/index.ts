import type { Template, Applicability } from './types'
import type { ColumnInfo } from '../data/schema'
import { bigNumberTemplate } from './big-number'
import { topNRankingTemplate } from './top-n-ranking'
import { trendStoryTemplate } from './trend-story'
import { distributionTemplate } from './distribution'
import { partToWholeTemplate } from './part-to-whole'
import { surveyLikertTemplate } from './survey-likert'

export const TEMPLATES: Template[] = [
  bigNumberTemplate,
  topNRankingTemplate,
  trendStoryTemplate,
  distributionTemplate,
  partToWholeTemplate,
  surveyLikertTemplate,
]

export function getTemplates(): ReadonlyArray<Template> {
  return TEMPLATES
}

export function applicableTemplates(
  columns: ReadonlyArray<ColumnInfo>,
): Array<Template & { applicability_result: Applicability }> {
  return TEMPLATES.map((t) => ({
    ...t,
    applicability_result: t.applicability(columns),
  }))
    .filter((t) => t.applicability_result.fits)
    .sort((a, b) => b.applicability_result.score - a.applicability_result.score)
}
