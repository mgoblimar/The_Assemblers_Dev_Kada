import type { ChapterState } from '@/lib/db/database'

type Design = 'quantitative' | 'qualitative' | 'mixed'

interface Props {
  state: ChapterState
  onSelect: (design: Design) => void
  aiRunning: boolean
}

const DESIGNS: { value: Design; label: string; description: string; icon: string }[] = [
  {
    value: 'quantitative',
    label: 'Quantitative',
    description: 'Uses numerical data, surveys, and statistical analysis to measure variables and test hypotheses.',
    icon: '📊',
  },
  {
    value: 'qualitative',
    label: 'Qualitative',
    description: 'Uses interviews, observations, and thematic analysis to understand experiences and meanings.',
    icon: '💬',
  },
  {
    value: 'mixed',
    label: 'Mixed Methods',
    description: 'Combines both quantitative and qualitative approaches for a more comprehensive understanding.',
    icon: '🔀',
  },
]

export function ResearchDesignStep({ state, onSelect, aiRunning }: Props) {
  const current = state.artifacts.ch3_researchDesign

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Research Design</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the research design that best fits your study. This determines how Chapter 3 is written.
        </p>
      </div>

      <div className="grid gap-3">
        {DESIGNS.map(design => {
          const isSelected = current === design.value
          return (
            <button
              key={design.value}
              type="button"
              onClick={() => onSelect(design.value)}
              disabled={aiRunning}
              className={`w-full text-left rounded-xl border p-5 transition-all
                ${isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{design.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{design.label}</p>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{design.description}</p>
                </div>
                <div className={`mt-1 size-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                  {isSelected && (
                    <svg viewBox="0 0 10 8" className="size-3 text-primary-foreground fill-current">
                      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {current && (
        <p className="text-xs text-muted-foreground text-center">
          Click to confirm your selection and proceed to the next step.
        </p>
      )}
    </div>
  )
}
