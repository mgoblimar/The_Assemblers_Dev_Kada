import { useEffect, useState } from 'react'
import { BarChart3, Sparkles, Loader2, ChevronDown, ChevronUp, WifiOff, Trophy, Info } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { db } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { runAnalysisAdvisorWorkflow, type AdvisorResult } from '@/lib/ai/workflows/analysis-advisor'
import type { ResearchItem } from '@/lib/db/database'
import { cn } from '@/lib/utils'

interface AnalysisAdvisorProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string
}

const COMPLEXITY_COLOR: Record<string, string> = {
  basic:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced:     'bg-rose-50 text-rose-700 border-rose-200',
}

const PARADIGM_COLOR: Record<string, string> = {
  quantitative: 'bg-blue-50 text-blue-700 border-blue-200',
  qualitative:  'bg-rose-50 text-rose-700 border-rose-200',
  mixed:        'bg-amber-50 text-amber-700 border-amber-200',
}

export function AnalysisAdvisor({ onRunStart, userId }: AnalysisAdvisorProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AdvisorResult | null>(null)
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    getResearchItems(userId)
      .then(data => { setItems(data); if (data[0]?.id) setSelectedId(data[0].id) })
      .finally(() => setLoadingItems(false))
  }, [userId])

  // Load cached advisor result for selected item
  useEffect(() => {
    if (!selectedId) return
    setResult(null)
    db.aiRuns
      .where('researchItemId').equals(selectedId)
      .filter(r => r.prompt === 'Analysis Advisor' && r.status === 'completed')
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
    setShowGuide(false)

    const item = items.find(i => i.id === selectedId)
    try {
      const { runId, result: res } = await runAnalysisAdvisorWorkflow(selectedId)
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
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Analysis Advisor</h1>
          <Badge variant="secondary" className="text-xs">Phase 9</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Recommends the right statistical or qualitative methods for your research.
        </p>
      </div>

      {/* Item selector + run */}
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
              : <><Sparkles className="w-4 h-4" /> Run Analysis Advisor</>
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
          {/* Paradigm summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Research Paradigm Detected
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('inline-flex items-center text-sm font-bold px-3 py-1 rounded-full border capitalize', PARADIGM_COLOR[result.paradigm])}>
                      {result.paradigm}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                    {result.offline && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <WifiOff className="w-3 h-3" /> Offline mode
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  {result.sample_size && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Sample:</span> {result.sample_size}
                    </p>
                  )}
                  {result.data_types.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Data:</span> {result.data_types.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {result.key_features.length > 0 && (
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                  {result.key_features.map((f, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Method recommendations */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Recommended Methods
            </h2>

            {result.recommendations.map((method) => (
              <Card
                key={method.id}
                className={cn('transition-shadow', expandedMethod === method.id && 'ring-1 ring-primary/20 shadow-sm')}
              >
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-start gap-3">
                    {/* Rank badge */}
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0',
                      method.rank === 1 ? 'bg-primary text-primary-foreground' :
                      method.rank === 2 ? 'bg-muted-foreground/20 text-muted-foreground' :
                                         'bg-muted text-muted-foreground/60'
                    )}>
                      #{method.rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">{method.name}</h3>
                        <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded border capitalize', COMPLEXITY_COLOR[method.complexity])}>
                          {method.complexity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {method.description}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedMethod(expandedMethod === method.id ? null : method.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedMethod === method.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </CardHeader>

                {expandedMethod === method.id && (
                  <CardContent className="px-4 pb-4 pt-3 space-y-3">
                    <div className="h-px bg-border" />

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-muted-foreground mb-1">When to use</p>
                        <ul className="space-y-0.5">
                          {method.when_to_use.map((w, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary mt-0.5">·</span>
                              <span className="text-muted-foreground">{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Sample size</p>
                          <p className="text-muted-foreground">{method.sample_size}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Tools</p>
                          <div className="flex flex-wrap gap-1">
                            {method.tools.slice(0, 4).map((t, i) => (
                              <span key={i} className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {method.rank === 1 && result.guide && (
                      <div>
                        <button
                          onClick={() => setShowGuide(v => !v)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <Info className="w-3 h-3" />
                          {showGuide ? 'Hide' : 'Show'} Step-by-Step Guide
                        </button>
                        {showGuide && (
                          <div className="mt-2 bg-primary/5 rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-line border border-primary/10">
                            {result.guide}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
