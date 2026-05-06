import { useEffect, useState } from 'react'
import { Bookmark, Sparkles, Loader2, Copy, Check, ExternalLink, WifiOff, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { db } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { runCitationWorkflow, type CitationResult, type Reference } from '@/lib/ai/workflows/citation-engine'
import type { ResearchItem } from '@/lib/db/database'
import { cn } from '@/lib/utils'

type CitationStyle = 'apa7' | 'mla9' | 'chicago17'

interface CitationEngineProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string
}

// ── Citation formatters ──────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map(p => p[0] ? p[0] + '.' : '').filter(Boolean).slice(1).join(' ')
}

function authorAPA(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author'
  const fmt = (a: string) => {
    const parts = a.split(',').map(s => s.trim())
    if (parts.length >= 2) return `${parts[0]}, ${initials(parts[1])}`
    const ws = a.trim().split(' ')
    return ws.length > 1 ? `${ws[ws.length - 1]}, ${ws.slice(0, -1).map(p => p[0] + '.').join(' ')}` : a
  }
  if (authors.length === 1) return fmt(authors[0])
  if (authors.length <= 20) return authors.slice(0, -1).map(fmt).join(', ') + ', & ' + fmt(authors[authors.length - 1])
  return authors.slice(0, 19).map(fmt).join(', ') + '... ' + fmt(authors[authors.length - 1])
}

function authorMLA(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author'
  const first = authors[0].includes(',') ? authors[0] : (() => {
    const ws = authors[0].trim().split(' ')
    return ws.length > 1 ? `${ws[ws.length - 1]}, ${ws.slice(0, -1).join(' ')}` : authors[0]
  })()
  if (authors.length === 1) return first
  if (authors.length === 2) return `${first}, and ${authors[1]}`
  return `${first}, et al.`
}

function authorChicago(authors: string[]): string {
  if (authors.length === 0) return 'Unknown Author'
  const fmt = (a: string, first: boolean) => {
    if (!first) {
      const parts = a.split(',').map(s => s.trim())
      return parts.length >= 2 ? `${parts[1]} ${parts[0]}` : a
    }
    return a.includes(',') ? a : (() => {
      const ws = a.trim().split(' ')
      return ws.length > 1 ? `${ws[ws.length - 1]}, ${ws.slice(0, -1).join(' ')}` : a
    })()
  }
  if (authors.length === 1) return fmt(authors[0], true)
  if (authors.length <= 3) return [fmt(authors[0], true), ...authors.slice(1).map(a => fmt(a, false))].join(', ')
  return fmt(authors[0], true) + ', et al.'
}

