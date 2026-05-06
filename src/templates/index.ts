import type { Template, Applicability } from './types'
import type { ColumnInfo } from '../data/schema'

export const TEMPLATES: Template[] = []

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
