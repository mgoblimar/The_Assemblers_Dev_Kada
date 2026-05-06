import { useEffect, useState } from 'react'
import { ResearchItem, db } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { ResearchCard } from './ResearchCard'
import { Badge } from '@/shared/components/ui/badge'
import { FileText, Loader2 } from 'lucide-react'

interface ResearchListProps {
  userId?: string
  refreshTrigger: number
  analyzingItemId: number | null
  onAnalyze: (item: ResearchItem) => void
  onViewDetails: (itemId: number) => void
  onItemCountChange: (count: number) => void
}

export function ResearchList({ userId, refreshTrigger, analyzingItemId, onAnalyze, onViewDetails, onItemCountChange }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [aiRunCounts, setAiRunCounts] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'quantitative' | 'qualitative' | 'mixed'>('all')

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
            isAnalyzing={item.id === analyzingItemId}
            onAnalyze={onAnalyze}
            onViewDetails={(item) => item.id && onViewDetails(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
