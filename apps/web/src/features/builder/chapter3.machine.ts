import type {
  ChapterState, ChapterStepId, StepStatus, ChapterArtifacts,
} from '@/lib/db/database'

// ─── Intents ──────────────────────────────────────────────────────────────────

export type Chapter3Intent =
  | { type: 'START_DESIGN_AI' }
  | { type: 'DESIGN_RECOMMENDED'; design: 'quantitative' | 'qualitative' | 'mixed'; rationale: string; keyReasons: string[] }
  | { type: 'SELECT_DESIGN'; design: 'quantitative' | 'qualitative' | 'mixed' }
  | { type: 'SUBMIT_LOCALE'; text: string }
  | { type: 'SUBMIT_SAMPLING'; text: string }
  | { type: 'INSTRUMENTS_GENERATED'; text: string }
  | { type: 'PROCEDURE_GENERATED'; text: string }
  | { type: 'SUBMIT_ANALYSIS'; text: string }
  | { type: 'ANALYSIS_GENERATED'; text: string }
  | { type: 'ETHICS_GENERATED'; text: string }
  | { type: 'RETRY' }

export type Chapter3SideEffect =
  | 'run_design_recommend'
  | 'run_instruments'
  | 'run_procedure'
  | 'run_analysis'
  | 'run_ethics'

export interface Chapter3Transition {
  next: ChapterState
  sideEffect?: Chapter3SideEffect
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
    chapterId: 'chapter-3',
    currentStep: step,
    stepStatus: status,
    artifacts,
    history: [...history, { step, at: new Date().toISOString(), note }],
    updatedAt: new Date(),
    syncStatus: 'pending',
  }
}

// ─── Client-side markdown assembler ──────────────────────────────────────────

const DESIGN_LABELS: Record<'quantitative' | 'qualitative' | 'mixed', string> = {
  quantitative: 'Quantitative Research',
  qualitative:  'Qualitative Research',
  mixed:        'Mixed Methods Research',
}

function assembleChapter3Markdown(a: ChapterArtifacts): string {
  const designLabel = a.ch3_researchDesign ? DESIGN_LABELS[a.ch3_researchDesign] : 'Descriptive Research'

  // Research design introductory paragraph
  const designIntro = `This study employed a **${designLabel}** design. ` +
    (a.ch3_instrumentsSection
      ? 'The methodology described in this chapter outlines the procedures followed by the researcher in gathering and analyzing the data necessary to address the research questions of the study.'
      : 'This chapter presents the research methodology, including the research design, locale of the study, sampling technique, instruments, data collection procedure, data analysis, and ethical considerations.')

  return [
    '# Chapter 3',
    '',
    '# Research Methodology',
    '',
    '## Research Design',
    '',
    designIntro,
    '',
    '## Locale of the Study and Participants',
    '',
    a.ch3_localeDescription ?? '',
    '',
    '## Sampling Technique and Sample Size',
    '',
    a.ch3_samplingDescription ?? '',
    '',
    '## Research Instruments',
    '',
    a.ch3_instrumentsSection ?? '',
    '',
    '## Data Collection Procedure',
    '',
    a.ch3_procedureSection ?? '',
    '',
    '## Data Analysis',
    '',
    a.ch3_analysisSection ?? '',
    '',
    '## Ethical Considerations',
    '',
    a.ch3_ethicsSection ?? '',
  ].join('\n').trim()
}

// ─── Pure reducer ─────────────────────────────────────────────────────────────

