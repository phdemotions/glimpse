/**
 * Excel (.xlsx) parser. Lazy-loads SheetJS only when called so users who never
 * upload Excel pay zero bundle cost. Reads with `cellDates: true` so date
 * cells surface as JS Date objects rather than Excel serial numbers, then
 * exposes per-sheet CSV strings for the existing DuckDB `read_csv_auto`
 * ingest path. Privacy stance: SheetJS runs entirely in the browser; no
 * network calls during parse.
 */

export type SheetMeta = {
  name: string
  rowCount: number
  columnCount: number
}

export type ParsedWorkbook = {
  sheets: SheetMeta[]
  getSheetCsv(name: string): string
}

const ERROR_PARSE = 'Failed to parse Excel workbook'
const ERROR_EMPTY = 'Excel workbook is empty'
const ERROR_SHEET_MISSING = 'Sheet not found in workbook'

type XlsxModule = typeof import('xlsx')

async function loadXlsx(): Promise<XlsxModule> {
  return await import('xlsx')
}

function sheetDimensions(
  XLSX: XlsxModule,
  worksheet: import('xlsx').WorkSheet,
): { rowCount: number; columnCount: number } {
  const ref = worksheet['!ref']
  if (!ref) return { rowCount: 0, columnCount: 0 }
  const range = XLSX.utils.decode_range(ref)
  const rows = range.e.r - range.s.r + 1
  const cols = range.e.c - range.s.c + 1
  // Header row (row 0) is metadata, not data — exclude from rowCount so the
  // SchemaView header reads "12 rows" not "13 rows" for a 12-record table.
  const dataRows = Math.max(0, rows - 1)
  return { rowCount: dataRows, columnCount: cols }
}

/**
 * Parse an .xlsx File into a metadata view + per-sheet CSV accessor. Empty
 * sheets (no `!ref` or zero data rows) are filtered out so callers cannot
 * select a sheet that would produce a zero-row CSV. Throws if the workbook
 * contains no usable sheets.
 */
function isXlsxZipSignature(bytes: Uint8Array): boolean {
  // .xlsx files are zip archives. Every zip starts with the 'PK' signature
  // (0x50 0x4B) followed by 0x03 0x04 (local file header), 0x05 0x06 (empty
  // archive end-of-directory), or 0x07 0x08 (spanned archive). Anything else
  // is not a zip and cannot be a valid xlsx.
  if (bytes.length < 4) return false
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false
  const tail = (bytes[2] << 8) | bytes[3]
  return tail === 0x0304 || tail === 0x0506 || tail === 0x0708
}

export async function parseWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (!isXlsxZipSignature(bytes)) {
    throw new Error(`${ERROR_PARSE}: not a valid Excel file`)
  }

  const XLSX = await loadXlsx()

  let workbook: import('xlsx').WorkBook
  try {
    workbook = XLSX.read(bytes, {
      type: 'array',
      cellDates: true,
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`${ERROR_PARSE}: ${reason}`)
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error(`${ERROR_PARSE}: no sheets found`)
  }

  const allSheets: SheetMeta[] = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name]
    const { rowCount, columnCount } = sheetDimensions(XLSX, ws)
    return { name, rowCount, columnCount }
  })

  const sheets = allSheets.filter((s) => s.rowCount > 0 && s.columnCount > 0)
  if (sheets.length === 0) {
    throw new Error(ERROR_EMPTY)
  }

  return {
    sheets,
    getSheetCsv(name: string): string {
      const ws = workbook.Sheets[name]
      if (!ws) {
        throw new Error(`${ERROR_SHEET_MISSING}: "${name}"`)
      }
      // SheetJS's default date format is "m/d/yy", and sheet_to_csv's various
      // format options ignore that default in stubborn ways across cell-type
      // combinations. Bypass the formatter entirely: rewrite Date-valued
      // cells to ISO strings before serialization. type-detect.ts then
      // classifies the column as high-confidence date downstream.
      for (const addr of Object.keys(ws)) {
        if (addr.startsWith('!')) continue
        const cell = (ws as Record<string, import('xlsx').CellObject>)[addr]
        if (cell && cell.v instanceof Date) {
          const iso = cell.v.toISOString().slice(0, 10)
          cell.v = iso
          cell.w = iso
          cell.t = 's'
        }
      }
      return XLSX.utils.sheet_to_csv(ws, { blankrows: false })
    },
  }
}

export const XLSX_ERRORS = {
  PARSE: ERROR_PARSE,
  EMPTY: ERROR_EMPTY,
  SHEET_MISSING: ERROR_SHEET_MISSING,
} as const
