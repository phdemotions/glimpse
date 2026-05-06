import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { InfographicCanvas } from './InfographicCanvas'

describe('InfographicCanvas', () => {
  it('renders children', () => {
    const { getByText } = render(
      <InfographicCanvas>
        <p>Chart goes here</p>
      </InfographicCanvas>,
    )
    expect(getByText('Chart goes here')).toBeInTheDocument()
  })

  it('has correct aspect-ratio style', () => {
    const { getByTestId } = render(
      <InfographicCanvas>
        <span />
      </InfographicCanvas>,
    )
    const el = getByTestId('infographic-canvas')
    expect(el.style.aspectRatio).toBe('1200 / 675')
  })

  it('has max-width constraint', () => {
    const { getByTestId } = render(
      <InfographicCanvas>
        <span />
      </InfographicCanvas>,
    )
    const el = getByTestId('infographic-canvas')
    expect(el.style.maxWidth).toBe('1200px')
  })
})
