import { useEffect } from 'react'
import type { ChapterStepId } from '@/lib/db/database'
import { useChapter1Runner } from './useChapter1Runner'
import { stepProgress, ORDERED_STEPS, stepLabel } from './chapter1.machine'
import { SopInputStep } from './SopInputStep'
import { RqPickStep } from './RqPickStep'
import { ObjPickStep } from './ObjPickStep'
import { AiProgressStep } from './AiProgressStep'
import { DraftReviewStep } from './DraftReviewStep'

interface Props {
  projectId: number
  onDone?: () => void
}

// Steps that are purely AI running (compile_draft removed — assembled client-side now)
const AI_RUNNING_STEPS: ChapterStepId[] = ['sop_validate', 'rq_suggest', 'rq_validate', 'obj_suggest', 'obj_validate', 'generate_sections']

export function Chapter1Wizard({ projectId, onDone }: Props) {
  const {
    chapterState,
    loading,
    aiRunning,
    error,
    submitSop,
    selectRqs,
    selectObjectives,
    retry,
    continueAnywayFromSop,
    continueAnywayFromRqs,
    continueAnywayFromObjs,
  } = useChapter1Runner(projectId)

  // Notify parent the moment Chapter 1 reaches done so it can unlock Ch2/Ch3 tabs
  useEffect(() => {
    if (chapterState?.currentStep === 'done') {
      onDone?.()
    }
  }, [chapterState?.currentStep, onDone])

  if (loading || !chapterState) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  const { currentStep, stepStatus } = chapterState
  const progress = stepProgress(currentStep)
  const isFailed = stepStatus === 'failed'

  // ── Step breadcrumb ────────────────────────────────────────────────────────
  const visibleSteps: ChapterStepId[] = ['sop_input', 'rq_select', 'obj_select', 'generate_sections', 'done']
  const currentStepIdx = ORDERED_STEPS.indexOf(currentStep)
  let currentVisibleIdx = 0
  for (let i = visibleSteps.length - 1; i >= 0; i--) {
    if (ORDERED_STEPS.indexOf(visibleSteps[i]) <= currentStepIdx) {
      currentVisibleIdx = i
      break
    }
  }

  // ── Render active step ─────────────────────────────────────────────────────
  function renderStep() {
    if (!chapterState) return null

    if (isFailed) {
      return (
        <AiProgressStep
          step={currentStep}
          failed
          error={error}
          onRetry={retry}
        />
      )
    }

    if (AI_RUNNING_STEPS.includes(currentStep) || aiRunning) {
      return <AiProgressStep step={currentStep} />
    }

    if (currentStep === 'done') {
      return <DraftReviewStep state={chapterState} />
    }

    if (currentStep === 'sop_input') {
      return (
        <SopInputStep
          state={chapterState}
          onSubmit={submitSop}
          onContinueAnyway={continueAnywayFromSop}
          aiRunning={aiRunning}
        />
      )
    }

    if (currentStep === 'rq_select') {
      return (
        <RqPickStep
          state={chapterState}
          onSelect={selectRqs}
          onContinueAnyway={continueAnywayFromRqs}
          aiRunning={aiRunning}
        />
      )
    }

    if (currentStep === 'obj_select') {
      return (
        <ObjPickStep
          state={chapterState}
          onSelect={selectObjectives}
          onContinueAnyway={continueAnywayFromObjs}
          aiRunning={aiRunning}
        />
      )
    }

    // Fallback for any transitional state
    return <AiProgressStep step={currentStep} />
  }

  const stepLabels: Partial<Record<ChapterStepId, string>> = {
    sop_input:        'Problem',
    rq_select:        'Questions',
    obj_select:       'Objectives',
    generate_sections:'Sections',
    done:             'Draft',
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Chapter 1 Progress</span>
          <span>{progress}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step breadcrumb */}
        <div className="flex items-center gap-1">
          {visibleSteps.map((step, idx) => {
            const isCompleted = idx < currentVisibleIdx
            const isCurrent   = idx === currentVisibleIdx
            return (
              <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`size-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                    ${isCompleted ? 'bg-primary text-primary-foreground'
                      : isCurrent  ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-muted text-muted-foreground'}`}
                  >
                    {isCompleted ? (
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {stepLabels[step]}
                  </span>
                </div>
                {idx < visibleSteps.length - 1 && (
                  <div className={`flex-1 h-px mt-[-14px] transition-colors ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active step content */}
      <div className="rounded-xl border border-border bg-card p-6 min-h-[320px]">
        {renderStep()}
      </div>

      {/* Current step label (for AI steps) */}
      {AI_RUNNING_STEPS.includes(currentStep) && !isFailed && (
        <p className="text-center text-xs text-muted-foreground">{stepLabel(currentStep)}</p>
      )}
    </div>
  )
}
