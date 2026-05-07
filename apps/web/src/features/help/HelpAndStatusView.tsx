import { useState } from 'react'
import { HelpCircle, LayoutDashboard, FolderOpen, BarChart3, Bookmark, PenLine, Lightbulb, ChevronDown, ChevronUp, Database, Cloud, CloudOff, Inbox, Activity } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your guided overview. See the research flow, jump to the next best action, and add a new research input without leaving the dashboard.',
    tips: ['Use the flow cards to move from input to analysis and beyond', 'Click "New Research" to capture notes, links, or documents', 'Open My Research when you want the full item library and filters'],
  },
  {
    icon: FolderOpen,
    title: 'My Research',
    description: 'Your full research library. Browse, filter, and manage all of your research items in one place.',
    tips: ['Filter by research type (Quantitative, Qualitative, Mixed)', 'Click any card title to view full details', 'Use the search bar to find items quickly'],
  },
  {
    icon: BarChart3,
    title: 'Analysis Advisor',
    description: 'AI-powered methodology recommender. Select a research item and get recommendations for the best analytical approach.',
    tips: ['Works best with items that have detailed source text', 'Top 3 methods are ranked by keyword match', 'Expand any method card for a step-by-step guide'],
  },
  {
    icon: Bookmark,
    title: 'Citations',
    description: 'Automatically finds and formats academic references from Semantic Scholar and CrossRef.',
    tips: ['Toggle between APA 7, MLA 9, and Chicago 17 styles instantly', 'Use "Copy All" to grab all citations at once', 'Expandable cards show abstracts and DOI links'],
  },
  {
    icon: PenLine,
    title: 'Improve Writing',
    description: 'Analyzes your research text for coherence, argument strength, and gaps — then suggests rewrites.',
    tips: ['Results include a paragraph-level breakdown', 'The weakest paragraph gets a before/after rewrite', 'Score: green >= 7, amber >= 4, red < 4'],
  },
  {
    icon: Lightbulb,
    title: 'Topic Builder',
    description: 'Generates 5 scored research topics, then builds a full 7-chapter outline for your chosen topic.',
    tips: ['Prefill the seed from an existing research item', 'Topics are scored on Novelty and Feasibility (0-10 each)', 'Select a topic first, then click "Build Outline"'],
  },
]

interface HelpAndStatusViewProps {
  itemCount: number
  online: boolean
  outboxCount: number
}

export function HelpAndStatusView({ itemCount, online, outboxCount }: HelpAndStatusViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="px-5 py-5 space-y-8 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Help & System Status</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Everything you need to know about PeerEvAI and your current connection.
        </p>
      </div>

      {/* System Status Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">System Status (Server Stats)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-semibold">Local Vault</span>
              </div>
              <Badge variant="secondary">{itemCount} Items</Badge>
            </div>
            <p className="text-xs text-muted-foreground">All your research is stored locally in an encrypted vault for offline access.</p>
          </div>

          <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400')} />
                <span className="text-sm font-semibold">Connection</span>
              </div>
              <Badge variant={online ? 'outline' : 'destructive'} className={cn(online && 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5')}>
                {online ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {online 
                ? 'Academic portals connected. AI features and sync are fully operational.' 
                : 'Restricted mode. Local access only. Connect to sync data and use AI tools.'}
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-primary/60" />
                <span className="text-sm font-semibold">Outbox Status</span>
              </div>
              <Badge variant={outboxCount > 0 ? 'default' : 'secondary'}>
                {outboxCount} Pending
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Changes waiting to be synced to the cloud. They will upload automatically when online.</p>
          </div>

          <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {online ? <Cloud className="w-4 h-4 text-emerald-500/60" /> : <CloudOff className="w-4 h-4 text-amber-500/60" />}
                <span className="text-sm font-semibold">Sync Engine</span>
              </div>
              <Badge variant="outline">{online ? 'Idle' : 'Paused'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">The sync engine keeps your research library consistent across all your devices.</p>
          </div>
        </div>
      </section>

      {/* Feature Guide Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Feature Guide</h2>
        </div>

        <div className="space-y-2">
          {SECTIONS.map(({ icon: Icon, title, description, tips }) => {
            const isOpen = expanded === title
            return (
              <div key={title} className="rounded-xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : title)}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm flex-1">{title}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t bg-muted/20">
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    <ul className="space-y-1.5">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-primary mt-0.5 shrink-0">·</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/30">
            <h3 className="font-semibold text-sm">FAQ & Notes</h3>
          </div>
          <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="space-y-2">
              <p><span className="font-semibold text-foreground">Do I need internet?</span> All data is stored locally. AI features require internet for Groq API calls.</p>
              <p><span className="font-semibold text-foreground">Are my documents synced?</span> Yes — when online, your data syncs to Supabase automatically.</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold text-foreground">Which citation style should I use?</span> Toggle between APA 7, MLA 9, and Chicago 17 in the Citations panel.</p>
              <p><span className="font-semibold text-foreground">Guided tour?</span> An onboarding tour is coming in a future update.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 pb-4 flex items-center justify-between border-t text-xs text-muted-foreground">
        <span>DevKada ResearchAI</span>
        <Badge variant="secondary" className="text-xs">v2.1</Badge>
      </div>
    </div>
  )
}
