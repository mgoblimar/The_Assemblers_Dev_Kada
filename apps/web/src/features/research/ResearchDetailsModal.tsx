import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AIRun, ResearchItem, db } from '@/lib/db/database'
import { getAIRunsForItem } from '@/lib/db/research-repository'
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
import { cn } from '@/lib/utils'

interface ResearchDetailsModalProps {
  itemId: number | null
  onClose: () => void
}

export function ResearchDetailsModal({ itemId, onClose }: ResearchDetailsModalProps) {
  const [item, setItem] = useState<ResearchItem | null>(null)
  const [aiRuns, setAiRuns] = useState<AIRun[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!itemId) {
      setItem(null)
      setAiRuns([])
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const foundItem = await db.researchItems.get(itemId)
        if (foundItem) {
          setItem(foundItem)
          const runs = await getAIRunsForItem(itemId)
          setAiRuns(runs)
        }
      } catch (err) {
        console.error('Failed to load research details:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [itemId])

  return (
    <Dialog open={!!itemId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {loading && !item ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
            <p className="text-sm text-muted-foreground font-medium">Loading details…</p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="rounded-full">Full Insight View</Badge>
                {item && (
                  <Badge variant={item.syncStatus === 'synced' ? 'success' : 'warning'} className="capitalize">
                    {item.syncStatus}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-gray-900">{item?.title}</DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                Created {item && new Date(item.createdAt).toLocaleString()}
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
                    {item?.sourceText}
                  </div>
                </section>

                {/* AI History */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    <History className="w-3.5 h-3.5" />
                    AI Analysis History
                  </div>

                  {loading ? (
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
