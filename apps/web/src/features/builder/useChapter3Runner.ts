import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ChapterState } from '@/lib/db/database'
import { getOrCreateChapterState, saveChapterState } from '@/lib/db/project-repository'
import { chapter3Reduce } from './chapter3.machine'
import type { Chapter3Intent, Chapter3SideEffect } from './chapter3.machine'
import {
  generateInstruments,
  generateProcedure,
  generateAnalysis,
  generateEthics,
} from '@/lib/ai/chapter3-client'

// ─── State ────────────────────────────────────────────────────────────────────

interface RunnerState {
  chapterState: ChapterState | null
  loading: boolean
  error: string | null
}

type RunnerAction =
  | { type: 'LOADED'; state: ChapterState }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'UPDATED'; state: ChapterState }
  | { type: 'AI_ERROR'; error: string }

function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'LOADED':     return { loading: false, chapterState: action.state, error: null }
    case 'LOAD_ERROR': return { ...state, loading: false, error: action.error }
    case 'UPDATED':    return { ...state, chapterState: action.state, error: null }
    case 'AI_ERROR':   return { ...state, error: action.error }
    default:           return state
  }
}

// ─── Side-effect executor ─────────────────────────────────────────────────────

async function executeSideEffect(
  effect: Chapter3SideEffect,
  state: ChapterState,
): Promise<Chapter3Intent> {
  const a = state.artifacts
  const design = a.ch3_researchDesign ?? 'quantitative'

  switch (effect) {
    case 'run_instruments': {
      const text = await generateInstruments(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        design,
        a.ch3_localeDescription ?? '',
        a.ch3_samplingDescription ?? '',
      )
      return { type: 'INSTRUMENTS_GENERATED', text }
    }
    case 'run_procedure': {
      const text = await generateProcedure(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        design,
        a.ch3_localeDescription ?? '',
        a.ch3_samplingDescription ?? '',
      )
      return { type: 'PROCEDURE_GENERATED', text }
    }
    case 'run_analysis': {
      const text = await generateAnalysis(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        design,
        a.ch3_analysisInput,
      )
      return { type: 'ANALYSIS_GENERATED', text }
    }
    case 'run_ethics': {
      const text = await generateEthics(
        a.sopDraft ?? '',
        a.ch3_localeDescription ?? '',
        design,
      )
      return { type: 'ETHICS_GENERATED', text }
    }
    default:
      throw new Error(`Unknown Chapter 3 side effect: ${effect}`)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChapter3Runner(projectId: number | null) {
  const [state, dispatch] = useReducer(runnerReducer, {
    chapterState: null,
    loading: true,
    error: null,
  })

  const chapterStateRef = useRef<ChapterState | null>(null)
  chapterStateRef.current = state.chapterState

  useEffect(() => {
    if (projectId === null) return
    let cancelled = false

    async function load() {
      try {
        let cs = await getOrCreateChapterState(projectId!, 'chapter-3', 'method_design_select')
        // Migrate stale records created before the chapter-specific initialStep fix
        if (cs.currentStep === 'sop_input') {
          cs = { ...cs, currentStep: 'method_design_select', stepStatus: 'awaiting_user' }
          await saveChapterState(cs)
        }
        if (!cancelled) dispatch({ type: 'LOADED', state: cs })
      } catch (err) {
        if (!cancelled) dispatch({ type: 'LOAD_ERROR', error: err instanceof Error ? err.message : String(err) })
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  const send = useCallback(async (intent: Chapter3Intent) => {
    const current = chapterStateRef.current
    if (!current) return

    const { next, sideEffect } = chapter3Reduce(current, intent)
    await saveChapterState(next)
    dispatch({ type: 'UPDATED', state: next })

    if (!sideEffect) return

    try {
      const followUpIntent = await executeSideEffect(sideEffect, next)
      await send(followUpIntent)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const failedState: ChapterState = { ...next, stepStatus: 'failed' }
      await saveChapterState(failedState)
      dispatch({ type: 'UPDATED', state: failedState })
      dispatch({ type: 'AI_ERROR', error: message })
    }
  }, [])

  const selectDesign   = useCallback((design: 'quantitative' | 'qualitative' | 'mixed') => send({ type: 'SELECT_DESIGN', design }),  [send])
  const submitLocale   = useCallback((text: string) => send({ type: 'SUBMIT_LOCALE',   text }), [send])
  const submitSampling = useCallback((text: string) => send({ type: 'SUBMIT_SAMPLING', text }), [send])
  const submitAnalysis = useCallback((text: string) => send({ type: 'SUBMIT_ANALYSIS', text }), [send])
  const retry          = useCallback(() => send({ type: 'RETRY' }), [send])

  const aiRunning = state.chapterState?.stepStatus === 'running_ai' || false

  return {
    chapterState: state.chapterState,
    loading: state.loading,
    aiRunning,
    error: state.error,
    selectDesign,
    submitLocale,
    submitSampling,
    submitAnalysis,
    retry,
  }
}
