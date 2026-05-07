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
  foreign:     'bg-secondary/10 text-secondary border-secondary/30',
  local:       'bg-primary/10 text-primary border-primary/30',
  theoretical: 'bg-accent/10 text-accent border-accent/30',
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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Suggested Citations
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Review the citations below and select the ones you want included in your literature review.
          The AI will incorporate your chosen sources when writing each section.
        </p>
      </div>

      {/* Scope filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors cursor-pointer
              ${filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
          >
            {f.label}
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold
              ${filter === f.key ? 'bg-white/20' : 'bg-muted'}`}>
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
          const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(`${citation.title} ${citation.authorLastName} ${citation.year}`)}`

          return (
            <button
              key={citation.id}
              type="button"
              onClick={() => toggle(citation.id)}
              disabled={aiRunning}
              className={`w-full text-left rounded border p-3.5 transition-all cursor-pointer
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

                  {/* Google Scholar search link — stops propagation so it doesn't toggle selection */}
                  <a
                    href={scholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline"
                  >
                    <svg className="size-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Search on Google Scholar
                  </a>
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
