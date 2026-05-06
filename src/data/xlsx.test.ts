import { describe, expect, it } from 'vitest'
import { parseWorkbook, XLSX_ERRORS } from './xlsx'

type SheetSpec = { name: string; rows: unknown[][] }

async function buildWorkbookFile(sheets: SheetSpec[], fileName = 'test.xlsx'): Promise<File> {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(rows, { cellDates: true })
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  const buf = XLSX.write(wb, {
    type: 'array',
    bookType: 'xlsx',
    cellDates: true,
  }) as Uint8Array
  // Copy into a fresh ArrayBuffer-backed Uint8Array so TS does not complain
  // about Uint8Array<ArrayBufferLike> vs Uint8Array<ArrayBuffer> on File.
  const bufCopy = new Uint8Array(buf.byteLength)
  bufCopy.set(buf)
  return new File([bufCopy], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseWorkbook', () => {
  it('parses a single-sheet workbook with expected row/column counts', async () => {
    const file = await buildWorkbookFile([
      {
        name: 'Survey',
        rows: [
          ['role', 'respondents'],
          ['student', 12],
          ['faculty', 5],
          ['admin', 3],
        ],
      },
    ])

    const wb = await parseWorkbook(file)

    expect(wb.sheets).toHaveLength(1)
    expect(wb.sheets[0]).toEqual({
      name: 'Survey',
      rowCount: 3, // header excluded
      columnCount: 2,
    })
  })

  it('parses a three-sheet workbook in source order', async () => {
    const file = await buildWorkbookFile([
      { name: 'Q1', rows: [['month', 'rev'], ['Jan', 100], ['Feb', 110]] },
      { name: 'Q2', rows: [['month', 'rev'], ['Apr', 130], ['May', 140]] },
      { name: 'Q3', rows: [['month', 'rev'], ['Jul', 160], ['Aug', 170]] },
    ])

    const wb = await parseWorkbook(file)

    expect(wb.sheets.map((s) => s.name)).toEqual(['Q1', 'Q2', 'Q3'])
    expect(wb.sheets[0].rowCount).toBe(2)
    expect(wb.sheets[0].columnCount).toBe(2)
  })

  it('round-trips a sheet to CSV with header + data rows in source order', async () => {
    const file = await buildWorkbookFile([
      {
        name: 'Data',
        rows: [
          ['country', 'population'],
          ['Canada', 40000000],
          ['Mexico', 130000000],
        ],
      },
    ])

    const wb = await parseWorkbook(file)
    const csv = wb.getSheetCsv('Data')

    const lines = csv.trim().split('\n')
    expect(lines[0]).toBe('country,population')
    expect(lines[1]).toBe('Canada,40000000')
    expect(lines[2]).toBe('Mexico,130000000')
  })

  it('throws an empty-workbook error when the only sheet has no data rows', async () => {
    const file = await buildWorkbookFile([
      { name: 'Empty', rows: [['only', 'header']] },
    ])

    await expect(parseWorkbook(file)).rejects.toThrow(XLSX_ERRORS.EMPTY)
  })

  it('surfaces date cells as ISO-style strings in the CSV (not Excel serial numbers)', async () => {
    // Construct dates at local noon so timezone offsets do not roll the date
    // back/forward when SheetJS converts through its 1900-epoch storage.
    const file = await buildWorkbookFile([
      {
        name: 'Trend',
        rows: [
          ['month', 'value'],
          [new Date(2024, 0, 1, 12, 0, 0), 100],
          [new Date(2024, 1, 1, 12, 0, 0), 110],
        ],
      },
    ])

    const wb = await parseWorkbook(file)
    const csv = wb.getSheetCsv('Trend')

    // Excel serial for 2024-01-01 is 45292 — must NOT appear.
    expect(csv).not.toMatch(/45292/)
    expect(csv).not.toMatch(/45323/)
    // dateNF forces ISO format so downstream type detection treats these as
    // high-confidence dates.
    expect(csv).toMatch(/2024-01-01/)
    expect(csv).toMatch(/2024-02-01/)
  })

  it('throws a typed error when getSheetCsv is called with an unknown sheet name', async () => {
    const file = await buildWorkbookFile([
      { name: 'Only', rows: [['x', 'y'], [1, 2]] },
    ])

    const wb = await parseWorkbook(file)

    expect(() => wb.getSheetCsv('does-not-exist')).toThrow(
      XLSX_ERRORS.SHEET_MISSING,
    )
  })

  it('wraps a corrupt-file parse failure with a stable error prefix', async () => {
    const garbage = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
    const file = new File([garbage], 'corrupt.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    await expect(parseWorkbook(file)).rejects.toThrow(XLSX_ERRORS.PARSE)
  })

  it('filters out empty sheets when at least one sheet has data', async () => {
    const file = await buildWorkbookFile([
      { name: 'EmptyOne', rows: [['header']] },
      { name: 'Real', rows: [['x', 'y'], [1, 2], [3, 4]] },
      { name: 'EmptyTwo', rows: [] },
    ])

    const wb = await parseWorkbook(file)

    expect(wb.sheets.map((s) => s.name)).toEqual(['Real'])
  })
})
