import { useState } from 'react'

interface Props {
  title: string
  description: string
  placeholder: string
  initialValue?: string
  onSubmit: (text: string) => void
  aiRunning: boolean
  submitLabel?: string
  minLength?: number
}

export function LocaleInputStep({
  title,
  description,
  placeholder,
  initialValue = '',
  onSubmit,
  aiRunning,
  submitLabel = 'Continue',
  minLength = 30,
}: Props) {
  const [text, setText] = useState(initialValue)
  const trimmed = text.trim()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={7}
        disabled={aiRunning}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm
                   text-foreground placeholder:text-muted-foreground resize-none
                   focus:outline-none focus:ring-2 focus:ring-primary/50
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {trimmed.length} characters
          {trimmed.length > 0 && trimmed.length < minLength && (
            <span className="text-amber-500 ml-2">— at least {minLength} characters required</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => onSubmit(trimmed)}
          disabled={aiRunning || trimmed.length < minLength}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5
                     text-sm font-medium text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {aiRunning ? (
            <>
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Processing…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </div>
  )
}
