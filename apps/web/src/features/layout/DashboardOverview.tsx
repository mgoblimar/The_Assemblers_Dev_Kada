import type { ActiveView } from './Sidebar'
import { ResearchForm } from '@/features/research/ResearchForm'
import { getResearchItems } from '@/lib/db/research-repository'
import { getProjects } from '@/lib/db/project-repository'
import type { ResearchProject } from '@/lib/db/database'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, BrainCircuit, FileInput, FileText, GraduationCap, HelpCircle, LayoutGrid, PanelRight, PenLine, Plus, Search, Sparkles, Users, ArrowRight, Clock } from 'lucide-react'

interface DashboardOverviewProps {
  userId?: string
  itemCount: number
  aiRunCount: number
  citationCount: number
  projectCount: number
  showForm: boolean
  onItemCreated: () => void
  onToggleForm: () => void
  onNavigateToView: (view: ActiveView) => void
  onTogglePanel: () => void
  onOpenProject: (id: number) => void
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
  { view: 'builder', label: 'Research Builder', description: 'Build AI-guided academic papers chapter by chapter.', icon: FileText },
  { view: 'peer-review', label: 'Peer Review', description: 'Check the work before sharing it.', icon: Users },
  { view: 'library', label: 'Ask My Library', description: 'Query your saved research knowledge.', icon: Search },
  { view: 'help', label: 'Help & Status', description: 'Guide and server statistics.', icon: HelpCircle },
]

function RoadmapStep({ step, index, showForm, onToggleForm, onTogglePanel, onNavigateToView }: {
  step: typeof FLOW_STEPS[0]
  index: number
  showForm: boolean
  onToggleForm: () => void
  onTogglePanel: () => void
  onNavigateToView: (view: ActiveView) => void
}) {
  const Icon = step.icon
  const stepAction =
    step.action === 'form'
      ? onToggleForm
      : step.action === 'panel'
        ? onTogglePanel
        : () => onNavigateToView(step.action)

  return (
    <button
      type="button"
      onClick={stepAction}
      className={cn(
        'relative flex flex-col p-6 rounded-xl border text-left transition-all hover:border-primary/40 hover:bg-muted/30 group bg-card shadow-sm',
        index === 0 && !showForm && 'ring-2 ring-primary/20 border-primary/40 bg-primary/[0.02]'
      )}
    >
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-heading font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {index + 1}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">
            {step.actionLabel}
          </span>
          <Icon className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
        <p className="font-bold text-sm leading-tight font-heading">{step.title}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{step.description}</p>
      </div>
    </button>
  )
}

