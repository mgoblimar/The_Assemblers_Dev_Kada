import type { ChapterStepId } from '@/lib/db/database'
import { useChapter3Runner } from './useChapter3Runner'
import {
  CHAPTER3_ORDERED_STEPS,
  CHAPTER3_AI_STEPS,
  chapter3StepProgress,
} from './chapter3.machine'
import { ResearchDesignStep } from './ResearchDesignStep'
import { LocaleInputStep } from './LocaleInputStep'
import { AiProgressStep } from './AiProgressStep'
import { DraftReviewStep } from './DraftReviewStep'

interface Props {
  projectId: number
  onGoToNext?: () => void
}

const VISIBLE_STEPS: ChapterStepId[] = [
  'method_design_ai',
  'method_design_select',
  'method_locale_input',
  'method_sampling_input',
  'method_instrument_generate',
  'method_analysis_input',
  'method_done',
]

const STEP_LABELS: Partial<Record<ChapterStepId, string>> = {
  method_design_ai:           'Recommend',
  method_design_select:       'Design',
  method_locale_input:        'Locale',
  method_sampling_input:      'Sampling',
  method_instrument_generate: 'Sections',
  method_analysis_input:      'Analysis',
  method_done:                'Draft',
}

export function Chapter3Wizard({ projectId, onGoToNext }: Props) {
  const { chapterState, loading, aiRunning, error, selectDesign, submitLocale, submitSampling, submitAnalysis, retry } =
    useChapter3Runner(projectId)

  if (loading || !chapterState) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="size-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  const { currentStep, stepStatus } = chapterState
  const progress = chapter3StepProgress(currentStep)
  const isFailed = stepStatus === 'failed'

  // Breadcrumb index
  const currentStepIdx = CHAPTER3_ORDERED_STEPS.indexOf(currentStep)
  let currentVisibleIdx = 0
  for (let i = VISIBLE_STEPS.length - 1; i >= 0; i--) {
    if (CHAPTER3_ORDERED_STEPS.indexOf(VISIBLE_STEPS[i]) <= currentStepIdx) {
      currentVisibleIdx = i
      break
    }
  }

  function renderStep() {
    if (!chapterState) return null

    if (isFailed) {
      return <AiProgressStep step={currentStep} failed error={error} onRetry={retry} />
    }

    if (CHAPTER3_AI_STEPS.includes(currentStep) || aiRunning) {
      return <AiProgressStep step={currentStep} />
    }

    if (currentStep === 'method_done') {
      const draftState = {
        ...chapterState,
        artifacts: {
          ...chapterState.artifacts,
          compiledDraft: chapterState.artifacts.ch3_compiledDraft,
        },
      }
      return <DraftReviewStep state={draftState} onNextChapter={onGoToNext} nextChapterLabel="Projects Dashboard" />
    }

    if (currentStep === 'method_design_select') {
      return <ResearchDesignStep state={chapterState} onSelect={selectDesign} aiRunning={aiRunning} />
    }

    if (currentStep === 'method_locale_input') {
      return (
        <LocaleInputStep
          title="Locale of the Study & Participants"
          description="Describe where the study will be conducted and who the participants are. Include the specific institution, city/municipality, and participant profile (e.g., year level, department)."
          placeholder="The study will be conducted at [Institution], located in [City/Municipality]. The respondents will consist of [participant description]…"
          initialValue={chapterState.artifacts.ch3_localeDescription ?? ''}
          onSubmit={submitLocale}
          aiRunning={aiRunning}
          submitLabel="Continue to Sampling"
          minLength={50}
        />
      )
    }

    if (currentStep === 'method_sampling_input') {
      return (
        <LocaleInputStep
          title="Sampling Technique & Sample Size"
          description="Describe the sampling method you will use and justify the sample size. Include the specific technique (e.g., purposive, stratified random, total enumeration) and the target number of respondents."
          placeholder="The researcher will use [sampling technique] sampling. The sample will consist of [number] respondents selected from [population]…"
          initialValue={chapterState.artifacts.ch3_samplingDescription ?? ''}
          onSubmit={submitSampling}
          aiRunning={aiRunning}
          submitLabel="Generate Instruments & Procedure"
          minLength={40}
        />
      )
    }

    if (currentStep === 'method_analysis_input') {
      return (
        <LocaleInputStep
          title="Data Analysis Plan"
          description="Describe how you plan to analyze your data. Include the statistical tools or analytical techniques, software (e.g., SPSS, Excel, NVivo), and how each research question will be addressed."
          placeholder="The researcher will use [statistical tool/technique] to analyze the data. For RQ1, [specific test] will be applied to determine… Software such as [SPSS/Excel/NVivo] will be used…"
          initialValue={chapterState.artifacts.ch3_analysisInput ?? ''}
          onSubmit={submitAnalysis}
          aiRunning={aiRunning}
          submitLabel="Generate Data Analysis Section"
          minLength={40}
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
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chapter III — Research Methodology</span>
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
                  <div className={`size-5 flex items-center justify-center transition-colors
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
