import { useState, type RefObject } from 'react'
import type { VegaSpec } from '../charts/vega'
import { downloadSvg, downloadPng, downloadJson } from '../charts/export'

type Props = {
  svgRef: RefObject<SVGSVGElement | null>
  spec: VegaSpec | null
  filename: string
  dimensions?: { width: number; height: number }
}

const QUICK_DIMENSIONS = { width: 800, height: 400 }
const INFOGRAPHIC_DIMENSIONS = { width: 1200, height: 675 }

function resolveDimensions(
  svgEl: SVGSVGElement | null,
  explicit?: { width: number; height: number },
): { width: number; height: number } {
  if (explicit) return explicit

  if (svgEl) {
    const viewBox = svgEl.getAttribute('viewBox')
    if (viewBox) {
      const parts = viewBox.split(/[\s,]+/)
      const w = Number(parts[2])
      const h = Number(parts[3])
      if (w > 0 && h > 0) return { width: w, height: h }
    }
  }

  return QUICK_DIMENSIONS
}

export { INFOGRAPHIC_DIMENSIONS }

export function ExportPanel({ svgRef, spec, filename, dimensions }: Props) {
  const [pngPending, setPngPending] = useState(false)

  const svgEl = svgRef.current
  const disabled = !svgEl || !spec

  const handleSvg = async () => {
    if (!svgEl) return
    await downloadSvg(svgEl, `${filename}.svg`)
  }

  const handlePng = async () => {
    if (!svgEl) return
    setPngPending(true)
    try {
      const dims = resolveDimensions(svgEl, dimensions)
      await downloadPng(svgEl, dims, `${filename}.png`)
    } finally {
      setPngPending(false)
    }
  }

  const handleJson = () => {
    if (!spec) return
    downloadJson(spec, `${filename}.json`)
  }

  const btnClass = [
    'font-sans text-sm',
    'px-3 py-1.5 rounded-md',
    'border border-ink-200',
    'transition-colors duration-fast',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ')

  const enabledClass = 'text-sage-700 hover:text-sage-800 hover:bg-sage-50'
  const disabledClass = 'text-ink-400'

  return (
    <div className="flex items-center gap-3 mt-6" data-testid="export-panel">
      <button
        type="button"
        onClick={handleSvg}
        disabled={disabled}
        className={`${btnClass} ${disabled ? disabledClass : enabledClass}`}
      >
        SVG
      </button>
      <button
        type="button"
        onClick={handlePng}
        disabled={disabled || pngPending}
        className={`${btnClass} ${disabled || pngPending ? disabledClass : enabledClass}`}
      >
        {pngPending ? 'Rendering…' : 'PNG'}
      </button>
      <button
        type="button"
        onClick={handleJson}
        disabled={!spec}
        className={`${btnClass} ${!spec ? disabledClass : enabledClass}`}
      >
        JSON
      </button>
    </div>
  )
}
