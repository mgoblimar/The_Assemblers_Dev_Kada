import { useState } from 'react'
import type { ChapterState } from '@/lib/db/database'

interface Props {
  state: ChapterState
  ch1State: ChapterState | null   // used to pre-populate themes from Ch1 RQs
  onConfirm: (themes: string[]) => void
  aiRunning: boolean
}

export function ThemeConfirmStep({ state, ch1State, onConfirm, aiRunning }: Props) {
  // Derive initial themes from Ch1 research questions if not already set
  const savedThemes = state.artifacts.ch2_themes
  const derivedThemes: string[] = savedThemes?.length
    ? savedThemes
    : (ch1State?.artifacts.selectedRqs ?? []).map(rq =>
        rq.replace(/^(what|how|does|do|is|are|can|to what extent)\s+/i, '').replace(/\?$/, '').trim()
      )

  const [themes, setThemes] = useState<string[]>(derivedThemes.length ? derivedThemes : [''])
  const [newTheme, setNewTheme] = useState('')

  function updateTheme(i: number, value: string) {
    setThemes(prev => prev.map((t, idx) => idx === i ? value : t))
  }

  function removeTheme(i: number) {
    setThemes(prev => prev.filter((_, idx) => idx !== i))
  }

  function addTheme() {
    const trimmed = newTheme.trim()
    if (!trimmed) return
    setThemes(prev => [...prev, trimmed])
    setNewTheme('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); addTheme() }
  }

  const validThemes = themes.filter(t => t.trim().length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Research Themes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          These themes guide the literature review. They were derived from your research questions —
          review and edit them as needed before the AI writes Chapter 2.
        </p>
      </div>

      <div className="space-y-2">
        {themes.map((theme, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={theme}
              onChange={e => updateTheme(i, e.target.value)}
              disabled={aiRunning}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm
                         text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => removeTheme(i)}
              disabled={aiRunning || themes.length <= 1}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove theme"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new theme */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newTheme}
          onChange={e => setNewTheme(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={aiRunning}
          placeholder="Add a theme…"
          className="flex-1 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm
                     text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2
                     focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={addTheme}
          disabled={aiRunning || !newTheme.trim()}
          className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors"
          aria-label="Add theme"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {validThemes.length} theme{validThemes.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={() => onConfirm(validThemes)}
          disabled={aiRunning || validThemes.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5
                     text-sm font-medium text-primary-foreground
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {aiRunning ? (
            <>
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Generating…
            </>
          ) : (
            'Confirm & Generate Chapter 2'
          )}
        </button>
      </div>
    </div>
  )
}
