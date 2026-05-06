import { useEffect, useMemo, useReducer } from 'react'
import { Landing, type SampleId } from './components/Landing'
import { SchemaView } from './components/SchemaView'
import { ingestFile } from './data/ingest'
import { prefetchDuckDB } from './data/duckdb'
import { getSchema, type ColumnType, type ColumnInfo } from './data/schema'
import type { UploadError } from './components/UploadDropzone'
import { selectChart } from './charts/selector'
import { captionFor } from './charts/captions'
import { appReducer, initialState } from './app/reducer'
import { applicableTemplates } from './templates/index'

function computeApplicable(columns: ReadonlyArray<ColumnInfo>, overrides: Record<string, ColumnType>) {
  const effective = columns.map((c) =>
    overrides[c.name] ? { ...c, type: overrides[c.name] } : c,
  )
  return applicableTemplates(effective)
}

function toApplicableList(columns: ReadonlyArray<ColumnInfo>, overrides: Record<string, ColumnType> = {}) {
  return computeApplicable(columns, overrides).map((t) => ({
    id: t.id,
    score: t.applicability_result.score,
  }))
}

function describeUploadError(err: UploadError): string {
  if (err.kind === 'too-large') {
    const mb = (err.file.size / (1024 * 1024)).toFixed(1)
    return `${err.file.name} is ${mb} MB. Files over 50 MB aren't supported in v1.`
  }
  return `${err.file.name} isn't a CSV or JSON file. Try one of those instead.`
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    prefetchDuckDB()
  }, [])

  const schemaColumns =
    state.phase === 'ready' && state.schema ? state.schema.columns : null

  const choice = useMemo(
    () => (schemaColumns ? selectChart(schemaColumns, state.overrides) : null),
    [schemaColumns, state.overrides],
  )

  const caption = useMemo(
    () => (choice ? captionFor(choice) : null),
    [choice],
  )

  const applicable = useMemo(
    () => (schemaColumns ? computeApplicable(schemaColumns, state.overrides) : []),
    [schemaColumns, state.overrides],
  )

  async function loadFile(file: File) {
    dispatch({ type: 'LOAD_FILE_START' })
    try {
      const result = await ingestFile(file)
      const schema = await getSchema(result.tableName)
      dispatch({
        type: 'LOAD_FILE_SUCCESS',
        schema,
        fileName: result.fileName,
        applicableTemplates: toApplicableList(schema.columns),
      })
    } catch (err) {
      dispatch({
        type: 'LOAD_FILE_ERROR',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  async function loadSample(id: SampleId) {
    dispatch({ type: 'LOAD_FILE_START' })
    try {
      const url = `${import.meta.env.BASE_URL}samples/${id}.csv`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Sample not found (${res.status})`)
      const blob = await res.blob()
      const file = new File([blob], `${id}.csv`, { type: 'text/csv' })
      await loadFile(file)
    } catch (err) {
      dispatch({
        type: 'LOAD_FILE_ERROR',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  function reset() {
    dispatch({ type: 'RESET' })
  }

  function handleTypeOverride(name: string, type: ColumnType) {
    if (!state.schema) return
    const nextOverrides = { ...state.overrides, [name]: type }
    dispatch({
      type: 'OVERRIDE_TYPE',
      name,
      columnType: type,
      applicableTemplates: toApplicableList(state.schema.columns, nextOverrides),
    })
  }

  function handleModeChange(mode: 'quick' | 'infographic') {
    dispatch({ type: 'SET_MODE', mode })
  }

  function handleSelectTemplate(id: string) {
    dispatch({ type: 'SELECT_TEMPLATE', id })
  }

  if (
    state.phase === 'ready' &&
    state.schema &&
    state.fileName &&
    choice &&
    caption
  ) {
    return (
      <SchemaView
        schema={state.schema}
        fileName={state.fileName}
        choice={choice}
        caption={caption}
        overrides={state.overrides}
        onTypeOverride={handleTypeOverride}
        onReset={reset}
        mode={state.mode}
        selectedTemplate={state.selectedTemplate}
        onModeChange={handleModeChange}
        hasTemplates={applicable.length > 0}
        applicableTemplates={applicable}
        onSelectTemplate={handleSelectTemplate}
      />
    )
  }

  return (
    <Landing
      loading={state.phase === 'loading'}
      error={state.phase === 'error' ? state.error : null}
      onFileSelected={loadFile}
      onSampleSelected={loadSample}
      onUploadValidationError={(err) =>
        dispatch({
          type: 'LOAD_FILE_ERROR',
          message: describeUploadError(err),
        })
      }
    />
  )
}
