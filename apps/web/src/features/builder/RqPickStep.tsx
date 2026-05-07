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
  descriptive:  'bg-secondary/10 text-secondary border-secondary/30',
  comparative:  'bg-accent/10 text-accent border-accent/30',
  causal:       'bg-primary/10 text-primary border-primary/30',
  exploratory:  'bg-muted text-muted-foreground border-border',
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
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Research Questions
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Select the research questions that best fit your study. You may select multiple.
          These were generated based on your Statement of the Problem.
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
                className={`w-full text-left rounded border p-4 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 size-4 rounded-sm border-2 flex-shrink-0 flex items-center justify-center
                    ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                    {isSelected && (
                      <svg viewBox="0 0 10 8" className="size-2.5 text-primary-foreground fill-current">
                        <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{rq.text}</p>
                    {rq.rationale && (
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic">{rq.rationale}</p>
                    )}
                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide ${TYPE_COLORS[rq.type]}`}>
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
          className="inline-flex items-center gap-2 rounded bg-primary px-4 py-1.5
                     text-sm font-medium text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors cursor-pointer"
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
