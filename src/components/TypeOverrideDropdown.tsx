import type { ColumnType } from '../data/schema'

const OPTIONS: ReadonlyArray<{ value: ColumnType; label: string }> = [
  { value: 'numeric', label: 'numeric' },
  { value: 'string', label: 'text' },
  { value: 'date', label: 'date' },
  { value: 'boolean', label: 'true/false' },
]

type TypeOverrideDropdownProps = {
  columnName: string
  value: ColumnType
  onChange: (columnName: string, type: ColumnType) => void
  className?: string
}

/**
 * Native `<select>` for changing a column's inferred type. Compact styling
 * to fit inside the schema table without dominating it. Options collapse
 * the user-facing labels (e.g., `string` → "text") so the dropdown reads
 * naturally to the lead audience (students, not type-system authors).
 */
export function TypeOverrideDropdown({
  columnName,
  value,
  onChange,
  className = '',
}: TypeOverrideDropdownProps) {
  return (
    <select
      aria-label={`Type for column ${columnName}`}
      value={value}
      onChange={(e) => onChange(columnName, e.target.value as ColumnType)}
      className={[
        'rounded-md border border-ink-200 bg-white px-2 py-1',
        'font-sans text-xs text-ink-800',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500',
        'hover:border-ink-300 transition-colors duration-fast',
        className,
      ].join(' ')}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
