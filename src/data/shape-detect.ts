import type { ColumnInfo } from './schema'

type WideShape = { kind: 'wide'; beforeCol: string; afterCol: string }
type LongShape = { kind: 'long'; categoryCol: string; valueCol: string }

export type BeforeAfterShape = WideShape | LongShape

const BEFORE_PATTERN = /^(before|previous|prior|pre|q\d+_?a|start|old|baseline)$/i
const AFTER_PATTERN = /^(after|current|new|post|q\d+_?b|end|latest|follow.?up)$/i

export function detectBeforeAfter(
  columns: ReadonlyArray<ColumnInfo>,
): BeforeAfterShape | null {
  const numerics = columns.filter((c) => c.type === 'numeric')

  if (numerics.length >= 2) {
    const beforeCol = numerics.find((c) => BEFORE_PATTERN.test(c.name))
    const afterCol = numerics.find((c) => AFTER_PATTERN.test(c.name))
    if (beforeCol && afterCol) {
      return { kind: 'wide', beforeCol: beforeCol.name, afterCol: afterCol.name }
    }
  }

  const categoricals = columns.filter(
    (c) => c.type === 'string' || c.type === 'boolean',
  )
  const cat2 = categoricals.find((c) => c.cardinality === 2)
  if (cat2 && numerics.length >= 1) {
    return { kind: 'long', categoryCol: cat2.name, valueCol: numerics[0].name }
  }

  return null
}
