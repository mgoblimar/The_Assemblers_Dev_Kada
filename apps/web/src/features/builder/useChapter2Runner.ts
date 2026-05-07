import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ChapterState } from '@/lib/db/database'
import { getOrCreateChapterState, saveChapterState } from '@/lib/db/project-repository'
import { chapter2Reduce } from './chapter2.machine'
import type { Chapter2Intent, Chapter2SideEffect } from './chapter2.machine'
import {
  suggestCitations,
  generateForeignLiterature,
  generateLocalLiterature,
  generateTheoreticalFramework,
  generateSynthesis,
} from '@/lib/ai/chapter2-client'

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
    case 'LOADED':    return { loading: false, chapterState: action.state, error: null }
    case 'LOAD_ERROR': return { ...state, loading: false, error: action.error }
    case 'UPDATED':   return { ...state, chapterState: action.state, error: null }
    case 'AI_ERROR':  return { ...state, error: action.error }
    default:          return state
  }
}

// ─── Side-effect executor ─────────────────────────────────────────────────────

async function executeSideEffect(
  effect: Chapter2SideEffect,
  state: ChapterState,
): Promise<Chapter2Intent> {
  const a = state.artifacts

  switch (effect) {
    case 'run_citation_suggest': {
      const citations = await suggestCitations(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        a.ch2_themes ?? [],
      )
      return { type: 'CITATIONS_SUGGESTED', citations }
    }
    case 'run_foreign_literature': {
      const selected = (a.ch2_suggestedCitations ?? []).filter(
        c => (a.ch2_selectedCitationIds ?? []).includes(c.id),
      )
      const text = await generateForeignLiterature(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        a.ch2_themes ?? [],
        selected.length > 0 ? selected : undefined,
      )
      return { type: 'FOREIGN_GENERATED', text }
    }
    case 'run_local_literature': {
      const selected = (a.ch2_suggestedCitations ?? []).filter(
        c => (a.ch2_selectedCitationIds ?? []).includes(c.id),
      )
      const text = await generateLocalLiterature(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        a.ch2_themes ?? [],
        a.ch2_foreignLiterature ?? '',
        selected.length > 0 ? selected : undefined,
      )
      return { type: 'LOCAL_GENERATED', text }
    }
    case 'run_theoretical_framework': {
      const text = await generateTheoreticalFramework(
        a.sopDraft ?? '',
        a.selectedRqs ?? [],
        a.selectedObjectives ?? [],
      )
      return { type: 'THEORETICAL_GENERATED', text }
    }
    case 'run_synthesis': {
      const text = await generateSynthesis(
        a.sopDraft ?? '',
        a.ch2_foreignLiterature ?? '',
        a.ch2_localLiterature ?? '',
        a.ch2_theoreticalFramework ?? '',
      )
      return { type: 'SYNTHESIS_GENERATED', text }
    }
    default:
      throw new Error(`Unknown Chapter 2 side effect: ${effect}`)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChapter2Runner(projectId: number | null) {
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
        let cs = await getOrCreateChapterState(projectId!, 'chapter-2', 'rrl_theme_input')
        // Migrate stale records: wrong initial step or old flow that skipped citation step
        if (cs.currentStep === 'sop_input') {
          cs = { ...cs, currentStep: 'rrl_theme_input', stepStatus: 'awaiting_user' }
          await saveChapterState(cs)
        } else if (cs.currentStep === 'rrl_foreign_generate' && !cs.artifacts.ch2_suggestedCitations) {
          // Was started before citation step existed — reset to theme input to go through new flow
          cs = { ...cs, currentStep: 'rrl_theme_input', stepStatus: 'awaiting_user' }
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

  const send = useCallback(async (intent: Chapter2Intent) => {
    const current = chapterStateRef.current
    if (!current) return

    const { next, sideEffect } = chapter2Reduce(current, intent)
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

  const confirmThemes    = useCallback((themes: string[])       => send({ type: 'CONFIRM_THEMES', themes }),         [send])
  const confirmCitations = useCallback((selectedIds: string[]) => send({ type: 'CONFIRM_CITATIONS', selectedIds }), [send])
  const retry            = useCallback(()                       => send({ type: 'RETRY' }),                          [send])

  const aiRunning = state.chapterState?.stepStatus === 'running_ai' || false

  return {
    chapterState: state.chapterState,
    loading: state.loading,
    aiRunning,
    error: state.error,
    confirmThemes,
    confirmCitations,
    retry,
  }
}
