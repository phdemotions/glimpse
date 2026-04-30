import { useState } from 'react'
import { Eyebrow } from './ui/Eyebrow'

/**
 * Shown in place of the upload affordance on viewports narrower than 768px
 * (per PLAN.md Decision #26). Editing on phones is intentionally not supported
 * in v1 — DuckDB-WASM + Vega-Lite together are the wrong cost on mobile.
 */
export function MobileSoftBlock() {
  const [copied, setCopied] = useState(false)

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — fail silently.
    }
  }

  return (
    <div className="rounded-md border border-ink-200 bg-white px-6 py-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Eyebrow>on a wider screen</Eyebrow>
        <p className="font-serif text-base text-ink-800">
          Glimpse works best on desktop. Open this page on your computer to
          upload data and build infographics.
        </p>
        <button
          onClick={copyURL}
          className="font-sans text-sm text-sage-700 hover:text-sage-800 transition-colors duration-fast underline-offset-4 hover:underline"
        >
          {copied ? 'Copied' : 'Copy this URL'}
        </button>
      </div>
    </div>
  )
}
