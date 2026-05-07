import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChapterState } from '@/lib/db/database'
import type { RefineSection } from './chapter1.machine'

interface Props {
  state: ChapterState
  onNextChapter?: () => void
  nextChapterLabel?: string
  onRefine?: (section: RefineSection) => void
}

type ViewMode = 'preview' | 'source'
type ActivePanel = 'draft' | 'references'

const REFINE_OPTIONS: { section: RefineSection; label: string; description: string }[] = [
  { section: 'background',  label: 'Background & Context',  description: 'Regenerate all narrative sections with fresh citations' },
  { section: 'rqs',         label: 'Research Questions',    description: 'Go back and change which questions you selected' },
  { section: 'objectives',  label: 'Research Objectives',   description: 'Go back and adjust your study objectives' },
  { section: 'references',  label: 'References List',       description: 'Re-extract and reformat the APA reference list' },
]

// Maps chapterId to human-readable label and filename slug
const CHAPTER_META: Record<string, { label: string; slug: string }> = {
  'chapter-1': { label: 'Chapter 1', slug: 'chapter-1' },
  'chapter-2': { label: 'Chapter 2', slug: 'chapter-2' },
  'chapter-3': { label: 'Chapter 3', slug: 'chapter-3' },
  'chapter-4': { label: 'Chapter 4', slug: 'chapter-4' },
  'chapter-5': { label: 'Chapter 5', slug: 'chapter-5' },
}

export function DraftReviewStep({ state, onNextChapter, nextChapterLabel, onRefine }: Props) {
  const markdown   = state.artifacts.compiledDraft ?? ''
  const references = state.artifacts.ch1_references ?? ''

  const chapterMeta = CHAPTER_META[state.chapterId] ?? { label: 'Chapter', slug: 'chapter' }
  const draftFilename = `${chapterMeta.slug}.md`

  const [view, setView]           = useState<ViewMode>('preview')
  const [panel, setPanel]         = useState<ActivePanel>('draft')
  const [copied, setCopied]       = useState(false)
  const [showRefine, setShowRefine] = useState(false)

  const activeContent = panel === 'draft' ? markdown : references

  async function handleCopy() {
    const full = markdown + (references ? '\n\n' + references : '')
    await navigator.clipboard.writeText(full)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const full = markdown + (references ? '\n\n---\n\n' + references : '')
    const blob = new Blob([full], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = draftFilename
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
            Review your {chapterMeta.label} draft{references ? ' and references' : ''}, then download or refine any section.
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
                Copy all
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
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Research Questions',  value: state.artifacts.selectedRqs?.length ?? 0 },
          { label: 'Objectives',          value: state.artifacts.selectedObjectives?.length ?? 0 },
          { label: 'Definition of Terms', value: state.artifacts.definitions?.length ?? 0 },
          { label: 'References',          value: references ? references.split('\n\n').length - 1 : 0 },
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
          {/* Draft / References panel switcher */}
          <div className="flex items-center gap-px rounded border border-border overflow-hidden">
            {([
              { key: 'draft',      label: 'Chapter Draft' },
              { key: 'references', label: 'References' },
            ] as { key: ActivePanel; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPanel(key)}
                className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer
                  ${panel === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {panel === 'draft' ? draftFilename : 'references.md'}
            </span>
            {/* Preview / Source toggle */}
            <div className="flex items-center gap-px rounded border border-border overflow-hidden">
              {(['preview', 'source'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer
                    ${view === mode
                      ? 'bg-primary/10 text-primary'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {mode === 'preview' ? 'Preview' : 'Source'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[640px] overflow-y-auto bg-muted/20 p-4">
          {panel === 'references' && !references ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-8 text-muted-foreground">
              <svg className="size-8 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-medium">References not generated yet</p>
              <p className="text-xs mt-1">Use the Refine panel below to generate the references list.</p>
            </div>
          ) : view === 'preview' ? (
            <div className="prose-manuscript-page max-w-[720px] mx-auto">
              <article
                className={`prose-manuscript px-14 py-12 ${panel === 'references' ? 'prose-manuscript-refs' : ''}`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeContent}
                </ReactMarkdown>
              </article>
            </div>
          ) : (
            <pre className="p-5 text-xs font-mono text-foreground/75 whitespace-pre-wrap leading-relaxed bg-card rounded border border-border">
              {activeContent}
            </pre>
          )}
        </div>
      </div>

      {/* ── Refine Panel ── */}
      {onRefine && (
        <div className="rounded border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRefine(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="text-sm font-medium text-foreground">Refine a section</span>
              <span className="text-xs text-muted-foreground">— regenerate or edit any part of Chapter 1</span>
            </div>
            <svg
              className={`size-4 text-muted-foreground transition-transform ${showRefine ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showRefine && (
            <div className="px-4 py-4 grid grid-cols-2 gap-2 bg-card">
              {REFINE_OPTIONS.map(({ section, label, description }) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => { onRefine(section); setShowRefine(false) }}
                  className="flex flex-col gap-1 rounded border border-border p-3 text-left
                             hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    {label}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    {description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Next chapter ── */}
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
