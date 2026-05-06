import type { SheetMeta } from '../data/xlsx'

const NAME_TRUNCATE_LIMIT = 24

type SheetSwitcherProps = {
  sheets: ReadonlyArray<SheetMeta>
  activeSheet: string
  onSwitch: (sheetName: string) => void
}

function truncate(name: string): string {
  if (name.length <= NAME_TRUNCATE_LIMIT) return name
  return name.slice(0, NAME_TRUNCATE_LIMIT - 1) + '…'
}

/**
 * Inline sheet switcher for multi-sheet xlsx workbooks. Hidden when the
 * workbook has a single sheet (CP-3.5 plan, Unit 4). Active sheet renders
 * sage-700 + bold; inactive sheets are ink-500 and click-to-swap. Long sheet
 * names truncate with the full name surfaced via title attribute.
 */
export function SheetSwitcher({ sheets, activeSheet, onSwitch }: SheetSwitcherProps) {
  if (sheets.length <= 1) return null

  return (
    <nav
      aria-label="Workbook sheets"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <span className="font-serif text-xs italic text-ink-500">sheet</span>
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {sheets.map((sheet, i) => {
          const isActive = sheet.name === activeSheet
          return (
            <li key={sheet.name} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (!isActive) onSwitch(sheet.name)
                }}
                aria-current={isActive ? 'page' : undefined}
                title={sheet.name}
                className={[
                  'font-sans text-sm transition-colors duration-fast rounded-sm px-1',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500',
                  isActive
                    ? 'text-sage-700 font-medium cursor-default'
                    : 'text-ink-500 hover:text-sage-700 cursor-pointer',
                ].join(' ')}
              >
                {truncate(sheet.name)}
              </button>
              {i < sheets.length - 1 ? (
                <span aria-hidden="true" className="text-ink-300">
                  ·
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
