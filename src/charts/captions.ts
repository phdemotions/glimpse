import type { ChartChoice } from './selector'

export type Caption = {
  eyebrow: string
  body: string
}

const NAME_TRUNCATE = 40

function trim(name: string | undefined): string {
  if (!name) return ''
  if (name.length <= NAME_TRUNCATE) return name
  return name.slice(0, NAME_TRUNCATE - 1) + '…'
}

/**
 * Plain-English caption for a chart selection. Eyebrow names the chart type
 * in lowercase italic; body explains the data-shape reasoning in serif prose.
 *
 * Tone benchmark (locked in plan):
 * - Address the reader as "you"
 * - Name the actual columns the chart uses
 * - Avoid jargon: no "dimension", "cardinality", "encoding"
 * - Reading level ≤ grade 9 (Flesch-Kincaid)
 * - Keep each body under 200 chars
 *
 * Captions are pure templates — no LLM calls (PLAN.md Decision #21).
 */
export function captionFor(choice: ChartChoice): Caption {
  const x = trim(choice.xField)
  const y = trim(choice.yField)

  switch (choice.kind) {
    case 'line':
      return {
        eyebrow: 'line chart',
        body: `Showing a line chart because your data has dates in ${x} and one number to track in ${y}.`,
      }

    case 'bar':
      return {
        eyebrow: 'bar chart',
        body: `Showing a bar chart because your data has categories in ${x} and one number to compare in ${y}.`,
      }

    case 'ranking':
      return {
        eyebrow: 'top ' + (choice.limit ?? 10),
        body: `Showing the top ${choice.limit ?? 10} because ${x} has too many values to read at a glance.`,
      }

    case 'pie':
      return {
        eyebrow: 'pie chart',
        body: `Showing a pie chart because ${x} has a small set of categories — easy to compare as parts of a whole.`,
      }

    case 'histogram':
      return {
        eyebrow: 'histogram',
        body: `Showing a histogram because ${x} is the only column with numbers and there's nothing to group by.`,
      }

    case 'scatter':
      return {
        eyebrow: 'scatter plot',
        body: `Showing a scatter plot because both ${x} and ${y} are numbers.`,
      }

    case 'none':
      return {
        eyebrow: 'no chart',
        body:
          "We couldn't pick a chart automatically — your data has no numeric column to plot. Try the manual picker below.",
      }
  }
}
