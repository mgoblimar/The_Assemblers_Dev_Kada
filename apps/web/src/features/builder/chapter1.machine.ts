import type {
  ChapterState, ChapterStepId, StepStatus,
  ValidationResult, RqSuggestion, ObjSuggestion,
  DefinitionEntry, ChapterArtifacts,
} from '@/lib/db/database'

// ─── Intents ─────────────────────────────────────────────────────────────────

export type RefineSection = 'background' | 'rqs' | 'objectives' | 'references'

export type Chapter1Intent =
  | { type: 'SUBMIT_SOP'; text: string }
  | { type: 'SOP_VALIDATED'; result: ValidationResult }
  | { type: 'RQ_GENERATED'; suggestions: RqSuggestion[] }
  | { type: 'SELECT_RQS'; questions: string[] }
  | { type: 'RQ_VALIDATED'; result: ValidationResult }
  | { type: 'OBJ_GENERATED'; suggestions: ObjSuggestion[] }
  | { type: 'SELECT_OBJECTIVES'; objectives: string[] }
  | { type: 'OBJ_VALIDATED'; result: ValidationResult }
  | { type: 'SECTIONS_GENERATED'; background: string; scopeDelimitation: string; significance: string; definitions: DefinitionEntry[] }
  | { type: 'REFERENCES_GENERATED'; references: string }
  | { type: 'DRAFT_COMPILED'; markdown: string }
  | { type: 'REFINE_SECTION'; section: RefineSection }
  | { type: 'AI_ERROR'; message: string }
  | { type: 'RETRY' }

export type SideEffect =
  | 'run_sop_validate'
  | 'run_rq_suggest'
  | 'run_rq_validate'
  | 'run_obj_suggest'
  | 'run_obj_validate'
  | 'run_generate_sections'
  | 'run_references_generate'

export interface Transition {
  next: ChapterState
  sideEffect?: SideEffect
}

// ─── Pure reducer ─────────────────────────────────────────────────────────────

function record(
  step: ChapterStepId,
  artifacts: ChapterArtifacts,
  history: ChapterState['history'],
  status: StepStatus,
  note?: string,
): ChapterState {
  return {
    projectId: 0, // filled in by caller
    chapterId: 'chapter-1',
    currentStep: step,
    stepStatus: status,
    artifacts,
    history: [...history, { step, at: new Date().toISOString(), note }],
    updatedAt: new Date(),
    syncStatus: 'pending',
  }
}

