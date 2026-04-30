type WordmarkProps = {
  className?: string
}

export function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span
      className={`font-serif text-xl font-semibold tracking-tight text-ink-900 ${className}`}
    >
      Glimpse<span className="text-sage-700">.</span>
    </span>
  )
}
