import { stepLabel } from './chapter1.machine'
import type { ChapterStepId } from '@/lib/db/database'

interface Props {
  step: ChapterStepId
  onRetry?: () => void
  failed?: boolean
  error?: string | null
}

const PROGRESS_MESSAGES: Partial<Record<ChapterStepId, string[]>> = {
  // Chapter 1
  sop_validate:       ['Reading your Statement of the Problem…', 'Checking academic quality…', 'Evaluating clarity and scope…'],
  rq_suggest:         ['Analyzing your SOP…', 'Generating research questions…', 'Categorizing by type…'],
  rq_validate:        ['Checking question alignment…', 'Verifying research scope…', 'Assessing feasibility…'],
  obj_suggest:        ['Mapping to your research questions…', 'Crafting measurable objectives…', 'Applying SMART criteria…'],
  obj_validate:       ['Reviewing objective alignment…', 'Checking action verbs…', 'Verifying measurability…'],
  generate_sections:  ['Writing Background of the Study…', 'Drafting Scope and Delimitation…', 'Composing Significance section…', 'Building Definition of Terms…'],
  compile_draft:      ['Assembling all components…', 'Formatting Chapter 1…', 'Polishing academic prose…'],
  // Chapter 2
  rrl_citations_suggest:    ['Analyzing your research themes…', 'Searching relevant academic sources…', 'Preparing citation suggestions…'],
  rrl_foreign_generate:     ['Searching international literature…', 'Writing foreign studies section…', 'Adding APA citations…'],
  rrl_local_generate:       ['Reviewing Philippine studies…', 'Writing local literature section…', 'Connecting to foreign context…'],
  rrl_theoretical_generate: ['Identifying theoretical frameworks…', 'Building conceptual framework…', 'Linking theories to your study…'],
  rrl_synthesis_generate:   ['Synthesizing all literature…', 'Identifying the research gap…', 'Writing synthesis paragraph…'],
  // Chapter 3
  method_instrument_generate: ['Designing research instruments…', 'Describing data collection tools…', 'Addressing validity and reliability…'],
  method_procedure_generate:  ['Outlining data collection steps…', 'Writing procedure section…', 'Adding ethical safeguards…'],
  method_analysis_generate:   ['Selecting statistical techniques…', 'Writing data analysis plan…', 'Matching methods to research questions…'],
  method_ethics_generate:     ['Addressing ethical considerations…', 'Applying Data Privacy Act…', 'Finalizing ethical guidelines…'],
}

export function AiProgressStep({ step, onRetry, failed, error }: Props) {
  const messages = PROGRESS_MESSAGES[step] ?? ['Processing…']

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
        <div className="size-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="size-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-foreground">Something went wrong</p>
          {error && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{error}</p>}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2
                       text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
      {/* Animated ring */}
      <div className="relative size-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground text-lg">{stepLabel(step)}</p>
        <div className="mt-2 space-y-1">
          {messages.map((msg, i) => (
            <p key={i} className="text-sm text-muted-foreground">{msg}</p>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground animate-pulse">This may take a few seconds…</p>
    </div>
  )
}
