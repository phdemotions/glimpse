import { useEffect, useRef, useState } from 'react'
import embed from 'vega-embed'
import type { ColumnInfo, Schema } from '../data/schema'
import { getDuckDB } from '../data/duckdb'
import { makeBarSpec } from '../charts/vega'

type ChartViewProps = {
  schema: Schema
}

const CATEGORICAL_TYPES: ColumnInfo['type'][] = ['string', 'date']
const NUMERIC_TYPES: ColumnInfo['type'][] = ['numeric']

export function ChartView({ schema }: ChartViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const categorical = schema.columns.filter((c) => CATEGORICAL_TYPES.includes(c.type))
  const numeric = schema.columns.filter((c) => NUMERIC_TYPES.includes(c.type))

  const [xField, setXField] = useState(categorical[0]?.name ?? '')
  const [yField, setYField] = useState(numeric[0]?.name ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!xField || !yField || !containerRef.current) return
    let cancelled = false

    async function render() {
      try {
        const db = await getDuckDB()
        const conn = await db.connect()
        const result = await conn.query(
          `SELECT "${xField}", "${yField}" FROM "${schema.tableName}" WHERE "${xField}" IS NOT NULL AND "${yField}" IS NOT NULL`,
        )
        await conn.close()
        if (cancelled || !containerRef.current) return
        const rows = result.toArray().map((r) => {
          const out: Record<string, unknown> = {}
          // DuckDB returns BIGINT/HUGEINT as JS BigInt; Vega-Lite cannot consume
          // those (TypeError: Cannot convert a BigInt value to a number). Coerce
          // to Number for chart consumption — precision loss only matters past
          // 2^53, which is not a CP-1 concern.
          out[xField] = coerce(r[xField])
          out[yField] = coerce(r[yField])
          return out
        })
        const spec = makeBarSpec(rows, xField, yField)
        await embed(containerRef.current, spec, {
          actions: false,
          renderer: 'svg',
        })
        setError(null)
      } catch (err) {
        console.error('Chart render failed:', err)
        setError(err instanceof Error ? err.message : 'Could not render chart')
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [xField, yField, schema.tableName])

  if (!xField || !yField) {
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
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <ColumnPicker
          label="x"
          value={xField}
          onChange={setXField}
          options={categorical}
        />
        <ColumnPicker
          label="y"
          value={yField}
          onChange={setYField}
          options={numeric}
        />
      </div>
      <div ref={containerRef} className="w-full" />
      {error ? (
        <p className="mt-4 font-sans text-sm text-danger">{error}</p>
      ) : null}
    </div>
  )
}

function coerce(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value)
  return value
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