export function formatCitation(ref: Reference, style: CitationStyle): string {
  const year = ref.year ? `${ref.year}` : 'n.d.'
  const doiSuffix = ref.doi ? ` https://doi.org/${ref.doi}` : ref.url ? ` ${ref.url}` : ''

  switch (style) {
    case 'apa7': {
      const authors = authorAPA(ref.authors)
      const journal = ref.journal ? ` *${ref.journal}*.` : '.'
      return `${authors} (${year}). ${ref.title}.${journal}${doiSuffix}`
    }
    case 'mla9': {
      const authors = authorMLA(ref.authors)
      const journal = ref.journal ? ` *${ref.journal}*,` : ''
      return `${authors}. "${ref.title}."${journal} ${year}.${ref.doi ? ` https://doi.org/${ref.doi}` : ''}`
    }
    case 'chicago17': {
      const authors = authorChicago(ref.authors)
      const journal = ref.journal ? ` *${ref.journal}*` : ''
      return `${authors}. "${ref.title}."${journal} (${year}).${doiSuffix}`
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

const STYLE_LABELS: Record<CitationStyle, string> = {
  apa7:      'APA 7',
  mla9:      'MLA 9',
  chicago17: 'Chicago 17',
}

export function CitationEngine({ onRunStart, userId }: CitationEngineProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [style, setStyle] = useState<CitationStyle>('apa7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CitationResult | null>(null)
  const [loadingItems, setLoadingItems] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    getResearchItems(userId)
      .then(data => { setItems(data); if (data[0]?.id) setSelectedId(data[0].id) })
      .finally(() => setLoadingItems(false))
  }, [userId])

  // Load cached result for selected item
  useEffect(() => {
    if (!selectedId) return
    setResult(null)
    db.aiRuns
      .where('researchItemId').equals(selectedId)
      .filter(r => r.prompt === 'Citation Engine' && r.status === 'completed')
      .last()
      .then(run => {
        if (run?.output) {
          try { setResult(JSON.parse(run.output)) } catch { /* corrupted */ }
        }
      })
  }, [selectedId])

  const handleRun = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    setResult(null)

    const item = items.find(i => i.id === selectedId)
    try {
      const { runId, result: res } = await runCitationWorkflow(selectedId)
      onRunStart(runId, item?.title ?? 'Research item')
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const copyOne = async (ref: Reference) => {
    await navigator.clipboard.writeText(formatCitation(ref, style))
    setCopiedId(ref.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const copyAll = async () => {
    if (!result) return
    const text = result.references.map((r, i) => `${i + 1}. ${formatCitation(r, style)}`).join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1800)
  }

  const selectedItem = items.find(i => i.id === selectedId)

  return (
    <div className="px-5 py-5 max-w-2xl mx-auto w-full space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Citation Engine</h1>
          <Badge variant="secondary" className="text-xs">Phase 10</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Finds real academic references and formats them in APA 7, MLA 9, or Chicago 17.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Research Item
            </label>
            {loadingItems ? (
              <div className="h-9 bg-muted animate-pulse rounded-lg" />
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No research items yet. Create one first.</p>
            ) : (
              <select
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedId ?? ''}
                onChange={e => setSelectedId(Number(e.target.value))}
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            )}
          </div>

          {selectedItem && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 rounded-lg px-3 py-2">
              {selectedItem.sourceText}
            </p>
          )}

          {/* Style selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Citation Style
            </label>
            <div className="flex gap-1.5">
              {(Object.keys(STYLE_LABELS) as CitationStyle[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-xs font-semibold border transition-colors',
                    style === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleRun}
            disabled={loading || !selectedId || items.length === 0}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
              : <><Sparkles className="w-4 h-4" /> Find References</>
            }
          </Button>

          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/5 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold">
                {result.references.length} reference{result.references.length !== 1 ? 's' : ''} found
              </span>
              {result.offline && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> Offline mode
                </span>
              )}
            </div>
            {result.references.length > 0 && (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={copyAll}>
                {copiedAll ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Copy all
              </Button>
            )}
          </div>

          {/* Search terms */}
          {result.terms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Terms used:</span>
              {result.terms.map((t, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Reference cards */}
          <div className="space-y-2">
            {result.references.map((ref, i) => (
              <ReferenceCard
                key={ref.id}
                ref={ref}
                index={i + 1}
                style={style}
                copied={copiedId === ref.id}
                expanded={expandedId === ref.id}
                onCopy={() => copyOne(ref)}
                onToggle={() => setExpandedId(expandedId === ref.id ? null : ref.id)}
              />
            ))}
          </div>

          {result.references.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No references found. Try a research item with more specific academic content.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ReferenceCardProps {
  ref: Reference
  index: number
  style: CitationStyle
  copied: boolean
  expanded: boolean
  onCopy: () => void
  onToggle: () => void
}

function ReferenceCard({ ref, index, style, copied, expanded, onCopy, onToggle }: ReferenceCardProps) {
  const citation = formatCitation(ref, style)

  return (
    <Card className={cn('transition-shadow', expanded && 'ring-1 ring-primary/20 shadow-sm')}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          {/* Index */}
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5">
            {index}
          </span>

          <div className="flex-1 min-w-0">
            {/* Title + year */}
            <div className="flex items-start gap-2 flex-wrap">
              <p className="text-sm font-semibold leading-snug flex-1">{ref.title}</p>
              {ref.year && (
                <span className="text-xs text-muted-foreground shrink-0">{ref.year}</span>
              )}
            </div>

            {/* Authors + journal */}
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {ref.authors.slice(0, 3).join(', ')}{ref.authors.length > 3 ? ' et al.' : ''}
              {ref.journal && <span className="italic"> · {ref.journal}</span>}
            </p>

            {/* Formatted citation */}
            <p className="text-xs text-foreground/80 mt-2 leading-relaxed bg-muted/30 rounded-md px-2.5 py-2 font-mono">
              {citation}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={onCopy}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy citation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Toggle details"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="pl-9 space-y-2 pt-1 border-t mt-2">
            {ref.abstract && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                {ref.abstract}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="capitalize bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                {ref.source === 'semantic_scholar' ? 'Semantic Scholar' : 'CrossRef'}
              </span>
              {ref.citationCount > 0 && (
                <span>{ref.citationCount.toLocaleString()} citations</span>
              )}
              {ref.doi && (
                <span className="font-mono">DOI: {ref.doi}</span>
              )}
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View paper <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
