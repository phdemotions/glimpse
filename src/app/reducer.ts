import type { ColumnType, Schema } from '../data/schema'

export type Mode = 'quick' | 'infographic'

export type ApplicableTemplate = { id: string; score: number }

export type AppState = {
  phase: 'idle' | 'loading' | 'ready' | 'error'
  schema: Schema | null
  fileName: string | null
  mode: Mode
  selectedTemplate: string | null
  overrides: Record<string, ColumnType>
  error: string | null
}

export type AppAction =
  | { type: 'LOAD_FILE_START' }
  | {
      type: 'LOAD_FILE_SUCCESS'
      schema: Schema
      fileName: string
      applicableTemplates: ApplicableTemplate[]
    }
  | { type: 'LOAD_FILE_ERROR'; message: string }
  | { type: 'RESET' }
  | {
      type: 'OVERRIDE_TYPE'
      name: string
      columnType: ColumnType
      applicableTemplates: ApplicableTemplate[]
    }
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'SELECT_TEMPLATE'; id: string }

export const AUTO_INFOGRAPHIC_THRESHOLD = 95

export const initialState: AppState = {
  phase: 'idle',
  schema: null,
  fileName: null,
  mode: 'quick',
  selectedTemplate: null,
  overrides: {},
  error: null,
}

function resolveTemplateDefaults(
  applicableTemplates: ApplicableTemplate[],
): Pick<AppState, 'mode' | 'selectedTemplate'> {
  if (applicableTemplates.length === 0) {
    return { mode: 'quick', selectedTemplate: null }
  }
  const top = applicableTemplates.reduce((best, t) =>
    t.score > best.score ? t : best,
  )
  if (top.score >= AUTO_INFOGRAPHIC_THRESHOLD) {
    return { mode: 'infographic', selectedTemplate: top.id }
  }
  return { mode: 'quick', selectedTemplate: null }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_FILE_START':
      return { ...state, phase: 'loading', error: null }

    case 'LOAD_FILE_SUCCESS': {
      const defaults = resolveTemplateDefaults(action.applicableTemplates)
      return {
        ...state,
        phase: 'ready',
        schema: action.schema,
        fileName: action.fileName,
        overrides: {},
        error: null,
        ...defaults,
      }
    }

    case 'LOAD_FILE_ERROR':
      return { ...state, phase: 'error', error: action.message }

    case 'RESET':
      return initialState

    case 'OVERRIDE_TYPE': {
      const overrides = { ...state.overrides, [action.name]: action.columnType }
      const ids = new Set(action.applicableTemplates.map((t) => t.id))

      if (state.selectedTemplate && ids.has(state.selectedTemplate)) {
        return { ...state, overrides }
      }

      if (action.applicableTemplates.length === 0) {
        return {
          ...state,
          overrides,
          mode: 'quick',
          selectedTemplate: null,
        }
      }

      const top = action.applicableTemplates.reduce((best, t) =>
        t.score > best.score ? t : best,
      )
      return {
        ...state,
        overrides,
        selectedTemplate: top.id,
      }
    }

    case 'SET_MODE':
      return { ...state, mode: action.mode }

    case 'SELECT_TEMPLATE':
      return {
        ...state,
        selectedTemplate: action.id,
        mode: 'infographic',
      }
  }
}
