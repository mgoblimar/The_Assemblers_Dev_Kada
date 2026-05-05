import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AIRun, ResearchItem, db } from '@/lib/db/database'
import { getInsightRunsForResearchItem, getResearchItems } from '@/lib/db/research-repository'
import { ResearchCard } from './ResearchCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { FileText, Loader2, X, ScrollText, Sparkles } from 'lucide-react'

interface ResearchListProps {
  refreshTrigger: number
  activeRunId: number | null
  onAnalyze: (item: ResearchItem) => void
  onItemCountChange: (count: number) => void
}

export function ResearchList({ refreshTrigger, activeRunId, onAnalyze, onItemCountChange }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [aiRunCounts, setAiRunCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)
  const [selectedSummaryRun, setSelectedSummaryRun] = useState<AIRun | null>(null)
  const [selectedDeepRun, setSelectedDeepRun] = useState<AIRun | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'quantitative' | 'qualitative' | 'mixed'>('all')

  const closeDetails = () => {
    setSelectedItem(null)
    setSelectedSummaryRun(null)
    setSelectedDeepRun(null)
  }

  const openDetails = async (item: ResearchItem) => {
    if (!item.id) return
    setSelectedItem(item)
    setDetailsLoading(true)
    try {
      const { summaryRun, deepRun } = await getInsightRunsForResearchItem(item.id)
      setSelectedSummaryRun(summaryRun ?? null)
      setSelectedDeepRun(deepRun ?? null)
    } catch {
      /* no-op */
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getResearchItems()
        setItems(data)
        onItemCountChange(data.length)

        const counts: Record<number, number> = {}
        await Promise.all(
          data.map(async (item) => {
            if (item.id) {
              counts[item.id] = await db.aiRuns.where('researchItemId').equals(item.id).count()
            }
          })
        )
        setAiRunCounts(counts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research items')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refreshTrigger, onItemCountChange])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
        <p className="text-sm text-muted-foreground font-medium">Loading your research…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-destructive text-sm font-medium">Error: {error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed py-16 flex flex-col items-center gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">No research yet</p>
        <p className="text-sm text-muted-foreground">Create your first item using the form above.</p>
      </div>
    )
  }

  const FILTERS = [
    { key: 'all',          label: 'All' },
    { key: 'quantitative', label: 'Quantitative' },
    { key: 'qualitative',  label: 'Qualitative' },
    { key: 'mixed',        label: 'Mixed' },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <Badge variant="secondary" className="text-xs font-semibold">
          {items.length} items
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ResearchCard
            key={item.id}
            item={item}
            aiRunCount={item.id ? (aiRunCounts[item.id] ?? 0) : 0}
            isAnalyzing={activeRunId !== null}
            onAnalyze={onAnalyze}
            onViewDetails={openDetails}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeDetails}
        >
          <Card
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden border-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-muted/30">
              <div className="space-y-1.5">
                <Badge variant="secondary">Full Insight View</Badge>
                <CardTitle className="text-xl">{selectedItem.title}</CardTitle>
                <CardDescription>
                  Created {new Date(selectedItem.createdAt).toLocaleString()} · {selectedItem.syncStatus}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDetails}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="grid max-h-[calc(90vh-100px)] gap-6 overflow-y-auto p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <ScrollText className="h-4 w-4" /> Full Source
                  </div>
                  <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                    {selectedItem.sourceText}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Sparkles className="h-4 w-4" /> Latest AI Insight
                  </div>
                  {detailsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : selectedSummaryRun || selectedDeepRun ? (
                    <div className="space-y-4">
                      {([selectedSummaryRun, selectedDeepRun] as (AIRun | null)[])
                        .filter((r): r is AIRun => r !== null)
                        .map((run) => (
                          <div key={run.id} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'destructive' : 'warning'}>
                                {run.status}
                              </Badge>
                              <Badge variant="outline">{run.provider}</Badge>
                              <Badge variant="outline">{run.model}</Badge>
                            </div>
                            <div className="rounded-lg border bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {run.output || 'No output yet.'}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No AI insight yet. Click Analyze on the card to generate one.
                    </p>
                  )}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-600">Metadata</h3>
                  <dl className="space-y-3 text-sm">
                    {([
                      ['Status',  selectedItem.syncStatus],
                      ['Created', new Date(selectedItem.createdAt).toLocaleString()],
                      ['Updated', new Date(selectedItem.updatedAt).toLocaleString()],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="font-medium text-slate-800 text-right capitalize">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </aside>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
