import type { AsyncDuckDB, AsyncDuckDBConnection } from '@duckdb/duckdb-wasm'
import * as duckdb from '@duckdb/duckdb-wasm'
import { getDuckDB } from './duckdb'
import { parseWorkbook, type ParsedWorkbook, type SheetMeta } from './xlsx'

const TABLE_NAME = 'glimpse'

export type WorkbookHandle = {
  sheets: SheetMeta[]
  activeSheet: string
  parsed: ParsedWorkbook
}

export type IngestResult = {
  tableName: string
  rowCount: number
  fileName: string
  /** Present only for .xlsx uploads. Lets the UI swap sheets without re-parsing. */
  workbook?: WorkbookHandle
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''")
}

async function rowCountOf(conn: AsyncDuckDBConnection): Promise<number> {
  const result = await conn.query(
    `SELECT COUNT(*)::INT AS c FROM "${TABLE_NAME}"`,
  )
  const row = result.toArray()[0] as { c: number }
  return row.c
}

async function ingestCsvText(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  csvText: string,
  virtualName: string,
): Promise<number> {
  const buffer = new TextEncoder().encode(csvText)
  await db.registerFileBuffer(virtualName, buffer)
  const safe = escapeSqlLiteral(virtualName)
  await conn.query(
    `CREATE OR REPLACE TABLE "${TABLE_NAME}" AS SELECT * FROM read_csv_auto('${safe}')`,
  )
  return rowCountOf(conn)
}

async function ingestTabularFile(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  file: File,
  reader: 'read_csv_auto' | 'read_json_auto',
): Promise<number> {
  await db.registerFileHandle(
    file.name,
    file,
    duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
    true,
  )
  const safe = escapeSqlLiteral(file.name)
  await conn.query(
    `CREATE OR REPLACE TABLE "${TABLE_NAME}" AS SELECT * FROM ${reader}('${safe}')`,
  )
  return rowCountOf(conn)
}

async function ingestActiveSheet(
  db: AsyncDuckDB,
  conn: AsyncDuckDBConnection,
  parsed: ParsedWorkbook,
  sheetName: string,
  fileName: string,
): Promise<number> {
  const csv = parsed.getSheetCsv(sheetName)
  const virtualName = `${fileName}::${sheetName}.csv`
  return ingestCsvText(db, conn, csv, virtualName)
}

/**
 * Ingest a user-supplied tabular file into DuckDB-WASM under the well-known
 * `glimpse` table name. Supports CSV, JSON, and XLSX. CSV/JSON stream straight
 * into DuckDB via BROWSER_FILEREADER; XLSX is parsed in JS (lazy-loaded
 * SheetJS) and bridged into the same DuckDB read path as a CSV string. The
 * existing `glimpse` table is replaced on every call.
 */
export async function ingestFile(file: File): Promise<IngestResult> {
  const ext = getExtension(file.name)
  if (ext !== 'csv' && ext !== 'json' && ext !== 'xlsx') {
    throw new Error(`Unsupported file type: ${ext || '(no extension)'}`)
  }

  // For xlsx, parse first so a corrupt or empty workbook fails fast without
  // opening a DuckDB connection.
  let parsed: ParsedWorkbook | null = null
  let activeSheet: string | null = null
  if (ext === 'xlsx') {
    parsed = await parseWorkbook(file)
    activeSheet = parsed.sheets[0].name
  }

  const db = await getDuckDB()
  const conn = await db.connect()

  try {
    if (parsed && activeSheet) {
      const rowCount = await ingestActiveSheet(
        db,
        conn,
        parsed,
        activeSheet,
        file.name,
      )
      return {
        tableName: TABLE_NAME,
        rowCount,
        fileName: file.name,
        workbook: { sheets: parsed.sheets, activeSheet, parsed },
      }
    }

    const reader = ext === 'csv' ? 'read_csv_auto' : 'read_json_auto'
    const rowCount = await ingestTabularFile(db, conn, file, reader)
    return { tableName: TABLE_NAME, rowCount, fileName: file.name }
  } finally {
    await conn.close()
  }
}

/**
 * Swap the active sheet of a previously parsed workbook into the `glimpse`
 * table. Used by the SheetSwitcher (Unit 4) so changing sheets does not
 * re-read the source file.
 */
export async function ingestWorkbookSheet(
  parsed: ParsedWorkbook,
  sheetName: string,
  fileName: string,
): Promise<IngestResult> {
  const sheet = parsed.sheets.find((s) => s.name === sheetName)
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`)
  }

  const db = await getDuckDB()
  const conn = await db.connect()
  try {
    const rowCount = await ingestActiveSheet(db, conn, parsed, sheetName, fileName)
    return {
      tableName: TABLE_NAME,
      rowCount,
      fileName,
      workbook: { sheets: parsed.sheets, activeSheet: sheetName, parsed },
    }
  } finally {
    await conn.close()
  }
}
