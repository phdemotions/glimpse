import type { Mode } from '../app/reducer'

type ModeToggleProps = {
  mode: Mode
  onModeChange: (mode: Mode) => void
  hasTemplates: boolean
}

export function ModeToggle({ mode, onModeChange, hasTemplates }: ModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-md border border-ink-200"
      role="radiogroup"
      aria-label="Visualization mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'quick'}
        onClick={() => onModeChange('quick')}
        className={`px-4 py-1.5 font-sans text-sm transition-colors duration-normal ${
          mode === 'quick'
            ? 'bg-sage-700 text-white'
            : 'bg-transparent text-ink-600 hover:text-ink-800'
        }`}
        style={{ borderRadius: '7px 0 0 7px' }}
      >
        Quick
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'infographic'}
        aria-disabled={!hasTemplates}
        onClick={() => {
          if (hasTemplates) onModeChange('infographic')
        }}
        className={`px-4 py-1.5 font-sans text-sm transition-colors duration-normal ${
          mode === 'infographic'
            ? 'bg-sage-700 text-white'
            : 'bg-transparent text-ink-600 hover:text-ink-800'
        } ${!hasTemplates ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ borderRadius: '0 7px 7px 0' }}
      >
        Infographic
      </button>
    </div>
  )
}