export function DashboardOverview({
  userId,
  itemCount,
  aiRunCount,
  citationCount,
  projectCount,
  showForm,
  onItemCreated,
  onToggleForm,
  onNavigateToView,
  onTogglePanel,
  onOpenProject,
  refreshTrigger,
  onItemCountChange,
}: DashboardOverviewProps) {
  const [projects, setProjects] = useState<ResearchProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      const [items, projectList] = await Promise.all([
        getResearchItems(userId),
        getProjects(userId)
      ])
      
      if (!cancelled) {
        onItemCountChange(items.length)
        setProjects(projectList.slice(0, 3)) // Only show top 3
        setLoadingProjects(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [onItemCountChange, refreshTrigger, userId])

  return (
    <div className="px-6 py-8 space-y-10 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
      {/* 1. Header & Status Strip */}
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="w-3 h-3" />
              Institutional Hub
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight select-none" style={{ fontFamily: 'Fraunces, serif' }}>
              Welcome to Peer<span className="text-primary italic">EvAI</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed mt-2">
              Welcome to your agentic research environment. Orchestrate multi-step AI workflows, 
              manage academic citations, and synthesize findings into peer-ready manuscripts.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Action buttons removed as per user request */}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Research items" value={itemCount} icon={LayoutGrid} />
          <StatCard label="Projects" value={projectCount} icon={FileText} />
          <StatCard label="AI runs" value={aiRunCount} icon={Sparkles} />
          <StatCard label="Citations" value={citationCount} icon={BookOpen} />
        </div>
      </header>

      {/* 2. Methodology Roadmap */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading">Methodology Roadmap</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">Recommended Research Lifecycle</p>
          </div>
          <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-none">Active Flow</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FLOW_STEPS.slice(0, 3).map((step, index) => (
            <RoadmapStep key={step.title} step={step} index={index} showForm={showForm} onToggleForm={onToggleForm} onTogglePanel={onTogglePanel} onNavigateToView={onNavigateToView} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {FLOW_STEPS.slice(3).map((step, index) => (
            <RoadmapStep key={step.title} step={step} index={index + 3} showForm={showForm} onToggleForm={onToggleForm} onTogglePanel={onTogglePanel} onNavigateToView={onNavigateToView} />
          ))}
        </div>
      </section>

      {/* 3. Research Builder (Main Feature) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading">Research Builder</h2>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.1em]">Academic Paper Construction</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigateToView('builder')}
            className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 gap-1.5"
          >
            View all projects <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl border border-border/50 bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed bg-muted/10 border-2">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold font-heading text-lg">No active projects</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Start building your first academic paper chapter by chapter with agentic AI guidance.
              </p>
              <Button 
                onClick={() => onNavigateToView('builder')} 
                className="mt-6 gap-2 h-9"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => project.id && onOpenProject(project.id)}
                className="group flex flex-col p-5 rounded-xl border bg-card text-left transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-muted/30 border-none">
                    {project.status}
                  </Badge>
                  <Clock className="w-3 h-3 text-muted-foreground/40" />
                </div>
                <h3 className="font-bold text-sm leading-tight font-heading group-hover:text-primary transition-colors line-clamp-2 mb-4">
                  {project.title}
                </h3>
                <div className="mt-auto pt-4 border-t flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <BrainCircuit className="w-2.5 h-2.5" /> {project.researchQuestions.length} RQs
                  </span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
            
            {/* Quick New Project Slot */}
            <button
              onClick={() => onNavigateToView('builder')}
              className="flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-2 transition-colors">
                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs font-bold text-muted-foreground group-hover:text-primary">New Project</span>
            </button>
          </div>
        )}
      </section>

      {showForm && (
        <section className="rounded-xl border bg-card shadow-md overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="border-b bg-muted/20 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-heading">Capture Research Input</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Seed your library with URLs, PDFs, or raw scholarly notes.
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggleForm} className="h-8 w-8 text-muted-foreground">
              <PanelRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="p-2 bg-background/50">
            <ResearchForm userId={userId} onItemCreated={onItemCreated} />
          </div>
        </section>
      )}

      {/* 3. Bottom Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 bg-muted/20 pb-4 border-b">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <LayoutGrid className="w-3.5 h-3.5" />
              Quick Actions
            </div>
            <CardTitle className="text-lg font-heading">Scholarly Toolset</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 p-6">
            {QUICK_ACTIONS.map(({ view, label, description, icon: Icon }) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigateToView(view)}
                className="rounded-xl border p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30 group bg-background/50"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2.5 text-primary group-hover:scale-110 transition-transform">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight font-heading">{label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="space-y-1 bg-muted/20 pb-4 border-b">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <GraduationCap className="w-3.5 h-3.5" />
              Institutional Memo
            </div>
            <CardTitle className="text-lg font-heading">The Research Promise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6 text-sm text-muted-foreground leading-relaxed flex-1">
            <p>
              Your inputs become immutable research items. Each item serves as the foundation for 
              agentic analysis, reference discovery, and critical peer synthesis.
            </p>
            <p>
              This environment is designed for **validation** over generation. Maintain the highest 
              standards of academic integrity through every stage of the workflow.
            </p>
            <div className="rounded-lg border bg-primary/5 p-4 text-[10px] text-foreground font-medium border-primary/10">
              <p className="font-bold text-primary uppercase tracking-widest mb-2">Optimal Sequence</p>
              <ol className="space-y-1.5 list-decimal list-inside text-muted-foreground">
                <li>Capture deep-portal input</li>
                <li>Execute agentic analysis</li>
                <li>Synthesize topic outlines</li>
                <li>Verify via peer review</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm border-border/50 group hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-primary transition-colors">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight font-heading">{value}</p>
    </div>
  )
}