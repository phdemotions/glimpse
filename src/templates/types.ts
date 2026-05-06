import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'

export { AUTO_INFOGRAPHIC_THRESHOLD } from '../app/reducer'

export type TemplateId =
  | 'big-number'
  | 'top-n'
  | 'before-after'
  | 'trend-story'
  | 'distribution'
  | 'part-to-whole'
  | 'geographic'
  | 'survey-likert'

export type Applicability = {
  fits: boolean
  score: number
  reason?: string
}

export type Template = {
  id: TemplateId
  label: string
  description: string
  applicability: (columns: ReadonlyArray<ColumnInfo>) => Applicability
  specBuilder: (
    data: ReadonlyArray<Record<string, unknown>>,
    columns: ReadonlyArray<ColumnInfo>,
  ) => VegaSpec
  captionFor: (columns: ReadonlyArray<ColumnInfo>) => Caption
  dataPrep?: (
    rows: ReadonlyArray<Record<string, unknown>>,
    columns: ReadonlyArray<ColumnInfo>,
  ) => unknown
}
