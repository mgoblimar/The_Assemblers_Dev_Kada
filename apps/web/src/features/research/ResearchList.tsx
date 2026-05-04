import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AIRun, ResearchItem } from '@/lib/db/database'
import { getInsightRunsForResearchItem, getResearchItems } from '@/lib/db/research-repository'
import { ResearchAI } from './ResearchAI'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Calendar, ChevronRight, FileText, Loader2, X, Sparkles, ScrollText } from 'lucide-react'

interface ResearchListProps {
  refreshTrigger: number
}

export function ResearchList({ refreshTrigger }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null)
  const [selectedSummaryRun, setSelectedSummaryRun] = useState<AIRun | null>(null)
  const [selectedDeepRun, setSelectedDeepRun] = useState<AIRun | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const closeDetails = () => {
    setSelectedItem(null)
    setSelectedSummaryRun(null)
    setSelectedDeepRun(null)
    setDetailsLoading(false)
  }

  const openDetails = async (item: ResearchItem) => {
    if (!item.id) return

    setSelectedItem(item)
    setSelectedSummaryRun(null)
    setSelectedDeepRun(null)
    setDetailsLoading(true)

    try {
      const { summaryRun, deepRun } = await getInsightRunsForResearchItem(item.id)
      setSelectedSummaryRun(summaryRun || null)
      setSelectedDeepRun(deepRun || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insight details')
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getResearchItems()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research items')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
        <p className="text-muted-foreground font-medium">Loading your research...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <p className="text-destructive font-medium">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-2 py-20 bg-gray-50/50">
        <CardContent className="text-center space-y-3">
          <div className="bg-gray-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">No research yet</CardTitle>
          <CardDescription>Create your first research item above to get started.</CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold tracking-tight">Recent Insights</h2>
        <Badge variant="secondary" className="px-3 py-1 font-bold">
          {items.length} Items
        </Badge>
      </div>
      
      <div className="grid gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    item.syncStatus === 'synced'
                      ? 'success'
                      : item.syncStatus === 'error'
                      ? 'destructive'
                      : 'warning'
                  }
                  className="capitalize shadow-none"
                >
                  {item.syncStatus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-4">
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                {item.sourceText}
              </p>
              
              <ResearchAI researchItemId={item.id} />
            </CardContent>

            <CardFooter className="bg-gray-50/50 border-t px-6 py-3 flex justify-between items-center">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDetails(item)}
                className="gap-2 group/btn font-semibold text-primary hover:text-primary hover:bg-primary/5"
              >
                View Details
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm px-4 py-6 sm:px-6 lg:px-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="research-details-title"
          onClick={closeDetails}
        >
          <div
            className="mx-auto flex h-full w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="max-h-[90vh] w-full overflow-hidden border-none shadow-2xl">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-slate-50/80">
                <div className="space-y-2">
                  <Badge variant="secondary" className="w-fit">
                    Full Insight View
                  </Badge>
                  <CardTitle id="research-details-title" className="text-2xl">
                    {selectedItem.title}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <span>Created {new Date(selectedItem.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedItem.syncStatus}</span>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={closeDetails} aria-label="Close details">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              <CardContent className="grid max-h-[calc(90vh-88px)] gap-6 overflow-y-auto p-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="space-y-4">
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <ScrollText className="h-4 w-4" />
                      Full Source
                    </div>
                    <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                      {selectedItem.sourceText}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Sparkles className="h-4 w-4" />
                      Latest AI Insight
                    </div>

                    {detailsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading insight outputs...
                      </div>
                    ) : selectedSummaryRun || selectedDeepRun ? (
                      <div className="space-y-4">
                        {selectedSummaryRun && (
                          <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-slate-700">Quick Summary</h4>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant={selectedSummaryRun.status === 'completed' ? 'success' : selectedSummaryRun.status === 'failed' ? 'destructive' : 'warning'}>
                                    {selectedSummaryRun.status}
                                  </Badge>
                                  <Badge variant="outline">{selectedSummaryRun.provider}</Badge>
                                  <Badge variant="outline">{selectedSummaryRun.model}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg border bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedSummaryRun.output || 'No summary output available yet.'}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {selectedDeepRun && (
                          <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-slate-700">Deep Insight</h4>
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <Badge variant={selectedDeepRun.status === 'completed' ? 'success' : selectedDeepRun.status === 'failed' ? 'destructive' : 'warning'}>
                                    {selectedDeepRun.status}
                                  </Badge>
                                  <Badge variant="outline">{selectedDeepRun.provider}</Badge>
                                  <Badge variant="outline">{selectedDeepRun.model}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg border bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedDeepRun.output || 'No deep insight output available yet.'}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No AI insight has been generated for this item yet. Click Quick Summary or Deep Insight to create one.
                      </p>
                    )}
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="rounded-xl border bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-slate-600">Research Metadata</h3>
                    <dl className="space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Status</dt>
                        <dd className="font-medium capitalize text-slate-800">{selectedItem.syncStatus}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Created</dt>
                        <dd className="font-medium text-slate-800 text-right">{new Date(selectedItem.createdAt).toLocaleString()}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-slate-500">Updated</dt>
                        <dd className="font-medium text-slate-800 text-right">{new Date(selectedItem.updatedAt).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>

                </aside>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
