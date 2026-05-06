import type { ActiveView } from './Sidebar'
import { ResearchForm } from '@/features/research/ResearchForm'
import { getResearchItems } from '@/lib/db/research-repository'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ArrowRight, BookOpen, BrainCircuit, FileInput, GraduationCap, LayoutGrid, PanelRight, PenLine, Search, Sparkles, Users } from 'lucide-react'
import type { ResearchItem } from '@/lib/db/database'

interface DashboardOverviewProps {
  userId?: string
  itemCount: number
  aiRunCount: number
  citationCount: number
  showForm: boolean
  onItemCreated: () => void
  onToggleForm: () => void
  onNavigateToView: (view: ActiveView) => void
  onTogglePanel: () => void
  onAnalyze: (item: ResearchItem) => void
  onViewDetails: (itemId: number) => void
  analyzingItemId: number | null
  refreshTrigger: number
  onItemCountChange: (count: number) => void
}

const FLOW_STEPS = [
  {
    title: 'Capture an input',
    description: 'Paste notes, a URL, a Google Doc, or a PDF into New Research so it becomes a structured research item.',
    icon: FileInput,
    actionLabel: 'Open form',
    action: 'form' as const,
  },
  {
    title: 'Analyze the item',
    description: 'Run the AI workflow to extract themes, evidence, and methodological clues from the item.',
    icon: Sparkles,
    actionLabel: 'Open AI panel',
    action: 'panel' as const,
  },
  {
    title: 'Improve the writing',
    description: 'Move from raw notes to a stronger draft by checking clarity, gaps, and argument strength.',
    icon: PenLine,
    actionLabel: 'Go to Improve',
    action: 'improve' as const,
  },
  {
    title: 'Attach citations',
    description: 'Find or format references after the analysis so the research item is easier to ground in sources.',
    icon: BookOpen,
    actionLabel: 'Go to Citations',
    action: 'citations' as const,
  },
  {
    title: 'Build the next step',
    description: 'Turn the item into a topic, outline, peer review pass, or library query when you are ready to expand it.',
    icon: BrainCircuit,
    actionLabel: 'Open tools',
    action: 'topics' as const,
  },
]

const QUICK_ACTIONS: Array<{ view: ActiveView; label: string; description: string; icon: React.ElementType }> = [
  { view: 'research', label: 'My Research', description: 'Browse, filter, and open the full item library.', icon: LayoutGrid },
  { view: 'advisor', label: 'Analysis Advisor', description: 'Choose the best method for a research item.', icon: Sparkles },
  { view: 'citations', label: 'Citations', description: 'Format and collect references.', icon: BookOpen },
  { view: 'improve', label: 'Improve Writing', description: 'Review clarity and argument strength.', icon: PenLine },
  { view: 'topics', label: 'Topic Builder', description: 'Move from ideas to an outline.', icon: GraduationCap },
  { view: 'peer-review', label: 'Peer Review', description: 'Check the work before sharing it.', icon: Users },
  { view: 'library', label: 'Ask My Library', description: 'Query your saved research knowledge.', icon: Search },
]

export function DashboardOverview({
  userId,
  itemCount,
  aiRunCount,
  citationCount,
  showForm,
  onItemCreated,
  onToggleForm,
  onNavigateToView,
  onTogglePanel,
  refreshTrigger,
  onItemCountChange,
}: DashboardOverviewProps) {
  useEffect(() => {
    let cancelled = false

    const loadItemCount = async () => {
      const items = await getResearchItems(userId)
      if (!cancelled) {
        onItemCountChange(items.length)
      }
    }

    loadItemCount()

    return () => {
      cancelled = true
    }
  }, [onItemCountChange, refreshTrigger, userId])

  const steps = FLOW_STEPS

  return (
    <div className="px-5 py-5 space-y-5 max-w-5xl mx-auto w-full">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border bg-linear-to-br from-background via-background to-muted/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            Research command center
          </div>
          <div className="mt-4 space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Start with a research input, send it through analysis, then branch into writing, citations, topics,
              peer review, or your library. This view stays high-level while My Research keeps the full item list.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Research items" value={itemCount} icon={LayoutGrid} />
            <StatCard label="AI runs" value={aiRunCount} icon={Sparkles} />
            <StatCard label="Citations" value={citationCount} icon={BookOpen} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onToggleForm} className="gap-2">
              <FileInput className="w-4 h-4" />
              {showForm ? 'Hide input form' : 'Start with new research'}
            </Button>
            <Button variant="outline" onClick={() => onNavigateToView('research')} className="gap-2">
              Open My Research
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={onTogglePanel} className="gap-2 text-muted-foreground">
              <PanelRight className="w-4 h-4" />
              Open AI panel
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">How it flows</p>
              <h2 className="mt-1 text-lg font-bold">From input to output</h2>
            </div>
            <Badge variant="secondary" className="font-semibold">Guide</Badge>
          </div>

          <div className="mt-4 space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              const stepAction =
                step.action === 'form'
                  ? onToggleForm
                  : step.action === 'panel'
                    ? onTogglePanel
                    : () => onNavigateToView(step.action)

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={stepAction}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30',
                    index === 0 && 'bg-primary/5 border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          Step {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-primary">{step.actionLabel}</span>
                      </div>
                      <p className="mt-1 font-semibold leading-tight">{step.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-bold">Capture a research input</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paste text, drop a link, or seed a demo item. The dashboard uses this as the first step in the flow.
            </p>
          </div>
          <ResearchForm userId={userId} onItemCreated={onItemCreated} />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border shadow-sm">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="text-base">Next actions</CardTitle>
            <p className="text-sm text-muted-foreground">Jump from the dashboard into the next tool without hunting through the sidebar.</p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS.map(({ view, label, description, icon: Icon }) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigateToView(view)}
                className="rounded-xl border p-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-2 pb-3">
            <CardTitle className="text-base">Dashboard promise</CardTitle>
            <p className="text-sm text-muted-foreground">The dashboard explains the journey; My Research stores the working set.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Your inputs become research items. Those items can then be analyzed, improved, cited, expanded into
              topics, reviewed by peers, or queried in the library.
            </p>
            <p>
              Use this view when you want a guided map of what happens next. Use My Research when you want the full
              list, filters, and item-level detail.
            </p>
            <div className="rounded-xl border bg-muted/20 p-3 text-xs text-foreground/80">
              <p className="font-semibold">Quick path</p>
              <p className="mt-1">1. Add input 2. Analyze 3. Improve 4. Cite 5. Build topic 6. Review 7. Search library</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-background p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}