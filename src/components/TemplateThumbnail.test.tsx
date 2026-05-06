import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { TemplateThumbnail } from './TemplateThumbnail'
import type { TemplateId } from '../templates/types'

const ALL_IDS: TemplateId[] = [
  'big-number',
  'top-n',
  'before-after',
  'trend-story',
  'distribution',
  'part-to-whole',
  'geographic',
  'survey-likert',
]

describe('TemplateThumbnail', () => {
  it.each(ALL_IDS)('renders an SVG for "%s"', (id) => {
    const { container } = render(<TemplateThumbnail templateId={id} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it.each(ALL_IDS)('SVG has viewBox attribute for "%s"', (id) => {
    const { container } = render(<TemplateThumbnail templateId={id} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox')
  })
})
