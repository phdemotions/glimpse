/**
 * Coerce DuckDB / Apache Arrow row values into plain JS types Vega-Lite can
 * consume. Centralized so every chart spec entry point uses the same coercion
 * — prevents the "Cannot convert BigInt" regression that bit CP-1 when DuckDB
 * returned BIGINT columns straight to vega-embed.
 *
 * Precision note: BigInt values past 2^53 lose precision when narrowed to
 * Number. Acceptable for Glimpse's chart-rendering use case; revisit if a
 * future feature needs full BigInt fidelity (e.g., financial ID fields used
 * as identifiers, not measures).
 */
export function toJsValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString()
  return value
}

/**
 * Apply `toJsValue` to every value in a row, returning a plain object Vega
 * accepts. Cheaper to call once per row than to coerce each cell at the spec
 * site.
 */
export function coerceRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in row) {
    out[key] = toJsValue(row[key])
  }
  return out
}
