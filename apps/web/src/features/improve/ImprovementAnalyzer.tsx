import { useEffect, useState } from 'react'
import { PenLine, Sparkles, Loader2, ChevronDown, ChevronUp, WifiOff, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

import { Card, CardContent } from '@/shared/components/ui/card'
import { db } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { runImprovementWorkflow, type ImprovementResult } from '@/lib/ai/workflows/improvement-analyzer'
import type { ResearchItem } from '@/lib/db/database'
import { cn } from '@/lib/utils'

interface ImprovementAnalyzerProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string
}

function scoreColor(score: number): string {
  if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 4) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-rose-600 bg-rose-50 border-rose-200'
}

function scoreBar(score: number): string {
  if (score >= 7) return 'bg-emerald-400'
  if (score >= 4) return 'bg-amber-400'
  return 'bg-rose-400'
}

const SECTION_LABELS: Record<string, string> = {
  introduction:      'Introduction',
  literature_review: 'Literature Review',
  methodology:       'Methodology',
  results:           'Results',
  discussion:        'Discussion',
  conclusion:        'Conclusion',
  abstract:          'Abstract',
  general:           'General',
}

export function ImprovementAnalyzer({ onRunStart, userId }: ImprovementAnalyzerProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImprovementResult | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    getResearchItems(userId)
      .then(data => { setItems(data); if (data[0]?.id) setSelectedId(data[0].id) })
      .finally(() => setLoadingItems(false))
  }, [userId])

  // Load cached result
  useEffect(() => {
    if (!selectedId) return
    setResult(null)
    db.aiRuns
      .where('researchItemId').equals(selectedId)
      .filter(r => r.prompt === 'Improvement Analyzer' && r.status === 'completed')
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
      const { runId, result: res } = await runImprovementWorkflow(selectedId)
      onRunStart(runId, item?.title ?? 'Research item')
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedItem = items.find(i => i.id === selectedId)

  return (
    <div className="px-5 py-5 max-w-2xl mx-auto w-full space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Improvement Analyzer</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Scores coherence, audits arguments, detects gaps, and suggests rewrites.
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

          <Button
            className="w-full gap-2"
            onClick={handleRun}
            disabled={loading || !selectedId || items.length === 0}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              : <><Sparkles className="w-4 h-4" /> Analyze Writing</>
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
        <div className="space-y-4">
          {/* Score overview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Overall Writing Score
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-3xl font-black tabular-nums',
                      result.overallScore >= 7 ? 'text-emerald-600' :
                      result.overallScore >= 4 ? 'text-amber-600' : 'text-rose-600'
                    )}>
                      {result.overallScore}
                    </span>
                    <span className="text-lg text-muted-foreground font-medium">/10</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ml-1', scoreColor(result.overallScore))}>
                      {SECTION_LABELS[result.sectionType] ?? result.sectionType}
                    </span>
                    {result.offline && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <WifiOff className="w-3 h-3" /> Offline
                      </span>
                    )}
                  </div>
                  {result.coherenceSummary && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-md">
                      {result.coherenceSummary}
                    </p>
                  )}
                </div>

                {/* Score bar */}
                <div className="w-28">
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', scoreBar(result.overallScore))}
                      style={{ width: `${result.overallScore * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Argument issues */}
          {result.argumentIssues.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Argument Issues
              </h2>
              <div className="space-y-1">
                {result.argumentIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">·</span>
                    <span className="text-amber-800">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {result.gaps.length > 0 && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Gaps Detected
              </h2>
              <div className="space-y-1">
                {result.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    <span className="text-rose-500 mt-0.5 shrink-0">·</span>
                    <span className="text-rose-800">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paragraph feedback */}
          {result.paragraphs.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Paragraph Breakdown
              </h2>
              {result.paragraphs.map((para, i) => (
                <Card key={i} className={cn('transition-shadow', expandedIdx === i && 'ring-1 ring-primary/20 shadow-sm')}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className={cn('text-xs font-black px-1.5 py-0.5 rounded border shrink-0 mt-0.5', scoreColor(para.coherenceScore))}>
                        {para.coherenceScore}/10
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {para.text}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {expandedIdx === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {expandedIdx === i && (para.issues.length > 0 || para.suggestion) && (
                      <div className="mt-3 pt-3 border-t space-y-2 pl-9">
                        {para.issues.length > 0 && (
                          <ul className="space-y-0.5">
                            {para.issues.map((issue, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-amber-500 shrink-0">·</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        )}
                        {para.suggestion && (
                          <p className="text-xs text-primary font-medium leading-relaxed">
                            💡 {para.suggestion}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Top rewrite */}
          {result.topRewrite && (
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested Rewrite
              </h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Before</p>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg px-3 py-2 line-through decoration-muted-foreground/40">
                      {result.topRewrite.original}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground/40">
                    <div className="flex-1 h-px bg-border" />
                    <ArrowRight className="w-3.5 h-3.5" />
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">After</p>
                    <p className="text-xs text-foreground leading-relaxed bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                      {result.topRewrite.improved}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