export function chapter3Reduce(
  state: Readonly<ChapterState>,
  intent: Chapter3Intent,
): Chapter3Transition {
  const { currentStep, artifacts, history } = state
  const merge = (patch: Partial<ChapterArtifacts>): ChapterArtifacts => ({ ...artifacts, ...patch })

  switch (intent.type) {

    case 'START_DESIGN_AI': {
      if (currentStep !== 'method_design_ai') return { next: state }
      const next = record('method_design_ai', artifacts, history, 'running_ai', 'Requesting design recommendation')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_design_recommend' }
    }

    case 'DESIGN_RECOMMENDED': {
      if (currentStep !== 'method_design_ai') return { next: state }
      const next = record(
        'method_design_select',
        merge({ ch3_designRecommendation: { design: intent.design, rationale: intent.rationale, keyReasons: intent.keyReasons } }),
        history,
        'awaiting_user',
        `AI recommends: ${intent.design}`,
      )
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SELECT_DESIGN': {
      if (currentStep !== 'method_design_select') return { next: state }
      const next = record('method_locale_input', merge({ ch3_researchDesign: intent.design }), history, 'awaiting_user', `Design: ${intent.design}`)
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SUBMIT_LOCALE': {
      if (currentStep !== 'method_locale_input') return { next: state }
      const next = record('method_sampling_input', merge({ ch3_localeDescription: intent.text }), history, 'awaiting_user', 'Locale submitted')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SUBMIT_SAMPLING': {
      if (currentStep !== 'method_sampling_input') return { next: state }
      const next = record('method_instrument_generate', merge({ ch3_samplingDescription: intent.text }), history, 'running_ai', 'Sampling submitted')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_instruments' }
    }

    case 'INSTRUMENTS_GENERATED': {
      if (currentStep !== 'method_instrument_generate') return { next: state }
      const next = record('method_procedure_generate', merge({ ch3_instrumentsSection: intent.text }), history, 'running_ai', 'Instruments generated')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_procedure' }
    }

    case 'PROCEDURE_GENERATED': {
      if (currentStep !== 'method_procedure_generate') return { next: state }
      const next = record('method_analysis_input', merge({ ch3_procedureSection: intent.text }), history, 'awaiting_user', 'Procedure generated')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SUBMIT_ANALYSIS': {
      if (currentStep !== 'method_analysis_input') return { next: state }
      const next = record('method_analysis_generate', merge({ ch3_analysisInput: intent.text }), history, 'running_ai', 'Analysis plan submitted')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_analysis' }
    }

    case 'ANALYSIS_GENERATED': {
      if (currentStep !== 'method_analysis_generate') return { next: state }
      const next = record('method_ethics_generate', merge({ ch3_analysisSection: intent.text }), history, 'running_ai', 'Analysis generated')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_ethics' }
    }

    case 'ETHICS_GENERATED': {
      if (currentStep !== 'method_ethics_generate') return { next: state }
      const updatedArtifacts = merge({ ch3_ethicsSection: intent.text })
      const markdown = assembleChapter3Markdown(updatedArtifacts)
      const next = record('method_done', { ...updatedArtifacts, ch3_compiledDraft: markdown }, history, 'done', 'Chapter 3 complete')
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

export const CHAPTER3_ORDERED_STEPS: ChapterStepId[] = [
  'method_design_ai',
  'method_design_select',
  'method_locale_input',
  'method_sampling_input',
  'method_instrument_generate',
  'method_procedure_generate',
  'method_analysis_input',
  'method_analysis_generate',
  'method_ethics_generate',
  'method_done',
]

export const CHAPTER3_AI_STEPS: ChapterStepId[] = [
  'method_design_ai',
  'method_instrument_generate',
  'method_procedure_generate',
  'method_analysis_generate',
  'method_ethics_generate',
]

export function chapter3StepLabel(step: ChapterStepId): string {
  const labels: Partial<Record<ChapterStepId, string>> = {
    method_design_ai:           'Analyzing Literature…',
    method_design_select:       'Research Design',
    method_locale_input:        'Locale & Participants',
    method_sampling_input:      'Sampling',
    method_instrument_generate: 'Writing Instruments…',
    method_procedure_generate:  'Writing Procedure…',
    method_analysis_input:      'Data Analysis Plan',
    method_analysis_generate:   'Writing Data Analysis…',
    method_ethics_generate:     'Writing Ethical Considerations…',
    method_done:                'Chapter 3 Complete',
  }
  return labels[step] ?? step
}

export function chapter3StepProgress(step: ChapterStepId): number {
  const idx = CHAPTER3_ORDERED_STEPS.indexOf(step)
  if (idx === -1) return 0
  return Math.round((idx / (CHAPTER3_ORDERED_STEPS.length - 1)) * 100)
}
