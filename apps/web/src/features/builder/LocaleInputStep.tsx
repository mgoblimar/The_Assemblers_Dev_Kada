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
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
        disabled={aiRunning}
        placeholder={placeholder}
        className="w-full rounded border border-border bg-card px-4 py-3 leading-relaxed
                   text-foreground placeholder:text-muted-foreground resize-none
                   focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
                   disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', lineHeight: '1.75' }}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {trimmed.length} characters
          {trimmed.length > 0 && trimmed.length < minLength && (
            <span className="text-amber-600 ml-2">— at least {minLength} characters required</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => onSubmit(trimmed)}
          disabled={aiRunning || trimmed.length < minLength}
          className="inline-flex items-center gap-2 rounded bg-primary px-4 py-1.5
                     text-sm font-medium text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
