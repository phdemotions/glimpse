import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type QueryCall = { sql: string }

// Hold the latest fakes the test set up so the mocked module can return them.
let fakeDb: FakeDb
let fakeConn: FakeConn

type FakeConn = {
  query: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  queries: QueryCall[]
}

type FakeDb = {
  connect: ReturnType<typeof vi.fn>
  registerFileHandle: ReturnType<typeof vi.fn>
  registerFileBuffer: ReturnType<typeof vi.fn>
  registeredHandles: Array<{ name: string; file: File }>
  registeredBuffers: Array<{ name: string; bytes: Uint8Array }>
}

function createFakes(opts: { rowCount?: number } = {}): { db: FakeDb; conn: FakeConn } {
  const queries: QueryCall[] = []
  const conn: FakeConn = {
    queries,
    query: vi.fn(async (sql: string) => {
      queries.push({ sql })
      // Return an arrow-table-like object whose toArray() yields the row count.
      if (/COUNT\(\*\)/i.test(sql)) {
        return { toArray: () => [{ c: opts.rowCount ?? 3 }] }
      }
      return { toArray: () => [] }
    }),
    close: vi.fn(async () => {}),
  }

  const db: FakeDb = {
    registeredHandles: [],
    registeredBuffers: [],
    connect: vi.fn(async () => conn),
    registerFileHandle: vi.fn(async (name: string, file: File) => {
      db.registeredHandles.push({ name, file })
    }),
    registerFileBuffer: vi.fn(async (name: string, bytes: Uint8Array) => {
      db.registeredBuffers.push({ name, bytes })
    }),
  }

  return { db, conn }
}

vi.mock('./duckdb', () => ({
  getDuckDB: () => Promise.resolve(fakeDb),
}))

