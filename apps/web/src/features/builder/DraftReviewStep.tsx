import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChapterState } from '@/lib/db/database'

interface Props {
  state: ChapterState
}

type ViewMode = 'preview' | 'source'

export function DraftReviewStep({ state }: Props) {
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="size-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Chapter 1 Complete</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review your draft below, then download or copy it.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2
                       text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? (
              <>
                <svg className="size-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2
                       text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download .md
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { label: 'Research Questions', value: state.artifacts.selectedRqs?.length ?? 0 },
          { label: 'Objectives',         value: state.artifacts.selectedObjectives?.length ?? 0 },
          { label: 'Definition of Terms', value: state.artifacts.definitions?.length ?? 0 },
        ].map(item => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-2xl font-semibold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ── Viewer ── */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
          {/* macOS dots */}
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-muted-foreground/25" />
            <div className="size-2.5 rounded-full bg-muted-foreground/25" />
            <div className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">chapter-1.md</span>
          </div>

          {/* Preview / Source toggle */}
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            {(['preview', 'source'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize
                  ${view === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'}`}
              >
                {mode === 'preview' ? (
                  <span className="flex items-center gap-1">
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Preview
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                    Source
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {view === 'preview' ? (
            <article className="prose prose-sm max-w-none p-6
                                prose-headings:text-foreground prose-headings:font-semibold
                                prose-h1:text-2xl prose-h1:border-b prose-h1:border-border prose-h1:pb-3 prose-h1:mb-6
                                prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
                                prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:my-3
                                prose-strong:text-foreground prose-strong:font-semibold
                                prose-ol:text-foreground/85 prose-ul:text-foreground/85
                                prose-li:my-1
                                prose-hr:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </article>
          ) : (
            <pre className="p-5 text-xs font-mono text-foreground/75 whitespace-pre-wrap leading-relaxed">
              {markdown}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
