import { getDuckDB } from './duckdb'
import { getSampleRows } from './sample-rows'
import {
  detectDateConfidence,
  detectGeographic,
  detectOrdinalLikert,
  type Confidence,
  type Subtype,
} from './type-detect'

export type ColumnType = 'numeric' | 'string' | 'date' | 'boolean' | 'unknown'

export type ColumnInfo = {
  name: string
  duckdbType: string
  type: ColumnType
  subtype: Subtype
  confidence: Confidence
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
 * Combine the base classification with sample-driven detectors. CP-2's
 * additions: subtype (ordinal/likert/geographic) + 3-tier confidence. The
 * date detector can also *upgrade* a string column to date when the values
 * look like dates even though DuckDB inferred VARCHAR.
 */
function refineColumn(
  baseType: ColumnType,
  name: string,
  samples: unknown[],
  cardinality: number,
  totalNonNull: number,
): { type: ColumnType; subtype: Subtype; confidence: Confidence } {
  // Native DuckDB date/timestamp columns: trust the engine.
  if (baseType === 'date') {
    return { type: 'date', subtype: null, confidence: 'high' }
  }

  // String columns may actually be dates parsed-as-strings, ordinal scales,
  // or geographic columns. Run detectors in priority order.
  if (baseType === 'string') {
    const dateDetection = detectDateConfidence(samples)
    if (dateDetection) {
      return {
        type: 'date',
        subtype: null,
        confidence: dateDetection.confidence,
      }
    }
    const ordinal = detectOrdinalLikert(samples, cardinality, totalNonNull)
    if (ordinal) {
      return {
        type: 'string',
        subtype: ordinal.subtype,
        confidence: ordinal.confidence,
      }
    }
    const geo = detectGeographic(name, samples)
    if (geo) {
      return {
        type: 'string',
        subtype: geo.subtype,
        confidence: geo.confidence,
      }
    }
    return { type: 'string', subtype: null, confidence: 'high' }
  }

  // Numeric / boolean / unknown: pass through with high confidence (engine
  // is authoritative for these types).
  return { type: baseType, subtype: null, confidence: 'high' }
}

/**
 * Inspect a table that ingest.ts has already populated and return a stable
 * schema descriptor: per-column DuckDB type + classification, row count,
 * cardinality, null count, plus the first N rows for preview.
 *
 * CP-2 extends each column with `subtype` and `confidence` from sample-based
 * detectors. Sample fetch is batched into a single DuckDB scan via
 * `getSampleRows`, keeping the schema build under CP-1's sub-1s budget even
 * on wide datasets.
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

    const baseColumns: Array<
      Omit<ColumnInfo, 'subtype' | 'confidence'>
    > = []
    for (const r of descRows) {
      const stats = await conn.query(
        `SELECT
          COUNT(*) FILTER (WHERE "${r.column_name}" IS NULL)::INT AS nulls,
          COUNT(DISTINCT "${r.column_name}")::INT AS cardinality
         FROM "${tableName}"`,
      )
      const s = stats.toArray()[0] as { nulls: number; cardinality: number }
      baseColumns.push({
        name: r.column_name,
        duckdbType: r.column_type,
        type: classifyType(r.column_type),
        nullCount: s.nulls,
        cardinality: s.cardinality,
      })
    }

    const columnNames = baseColumns.map((c) => c.name)
    const samples = await getSampleRows(tableName, columnNames)

    const columns: ColumnInfo[] = baseColumns.map((c) => {
      const colSamples = samples[c.name] ?? []
      const totalNonNull = rowCount - c.nullCount
      const refined = refineColumn(
        c.type,
        c.name,
        colSamples,
        c.cardinality,
        totalNonNull,
      )
      return {
        ...c,
        type: refined.type,
        subtype: refined.subtype,
        confidence: refined.confidence,
      }
    })

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
