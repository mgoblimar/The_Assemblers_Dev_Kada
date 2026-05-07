import { useState } from 'react'
import type { ChapterState, RqSuggestion } from '@/lib/db/database'
import { ValidationFeedbackPanel, CONTINUE_ANYWAY_THRESHOLD } from './ValidationFeedbackPanel'

interface Props {
  state: ChapterState
  onSelect: (questions: string[]) => void
  onContinueAnyway: (questions: string[]) => void
  aiRunning: boolean
}

const TYPE_COLORS: Record<RqSuggestion['type'], string> = {
  descriptive:  'bg-blue-50 text-blue-700 border-blue-200',
  comparative:  'bg-purple-50 text-purple-700 border-purple-200',
  causal:       'bg-rose-50 text-rose-700 border-rose-200',
  exploratory:  'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function RqPickStep({ state, onSelect, onContinueAnyway, aiRunning }: Props) {
  const suggestions = state.artifacts.rqSuggestions ?? []
  const prevSelected = state.artifacts.selectedRqs ?? []
  const validation = state.artifacts.rqValidation

  const [selected, setSelected] = useState<Set<string>>(new Set(prevSelected))
  const canContinueAnyway = validation && !validation.ok && validation.score >= CONTINUE_ANYWAY_THRESHOLD

  function toggle(text: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(text)) next.delete(text)
      else next.add(text)
      return next
    })
  }

  function handleSubmit() {
    if (selected.size === 0) return
    onSelect(Array.from(selected))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Research Questions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select the research questions that best fit your study. You may select multiple.
          AI-generated based on your Statement of the Problem.
        </p>
      </div>

      {validation && !validation.ok && (
        <ValidationFeedbackPanel
          validation={validation}
          onContinueAnyway={canContinueAnyway ? () => onContinueAnyway(Array.from(selected)) : undefined}
        />
      )}

      {suggestions.length === 0 ? (
        <div className="flex items-center gap-3 text-muted-foreground text-sm py-8 justify-center">
          <span className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          Generating research questions…
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((rq, i) => {
            const isSelected = selected.has(rq.text)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(rq.text)}
                disabled={aiRunning}
                className={`w-full text-left rounded-lg border p-4 transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 size-5 rounded border-2 flex-shrink-0 flex items-center justify-center
                    ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {isSelected && (
                      <svg viewBox="0 0 10 8" className="size-3 text-primary-foreground fill-current">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">{rq.text}</p>
                    {rq.rationale && (
                      <p className="text-xs text-muted-foreground mt-1">{rq.rationale}</p>
                    )}
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded border font-medium capitalize ${TYPE_COLORS[rq.type]}`}>
                      {rq.type}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {selected.size} question{selected.size !== 1 ? 's' : ''} selected
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={aiRunning || selected.size === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5
                     text-sm font-medium text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {aiRunning ? (
            <>
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Validating…
            </>
          ) : (
            'Confirm Selection'
          )}
        </button>
      </div>
    </div>
  )
}
