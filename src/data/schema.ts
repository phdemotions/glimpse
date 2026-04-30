import { getDuckDB } from './duckdb'

export type ColumnType = 'numeric' | 'string' | 'date' | 'boolean' | 'unknown'

export type ColumnInfo = {
  name: string
  duckdbType: string
  type: ColumnType
  nullCount: number
  cardinality: number
}

export type Schema = {
  tableName: string
  rowCount: number
  columns: ColumnInfo[]
  sampleRows: Record<string, unknown>[]
}

function classifyType(duckdbType: string): ColumnType {
  const t = duckdbType.toUpperCase()
  if (
    t.includes('INT') ||
    t.includes('DECIMAL') ||
    t.includes('FLOAT') ||
    t.includes('DOUBLE') ||
    t.includes('NUMERIC') ||
    t.includes('REAL') ||
    t.includes('BIGINT')
  )
    return 'numeric'
  if (t.includes('DATE') || t.includes('TIMESTAMP') || t.includes('TIME'))
    return 'date'
  if (t.includes('BOOL')) return 'boolean'
  if (t.includes('VARCHAR') || t === 'TEXT' || t === 'STRING') return 'string'
  return 'unknown'
}

/**
 * Inspect a table that ingest.ts has already populated and return a stable
 * schema descriptor: per-column DuckDB type + classification, row count,
 * cardinality, null count, plus the first N rows for preview. CP-2 will
 * extend this to feed auto-chart selection.
 */
export async function getSchema(
  tableName: string,
  sampleSize = 10,
): Promise<Schema> {
  const db = await getDuckDB()
  const conn = await db.connect()
  try {
    const desc = await conn.query(`DESCRIBE "${tableName}"`)
    const descRows = desc.toArray() as Array<{
      column_name: string
      column_type: string
    }>

    const countRes = await conn.query(
      `SELECT COUNT(*)::INT AS c FROM "${tableName}"`,
    )
    const rowCount = (countRes.toArray()[0] as { c: number }).c

    const columns: ColumnInfo[] = []
    for (const r of descRows) {
      const stats = await conn.query(
        `SELECT
          COUNT(*) FILTER (WHERE "${r.column_name}" IS NULL)::INT AS nulls,
          COUNT(DISTINCT "${r.column_name}")::INT AS cardinality
         FROM "${tableName}"`,
      )
      const s = stats.toArray()[0] as { nulls: number; cardinality: number }
      columns.push({
        name: r.column_name,
        duckdbType: r.column_type,
        type: classifyType(r.column_type),
        nullCount: s.nulls,
        cardinality: s.cardinality,
      })
    }

    const sample = await conn.query(
      `SELECT * FROM "${tableName}" LIMIT ${sampleSize}`,
    )
    const sampleRows = sample.toArray().map((row) => {
      const obj: Record<string, unknown> = {}
      for (const col of descRows) {
        obj[col.column_name] = row[col.column_name]
      }
      return obj
    })

    return { tableName, rowCount, columns, sampleRows }
  } finally {
    await conn.close()
  }
}
