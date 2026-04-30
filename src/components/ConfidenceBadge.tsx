import type { Confidence } from '../data/type-detect'

type ConfidenceBadgeProps = {
  confidence: Confidence
  className?: string
}

/**
 * Inline indicator next to a column type label.
 *  - high   → renders nothing (silent — engine is authoritative)
 *  - medium → faint italic sage hint ("we think")
 *  - low    → ink-200 border pill with warning-tinted text ("low confidence")
 */
export function ConfidenceBadge({ confidence, className = '' }: ConfidenceBadgeProps) {
  if (confidence === 'high') return null

  if (confidence === 'medium') {
    return (
      <span
        className={`font-serif text-xs italic text-sage-700 ${className}`}
        aria-label="medium confidence"
      >
        we think
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-md border border-ink-200 px-1.5 py-0.5 font-sans text-xs text-warning ${className}`}
      aria-label="low confidence"
    >
      low confidence
    </span>
  )
}
