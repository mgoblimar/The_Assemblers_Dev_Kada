import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AIRun, ResearchItem, db } from '@/lib/db/database'
import { getAIRunsForItem } from '@/lib/db/research-repository'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  FileText, Loader2, Sparkles, CheckCircle2, XCircle, Clock, History, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ResearchDetailsModalProps {
  itemId: number | null
  onClose: () => void
}

type Tab = 'report' | 'source' | 'history'

export function ResearchDetailsModal({ itemId, onClose }: ResearchDetailsModalProps) {
  const [item, setItem] = useState<ResearchItem | null>(null)
  const [aiRuns, setAiRuns] = useState<AIRun[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('report')
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null)

  useEffect(() => {
    if (!itemId) {
      setItem(null)
      setAiRuns([])
      return
    }
    setTab('report')

    const load = async () => {
      setLoading(true)
      try {
        const foundItem = await db.researchItems.get(itemId)
        if (foundItem) {
          setItem(foundItem)
          const runs = await getAIRunsForItem(itemId)
          setAiRuns(runs)
          if (runs.length > 0) setExpandedRunId(runs[0].id ?? null)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [itemId])

  const latestRun = aiRuns[0] ?? null
  const olderRuns = aiRuns.slice(1)

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-snug truncate pr-2">{item?.title ?? '…'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item ? new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                {latestRun && (
                  <> &middot; {latestRun.provider} &middot; {latestRun.model}</>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['report', 'source', 'history'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize',
                  tab === t
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {t}
                {t === 'history' && aiRuns.length > 0 && (
                  <span className="ml-1.5 bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {aiRuns.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-primary/30" />
                <p className="text-sm text-muted-foreground">Loading…</p>
              </div>
            ) : (
              <>
                {/* ── Report tab ── */}
                {tab === 'report' && (
                  <>
                    {!latestRun ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-semibold">No analysis yet</p>
                        <p className="text-xs text-muted-foreground">Click Analyze on this item to generate a report.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Run status + steps */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <RunStatusBadge status={latestRun.status} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(latestRun.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {latestRun.steps && latestRun.steps.length > 0 && (
                          <div className="flex gap-2">
                            {latestRun.steps.map((step, i) => (
                              <div key={i} className={cn(
                                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                                step.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                step.status === 'failed'    ? 'border-destructive/20 bg-destructive/5 text-destructive' :
                                                              'border-muted bg-muted/50 text-muted-foreground'
                              )}>
                                {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                                 step.status === 'failed'    ? <XCircle className="w-3 h-3" /> :
                                                               <Clock className="w-3 h-3" />}
                                {step.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Output */}
                        {latestRun.status === 'failed' ? (
                          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                            <p className="font-semibold mb-1">Analysis failed</p>
                            <p className="text-xs opacity-80">{latestRun.output || 'Unknown error'}</p>
                          </div>
                        ) : latestRun.output ? (
                          <div className="rounded-xl border bg-card p-5">
                            <div className="prose prose-sm max-w-none
                              prose-headings:font-bold prose-headings:text-foreground
                              prose-p:text-muted-foreground prose-p:leading-relaxed
                              prose-li:text-muted-foreground
                              prose-strong:text-foreground
                              prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {latestRun.output}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No output captured.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ── Source tab ── */}
                {tab === 'source' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5" />
                      Source Text
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item?.sourceText || '—'}
                    </div>
                  </div>
                )}

                {/* ── History tab ── */}
                {tab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <History className="w-3.5 h-3.5" />
                      All Runs
                    </div>

                    {aiRuns.length === 0 ? (
                      <div className="text-center py-12 rounded-xl border-2 border-dashed">
                        <Sparkles className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No runs yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {aiRuns.map((run, idx) => (
                          <HistoryRunRow
                            key={run.id}
                            run={run}
                            isLatest={idx === 0}
                            expanded={expandedRunId === run.id}
                            onToggle={() => setExpandedRunId(expandedRunId === run.id ? null : (run.id ?? null))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!loading && item && tab === 'report' && olderRuns.length > 0 && (
          <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{olderRuns.length} older run{olderRuns.length !== 1 ? 's' : ''}</p>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setTab('history')}>
              View history
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RunStatusBadge({ status }: { status: AIRun['status'] }) {
  if (status === 'completed') return (
    <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 border hover:bg-emerald-50">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </Badge>
  )
  if (status === 'failed') return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="w-3 h-3" /> Failed
    </Badge>
  )
  return (
    <Badge variant="secondary" className="gap-1">
      <Loader2 className="w-3 h-3 animate-spin" /> Running
    </Badge>
  )
}

function HistoryRunRow({
  run, isLatest, expanded, onToggle,
}: {
  run: AIRun
  isLatest: boolean
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-shadow',
      isLatest ? 'border-primary/20 shadow-sm' : 'border-border'
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{run.prompt}</span>
            {isLatest && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Latest</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(run.createdAt).toLocaleString()} &middot; {run.model}
          </p>
        </div>
        <RunStatusBadge status={run.status} />
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t bg-muted/10">
          {run.steps && run.steps.length > 0 && (
            <div className="flex gap-2 pt-3 pb-3">
              {run.steps.map((step, i) => (
                <div key={i} className={cn(
                  'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                  step.status === 'completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                  step.status === 'failed'    ? 'border-destructive/20 bg-destructive/5 text-destructive' :
                                                'border-muted text-muted-foreground'
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                  {step.name}
                </div>
              ))}
            </div>
          )}
          <div className="prose prose-sm max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {run.output || '_No output._'}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
