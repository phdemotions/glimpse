import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ConfidenceBadge } from './ConfidenceBadge'

describe('ConfidenceBadge', () => {
  it('renders nothing for high confidence', () => {
    const { container } = render(<ConfidenceBadge confidence="high" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders italic sage hint for medium confidence', () => {
    const { getByLabelText } = render(<ConfidenceBadge confidence="medium" />)
    const el = getByLabelText('medium confidence')
    expect(el).toBeInTheDocument()
    expect(el.textContent).toBe('we think')
    expect(el.className).toContain('italic')
    expect(el.className).toContain('text-sage-700')
  })

  it('renders ink-200 pill with warning text for low confidence', () => {
    const { getByLabelText } = render(<ConfidenceBadge confidence="low" />)
    const el = getByLabelText('low confidence')
    expect(el).toBeInTheDocument()
    expect(el.textContent).toBe('low confidence')
    expect(el.className).toContain('border-ink-200')
    expect(el.className).toContain('text-warning')
  })
})
