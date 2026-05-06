import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AIRun, ResearchItem, db } from '@/lib/db/database'
import { getResearchItems, getAIRunsForItem } from '@/lib/db/research-repository'
import { ResearchCard } from './ResearchCard'
import { Badge } from '@/shared/components/ui/badge'
import { FileText, Loader2, Sparkles, Brain, MessageSquare, History } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

interface ResearchListProps {
  userId?: string
  refreshTrigger: number
  activeRunId: number | null
  onAnalyze: (item: ResearchItem) => void
  onItemCountChange: (count: number) => void
}

export function ResearchList({ userId, refreshTrigger, activeRunId, onAnalyze, onItemCountChange }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [aiRunCounts, setAiRunCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)
  const [aiRuns, setAiRuns] = useState<AIRun[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'quantitative' | 'qualitative' | 'mixed'>('all')

  const closeDetails = () => {
    setSelectedItem(null)
    setAiRuns([])
  }

  const openDetails = async (item: ResearchItem) => {
    if (!item.id) return
    setSelectedItem(item)
    setDetailsLoading(true)
    try {
      const runs = await getAIRunsForItem(item.id)
      setAiRuns(runs)
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
        const data = await getResearchItems(userId)
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
  }, [refreshTrigger, onItemCountChange, userId])

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

  function detectItemType(title: string, text: string): 'quantitative' | 'qualitative' | 'mixed' | 'other' {
    const s = (title + ' ' + text).toLowerCase()
    const quant = /\b(quantitative|regression|anova|correlation|survey|statistics|coefficient|p-value|sample size|hypothesis test)\b/.test(s)
    const qual  = /\b(qualitative|thematic|narrative|interview|ethnograph|grounded theory|discourse|content analysis)\b/.test(s)
    if (quant && qual) return 'mixed'
    if (quant) return 'quantitative'
    if (qual)  return 'qualitative'
    return 'other'
  }

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => detectItemType(item.title, item.sourceText) === filter)

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
          {filteredItems.length}{filter !== 'all' ? ` / ${items.length}` : ''} item{items.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Empty filtered state */}
      {filteredItems.length === 0 && (
        <div className="rounded-xl border-2 border-dashed py-10 flex flex-col items-center gap-2 text-center px-6">
          <FileText className="w-6 h-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No {filter} research items found.</p>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => (
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
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="rounded-full">Full Insight View</Badge>
              {selectedItem && (
                <Badge variant={selectedItem.syncStatus === 'synced' ? 'success' : 'warning'} className="capitalize">
                  {selectedItem.syncStatus}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">{selectedItem?.title}</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
              Created {selectedItem && new Date(selectedItem.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-8">
              {/* Source Content */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                  <FileText className="w-3.5 h-3.5" />
                  Source Text
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {selectedItem?.sourceText}
                </div>
              </section>

              {/* AI History */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                  <History className="w-3.5 h-3.5" />
                  AI Analysis History
                </div>

                {detailsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                  </div>
                ) : aiRuns.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No AI analysis runs yet.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Generate a summary or deep insight to see results here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {aiRuns.map((run) => (
                      <div key={run.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div className="bg-gray-50/80 px-5 py-3 border-b flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              run.steps && run.steps.length > 0 ? "bg-purple-100 text-purple-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                              {run.steps && run.steps.length > 0 ? (
                                <Brain className="w-4 h-4" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-700">
                                {run.steps && run.steps.length > 0 ? 'Deep Insight' : 'Quick Summary'}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[9px] h-4 bg-white font-medium uppercase tracking-tighter">
                                  {run.provider} • {run.model}
                                </Badge>
                                <Badge variant={run.status === 'completed' ? 'success' : 'destructive'} className="text-[9px] h-4 uppercase px-1.5">
                                  {run.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">
                            {new Date(run.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="p-5 space-y-5">
                          {/* Prompt Section */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <MessageSquare className="w-3 h-3" />
                              Prompt Sent
                            </div>
                            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-[11px] font-mono leading-relaxed max-h-40 overflow-y-auto border border-slate-800 shadow-inner">
                              {run.prompt}
                            </div>
                          </div>

                          {/* Output Section */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              <Sparkles className="w-3 h-3" />
                              AI Output
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800 bg-indigo-50/20 p-5 rounded-xl border border-indigo-100/50 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {run.output || 'No output captured.'}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
