import { getDuckDB } from './duckdb'
import { toJsValue } from './coerce'

export type SampleMap = Record<string, unknown[]>

/**
 * Pure transpose helper — given a row-oriented sample, return a
 * column-oriented map of up to `perColumn` non-null values per column.
 * Extracted from the DB wrapper so the column-shaping logic is unit-testable
 * without mocking DuckDB-WASM.
 */
export function transposeRows(
  rows: ReadonlyArray<Record<string, unknown>>,
  columnNames: ReadonlyArray<string>,
  perColumn = 50,
): SampleMap {
  const out: SampleMap = Object.fromEntries(
    columnNames.map((name) => [name, [] as unknown[]]),
  )

  for (const row of rows) {
    let stillCollecting = false
    for (const col of columnNames) {
      const bucket = out[col]
      if (bucket.length >= perColumn) continue
      stillCollecting = true
      const raw = row[col]
      if (raw === null || raw === undefined) continue
      bucket.push(toJsValue(raw))
    }
    // Optional: stop early when every bucket is full.
    if (!stillCollecting) break
  }
  return out
}

/**
 * Fetch up to `perColumn` non-null sample values for every named column using
 * a single batched DuckDB query (one round trip, one table scan capped by
 * `sampleSize`). Returns a column-oriented map ready for type detection.
 *
 * Why batched: the doc-review found that running one DuckDB query per column
 * would breach CP-1's sub-1s schema budget on wide datasets (100 columns ×
 * round-trip latency). One bounded scan + client-side transpose keeps wall
 * time flat regardless of column count.
 */
export async function getSampleRows(
  tableName: string,
  columnNames: string[],
  perColumn = 50,
  sampleSize = 200,
): Promise<SampleMap> {
  if (columnNames.length === 0) {
    return {}
  }

  const db = await getDuckDB()
  const conn = await db.connect()
  try {
    const result = await conn.query(
      `SELECT * FROM "${tableName}" LIMIT ${sampleSize}`,
    )
    const rows = result.toArray() as Record<string, unknown>[]
    return transposeRows(rows, columnNames, perColumn)
  } finally {
    await conn.close()
  }
}
