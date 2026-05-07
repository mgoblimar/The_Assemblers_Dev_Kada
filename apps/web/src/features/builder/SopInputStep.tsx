import { useState } from 'react'
import type { ChapterState } from '@/lib/db/database'
import { ValidationFeedbackPanel, CONTINUE_ANYWAY_THRESHOLD } from './ValidationFeedbackPanel'

interface Props {
  state: ChapterState
  onSubmit: (text: string) => void
  onContinueAnyway: (text: string) => void
  aiRunning: boolean
}

export function SopInputStep({ state, onSubmit, onContinueAnyway, aiRunning }: Props) {
  const [text, setText] = useState(state.artifacts.sopDraft ?? '')
  const validation = state.artifacts.sopValidation
  const canContinueAnyway = validation && !validation.ok && validation.score >= CONTINUE_ANYWAY_THRESHOLD

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim().length < 50) return
    onSubmit(text.trim())
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Statement of the Problem</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Write a clear description of the research problem you want to investigate. Include the context,
          what gap exists in current knowledge, and why it matters. Aim for 150–400 words.
        </p>
      </div>

      {validation && !validation.ok && (
        <ValidationFeedbackPanel
          validation={validation}
          onContinueAnyway={canContinueAnyway ? () => onContinueAnyway(text.trim()) : undefined}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={10}
          disabled={aiRunning}
          placeholder="The study examines..."
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm
                     text-foreground placeholder:text-muted-foreground resize-none
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {text.trim().length} characters
            {text.trim().length < 50 && text.trim().length > 0 && (
              <span className="text-amber-500 ml-2">— at least 50 characters required</span>
            )}
          </p>
          <button
            type="submit"
            disabled={aiRunning || text.trim().length < 50}
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
              'Validate & Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
