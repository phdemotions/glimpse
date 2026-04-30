import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-sage-700 text-stone-50 hover:bg-sage-800 focus-visible:ring-sage-500',
  secondary:
    'bg-transparent text-ink-800 border border-ink-200 hover:bg-sage-50 hover:border-ink-300 focus-visible:ring-sage-500',
  ghost:
    'bg-transparent text-sage-700 hover:bg-sage-50 hover:text-sage-800 focus-visible:ring-sage-500',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center',
        'px-4 py-2 rounded-md',
        'font-sans text-sm font-medium',
        'transition-colors duration-fast',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...props}
    />
  )
}
