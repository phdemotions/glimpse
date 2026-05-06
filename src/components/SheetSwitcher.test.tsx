import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { SheetSwitcher } from './SheetSwitcher'
import type { SheetMeta } from '../data/xlsx'

function meta(name: string, rowCount = 10, columnCount = 3): SheetMeta {
  return { name, rowCount, columnCount }
}

describe('SheetSwitcher', () => {
  it('renders nothing when the workbook has only one sheet', () => {
    const { container } = render(
      <SheetSwitcher
        sheets={[meta('Only')]}
        activeSheet="Only"
        onSwitch={() => {}}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders one button per sheet for multi-sheet workbooks', () => {
    const { getByRole, getAllByRole } = render(
      <SheetSwitcher
        sheets={[meta('Q1'), meta('Q2'), meta('Q3')]}
        activeSheet="Q1"
        onSwitch={() => {}}
      />,
    )

    expect(getByRole('navigation')).toBeInTheDocument()
    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(3)
    expect(buttons.map((b) => b.textContent)).toEqual(['Q1', 'Q2', 'Q3'])
  })

  it('marks the active sheet via aria-current="page"', () => {
    const { getByRole } = render(
      <SheetSwitcher
        sheets={[meta('Q1'), meta('Q2'), meta('Q3')]}
        activeSheet="Q2"
        onSwitch={() => {}}
      />,
    )

    expect(getByRole('button', { name: 'Q2' })).toHaveAttribute('aria-current', 'page')
    expect(getByRole('button', { name: 'Q1' })).not.toHaveAttribute('aria-current')
    expect(getByRole('button', { name: 'Q3' })).not.toHaveAttribute('aria-current')
  })

  it('fires onSwitch with the clicked sheet name when an inactive pill is clicked', () => {
    const onSwitch = vi.fn()
    const { getByRole } = render(
      <SheetSwitcher
        sheets={[meta('Q1'), meta('Q2'), meta('Q3')]}
        activeSheet="Q1"
        onSwitch={onSwitch}
      />,
    )

    fireEvent.click(getByRole('button', { name: 'Q3' }))

    expect(onSwitch).toHaveBeenCalledTimes(1)
    expect(onSwitch).toHaveBeenCalledWith('Q3')
  })

  it('does not fire onSwitch when the already-active pill is clicked', () => {
    const onSwitch = vi.fn()
    const { getByRole } = render(
      <SheetSwitcher
        sheets={[meta('Q1'), meta('Q2')]}
        activeSheet="Q1"
        onSwitch={onSwitch}
      />,
    )

    fireEvent.click(getByRole('button', { name: 'Q1' }))

    expect(onSwitch).not.toHaveBeenCalled()
  })

  it('truncates long sheet names with ellipsis and exposes full name via title', () => {
    const longName = 'A really long sheet name that should be truncated nicely'
    const { container } = render(
      <SheetSwitcher
        sheets={[meta(longName), meta('Other')]}
        activeSheet={longName}
        onSwitch={() => {}}
      />,
    )

    const button = container.querySelector(`button[title="${longName}"]`) as HTMLButtonElement | null
    expect(button).not.toBeNull()
    expect(button!.textContent).toMatch(/…$/)
    expect(button!.textContent!.length).toBeLessThan(longName.length)
  })
})