// Helper: build a real .xlsx File via SheetJS, matching xlsx.test.ts pattern.
type SheetSpec = { name: string; rows: unknown[][] }
async function buildXlsxFile(sheets: SheetSpec[], fileName = 'workbook.xlsx'): Promise<File> {
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
  }) as ArrayBuffer
  return new File([buf], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('ingestFile', () => {
  beforeEach(() => {
    const fakes = createFakes()
    fakeDb = fakes.db
    fakeConn = fakes.conn
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('routes a CSV file through registerFileHandle + read_csv_auto', async () => {
    const { ingestFile } = await import('./ingest')
    const file = new File(['role,n\nstudent,12\n'], 'survey.csv', { type: 'text/csv' })

    const result = await ingestFile(file)

    expect(fakeDb.registerFileHandle).toHaveBeenCalledTimes(1)
    expect(fakeDb.registerFileHandle.mock.calls[0][0]).toBe('survey.csv')
    expect(fakeConn.queries[0].sql).toMatch(/read_csv_auto\('survey\.csv'\)/)
    expect(result.fileName).toBe('survey.csv')
    expect(result.workbook).toBeUndefined()
    expect(fakeConn.close).toHaveBeenCalled()
  })

  it('routes a JSON file through read_json_auto', async () => {
    const { ingestFile } = await import('./ingest')
    const file = new File(['[{"x":1}]'], 'data.json', { type: 'application/json' })

    await ingestFile(file)

    expect(fakeConn.queries[0].sql).toMatch(/read_json_auto\('data\.json'\)/)
  })

  it('rejects unsupported extensions (e.g. .xls) with a clear message', async () => {
    const { ingestFile } = await import('./ingest')
    const file = new File([new Uint8Array([0])], 'legacy.xls')

    await expect(ingestFile(file)).rejects.toThrow(/Unsupported file type: xls/)
    expect(fakeDb.connect).not.toHaveBeenCalled()
  })

  it('escapes single quotes in filenames passed into SQL', async () => {
    const { ingestFile } = await import('./ingest')
    const file = new File(['x\n1\n'], "Q1's data.csv")

    await ingestFile(file)

    expect(fakeConn.queries[0].sql).toContain("read_csv_auto('Q1''s data.csv')")
  })

  describe('xlsx handling', () => {
    it('parses a single-sheet workbook, registers a CSV buffer, and returns workbook metadata', async () => {
      const { ingestFile } = await import('./ingest')
      const file = await buildXlsxFile([
        {
          name: 'Survey',
          rows: [
            ['role', 'count'],
            ['student', 12],
            ['faculty', 5],
          ],
        },
      ])

      const result = await ingestFile(file)

      expect(fakeDb.registerFileHandle).not.toHaveBeenCalled()
      expect(fakeDb.registerFileBuffer).toHaveBeenCalledTimes(1)
      const [virtualName, bytes] = fakeDb.registerFileBuffer.mock.calls[0]
      expect(virtualName).toBe('workbook.xlsx::Survey.csv')
      const csv = new TextDecoder().decode(bytes)
      expect(csv).toContain('role,count')
      expect(csv).toContain('student,12')

      expect(fakeConn.queries[0].sql).toMatch(
        /read_csv_auto\('workbook\.xlsx::Survey\.csv'\)/,
      )
      expect(result.workbook).toBeDefined()
      expect(result.workbook?.activeSheet).toBe('Survey')
      expect(result.workbook?.sheets).toHaveLength(1)
      expect(result.workbook?.parsed).toBeDefined()
    })

    it('selects the first sheet by default for multi-sheet workbooks', async () => {
      const { ingestFile } = await import('./ingest')
      const file = await buildXlsxFile([
        { name: 'Q1', rows: [['m', 'r'], ['Jan', 100]] },
        { name: 'Q2', rows: [['m', 'r'], ['Apr', 130]] },
        { name: 'Q3', rows: [['m', 'r'], ['Jul', 160]] },
      ])

      const result = await ingestFile(file)

      expect(result.workbook?.activeSheet).toBe('Q1')
      expect(result.workbook?.sheets.map((s) => s.name)).toEqual(['Q1', 'Q2', 'Q3'])
      const [virtualName] = fakeDb.registerFileBuffer.mock.calls[0]
      expect(virtualName).toBe('workbook.xlsx::Q1.csv')
    })

    it('propagates xlsx-empty-workbook errors verbatim', async () => {
      const { ingestFile } = await import('./ingest')
      const file = await buildXlsxFile([
        { name: 'OnlyHeader', rows: [['a', 'b']] },
      ])

      await expect(ingestFile(file)).rejects.toThrow(/Excel workbook is empty/)
      // Connection is opened lazily after parseWorkbook succeeds; for empty
      // workbooks parseWorkbook throws first, so the connection is never opened.
      expect(fakeDb.connect).not.toHaveBeenCalled()
    })

    it('propagates xlsx-corrupt-file errors verbatim', async () => {
      const { ingestFile } = await import('./ingest')
      const garbage = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
      const file = new File([garbage], 'corrupt.xlsx')

      await expect(ingestFile(file)).rejects.toThrow(/Failed to parse Excel workbook/)
    })

    it('produces ISO-formatted dates in the registered CSV buffer (no Excel serials)', async () => {
      const { ingestFile } = await import('./ingest')
      const file = await buildXlsxFile([
        {
          name: 'Trend',
          rows: [
            ['month', 'value'],
            [new Date(2024, 0, 1, 12, 0, 0), 100],
            [new Date(2024, 1, 1, 12, 0, 0), 110],
          ],
        },
      ])

      await ingestFile(file)

      const [, bytes] = fakeDb.registerFileBuffer.mock.calls[0]
      const csv = new TextDecoder().decode(bytes)
      expect(csv).toMatch(/2024-01-01/)
      expect(csv).not.toMatch(/45292/)
    })
  })
})

describe('ingestWorkbookSheet', () => {
  beforeEach(() => {
    const fakes = createFakes()
    fakeDb = fakes.db
    fakeConn = fakes.conn
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('swaps the active sheet without re-parsing the source file', async () => {
    const { ingestFile, ingestWorkbookSheet } = await import('./ingest')
    const file = await buildXlsxFile(
      [
        { name: 'Q1', rows: [['m', 'r'], ['Jan', 100]] },
        { name: 'Q2', rows: [['m', 'r'], ['Apr', 130]] },
      ],
      'sales.xlsx',
    )

    const initial = await ingestFile(file)
    expect(initial.workbook?.activeSheet).toBe('Q1')
    const initialBufferCount = fakeDb.registerFileBuffer.mock.calls.length

    const swapped = await ingestWorkbookSheet(initial.workbook!.parsed, 'Q2', initial.fileName)

    expect(swapped.workbook?.activeSheet).toBe('Q2')
    // A new CSV buffer was registered (one more than before the swap).
    expect(fakeDb.registerFileBuffer.mock.calls.length).toBe(initialBufferCount + 1)
    const [virtualName] = fakeDb.registerFileBuffer.mock.calls.at(-1)!
    expect(virtualName).toBe('sales.xlsx::Q2.csv')
  })

  it('throws when asked for a sheet that is not in the workbook', async () => {
    const { ingestFile, ingestWorkbookSheet } = await import('./ingest')
    const file = await buildXlsxFile([
      { name: 'Only', rows: [['x', 'y'], [1, 2]] },
    ])

    const initial = await ingestFile(file)
    await expect(
      ingestWorkbookSheet(initial.workbook!.parsed, 'does-not-exist', initial.fileName),
    ).rejects.toThrow(/not found in workbook/)
  })
})
