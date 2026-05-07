import type {
  ChapterState, ChapterStepId, StepStatus, ChapterArtifacts, Citation,
} from '@/lib/db/database'

// ─── Intents ──────────────────────────────────────────────────────────────────

export type Chapter2Intent =
  | { type: 'CONFIRM_THEMES'; themes: string[] }
  | { type: 'CITATIONS_SUGGESTED'; citations: Citation[] }
  | { type: 'CONFIRM_CITATIONS'; selectedIds: string[] }
  | { type: 'FOREIGN_GENERATED'; text: string }
  | { type: 'LOCAL_GENERATED'; text: string }
  | { type: 'THEORETICAL_GENERATED'; text: string }
  | { type: 'SYNTHESIS_GENERATED'; text: string }
  | { type: 'RETRY' }

export type Chapter2SideEffect =
  | 'run_citation_suggest'
  | 'run_foreign_literature'
  | 'run_local_literature'
  | 'run_theoretical_framework'
  | 'run_synthesis'

export interface Chapter2Transition {
  next: ChapterState
  sideEffect?: Chapter2SideEffect
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function record(
  step: ChapterStepId,
  artifacts: ChapterArtifacts,
  history: ChapterState['history'],
  status: StepStatus,
  note?: string,
): ChapterState {
  return {
    projectId: 0,
    chapterId: 'chapter-2',
    currentStep: step,
    stepStatus: status,
    artifacts,
    history: [...history, { step, at: new Date().toISOString(), note }],
    updatedAt: new Date(),
    syncStatus: 'pending',
  }
}

// ─── Client-side markdown assembler ──────────────────────────────────────────

function assembleChapter2Markdown(a: ChapterArtifacts): string {
  const themeList = (a.ch2_themes ?? []).map((t, i) => `${i + 1}. ${t}`).join('\n')
  const themeIntro = (a.ch2_themes ?? []).length > 0
    ? `The following themes guided the review: ${(a.ch2_themes ?? []).join('; ')}.`
    : ''

  return [
    '# Chapter 2',
    '',
    '# Review of Related Literature',
    '',
    '## Introduction',
    '',
    `This chapter presents a comprehensive review of related literature and studies relevant to the present inquiry. The review covers both foreign and local sources and is organized around key thematic areas to provide a thorough theoretical and empirical foundation for the study. ${themeIntro}`,
    '',
    '## Theoretical and Conceptual Framework',
    '',
    a.ch2_theoreticalFramework ?? '',
    '',
    '## Foreign Literature and Studies',
    '',
    a.ch2_foreignLiterature ?? '',
    '',
    '## Local Literature and Studies',
    '',
    a.ch2_localLiterature ?? '',
    '',
    '## Synthesis of the Literature',
    '',
    a.ch2_synthesis ?? '',
    ...(themeList ? [
      '',
      '## Research Themes',
      '',
      themeList,
    ] : []),
  ].join('\n').trim()
}

// ─── Pure reducer ─────────────────────────────────────────────────────────────

export function chapter2Reduce(
  state: Readonly<ChapterState>,
  intent: Chapter2Intent,
): Chapter2Transition {
  const { currentStep, artifacts, history } = state
  const merge = (patch: Partial<ChapterArtifacts>): ChapterArtifacts => ({ ...artifacts, ...patch })

  switch (intent.type) {

    case 'CONFIRM_THEMES': {
      if (currentStep !== 'rrl_theme_input') return { next: state }
      const next = record('rrl_citations_suggest', merge({ ch2_themes: intent.themes }), history, 'running_ai', 'Themes confirmed — suggesting citations')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_citation_suggest' }
    }

    case 'CITATIONS_SUGGESTED': {
      if (currentStep !== 'rrl_citations_suggest') return { next: state }
      const next = record('rrl_citations_select', merge({ ch2_suggestedCitations: intent.citations }), history, 'awaiting_user', 'Citations suggested')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'CONFIRM_CITATIONS': {
      if (currentStep !== 'rrl_citations_select') return { next: state }
      const next = record('rrl_foreign_generate', merge({ ch2_selectedCitationIds: intent.selectedIds }), history, 'running_ai', 'Citations selected')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_foreign_literature' }
    }

    case 'FOREIGN_GENERATED': {
      if (currentStep !== 'rrl_foreign_generate') return { next: state }
      const next = record('rrl_local_generate', merge({ ch2_foreignLiterature: intent.text }), history, 'running_ai', 'Foreign literature generated')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_local_literature' }
    }

    case 'LOCAL_GENERATED': {
      if (currentStep !== 'rrl_local_generate') return { next: state }
      const next = record('rrl_theoretical_generate', merge({ ch2_localLiterature: intent.text }), history, 'running_ai', 'Local literature generated')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_theoretical_framework' }
    }

    case 'THEORETICAL_GENERATED': {
      if (currentStep !== 'rrl_theoretical_generate') return { next: state }
      const next = record('rrl_synthesis_generate', merge({ ch2_theoreticalFramework: intent.text }), history, 'running_ai', 'Theoretical framework generated')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_synthesis' }
    }

    case 'SYNTHESIS_GENERATED': {
      if (currentStep !== 'rrl_synthesis_generate') return { next: state }
      const updatedArtifacts = merge({ ch2_synthesis: intent.text })
      const markdown = assembleChapter2Markdown(updatedArtifacts)
      const next = record('rrl_done', { ...updatedArtifacts, ch2_compiledDraft: markdown }, history, 'done', 'Chapter 2 complete')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'RETRY': {
      const next: ChapterState = { ...state, stepStatus: 'awaiting_user' }
      return { next }
    }

    default:
      return { next: state }
  }
}

// ─── Step metadata ────────────────────────────────────────────────────────────

export const CHAPTER2_ORDERED_STEPS: ChapterStepId[] = [
  'rrl_theme_input',
  'rrl_citations_suggest',
  'rrl_citations_select',
  'rrl_foreign_generate',
  'rrl_local_generate',
  'rrl_theoretical_generate',
  'rrl_synthesis_generate',
  'rrl_done',
]

export const CHAPTER2_AI_STEPS: ChapterStepId[] = [
  'rrl_citations_suggest',
  'rrl_foreign_generate',
  'rrl_local_generate',
  'rrl_theoretical_generate',
  'rrl_synthesis_generate',
]

export function chapter2StepLabel(step: ChapterStepId): string {
  const labels: Partial<Record<ChapterStepId, string>> = {
    rrl_theme_input:           'Research Themes',
    rrl_citations_suggest:     'Suggesting Citations…',
    rrl_citations_select:      'Select Citations',
    rrl_foreign_generate:      'Writing Foreign Literature…',
    rrl_local_generate:        'Writing Local Literature…',
    rrl_theoretical_generate:  'Building Theoretical Framework…',
    rrl_synthesis_generate:    'Writing Synthesis…',
    rrl_done:                  'Chapter 2 Complete',
  }
  return labels[step] ?? step
}

export function chapter2StepProgress(step: ChapterStepId): number {
  const idx = CHAPTER2_ORDERED_STEPS.indexOf(step)
  if (idx === -1) return 0
  return Math.round((idx / (CHAPTER2_ORDERED_STEPS.length - 1)) * 100)
}
