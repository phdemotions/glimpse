import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ViewSource } from './ViewSource'

const spec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  mark: 'bar',
  encoding: { x: { field: 'role' }, y: { field: 'count' } },
}

describe('ViewSource', () => {
  it('renders nothing when spec is null', () => {
    const { container } = render(
      <ViewSource spec={null} reasoning="r" caption="c" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows the disclosure summary closed by default', () => {
    const { getByText } = render(
      <ViewSource spec={spec} reasoning="r" caption="c" />,
    )
    expect(getByText('show the spec')).toBeInTheDocument()
  })

  it('renders caption and reasoning regardless of disclosure state', () => {
    // jsdom renders all <details> children regardless of `open` — visibility
    // is a browser-level concern. We only need to verify the markup is there.
    const { getByText, getByRole } = render(
      <ViewSource
        spec={spec}
        reasoning="Because the data has X and Y."
        caption="Showing a bar chart because your data is..."
      />,
    )
    expect(getByText(/Showing a bar chart/)).toBeInTheDocument()
    expect(getByText(/Because the data has X and Y/)).toBeInTheDocument()
    expect(getByRole('button', { name: 'copy spec' })).toBeInTheDocument()
  })

  it('renders pretty-printed JSON spec', () => {
    const { container } = render(
      <ViewSource spec={spec} reasoning="r" caption="c" />,
    )
    const pre = container.querySelector('pre')!
    expect(pre.textContent).toContain('"$schema"')
    expect(pre.textContent).toContain('"mark"')
    // Pretty-printed: indented lines start with two spaces.
    expect(pre.textContent).toMatch(/\n {2}"mark"/)
  })

  it('does not duplicate caption when reasoning matches caption verbatim', () => {
    const same = 'Showing a bar chart because.'
    const { container } = render(
      <ViewSource spec={spec} reasoning={same} caption={same} />,
    )
    const matches = container.textContent?.match(/Showing a bar chart because\./g) ?? []
    expect(matches.length).toBe(1)
  })
})
