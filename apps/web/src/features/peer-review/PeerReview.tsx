import { useEffect, useState } from 'react'
import { Users, Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle, ThumbsUp, Gavel } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { getResearchItems } from '@/lib/db/research-repository'
import { runPeerReviewWorkflow, type PeerReviewResult, type PeerReviewPhase } from '@/lib/ai/workflows/peer-review'
import type { ResearchItem } from '@/lib/db/database'
import { cn } from '@/lib/utils'

interface PeerReviewProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string
}

const VERDICT_COLOR: Record<string, string> = {
  'Accept': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'Accept with minor revisions': 'text-blue-600 bg-blue-50 border-blue-200',
  'Major revisions required': 'text-amber-600 bg-amber-50 border-amber-200',
  'Reject and resubmit': 'text-rose-600 bg-rose-50 border-rose-200',
}

const SEVERITY_COLOR: Record<string, string> = {
  minor: 'text-blue-600 bg-blue-50 border-blue-200',
  moderate: 'text-amber-600 bg-amber-50 border-amber-200',
  major: 'text-rose-600 bg-rose-50 border-rose-200',
}

type UIPhase = 'idle' | PeerReviewPhase | 'done'

const PHASE_STEPS: PeerReviewPhase[] = ['skeptic', 'advocate', 'synthesis']

