import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChapterState } from '@/lib/db/database'

interface Props {
  state: ChapterState
  onNextChapter?: () => void
  nextChapterLabel?: string
}

type ViewMode = 'preview' | 'source'

export function DraftReviewStep({ state, onNextChapter, nextChapterLabel }: Props) {
  const markdown = state.artifacts.compiledDraft ?? ''
  const [view, setView]     = useState<ViewMode>('preview')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'chapter-1.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-5 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
              <svg className="size-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
              Draft Complete
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review your manuscript draft below, then download or copy it for submission.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5
                       text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5
                       text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download .md
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Research Questions', value: state.artifacts.selectedRqs?.length ?? 0 },
          { label: 'Objectives',         value: state.artifacts.selectedObjectives?.length ?? 0 },
          { label: 'Definition of Terms', value: state.artifacts.definitions?.length ?? 0 },
        ].map(item => (
          <div key={item.label} className="rounded border border-border bg-muted/20 px-4 py-3">
            <p className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              {item.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Viewer ── */}
      <div className="rounded border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <svg className="size-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="text-xs text-muted-foreground font-mono">chapter-1.md</span>
          </div>

          {/* Preview / Source toggle */}
          <div className="flex items-center gap-px rounded border border-border overflow-hidden">
            {(['preview', 'source'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer
                  ${view === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {mode === 'preview' ? 'Preview' : 'Source'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {view === 'preview' ? (
            <article className="prose-manuscript p-8 max-w-3xl mx-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </article>
          ) : (
            <pre className="p-5 text-xs font-mono text-foreground/75 whitespace-pre-wrap leading-relaxed bg-muted/20">
              {markdown}
            </pre>
          )}
        </div>
      </div>

      {onNextChapter && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onNextChapter}
            className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2
                       text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            Continue to {nextChapterLabel ?? 'Next Chapter'}
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