export function chapter1Reduce(
  state: Readonly<ChapterState>,
  intent: Chapter1Intent,
): Transition {
  const { currentStep, artifacts, history } = state
  const merge = (patch: Partial<ChapterArtifacts>): ChapterArtifacts => ({ ...artifacts, ...patch })

  switch (intent.type) {

    case 'SUBMIT_SOP': {
      if (currentStep !== 'sop_input') return { next: state }
      const next = record('sop_validate', merge({ sopDraft: intent.text }), history, 'running_ai')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_sop_validate' }
    }

    case 'SOP_VALIDATED': {
      if (currentStep !== 'sop_validate') return { next: state }
      const attempt = (artifacts.sopValidation?.attempt ?? 0) + 1
      const validation: ValidationResult = { ...intent.result, attempt }
      if (intent.result.ok) {
        const next = record('rq_suggest', merge({ sopValidation: validation }), history, 'running_ai', 'SOP accepted')
        return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_rq_suggest' }
      }
      // Loop back
      const next = record('sop_input', merge({ sopValidation: validation }), history, 'awaiting_user', `SOP invalid (attempt ${attempt})`)
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'RQ_GENERATED': {
      if (currentStep !== 'rq_suggest') return { next: state }
      const next = record('rq_select', merge({ rqSuggestions: intent.suggestions }), history, 'awaiting_user', 'RQ suggestions ready')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SELECT_RQS': {
      if (currentStep !== 'rq_select') return { next: state }
      const next = record('rq_validate', merge({ selectedRqs: intent.questions }), history, 'running_ai')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_rq_validate' }
    }

    case 'RQ_VALIDATED': {
      if (currentStep !== 'rq_validate') return { next: state }
      const attempt = (artifacts.rqValidation?.attempt ?? 0) + 1
      const validation: ValidationResult = { ...intent.result, attempt }
      if (intent.result.ok) {
        const next = record('obj_suggest', merge({ rqValidation: validation }), history, 'running_ai', 'RQs accepted')
        return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_obj_suggest' }
      }
      const next = record('rq_select', merge({ rqValidation: validation }), history, 'awaiting_user', `RQs invalid (attempt ${attempt})`)
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'OBJ_GENERATED': {
      if (currentStep !== 'obj_suggest') return { next: state }
      const next = record('obj_select', merge({ objSuggestions: intent.suggestions }), history, 'awaiting_user', 'Objective suggestions ready')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SELECT_OBJECTIVES': {
      if (currentStep !== 'obj_select') return { next: state }
      const next = record('obj_validate', merge({ selectedObjectives: intent.objectives }), history, 'running_ai')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_obj_validate' }
    }

    case 'OBJ_VALIDATED': {
      if (currentStep !== 'obj_validate') return { next: state }
      const attempt = (artifacts.objValidation?.attempt ?? 0) + 1
      const validation: ValidationResult = { ...intent.result, attempt }
      if (intent.result.ok) {
        const next = record('generate_sections', merge({ objValidation: validation }), history, 'running_ai', 'Objectives accepted')
        return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_generate_sections' }
      }
      const next = record('obj_select', merge({ objValidation: validation }), history, 'awaiting_user', `Objectives invalid (attempt ${attempt})`)
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'SECTIONS_GENERATED': {
      if (currentStep !== 'generate_sections') return { next: state }
      // Store sections, then kick off references generation as the next AI step.
      const updatedArtifacts = merge({
        background: intent.background,
        scopeDelimitation: intent.scopeDelimitation,
        significance: intent.significance,
        definitions: intent.definitions,
      })
      const next = record('ch1_references_generate', updatedArtifacts, history, 'running_ai', 'Generating references')
      return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_references_generate' }
    }

    case 'REFERENCES_GENERATED': {
      if (currentStep !== 'ch1_references_generate') return { next: state }
      const updatedArtifacts = merge({ ch1_references: intent.references })
      // Assemble the chapter draft client-side now that all artifacts are ready.
      const markdown = assembleChapter1Markdown(updatedArtifacts)
      const next = record('done', { ...updatedArtifacts, compiledDraft: markdown }, history, 'done', 'Chapter 1 complete')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'DRAFT_COMPILED': {
      // Legacy intent — kept for backwards compatibility with any persisted states.
      if (currentStep !== 'compile_draft') return { next: state }
      const next = record('done', merge({ compiledDraft: intent.markdown }), history, 'done', 'Chapter 1 complete')
      return { next: { ...next, id: state.id, projectId: state.projectId } }
    }

    case 'REFINE_SECTION': {
      // Only allowed from the done state — sends the user back to regenerate a section.
      if (currentStep !== 'done') return { next: state }
      if (intent.section === 'background') {
        const next = record('generate_sections', artifacts, history, 'running_ai', 'Refining background sections')
        return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_generate_sections' }
      }
      if (intent.section === 'rqs') {
        const next = record('rq_select', artifacts, history, 'awaiting_user', 'Editing research questions')
        return { next: { ...next, id: state.id, projectId: state.projectId } }
      }
      if (intent.section === 'objectives') {
        const next = record('obj_select', artifacts, history, 'awaiting_user', 'Editing objectives')
        return { next: { ...next, id: state.id, projectId: state.projectId } }
      }
      if (intent.section === 'references') {
        const next = record('ch1_references_generate', artifacts, history, 'running_ai', 'Regenerating references')
        return { next: { ...next, id: state.id, projectId: state.projectId }, sideEffect: 'run_references_generate' }
      }
      return { next: state }
    }

    case 'AI_ERROR': {
      const next: ChapterState = { ...state, stepStatus: 'failed' }
      return { next }
    }

    case 'RETRY': {
      // For validation steps — go back to their input step.
      // For AI-only steps (generate_sections, ch1_references_generate) — re-run the same effect.
      if (currentStep === 'generate_sections') {
        const next: ChapterState = { ...state, stepStatus: 'running_ai' }
        return { next, sideEffect: 'run_generate_sections' }
      }
      if (currentStep === 'ch1_references_generate') {
        const next: ChapterState = { ...state, stepStatus: 'running_ai' }
        return { next, sideEffect: 'run_references_generate' }
      }
      const inputStep = currentStep === 'sop_validate' ? 'sop_input'
        : currentStep === 'rq_validate'  ? 'rq_select'
        : currentStep === 'obj_validate' ? 'obj_select'
        : currentStep
      const next: ChapterState = { ...state, currentStep: inputStep as ChapterStepId, stepStatus: 'awaiting_user' }
      return { next }
    }

    default:
      return { next: state }
  }
}

// ─── Client-side markdown assembler ──────────────────────────────────────────
// We already have every section after generate_sections — no AI call needed.
// Assembling here is instant and avoids a second round-trip that would overflow
// llama3.1-8b's 8k context window.

function assembleChapter1Markdown(a: ChapterArtifacts): string {
  // Research Questions — each on its own line with number
  const rqLines = (a.selectedRqs ?? [])
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n')

  // Objectives — each on its own line with number
  const objLines = (a.selectedObjectives ?? [])
    .map((o, i) => `${i + 1}. ${o}`)
    .join('\n')

  // Definition of Terms — bold term + period + definition in APA operational style
  const defLines = (a.definitions ?? [])
    .map(d => `**${d.term}.** ${d.definition}`)
    .join('\n\n')

  return [
    '# Chapter 1',
    '',
    '# The Problem and Its Background',
    '',
    '## Background of the Study',
    '',
    a.background ?? '',
    '',
    '## Statement of the Problem',
    '',
    a.sopDraft ?? '',
    '',
    '## Research Questions',
    '',
    'This study seeks to answer the following research questions:',
    '',
    rqLines,
    '',
    '## Objectives of the Study',
    '',
    'This study aims to achieve the following objectives:',
    '',
    objLines,
    '',
    '## Significance of the Study',
    '',
    a.significance ?? '',
    '',
    '## Scope and Delimitation of the Study',
    '',
    a.scopeDelimitation ?? '',
    '',
    '## Definition of Terms',
    '',
    'For the purposes of this study, the following terms are operationally defined:',
    '',
    defLines,
  ].join('\n').trim()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function stepLabel(step: ChapterStepId): string {
  const labels: Record<ChapterStepId, string> = {
    // Chapter 1
    sop_input: 'Statement of the Problem',
    sop_validate: 'Validating SOP…',
    rq_suggest: 'Generating Research Questions…',
    rq_select: 'Research Questions',
    rq_validate: 'Validating Research Questions…',
    obj_suggest: 'Generating Objectives…',
    obj_select: 'Objectives',
    obj_validate: 'Validating Objectives…',
    generate_sections:        'Generating Sections…',
    ch1_references_generate:  'Generating References…',
    compile_draft:            'Compiling Chapter 1…',
    done:                     'Chapter 1 Complete',
    // Chapter 2
    rrl_theme_input: 'Research Themes',
    rrl_citations_suggest: 'Suggesting Citations…',
    rrl_citations_select: 'Select Citations',
    rrl_foreign_generate: 'Generating Foreign Literature…',
    rrl_local_generate: 'Generating Local Literature…',
    rrl_theoretical_generate: 'Building Theoretical Framework…',
    rrl_synthesis_generate: 'Writing Synthesis…',
    rrl_done: 'Chapter 2 Complete',
    // Chapter 3
    method_design_ai:     'Analyzing Literature…',
    method_design_select: 'Research Design',
    method_locale_input: 'Locale & Participants',
    method_sampling_input: 'Sampling Technique',
    method_instrument_generate: 'Generating Instruments Section…',
    method_procedure_generate: 'Generating Procedure Section…',
    method_analysis_input: 'Data Analysis Plan',
    method_analysis_generate: 'Generating Data Analysis Section…',
    method_ethics_generate: 'Generating Ethical Considerations…',
    method_done: 'Chapter 3 Complete',
  }
  return labels[step]
}

export const ORDERED_STEPS: ChapterStepId[] = [
  'sop_input', 'sop_validate',
  'rq_suggest', 'rq_select', 'rq_validate',
  'obj_suggest', 'obj_select', 'obj_validate',
  'generate_sections', 'ch1_references_generate', 'done',
]

export function stepProgress(step: ChapterStepId): number {
  const idx = ORDERED_STEPS.indexOf(step)
  return Math.round((idx / (ORDERED_STEPS.length - 1)) * 100)
}
