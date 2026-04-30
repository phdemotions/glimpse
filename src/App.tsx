import { useEffect, useMemo, useState } from 'react'
import { Landing, type SampleId } from './components/Landing'
import { SchemaView } from './components/SchemaView'
import { ingestFile } from './data/ingest'
import { prefetchDuckDB } from './data/duckdb'
import {
  getSchema,
  type ColumnType,
  type Schema,
} from './data/schema'
import type { UploadError } from './components/UploadDropzone'
import { selectChart } from './charts/selector'
import { captionFor } from './charts/captions'

type AppState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; schema: Schema; fileName: string }
  | { kind: 'error'; message: string }

function describeUploadError(err: UploadError): string {
  if (err.kind === 'too-large') {
    const mb = (err.file.size / (1024 * 1024)).toFixed(1)
    return `${err.file.name} is ${mb} MB. Files over 50 MB aren't supported in v1.`
  }
  return `${err.file.name} isn't a CSV or JSON file. Try one of those instead.`
}

export default function App() {
  const [state, setState] = useState<AppState>({ kind: 'idle' })
  const [overrides, setOverrides] = useState<Record<string, ColumnType>>({})

  // Idle-prefetch DuckDB-WASM after first paint so the user's first click
  // finds the engine warm. Mitigates the 5MB cold-load risk on slow networks.
  useEffect(() => {
    prefetchDuckDB()
  }, [])

  const schemaColumns =
    state.kind === 'ready' ? state.schema.columns : null

  const choice = useMemo(
    () => (schemaColumns ? selectChart(schemaColumns, overrides) : null),
    [schemaColumns, overrides],
  )

  const caption = useMemo(
    () => (choice ? captionFor(choice) : null),
    [choice],
  )

  async function loadFile(file: File) {
    setState({ kind: 'loading' })
    try {
      const result = await ingestFile(file)
      const schema = await getSchema(result.tableName)
      setState({ kind: 'ready', schema, fileName: result.fileName })
      setOverrides({})
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  async function loadSample(id: SampleId) {
    setState({ kind: 'loading' })
    try {
      const url = `${import.meta.env.BASE_URL}samples/${id}.csv`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Sample not found (${res.status})`)
      const blob = await res.blob()
      const file = new File([blob], `${id}.csv`, { type: 'text/csv' })
      await loadFile(file)
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  function reset() {
    setState({ kind: 'idle' })
    setOverrides({})
  }

  function handleTypeOverride(name: string, type: ColumnType) {
    setOverrides((prev) => ({ ...prev, [name]: type }))
  }

  if (state.kind === 'ready' && choice && caption) {
    return (
      <SchemaView
        schema={state.schema}
        fileName={state.fileName}
        choice={choice}
        caption={caption}
        overrides={overrides}
        onTypeOverride={handleTypeOverride}
        onReset={reset}
      />
    )
  }

  return (
    <Landing
      loading={state.kind === 'loading'}
      error={state.kind === 'error' ? state.message : null}
      onFileSelected={loadFile}
      onSampleSelected={loadSample}
      onUploadValidationError={(err) =>
        setState({ kind: 'error', message: describeUploadError(err) })
      }
    />
  )
}
