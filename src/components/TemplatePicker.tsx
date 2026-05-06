import type { Template, Applicability } from '../templates/types'
import { TemplateThumbnail } from './TemplateThumbnail'

type Props = {
  templates: Array<Template & { applicability_result: Applicability }>
  selectedTemplate: string | null
  onSelect: (id: string) => void
  onBackToQuick: () => void
}

export function TemplatePicker({
  templates,
  selectedTemplate,
  onSelect,
  onBackToQuick,
}: Props) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12" data-testid="template-picker-empty">
        <p className="font-serif text-lg text-ink-700">
          Your data doesn&rsquo;t match any templates yet
        </p>
        <p className="mt-2 font-sans text-sm text-ink-500">
          Try Quick mode for an auto-detected chart, or adjust column types
          above.
        </p>
        <button
          type="button"
          onClick={onBackToQuick}
          className="mt-4 font-sans text-sm text-sage-700 hover:text-sage-800 underline"
          data-testid="back-to-quick"
        >
          &larr; switch to Quick mode
        </button>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      data-testid="template-picker"
    >
      {templates.map((t) => {
        const isSelected = t.id === selectedTemplate
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            data-testid={`template-card-${t.id}`}
            className={[
              'flex items-start gap-4 rounded-md p-4 text-left',
              'transition-all duration-normal',
              isSelected
                ? 'border-2 border-sage-500 bg-sage-50'
                : 'border border-ink-200 bg-white hover:bg-ink-100',
            ].join(' ')}
          >
            <TemplateThumbnail templateId={t.id} />
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm font-semibold text-ink-800">
                {t.label}
              </p>
              <p className="mt-1 font-sans text-xs text-ink-600">
                {t.description}
              </p>
              {t.applicability_result.score < 80 ? (
                <span className="mt-1.5 inline-block font-serif text-xs italic text-sage-700">
                  limited fit
                </span>
              ) : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
