import type { ColumnInfo, Schema } from '../data/schema'
import { ChartView } from './ChartView'
import { Wordmark } from './ui/Wordmark'

type SchemaViewProps = {
  schema: Schema
  fileName: string
  onReset: () => void
}

const TYPE_LABEL: Record<ColumnInfo['type'], string> = {
  numeric: 'numeric',
  string: 'text',
  date: 'date',
  boolean: 'true/false',
  unknown: 'unknown',
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function SchemaView({ schema, fileName, onReset }: SchemaViewProps) {
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
          <div className="mb-12">
            <p className="font-serif text-sm italic text-sage-700">{fileName}</p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl font-semibold text-ink-900 leading-tight">
              {schema.rowCount.toLocaleString()}{' '}
              {schema.rowCount === 1 ? 'row' : 'rows'},{' '}
              {schema.columns.length}{' '}
              {schema.columns.length === 1 ? 'column' : 'columns'}
            </h2>
          </div>

          {/* Chart */}
          <section className="mb-16">
            <ChartView schema={schema} />
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
                  {schema.columns.map((col) => (
                    <tr key={col.name} className="border-b border-ink-100">
                      <td className="py-2 pr-6 font-mono text-ink-900">
                        {col.name}
                      </td>
                      <td className="py-2 pr-6 font-sans text-ink-600">
                        {TYPE_LABEL[col.type]}
                      </td>
                      <td className="py-2 pr-6 font-mono text-ink-600">
                        {col.cardinality.toLocaleString()}
                      </td>
                      <td className="py-2 pr-6 font-mono text-ink-600">
                        {col.nullCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