export function PeerReview({ onRunStart, userId }: PeerReviewProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PeerReviewResult | null>(null)
  const [phase, setPhase] = useState<UIPhase>('idle')
  const [expanded, setExpanded] = useState<'skeptic' | 'advocate' | null>('skeptic')

  useEffect(() => {
    getResearchItems(userId)
      .then(data => {
        setItems(data)
        if (data[0]?.id) setSelectedItemId(data[0].id)
      })
      .finally(() => setLoadingItems(false))
  }, [userId])

  const selectedItem = items.find(i => i.id === selectedItemId)

  const handleRun = async () => {
    if (!selectedItem?.id) return
    setLoading(true)
    setError(null)
    setResult(null)
    setPhase('skeptic')

    try {
      const { runId, result: r } = await runPeerReviewWorkflow(
        selectedItem.id,
        selectedItem.sourceText,
        (p) => setPhase(p)  // driven by actual workflow progress, not timers
      )
      onRunStart(runId, selectedItem.title)
      setResult(r)
      setPhase('done')
      setExpanded('skeptic')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Peer review failed. Check your API key and try again.')
      setPhase('idle')
    } finally {
      setLoading(false)
    }
  }

  const phaseIndex = (p: UIPhase) => PHASE_STEPS.indexOf(p as PeerReviewPhase)

  return (
    <div className="px-5 py-5 max-w-2xl mx-auto w-full space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Peer Review</h1>
          <Badge variant="secondary" className="text-xs">Multi-Agent</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          A Skeptic and an Advocate debate your research. An Editor delivers the final verdict.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {loadingItems && <div className="h-9 bg-muted rounded-lg animate-pulse" />}

          {!loadingItems && items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No research items yet. Add one from the Dashboard first.
            </p>
          )}

          {!loadingItems && items.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Research Item
              </label>
              <select
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedItemId ?? ''}
                onChange={e => setSelectedItemId(Number(e.target.value))}
                disabled={loading}
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
          )}

          <Button className="w-full gap-2" onClick={handleRun} disabled={loading || !selectedItem}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {phase === 'skeptic'   && 'Skeptic is analyzing…'}
                {phase === 'advocate'  && 'Advocate is responding…'}
                {phase === 'synthesis' && 'Editor is synthesizing…'}
              </>
            ) : (
              <><Sparkles className="w-4 h-4" /> Start Peer Review</>
            )}
          </Button>

          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/5 rounded-lg px-3 py-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Live phase progress chips */}
      {(loading || phase === 'done') && (
        <div className="grid grid-cols-3 gap-2">
          {PHASE_STEPS.map((p, i) => {
            const cur = phaseIndex(phase)
            const isDone = phase === 'done' || cur > i
            const isActive = !isDone && cur === i
            return (
              <div key={p} className={cn(
                'rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all',
                isDone   && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                isActive && 'border-primary/30 bg-primary/5 text-primary',
                !isDone && !isActive && 'border-muted text-muted-foreground opacity-40'
              )}>
                {isActive && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                {p === 'skeptic' ? 'Skeptic' : p === 'advocate' ? 'Advocate' : 'Editor'}
              </div>
            )
          })}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Editorial verdict */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Editorial Verdict</h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded border',
                  VERDICT_COLOR[result.synthesis.overallVerdict] ?? 'text-muted-foreground bg-muted border-muted'
                )}>
                  {result.synthesis.overallVerdict}
                </span>
                <span className="text-sm font-black text-primary">{result.synthesis.consensusScore}/10</span>
              </div>
              {result.synthesis.summary && (
                <p className="text-sm text-muted-foreground">{result.synthesis.summary}</p>
              )}
              {(result.synthesis.priorityActions ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Priority Actions</p>
                  <ul className="space-y-1">
                    {(result.synthesis.priorityActions ?? []).map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skeptic vs Advocate */}
          <div className="grid grid-cols-2 gap-3">
            {/* Skeptic card */}
            <Card className="border-rose-200">
              <CardContent className="p-3 space-y-2">
                <button className="w-full flex items-center gap-2" onClick={() => setExpanded(expanded === 'skeptic' ? null : 'skeptic')}>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-xs font-bold text-rose-700 flex-1 text-left">Skeptic</span>
                  <Badge variant="outline" className={cn('text-[10px] border', SEVERITY_COLOR[result.skeptic.severity] ?? 'text-muted-foreground')}>
                    {result.skeptic.severity}
                  </Badge>
                  {expanded === 'skeptic' ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                <p className="text-xs text-rose-800 italic line-clamp-2">"{result.skeptic.verdict}"</p>
                {expanded === 'skeptic' && (
                  <div className="space-y-2 pt-2 border-t border-rose-100">
                    {[
                      { label: 'Weaknesses', items: result.skeptic.weaknesses ?? [] },
                      { label: 'Methodology Gaps', items: result.skeptic.methodologyGaps ?? [] },
                      { label: 'Counterarguments', items: result.skeptic.counterarguments ?? [] },
                    ].map(({ label, items: list }) => list.length > 0 && (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{label}</p>
                        <ul className="space-y-0.5">
                          {list.map((item, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex gap-1">
                              <span className="text-rose-400 shrink-0">·</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Advocate card */}
            <Card className="border-emerald-200">
              <CardContent className="p-3 space-y-2">
                <button className="w-full flex items-center gap-2" onClick={() => setExpanded(expanded === 'advocate' ? null : 'advocate')}>
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-emerald-700 flex-1 text-left">Advocate</span>
                  {expanded === 'advocate' ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                </button>
                <p className="text-xs text-emerald-800 italic line-clamp-2">"{result.advocate.verdict}"</p>
                {expanded === 'advocate' && (
                  <div className="space-y-2 pt-2 border-t border-emerald-100">
                    {[
                      { label: 'Strengths', items: result.advocate.strengths ?? [] },
                      { label: 'Contributions', items: result.advocate.contributions ?? [] },
                      { label: 'Rebuttals to Skeptic', items: result.advocate.rebuttals ?? [] },
                    ].map(({ label, items: list }) => list.length > 0 && (
                      <div key={label}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{label}</p>
                        <ul className="space-y-0.5">
                          {list.map((item, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground flex gap-1">
                              <span className="text-emerald-500 shrink-0">·</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {result.advocate.potential && (
                      <p className="text-[11px] text-emerald-700 italic pt-1 border-t border-emerald-100">
                        {result.advocate.potential}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
