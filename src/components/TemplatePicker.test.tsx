import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TemplatePicker } from './TemplatePicker'
import type { Template, Applicability } from '../templates/types'
import type { ColumnInfo } from '../data/schema'

function makeTemplate(
  id: string,
  score: number,
  overrides: Partial<Template> = {},
): Template & { applicability_result: Applicability } {
  return {
    id: id as Template['id'],
    label: `${id} label`,
    description: `${id} description`,
    applicability: () => ({ fits: true, score }),
    specBuilder: () => ({} as never),
    captionFor: () => ({ eyebrow: '', body: '' }),
    ...overrides,
    applicability_result: { fits: true, score },
  }
}

describe('TemplatePicker', () => {
  it('renders one card per template', () => {
    const templates = [
      makeTemplate('big-number', 100),
      makeTemplate('top-n', 80),
    ]
    const { getByTestId } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    expect(getByTestId('template-card-big-number')).toBeInTheDocument()
    expect(getByTestId('template-card-top-n')).toBeInTheDocument()
  })

  it('calls onSelect with the template id when a card is clicked', () => {
    const onSelect = vi.fn()
    const templates = [makeTemplate('big-number', 100)]
    const { getByTestId } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate={null}
        onSelect={onSelect}
        onBackToQuick={() => {}}
      />,
    )
    fireEvent.click(getByTestId('template-card-big-number'))
    expect(onSelect).toHaveBeenCalledWith('big-number')
  })

  it('renders templates in the order received (sorted by caller)', () => {
    const templates = [
      makeTemplate('top-n', 90),
      makeTemplate('big-number', 100),
    ]
    const { getByTestId } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    const grid = getByTestId('template-picker')
    const cards = grid.querySelectorAll('[data-testid^="template-card-"]')
    expect(cards[0]).toHaveAttribute('data-testid', 'template-card-top-n')
    expect(cards[1]).toHaveAttribute('data-testid', 'template-card-big-number')
  })

  it('shows empty state when templates array is empty', () => {
    const { getByTestId, getByText } = render(
      <TemplatePicker
        templates={[]}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    expect(getByTestId('template-picker-empty')).toBeInTheDocument()
    expect(
      getByText(/doesn.t match any templates yet/),
    ).toBeInTheDocument()
  })

  it('clicking back-link calls onBackToQuick', () => {
    const onBack = vi.fn()
    const { getByTestId } = render(
      <TemplatePicker
        templates={[]}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={onBack}
      />,
    )
    fireEvent.click(getByTestId('back-to-quick'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('selected template gets sage border class', () => {
    const templates = [
      makeTemplate('big-number', 100),
      makeTemplate('top-n', 80),
    ]
    const { getByTestId } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate="big-number"
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    expect(getByTestId('template-card-big-number').className).toContain(
      'border-sage-500',
    )
    expect(getByTestId('template-card-top-n').className).not.toContain(
      'border-sage-500',
    )
  })

  it('shows "limited fit" pill when score < 80', () => {
    const templates = [makeTemplate('big-number', 60)]
    const { getByText } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    expect(getByText('limited fit')).toBeInTheDocument()
  })

  it('does not show "limited fit" pill when score >= 80', () => {
    const templates = [makeTemplate('big-number', 80)]
    const { queryByText } = render(
      <TemplatePicker
        templates={templates}
        selectedTemplate={null}
        onSelect={() => {}}
        onBackToQuick={() => {}}
      />,
    )
    expect(queryByText('limited fit')).not.toBeInTheDocument()
  })
})
