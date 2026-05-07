import type { ChapterStepId } from '@/lib/db/database'
import type { ChapterState } from '@/lib/db/database'
import { useChapter2Runner } from './useChapter2Runner'
import {
  CHAPTER2_ORDERED_STEPS,
  CHAPTER2_AI_STEPS,
  chapter2StepProgress,
} from './chapter2.machine'
import { ThemeConfirmStep } from './ThemeConfirmStep'
import { CitationSelectStep } from './CitationSelectStep'
import { AiProgressStep } from './AiProgressStep'
import { DraftReviewStep } from './DraftReviewStep'

interface Props {
  projectId: number
  ch1State: ChapterState | null
  onGoToNext?: () => void
}

const VISIBLE_STEPS: ChapterStepId[] = [
  'rrl_theme_input',
  'rrl_citations_select',
  'rrl_foreign_generate',
  'rrl_theoretical_generate',
  'rrl_done',
]

const STEP_LABELS: Partial<Record<ChapterStepId, string>> = {
  rrl_theme_input:          'Themes',
  rrl_citations_select:     'Citations',
  rrl_foreign_generate:     'Literature',
  rrl_theoretical_generate: 'Framework',
  rrl_done:                 'Draft',
}

export function Chapter2Wizard({ projectId, ch1State, onGoToNext }: Props) {
  const { chapterState, loading, aiRunning, error, confirmThemes, confirmCitations, retry } =
    useChapter2Runner(projectId)

  if (loading || !chapterState) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  const { currentStep, stepStatus } = chapterState
  const progress = chapter2StepProgress(currentStep)
  const isFailed = stepStatus === 'failed'

  // Breadcrumb index
  const currentStepIdx = CHAPTER2_ORDERED_STEPS.indexOf(currentStep)
  let currentVisibleIdx = 0
  for (let i = VISIBLE_STEPS.length - 1; i >= 0; i--) {
    if (CHAPTER2_ORDERED_STEPS.indexOf(VISIBLE_STEPS[i]) <= currentStepIdx) {
      currentVisibleIdx = i
      break
    }
  }

  function renderStep() {
    if (!chapterState) return null

    if (isFailed) {
      return <AiProgressStep step={currentStep} failed error={error} onRetry={retry} />
    }

    if (CHAPTER2_AI_STEPS.includes(currentStep) || aiRunning) {
      return <AiProgressStep step={currentStep} />
    }

    if (currentStep === 'rrl_done') {
      // Wrap into a ChapterState shape that DraftReviewStep understands
      const draftState = {
        ...chapterState,
        artifacts: {
          ...chapterState.artifacts,
          compiledDraft: chapterState.artifacts.ch2_compiledDraft,
        },
      }
      return <DraftReviewStep state={draftState} onNextChapter={onGoToNext} nextChapterLabel="Chapter 3" />
    }

    if (currentStep === 'rrl_theme_input') {
      return (
        <ThemeConfirmStep
          state={chapterState}
          ch1State={ch1State}
          onConfirm={confirmThemes}
          aiRunning={aiRunning}
        />
      )
    }

    if (currentStep === 'rrl_citations_select') {
      return (
        <CitationSelectStep
          state={chapterState}
          onConfirm={confirmCitations}
          aiRunning={aiRunning}
        />
      )
    }

    return <AiProgressStep step={currentStep} />
  }

  return (
    <div className="space-y-5">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chapter II — Review of Literature</span>
          <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0">
          {VISIBLE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentVisibleIdx
            const isCurrent   = idx === currentVisibleIdx
            return (
              <div key={step} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`size-5 flex items-center justify-center text-[10px] font-bold transition-colors
                    ${isCompleted ? 'text-primary'
                      : isCurrent  ? 'text-primary'
                      : 'text-muted-foreground/40'}`}
                  >
                    {isCompleted ? (
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <span className={`text-[9px] font-semibold uppercase tracking-wide
                        ${isCurrent ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        {String.fromCharCode(8544 + idx)}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap font-medium
                    ${isCurrent ? 'text-primary' : isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
                {idx < VISIBLE_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-1 mb-4 transition-colors ${isCompleted ? 'bg-primary/40' : 'bg-border'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded border border-border bg-card p-4 min-h-[260px]">
        {renderStep()}
      </div>
    </div>
  )
}
