import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TypeOverrideDropdown } from './TypeOverrideDropdown'

describe('TypeOverrideDropdown', () => {
  it('renders all five type options', () => {
    const { getByLabelText } = render(
      <TypeOverrideDropdown
        columnName="role"
        value="string"
        onChange={() => {}}
      />,
    )
    const select = getByLabelText('Type for column role') as HTMLSelectElement
    const labels = Array.from(select.options).map((o) => o.textContent)
    expect(labels).toEqual(['numeric', 'text', 'date', 'true/false'])
  })

  it('calls onChange with column name and new type', () => {
    const onChange = vi.fn()
    const { getByLabelText } = render(
      <TypeOverrideDropdown
        columnName="role"
        value="string"
        onChange={onChange}
      />,
    )
    const select = getByLabelText('Type for column role') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'numeric' } })
    expect(onChange).toHaveBeenCalledWith('role', 'numeric')
  })

  it('reflects the controlled value', () => {
    const { getByLabelText, rerender } = render(
      <TypeOverrideDropdown
        columnName="x"
        value="string"
        onChange={() => {}}
      />,
    )
    const select = getByLabelText('Type for column x') as HTMLSelectElement
    expect(select.value).toBe('string')

    rerender(
      <TypeOverrideDropdown
        columnName="x"
        value="date"
        onChange={() => {}}
      />,
    )
    expect(select.value).toBe('date')
  })
})
