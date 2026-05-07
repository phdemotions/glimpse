import type { ReactNode } from 'react'

type InfographicCanvasProps = {
  children: ReactNode
}

/**
 * Visual frame for an Infographic-mode export at 1200×675 — also the social-
 * share aspect every template's spec is sized to. The `[&_svg]` selector
 * scales the embedded Vega-Lite SVG to fit the canvas so the in-spec frame
 * (eyebrow / headline / takeaway / source / wordmark layers) stay visible at
 * narrower viewports rather than being clipped by `overflow-hidden`.
 */
export function InfographicCanvas({ children }: InfographicCanvasProps) {
  return (
    <div
      className="w-full mx-auto bg-white border border-ink-200 rounded-md overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:block"
      style={{
        maxWidth: '1200px',
        aspectRatio: '1200 / 675',
      }}
      data-testid="infographic-canvas"
    >
      {children}
    </div>
  )
}
