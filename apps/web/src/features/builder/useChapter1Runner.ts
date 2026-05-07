import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ChapterState } from '@/lib/db/database'
import { getOrCreateChapterState, saveChapterState } from '@/lib/db/project-repository'
import { chapter1Reduce } from './chapter1.machine'
import type { Chapter1Intent, SideEffect } from './chapter1.machine'
import {
  validateSop,
  suggestRqs,
  validateRqs,
  suggestObjectives,
  validateObjectives,
  generateSections,
} from '@/lib/ai/chapter1-client'

// ─── State ────────────────────────────────────────────────────────────────────
// aiRunning is NOT stored here — it is derived from chapterState.stepStatus
// to avoid the "spinner stuck" bug where AI_START fires but AI_DONE never does.

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
    case 'LOADED':
      return { loading: false, chapterState: action.state, error: null }
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error }
    case 'UPDATED':
      return { ...state, chapterState: action.state, error: null }
    case 'AI_ERROR':
      return { ...state, error: action.error }
    default:
      return state
  }
}

// ─── Side-effect executor ─────────────────────────────────────────────────────

async function executeSideEffect(
  effect: SideEffect,
  state: ChapterState,
): Promise<Chapter1Intent> {
  const a = state.artifacts

  switch (effect) {
    case 'run_sop_validate': {
      const result = await validateSop(a.sopDraft ?? '')
      return { type: 'SOP_VALIDATED', result }
    }
    case 'run_rq_suggest': {
      const suggestions = await suggestRqs(a.sopDraft ?? '')
      return { type: 'RQ_GENERATED', suggestions }
    }
    case 'run_rq_validate': {
      const result = await validateRqs(a.sopDraft ?? '', a.selectedRqs ?? [])
      return { type: 'RQ_VALIDATED', result }
    }
    case 'run_obj_suggest': {
      const suggestions = await suggestObjectives(a.sopDraft ?? '', a.selectedRqs ?? [])
      return { type: 'OBJ_GENERATED', suggestions }
    }
    case 'run_obj_validate': {
      const result = await validateObjectives(a.sopDraft ?? '', a.selectedRqs ?? [], a.selectedObjectives ?? [])
      return { type: 'OBJ_VALIDATED', result }
    }
    case 'run_generate_sections': {
      const sections = await generateSections(a.sopDraft ?? '', a.selectedRqs ?? [], a.selectedObjectives ?? [])
      return {
        type: 'SECTIONS_GENERATED',
        background: sections.background,
        scopeDelimitation: sections.scopeDelimitation,
        significance: sections.significance,
        definitions: sections.definitions,
      }
    }
    default:
      throw new Error(`Unknown side effect: ${effect}`)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChapter1Runner(projectId: number | null) {
  const [state, dispatch] = useReducer(runnerReducer, {
    chapterState: null,
    loading: true,
    error: null,
  })

  // Ref always holds the latest chapterState without stale closures
  const chapterStateRef = useRef<ChapterState | null>(null)
  chapterStateRef.current = state.chapterState

  // ── Load or create chapter state on mount / projectId change ──────────────
  useEffect(() => {
    if (projectId === null) return
    let cancelled = false

    async function load() {
      try {
        const cs = await getOrCreateChapterState(projectId!, 'chapter-1')
        if (!cancelled) dispatch({ type: 'LOADED', state: cs })
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'LOAD_ERROR', error: err instanceof Error ? err.message : String(err) })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  // ── Dispatch an intent (user action or AI result) ─────────────────────────
  const send = useCallback(async (intent: Chapter1Intent) => {
    const current = chapterStateRef.current
    if (!current) return

    const { next, sideEffect } = chapter1Reduce(current, intent)

    // Persist + update UI — stepStatus in `next` tells the UI what to show
    await saveChapterState(next)
    dispatch({ type: 'UPDATED', state: next })

    if (!sideEffect) return  // user-input step or terminal — nothing more to do

    // stepStatus is already 'running_ai' in `next`, so the spinner renders immediately.
    // Run the AI call, then feed the result back through the same send() path.
    try {
      const followUpIntent = await executeSideEffect(sideEffect, next)
      await send(followUpIntent)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      // Mark the current step as failed so the UI shows the retry button
      const failedState: ChapterState = { ...next, stepStatus: 'failed' }
      await saveChapterState(failedState)
      dispatch({ type: 'UPDATED', state: failedState })
      dispatch({ type: 'AI_ERROR', error: message })
    }
  }, [])

  // ── Convenience dispatchers ───────────────────────────────────────────────
  const submitSop        = useCallback((text: string)         => send({ type: 'SUBMIT_SOP', text }),               [send])
  const selectRqs        = useCallback((questions: string[])  => send({ type: 'SELECT_RQS', questions }),          [send])
  const selectObjectives = useCallback((objectives: string[]) => send({ type: 'SELECT_OBJECTIVES', objectives }),  [send])
  const retry            = useCallback(()                      => send({ type: 'RETRY' }),                          [send])

  // "Continue anyway" — force-accepts the current draft by injecting an ok=true validation result
  const continueAnywayFromSop = useCallback((text: string) => {
    const cs = chapterStateRef.current
    if (!cs) return
    // First record the SOP text, then inject an accepted validation
    send({ type: 'SUBMIT_SOP', text }).then(() => {
      // Wait for the running_ai state, then short-circuit with forced ok
      send({ type: 'SOP_VALIDATED', result: { ok: true, score: cs.artifacts.sopValidation?.score ?? 50, issues: [], suggestions: [], attempt: (cs.artifacts.sopValidation?.attempt ?? 0) + 1 } })
    })
  }, [send])

  const continueAnywayFromRqs = useCallback((questions: string[]) => {
    const cs = chapterStateRef.current
    if (!cs) return
    send({ type: 'SELECT_RQS', questions }).then(() => {
      send({ type: 'RQ_VALIDATED', result: { ok: true, score: cs.artifacts.rqValidation?.score ?? 50, issues: [], suggestions: [], attempt: (cs.artifacts.rqValidation?.attempt ?? 0) + 1 } })
    })
  }, [send])

  const continueAnywayFromObjs = useCallback((objectives: string[]) => {
    const cs = chapterStateRef.current
    if (!cs) return
    send({ type: 'SELECT_OBJECTIVES', objectives }).then(() => {
      send({ type: 'OBJ_VALIDATED', result: { ok: true, score: cs.artifacts.objValidation?.score ?? 50, issues: [], suggestions: [], attempt: (cs.artifacts.objValidation?.attempt ?? 0) + 1 } })
    })
  }, [send])

  // Derive aiRunning from stepStatus — no separate flag, no desync
  const aiRunning = state.chapterState?.stepStatus === 'running_ai' || false

  return {
    chapterState: state.chapterState,
    loading: state.loading,
    aiRunning,
    error: state.error,
    submitSop,
    selectRqs,
    selectObjectives,
    retry,
    continueAnywayFromSop,
    continueAnywayFromRqs,
    continueAnywayFromObjs,
  }
}
