import type { ReactNode } from 'react'

type EyebrowProps = {
  children: ReactNode
  className?: string
}

/**
 * Family-signature label — italic lowercase sage with hairline flanks.
 * Use to ground sections, never as a heading replacement.
 */
export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <p
      className={`flex items-center justify-center gap-3 text-sm italic text-sage-700 ${className}`}
    >
      <span className="h-px w-8 bg-sage-300" aria-hidden="true" />
      <span className="lowercase">{children}</span>
      <span className="h-px w-8 bg-sage-300" aria-hidden="true" />
    </p>
  )
}
