import { useEffect, useRef, useState } from 'react'
import embed from 'vega-embed'
import type { Schema } from '../data/schema'
import type { Template } from '../templates/types'
import type { VegaSpec } from '../charts/vega'
import { getDuckDB } from '../data/duckdb'
import { coerceRow } from '../data/coerce'
import { wrapWithFrame, type Frame } from '../charts/infographic-frame'
import { InfographicCanvas } from './InfographicCanvas'

type Props = {
  schema: Schema
  template: Template
  fileName: string
  onSpecBuilt?: (spec: VegaSpec | null) => void
  onSvgReady?: (svg: SVGSVGElement | null) => void
  onFrameBuilt?: (frame: Frame | null) => void
}

export function InfographicView({ schema, template, fileName, onSpecBuilt, onSvgReady, onFrameBuilt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    async function render() {
      try {
        const db = await getDuckDB()
        const conn = await db.connect()
        const result = await conn.query(
          `SELECT * FROM "${schema.tableName}"`,
        )
        const rows = result
          .toArray()
          .map((r) => coerceRow(r as Record<string, unknown>))
        await conn.close()

        const prepared = template.dataPrep
          ? (template.dataPrep(rows, schema.columns) as Record<string, unknown>[])
          : rows

        const chartSpec = template.specBuilder(prepared, schema.columns)
        const frame = template.frameFor(schema.columns, fileName, prepared)
        const spec = wrapWithFrame(chartSpec, frame)

        if (cancelled || !containerRef.current) return
        await embed(containerRef.current, spec, {
          actions: false,
          renderer: 'svg',
        })
        if (!cancelled) {
          onSpecBuilt?.(spec)
          onSvgReady?.(containerRef.current?.querySelector('svg') ?? null)
          onFrameBuilt?.(frame)
          setError(null)
        }
      } catch (err) {
        console.error('Infographic render failed:', err)
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not render infographic',
          )
          onSpecBuilt?.(null)
          onSvgReady?.(null)
          onFrameBuilt?.(null)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [schema.tableName, schema.columns, template, fileName, onSpecBuilt, onSvgReady, onFrameBuilt])

  return (
    <InfographicCanvas>
      <div ref={containerRef} className="w-full h-full" />
      {error ? (
        <p className="mt-4 font-sans text-sm text-danger">{error}</p>
      ) : null}
    </InfographicCanvas>
  )
}
