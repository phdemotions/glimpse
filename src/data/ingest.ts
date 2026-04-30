import * as duckdb from '@duckdb/duckdb-wasm'
import { getDuckDB } from './duckdb'

const TABLE_NAME = 'glimpse'

export type IngestResult = {
  tableName: string
  rowCount: number
  fileName: string
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

/**
 * Ingest a user-supplied CSV or JSON file into DuckDB-WASM under the
 * well-known table name. Uses BROWSER_FILEREADER so the file is streamed
 * without copying the full bytes into the WASM heap. Replaces any existing
 * dataset on each call. Excel parsing is deferred to CP-2 per CP-1 risk note.
 */
export async function ingestFile(file: File): Promise<IngestResult> {
  const ext = getExtension(file.name)
  if (ext !== 'csv' && ext !== 'json') {
    throw new Error(`Unsupported file type: ${ext || '(no extension)'}`)
  }

  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    await db.registerFileHandle(
      file.name,
      file,
      duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    )

    const reader = ext === 'csv' ? 'read_csv_auto' : 'read_json_auto'
    const safeName = file.name.replace(/'/g, "''")
    await conn.query(
      `CREATE OR REPLACE TABLE "${TABLE_NAME}" AS SELECT * FROM ${reader}('${safeName}')`,
    )

    const result = await conn.query(
      `SELECT COUNT(*)::INT AS c FROM "${TABLE_NAME}"`,
    )
    const row = result.toArray()[0] as { c: number }

    return { tableName: TABLE_NAME, rowCount: row.c, fileName: file.name }
  } finally {
    await conn.close()
  }
}
