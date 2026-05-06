import { useState } from 'react'
import type { ColumnInfo, ColumnType, Schema } from '../data/schema'
import type { ChartChoice } from '../charts/selector'
import type { VegaSpec } from '../charts/vega'
import type { Caption } from '../charts/captions'
import type { Mode } from '../app/reducer'
import { ChartView } from './ChartView'
import { Wordmark } from './ui/Wordmark'
import { ConfidenceBadge } from './ConfidenceBadge'
import { TypeOverrideDropdown } from './TypeOverrideDropdown'
import { ViewSource } from './ViewSource'
import { ModeToggle } from './ModeToggle'
import { InfographicCanvas } from './InfographicCanvas'

type SchemaViewProps = {
  schema: Schema
  fileName: string
  choice: ChartChoice
  caption: Caption
  overrides: Record<string, ColumnType>
  onTypeOverride: (name: string, type: ColumnType) => void
  onReset: () => void
  mode: Mode
  selectedTemplate: string | null
  onModeChange: (mode: Mode) => void
  hasTemplates: boolean
}

const SUBTYPE_LABEL: Record<NonNullable<ColumnInfo['subtype']>, string> = {
  ordinal: 'ordinal',
  likert: 'likert scale',
  geographic: 'geographic',
}

const VISIBLE_COLUMN_LIMIT = 20

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function SchemaView({
  schema,
  fileName,
  choice,
  caption,
  overrides,
  onTypeOverride,
  onReset,
  mode,
  selectedTemplate,
  onModeChange,
  hasTemplates,
}: SchemaViewProps) {
  const [spec, setSpec] = useState<VegaSpec | null>(null)

  const visibleColumns = schema.columns.slice(0, VISIBLE_COLUMN_LIMIT)
  const hiddenColumns = schema.columns.slice(VISIBLE_COLUMN_LIMIT)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 md:px-10 lg:px-16 py-5">
        <div className="max-w-content mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 focus-visible:ring-sage-500 rounded-sm"
          >
            <Wordmark />
          </button>
          <button
            type="button"
            onClick={onReset}
            className="font-sans text-sm text-sage-700 hover:text-sage-800 transition-colors duration-fast"
          >
            ← drop another file
          </button>
        </div>
      </header>
      <hr />

      <main className="flex-1">
        <div className="max-w-content mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-16">
          {/* Title */}
          <div className="mb-8">
            <p className="font-serif text-sm italic text-sage-700">{fileName}</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-semibold text-ink-900 leading-tight">
              {schema.rowCount.toLocaleString()}{' '}
              {schema.rowCount === 1 ? 'row' : 'rows'},{' '}
              {schema.columns.length}{' '}
              {schema.columns.length === 1 ? 'column' : 'columns'}
            </h2>
          </div>

          {/* Mode toggle */}
          <div className="mb-8">
            <ModeToggle
              mode={mode}
              onModeChange={onModeChange}
              hasTemplates={hasTemplates}
            />
          </div>

          {/* Caption + chart */}
          <section className="mb-16">
            <div className="mb-6 max-w-2xl">
              <p className="font-serif text-sm italic text-sage-700">
                {caption.eyebrow}
              </p>
              <p className="mt-2 font-serif text-lg text-ink-700">
                {caption.body}
              </p>
            </div>

            {mode === 'infographic' && selectedTemplate ? (
              <InfographicCanvas>
                <ChartView schema={schema} choice={choice} onSpecBuilt={setSpec} />
              </InfographicCanvas>
            ) : mode === 'infographic' && !selectedTemplate ? (
              <p className="font-serif italic text-sage-700">
                Select a template to get started
              </p>
            ) : (
              <ChartView schema={schema} choice={choice} onSpecBuilt={setSpec} />
            )}

            <ViewSource
              spec={spec}
              reasoning={choice.reasoning}
              caption={caption.body}
            />
          </section>

          {/* Schema */}
          <section className="mb-16">
            <h3 className="mb-4 font-serif text-xl font-semibold text-ink-800">
              Schema
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-left">
                    <th className="py-2 pr-6 font-sans font-medium text-ink-700">
                      Column
                    </th>
                    <th className="py-2 pr-6 font-sans font-medium text-ink-700">
                      Type
                    </th>
                    <th className="py-2 pr-6 font-sans font-medium text-ink-700">
                      Distinct
                    </th>
                    <th className="py-2 pr-6 font-sans font-medium text-ink-700">
                      Nulls
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleColumns.map((col) => (
                    <SchemaRow
                      key={col.name}
                      col={col}
                      override={overrides[col.name]}
                      onOverride={onTypeOverride}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {hiddenColumns.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer font-sans text-sm text-sage-700 hover:text-sage-800 transition-colors duration-fast">
                  show all {schema.columns.length} columns ({hiddenColumns.length} more)
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {hiddenColumns.map((col) => (
                        <SchemaRow
                          key={col.name}
                          col={col}
                          override={overrides[col.name]}
                          onOverride={onTypeOverride}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </section>

          {/* Sample rows */}
          <section>
            <h3 className="mb-4 font-serif text-xl font-semibold text-ink-800">
              First {schema.sampleRows.length} rows
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-left">
                    {schema.columns.map((col) => (
                      <th
                        key={col.name}
                        className="py-2 pr-6 font-sans font-medium text-ink-700"
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schema.sampleRows.map((row, i) => (
                    <tr key={i} className="border-b border-ink-100">
                      {schema.columns.map((col) => (
                        <td
                          key={col.name}
                          className="py-2 pr-6 font-mono text-ink-700 whitespace-nowrap"
                        >
                          {formatCellValue(row[col.name])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

type SchemaRowProps = {
  col: ColumnInfo
  override: ColumnType | undefined
  onOverride: (name: string, type: ColumnType) => void
}

function SchemaRow({ col, override, onOverride }: SchemaRowProps) {
  const effectiveType = override ?? col.type
  const subtypeLabel = col.subtype ? SUBTYPE_LABEL[col.subtype] : null

  return (
    <tr className="border-b border-ink-100">
      <td className="py-2 pr-6 font-mono text-ink-900">{col.name}</td>
      <td className="py-2 pr-6 font-sans text-ink-600">
        <div className="flex flex-wrap items-center gap-2">
          <TypeOverrideDropdown
            columnName={col.name}
            value={effectiveType}
            onChange={onOverride}
          />
          {subtypeLabel ? (
            <span className="font-serif text-xs italic text-ink-500">
              {subtypeLabel}
            </span>
          ) : null}
          <ConfidenceBadge confidence={col.confidence} />
        </div>
      </td>
      <td className="py-2 pr-6 font-mono text-ink-600">
        {col.cardinality.toLocaleString()}
      </td>
      <td className="py-2 pr-6 font-mono text-ink-600">
        {col.nullCount.toLocaleString()}
      </td>
    </tr>
  )
}
