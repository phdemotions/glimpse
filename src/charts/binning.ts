import { getDuckDB } from '../data/duckdb'

export type Bin = { bucket: number; count: number }

const DEFAULT_BIN_COUNT = 20

/**
 * Sturges' formula for histogram bin count: `1 + log2(n)`. Returns at least
 * 1, capped at 50 to keep the render legible. Only used as a fallback when
 * we don't already know the data range — we still divide the range into N
 * equal-width buckets at query time.
 */
function sturgesBinCount(rowCount: number): number {
  if (rowCount <= 1) return 1
  return Math.min(50, Math.max(5, Math.ceil(1 + Math.log2(rowCount))))
}

/**
 * Pre-bin a numeric column in DuckDB and return `[{ bucket, count }]` ready
 * for `makeHistogramSpec`. One round trip: compute min/max + bin width, then
 * GROUP BY the floored bucket. Keeps render cost flat regardless of row count
 * — Vega-Lite's `bin: true` would otherwise ship every row to the renderer.
 */
export async function binNumericColumn(
  tableName: string,
  columnName: string,
  binCount?: number,
): Promise<Bin[]> {
  const db = await getDuckDB()
  const conn = await db.connect()
  try {
    const rangeRes = await conn.query(
      `SELECT
        MIN("${columnName}")::DOUBLE AS lo,
        MAX("${columnName}")::DOUBLE AS hi,
        COUNT("${columnName}")::INT AS n
       FROM "${tableName}"
       WHERE "${columnName}" IS NOT NULL`,
    )
    const range = rangeRes.toArray()[0] as { lo: number; hi: number; n: number }
    if (range.n === 0 || range.lo === range.hi) {
      // Degenerate column (all-null or constant) — single bucket.
      return [{ bucket: range.lo ?? 0, count: range.n }]
    }

    const bins = binCount ?? sturgesBinCount(range.n)
    const width = (range.hi - range.lo) / bins
    if (width === 0) {
      return [{ bucket: range.lo, count: range.n }]
    }

    const result = await conn.query(
      `SELECT
        (FLOOR(("${columnName}"::DOUBLE - ${range.lo}) / ${width}) * ${width} + ${range.lo})::DOUBLE AS bucket,
        COUNT(*)::INT AS count
       FROM "${tableName}"
       WHERE "${columnName}" IS NOT NULL
       GROUP BY bucket
       ORDER BY bucket`,
    )
    return result.toArray().map((r) => ({
      bucket: Number(r.bucket),
      count: Number(r.count),
    }))
  } finally {
    await conn.close()
  }
}

export const __test = { sturgesBinCount, DEFAULT_BIN_COUNT }
