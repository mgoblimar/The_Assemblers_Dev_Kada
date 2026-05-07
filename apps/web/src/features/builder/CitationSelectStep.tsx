import { useState } from 'react'
import type { ChapterState, Citation } from '@/lib/db/database'

interface Props {
  state: ChapterState
  onConfirm: (selectedIds: string[]) => void
  aiRunning: boolean
}

type ScopeFilter = 'all' | 'foreign' | 'local' | 'theoretical'

const SCOPE_LABELS: Record<string, string> = {
  foreign:     'Foreign',
  local:       'Local (PH)',
  theoretical: 'Theoretical',
}

const SCOPE_COLORS: Record<string, string> = {
  foreign:     'bg-blue-50 text-blue-700 border-blue-200',
  local:       'bg-green-50 text-green-700 border-green-200',
  theoretical: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function CitationSelectStep({ state, onConfirm, aiRunning }: Props) {
  const all: Citation[] = state.artifacts.ch2_suggestedCitations ?? []

  // Start with everything selected
  const [selected, setSelected] = useState<Set<string>>(() => new Set(all.map(c => c.id)))
  const [filter, setFilter] = useState<ScopeFilter>('all')

  const visible = filter === 'all' ? all : all.filter(c => c.scope === filter)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectVisible  = () => setSelected(prev => new Set([...prev, ...visible.map(c => c.id)]))
  const deselectVisible = () => setSelected(prev => {
    const next = new Set(prev)
    visible.forEach(c => next.delete(c.id))
    return next
  })

  const counts = {
    foreign:     all.filter(c => c.scope === 'foreign').length,
    local:       all.filter(c => c.scope === 'local').length,
    theoretical: all.filter(c => c.scope === 'theoretical').length,
  }

  const FILTERS: { key: ScopeFilter; label: string; count: number }[] = [
    { key: 'all',         label: 'All',         count: all.length },
    { key: 'foreign',     label: 'Foreign',     count: counts.foreign },
    { key: 'local',       label: 'Local (PH)',  count: counts.local },
    { key: 'theoretical', label: 'Theoretical', count: counts.theoretical },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Suggested Citations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review the citations below and select the ones you want included in your literature review.
          The AI will incorporate your chosen sources when writing each section.
        </p>
      </div>

      {/* Scope filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold
              ${filter === f.key ? 'bg-white/20' : 'bg-background'}`}>
              {f.count}
            </span>
          </button>
        ))}

        {/* Select/Deselect all visible */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={selectVisible}
            className="text-xs text-primary hover:underline"
          >
            Select all
          </button>
          <span className="text-muted-foreground text-xs">·</span>
          <button
            type="button"
            onClick={deselectVisible}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Deselect all
          </button>
        </div>
      </div>

      {/* Citation list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No citations in this category.</p>
        )}
        {visible.map(citation => {
          const isSelected = selected.has(citation.id)
          return (
            <button
              key={citation.id}
              type="button"
              onClick={() => toggle(citation.id)}
              disabled={aiRunning}
              className={`w-full text-left rounded-lg border p-3.5 transition-all
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`mt-0.5 size-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors
                  ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}
                >
                  {isSelected && (
                    <svg className="size-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {citation.authorLastName} ({citation.year})
                    </span>
                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${SCOPE_COLORS[citation.scope] ?? ''}`}>
                      {SCOPE_LABELS[citation.scope] ?? citation.scope}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-0.5 font-medium leading-snug">
                    {citation.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                    {citation.source}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {citation.relevanceSummary}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selected.size}</span> of {all.length} citations selected
          {selected.size === 0 && (
            <span className="text-amber-500 ml-2">— select at least one citation</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => onConfirm(Array.from(selected))}
          disabled={aiRunning || selected.size === 0}
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
            <>
              Confirm Selection
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
