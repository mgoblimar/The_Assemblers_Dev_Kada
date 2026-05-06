import { Sparkles, BookmarkPlus, PenLine, MoreHorizontal, Cloud, CloudOff, Loader2 } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import type { ResearchItem } from '@/lib/db/database'

type ResearchType = 'quantitative' | 'qualitative' | 'mixed' | 'research'

interface ResearchCardProps {
  item: ResearchItem
  aiRunCount: number
  isAnalyzing: boolean
  onAnalyze: (item: ResearchItem) => void
  onViewDetails: (item: ResearchItem) => void
}

function detectType(title: string, text: string): ResearchType {
  const s = (title + ' ' + text).toLowerCase()
  const quant = /\b(quantitative|regression|anova|correlation|survey|statistics|coefficient|p-value|sample size|hypothesis test)\b/.test(s)
  const qual  = /\b(qualitative|thematic|narrative|interview|ethnograph|grounded theory|discourse|content analysis)\b/.test(s)
  if (quant && qual) return 'mixed'
  if (quant) return 'quantitative'
  if (qual)  return 'qualitative'
  return 'research'
}

const TYPE_STYLES: Record<ResearchType, string> = {
  quantitative: 'bg-blue-50 text-blue-700 border-blue-200',
  qualitative:  'bg-rose-50 text-rose-700 border-rose-200',
  mixed:        'bg-amber-50 text-amber-700 border-amber-200',
  research:     'bg-slate-100 text-slate-600 border-slate-200',
}

const TYPE_LABELS: Record<ResearchType, string> = {
  quantitative: 'Quantitative',
  qualitative:  'Qualitative',
  mixed:        'Mixed Methods',
  research:     'Research',
}

export function ResearchCard({ item, aiRunCount, isAnalyzing, onAnalyze, onViewDetails }: ResearchCardProps) {
  const type = detectType(item.title, item.sourceText)

  const syncIcon = item.syncStatus === 'synced'
    ? <Cloud className="w-3 h-3" />
    : <CloudOff className="w-3 h-3" />

  const syncLabel = item.syncStatus === 'synced'
    ? 'Synced'
    : item.syncStatus === 'error'
    ? 'Error'
    : 'Pending'

  return (
    <div 
      onClick={() => onViewDetails(item)}
      className={cn(
        'rounded-xl border bg-card p-4 flex flex-col gap-3 transition-shadow hover:shadow-md cursor-pointer group',
        isAnalyzing && 'ring-1 ring-primary/30 shadow-sm shadow-primary/10'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border', TYPE_STYLES[type])}>
          {TYPE_LABELS[type]}
        </span>
        <Badge
          variant={item.syncStatus === 'synced' ? 'success' : item.syncStatus === 'error' ? 'destructive' : 'warning'}
          className="gap-1 text-[10px] font-semibold"
        >
          {syncIcon}
          {syncLabel}
        </Badge>
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-6 h-6 text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Title */}
      <h3 className="text-left text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
        {item.title}
      </h3>

      {/* Preview */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {item.sourceText}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex gap-3 text-[11px] text-muted-foreground font-medium flex-1 flex-wrap">
          <span>{aiRunCount} AI run{aiRunCount !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            {syncIcon} {syncLabel}
          </span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Improve Writing — Phase 11"
            onClick={(e) => e.stopPropagation()}
          >
            <PenLine className="w-3 h-3" />
            Improve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Find Citations — Phase 10"
            onClick={(e) => e.stopPropagation()}
          >
            <BookmarkPlus className="w-3 h-3" />
            Cite
          </Button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(item);
            }}
            disabled={isAnalyzing}
          >
            {isAnalyzing
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Sparkles className="w-3 h-3" />
            }
            Analyze
          </Button>
        </div>
      </div>
    </div>
  )
}
