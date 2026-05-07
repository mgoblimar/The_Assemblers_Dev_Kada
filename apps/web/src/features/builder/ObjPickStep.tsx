import { useState } from 'react'
import type { ChapterState } from '@/lib/db/database'
import { ValidationFeedbackPanel, CONTINUE_ANYWAY_THRESHOLD } from './ValidationFeedbackPanel'

interface Props {
  state: ChapterState
  onSelect: (objectives: string[]) => void
  onContinueAnyway: (objectives: string[]) => void
  aiRunning: boolean
}

export function ObjPickStep({ state, onSelect, onContinueAnyway, aiRunning }: Props) {
  const suggestions = state.artifacts.objSuggestions ?? []
  const prevSelected = state.artifacts.selectedObjectives ?? []
  const validation = state.artifacts.objValidation

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
          Objectives of the Study
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Select the objectives that match your research goals. Each is aligned to one or more research questions.
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
          Generating objectives…
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((obj, i) => {
            const isSelected = selected.has(obj.text)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(obj.text)}
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
                    <p className="text-sm font-medium text-foreground leading-relaxed">{obj.text}</p>
                    {obj.mapsToQuestion && obj.mapsToQuestion !== 'General' && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        → {obj.mapsToQuestion}
                      </p>
                    )}
                    {obj.mapsToQuestion === 'General' && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded border bg-primary/5 text-primary border-primary/20 font-medium">
                        General Objective
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {selected.size} objective{selected.size !== 1 ? 's' : ''} selected
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
