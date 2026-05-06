import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ModeToggle } from './ModeToggle'

describe('ModeToggle', () => {
  it('renders both buttons', () => {
    const { getByRole } = render(
      <ModeToggle mode="quick" onModeChange={() => {}} hasTemplates={true} />,
    )
    expect(getByRole('radio', { name: /quick/i })).toBeInTheDocument()
    expect(getByRole('radio', { name: /infographic/i })).toBeInTheDocument()
  })

  it('calls onModeChange("infographic") when hasTemplates is true', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ModeToggle mode="quick" onModeChange={onChange} hasTemplates={true} />,
    )
    fireEvent.click(getByRole('radio', { name: /infographic/i }))
    expect(onChange).toHaveBeenCalledWith('infographic')
  })

  it('does NOT call onModeChange when hasTemplates is false', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <ModeToggle mode="quick" onModeChange={onChange} hasTemplates={false} />,
    )
    fireEvent.click(getByRole('radio', { name: /infographic/i }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('marks the active button with sage-700 bg class', () => {
    const { getByRole } = render(
      <ModeToggle mode="quick" onModeChange={() => {}} hasTemplates={true} />,
    )
    expect(getByRole('radio', { name: /quick/i }).className).toContain(
      'bg-sage-700',
    )
    expect(getByRole('radio', { name: /infographic/i }).className).not.toContain(
      'bg-sage-700',
    )
  })

  it('disables infographic button visually when hasTemplates is false', () => {
    const { getByRole } = render(
      <ModeToggle mode="quick" onModeChange={() => {}} hasTemplates={false} />,
    )
    const btn = getByRole('radio', { name: /infographic/i })
    expect(btn.className).toContain('opacity-50')
    expect(btn.className).toContain('cursor-not-allowed')
  })
})
