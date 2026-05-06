import { useEffect, useRef, useState } from 'react'
import embed from 'vega-embed'
import type { ColumnInfo, Schema } from '../data/schema'
import { getDuckDB } from '../data/duckdb'
import { coerceRow } from '../data/coerce'
import { binNumericColumn } from '../charts/binning'
import {
  makeBarSpec,
  makeHistogramSpec,
  makeLineSpec,
  makePieSpec,
  makeRankingSpec,
  makeScatterSpec,
  type VegaSpec,
} from '../charts/vega'
import type { ChartChoice } from '../charts/selector'

type ChartViewProps = {
  schema: Schema
  choice: ChartChoice
  /** Reports the live spec back to the parent so ViewSource can mirror it. */
  onSpecBuilt?: (spec: VegaSpec | null) => void
  /** Exposes the rendered SVG element for export. */
  onSvgReady?: (svg: SVGSVGElement | null) => void
}

const CATEGORICAL_TYPES: ColumnInfo['type'][] = ['string', 'date', 'boolean']
const NUMERIC_TYPES: ColumnInfo['type'][] = ['numeric']

export function ChartView({ schema, choice, onSpecBuilt, onSvgReady }: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Manual picker state — only surfaces when the auto-selector returns 'none'.
  const categorical = schema.columns.filter((c) => CATEGORICAL_TYPES.includes(c.type))
  const numeric = schema.columns.filter((c) => NUMERIC_TYPES.includes(c.type))
  const [manualX, setManualX] = useState(categorical[0]?.name ?? '')
  const [manualY, setManualY] = useState(numeric[0]?.name ?? '')

  const isNone = choice.kind === 'none'
  const xField = isNone ? manualX : choice.xField
  const yField = isNone ? manualY : choice.yField
  const effectiveKind = isNone && manualX && manualY ? 'bar' : choice.kind

  useEffect(() => {
    if (!containerRef.current) return
    if (effectiveKind === 'none') {
      onSpecBuilt?.(null)
      onSvgReady?.(null)
      return
    }
    let cancelled = false

    async function render() {
      try {
        let spec: VegaSpec

        if (effectiveKind === 'histogram') {
          if (!xField) return
          const bins = await binNumericColumn(schema.tableName, xField)
          spec = makeHistogramSpec(bins, xField)
        } else {
          if (!xField || !yField) return
          const db = await getDuckDB()
          const conn = await db.connect()
          const result = await conn.query(
            `SELECT "${xField}", "${yField}" FROM "${schema.tableName}" WHERE "${xField}" IS NOT NULL AND "${yField}" IS NOT NULL`,
          )
          const rows = result
            .toArray()
            .map((r) => coerceRow(r as Record<string, unknown>))
          await conn.close()

          switch (effectiveKind) {
            case 'line': {
              const xCol = schema.columns.find((c) => c.name === xField)
              // Temporal axis only when the date column is high-confidence ISO.
              // US-format dates render cleaner as nominal.
              const temporal =
                xCol?.type === 'date' && xCol.confidence === 'high'
              spec = makeLineSpec(rows, xField, yField, { temporal })
              break
            }
            case 'scatter':
              spec = makeScatterSpec(rows, xField, yField)
              break
            case 'pie':
              spec = makePieSpec(rows, xField, yField)
              break
            case 'ranking':
              spec = makeRankingSpec(rows, xField, yField, choice.limit ?? 10)
              break
            case 'bar':
            default:
              spec = makeBarSpec(rows, xField, yField)
          }
        }

        if (cancelled || !containerRef.current) return
        await embed(containerRef.current, spec, {
          actions: false,
          renderer: 'svg',
        })
        if (!cancelled) {
          onSpecBuilt?.(spec)
          onSvgReady?.(containerRef.current?.querySelector('svg') ?? null)
          setError(null)
        }
      } catch (err) {
        console.error('Chart render failed:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not render chart')
          onSpecBuilt?.(null)
          onSvgReady?.(null)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [
    schema.tableName,
    schema.columns,
    effectiveKind,
    xField,
    yField,
    choice.limit,
    onSpecBuilt,
    onSvgReady,
  ])

  // 'none' kind without enough columns to even offer a manual picker.
  if (isNone && (!categorical.length || !numeric.length)) {
    return (
      <div className="rounded-md border border-ink-200 bg-stone-50 px-6 py-12 text-center">
        <p className="font-serif text-lg text-ink-700">No chart yet</p>
        <p className="mt-2 font-sans text-sm text-ink-500">
          {!categorical.length
            ? 'Need at least one text or date column for the X axis.'
            : 'Need at least one numeric column for the Y axis.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {isNone ? (
        <div className="mb-6 flex flex-wrap items-end gap-6">
          <ColumnPicker
            label="x"
            value={manualX}
            onChange={setManualX}
            options={categorical}
          />
          <ColumnPicker
            label="y"
            value={manualY}
            onChange={setManualY}
            options={numeric}
          />
        </div>
      ) : null}
      <div ref={containerRef} className="w-full" />
      {error ? (
        <p className="mt-4 font-sans text-sm text-danger">{error}</p>
      ) : null}
    </div>
  )
}

type ColumnPickerProps = {
  label: string
  value: string
  onChange: (v: string) => void
  options: ColumnInfo[]
}

function ColumnPicker({ label, value, onChange, options }: ColumnPickerProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-serif text-sm italic text-sage-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-ink-200 bg-white px-3 py-2 font-sans text-sm text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500"
      >
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  )
}
