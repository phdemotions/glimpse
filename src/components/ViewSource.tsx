import { useState } from 'react'
import type { VegaSpec } from '../charts/vega'
import { Eyebrow } from './ui/Eyebrow'

type ViewSourceProps = {
  spec: VegaSpec | null
  reasoning: string
  caption: string
}

/**
 * Disclosure that exposes the active Vega-Lite spec JSON and the plain-English
 * reasoning behind the chart selection. Closed by default (PLAN.md Decision
 * #13). Native `<details>` for keyboard accessibility.
 *
 * Two-column layout above 768px (md+); stacked below.
 *
 * Designed to be reused in CP-3 for templates without modification — the
 * contract is spec-agnostic.
 */
export function ViewSource({ spec, reasoning, caption }: ViewSourceProps) {
  const [copied, setCopied] = useState(false)

  if (!spec) return null

  const json = JSON.stringify(spec, null, 2)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — fail silently.
    }
  }

  return (
    <details className="group mt-12 border-t border-ink-200 pt-6">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-3">
        <span className="h-px w-8 bg-sage-300" aria-hidden="true" />
        <span className="font-serif text-sm italic text-sage-700">
          show the spec
        </span>
        <span className="h-px w-8 bg-sage-300" aria-hidden="true" />
      </summary>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Why this chart */}
        <section>
          <Eyebrow>why this chart</Eyebrow>
          <p className="mt-4 font-serif text-base text-ink-800 leading-relaxed">
            {caption}
          </p>
          {reasoning && reasoning !== caption ? (
            <p className="mt-3 font-serif text-sm text-ink-600 leading-relaxed">
              {reasoning}
            </p>
          ) : null}
        </section>

        {/* The spec */}
        <section>
          <div className="flex items-center justify-between">
            <Eyebrow>the spec</Eyebrow>
            <button
              type="button"
              onClick={copy}
              className="font-sans text-xs text-sage-700 hover:text-sage-800 transition-colors duration-fast"
            >
              {copied ? 'copied' : 'copy spec'}
            </button>
          </div>
          <pre className="mt-4 max-h-96 overflow-auto rounded-md border border-ink-200 bg-white p-4 font-mono text-xs leading-relaxed text-ink-800">
            {json}
          </pre>
        </section>
      </div>
    </details>
  )
}
