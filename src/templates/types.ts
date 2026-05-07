import type { ColumnInfo } from '../data/schema'
import type { VegaSpec } from '../charts/vega'
import type { Frame } from '../charts/infographic-frame'

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
  /**
   * Returns the chart-only Vega-Lite spec, sized to `CHART_REGION`. The
   * surrounding eyebrow / headline / takeaway / source / wordmark frame is
   * composed by `wrapWithFrame` at render time — templates never need to
   * know about the shell.
   */
  specBuilder: (
    data: ReadonlyArray<Record<string, unknown>>,
    columns: ReadonlyArray<ColumnInfo>,
  ) => VegaSpec
  /**
   * Returns the surrounding shell metadata. Same return value renders into
   * the in-spec text-mark frame (visible in SVG/PNG export) and the DOM
   * caption strip above the chart. Replaces the older `captionFor` whose
   * body now lives in `frame.takeaway`.
   */
  frameFor: (
    columns: ReadonlyArray<ColumnInfo>,
    fileName: string,
  ) => Frame
  dataPrep?: (
    rows: ReadonlyArray<Record<string, unknown>>,
    columns: ReadonlyArray<ColumnInfo>,
  ) => unknown
}
