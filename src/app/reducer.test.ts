import { describe, expect, it } from 'vitest'
import {
  appReducer,
  initialState,
  AUTO_INFOGRAPHIC_THRESHOLD,
  type AppState,
  type ApplicableTemplate,
} from './reducer'
import type { Schema } from '../data/schema'

const stubSchema: Schema = {
  tableName: 'test',
  rowCount: 10,
  columns: [],
  sampleRows: [],
}

describe('appReducer', () => {
  it('exports AUTO_INFOGRAPHIC_THRESHOLD as 95', () => {
    expect(AUTO_INFOGRAPHIC_THRESHOLD).toBe(95)
  })

  describe('LOAD_FILE_START', () => {
    it('sets phase to loading and clears error', () => {
      const prev: AppState = { ...initialState, phase: 'error', error: 'bad' }
      const next = appReducer(prev, { type: 'LOAD_FILE_START' })
      expect(next.phase).toBe('loading')
      expect(next.error).toBeNull()
    })
  })

  describe('LOAD_FILE_SUCCESS', () => {
    it('auto-selects infographic when top score >= 95', () => {
      const templates: ApplicableTemplate[] = [
        { id: 'tmpl-a', score: 100 },
        { id: 'tmpl-b', score: 80 },
      ]
      const next = appReducer(initialState, {
        type: 'LOAD_FILE_SUCCESS',
        schema: stubSchema,
        fileName: 'data.csv',
        applicableTemplates: templates,
      })
      expect(next.phase).toBe('ready')
      expect(next.mode).toBe('infographic')
      expect(next.selectedTemplate).toBe('tmpl-a')
      expect(next.schema).toBe(stubSchema)
      expect(next.fileName).toBe('data.csv')
      expect(next.overrides).toEqual({})
      expect(next.error).toBeNull()
    })

    it('stays quick when all scores < 95', () => {
      const templates: ApplicableTemplate[] = [
        { id: 'tmpl-a', score: 90 },
        { id: 'tmpl-b', score: 80 },
      ]
      const next = appReducer(initialState, {
        type: 'LOAD_FILE_SUCCESS',
        schema: stubSchema,
        fileName: 'data.csv',
        applicableTemplates: templates,
      })
      expect(next.mode).toBe('quick')
      expect(next.selectedTemplate).toBeNull()
    })

    it('stays quick when applicableTemplates is empty', () => {
      const next = appReducer(initialState, {
        type: 'LOAD_FILE_SUCCESS',
        schema: stubSchema,
        fileName: 'data.csv',
        applicableTemplates: [],
      })
      expect(next.mode).toBe('quick')
      expect(next.selectedTemplate).toBeNull()
    })

    it('clears overrides from previous session', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        overrides: { age: 'string' },
      }
      const next = appReducer(prev, {
        type: 'LOAD_FILE_SUCCESS',
        schema: stubSchema,
        fileName: 'new.csv',
        applicableTemplates: [],
      })
      expect(next.overrides).toEqual({})
    })
  })

  describe('LOAD_FILE_ERROR', () => {
    it('sets phase to error with message', () => {
      const next = appReducer(initialState, {
        type: 'LOAD_FILE_ERROR',
        message: 'parse failed',
      })
      expect(next.phase).toBe('error')
      expect(next.error).toBe('parse failed')
    })
  })

  describe('RESET', () => {
    it('returns to initial state', () => {
      const dirty: AppState = {
        phase: 'ready',
        schema: stubSchema,
        fileName: 'x.csv',
        mode: 'infographic',
        selectedTemplate: 'tmpl-a',
        overrides: { col: 'numeric' },
        error: null,
      }
      expect(appReducer(dirty, { type: 'RESET' })).toEqual(initialState)
    })
  })

  describe('OVERRIDE_TYPE', () => {
    it('preserves selectedTemplate when still in applicable list', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'infographic',
        selectedTemplate: 'tmpl-a',
      }
      const next = appReducer(prev, {
        type: 'OVERRIDE_TYPE',
        name: 'age',
        columnType: 'numeric',
        applicableTemplates: [
          { id: 'tmpl-a', score: 90 },
          { id: 'tmpl-b', score: 85 },
        ],
      })
      expect(next.overrides).toEqual({ age: 'numeric' })
      expect(next.selectedTemplate).toBe('tmpl-a')
      expect(next.mode).toBe('infographic')
    })

    it('falls back to new top when previous selection removed', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'infographic',
        selectedTemplate: 'tmpl-a',
      }
      const next = appReducer(prev, {
        type: 'OVERRIDE_TYPE',
        name: 'age',
        columnType: 'string',
        applicableTemplates: [
          { id: 'tmpl-b', score: 85 },
          { id: 'tmpl-c', score: 92 },
        ],
      })
      expect(next.selectedTemplate).toBe('tmpl-c')
    })

    it('drops to quick when applicable list is empty', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'infographic',
        selectedTemplate: 'tmpl-a',
      }
      const next = appReducer(prev, {
        type: 'OVERRIDE_TYPE',
        name: 'age',
        columnType: 'string',
        applicableTemplates: [],
      })
      expect(next.mode).toBe('quick')
      expect(next.selectedTemplate).toBeNull()
    })
  })

  describe('SET_MODE', () => {
    it('allows infographic even when no selectedTemplate (user picks from picker)', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'quick',
        selectedTemplate: null,
      }
      const next = appReducer(prev, {
        type: 'SET_MODE',
        mode: 'infographic',
      })
      expect(next.mode).toBe('infographic')
    })

    it('allows infographic when selectedTemplate is set', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'quick',
        selectedTemplate: 'tmpl-a',
      }
      const next = appReducer(prev, {
        type: 'SET_MODE',
        mode: 'infographic',
      })
      expect(next.mode).toBe('infographic')
    })

    it('always allows switching to quick', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'infographic',
        selectedTemplate: 'tmpl-a',
      }
      const next = appReducer(prev, { type: 'SET_MODE', mode: 'quick' })
      expect(next.mode).toBe('quick')
    })
  })

  describe('SELECT_TEMPLATE', () => {
    it('sets selectedTemplate and switches to infographic', () => {
      const prev: AppState = {
        ...initialState,
        phase: 'ready',
        mode: 'quick',
      }
      const next = appReducer(prev, {
        type: 'SELECT_TEMPLATE',
        id: 'tmpl-x',
      })
      expect(next.selectedTemplate).toBe('tmpl-x')
      expect(next.mode).toBe('infographic')
    })
  })
})
