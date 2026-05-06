import { useState } from 'react'
import { HelpCircle, X, LayoutDashboard, FolderOpen, BarChart3, Bookmark, PenLine, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

const SECTIONS = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'Your research command center. View stats (total items, AI runs, citations), add new research, and analyze items with the AI pipeline.',
    tips: ['Click "New Research" to add an item', 'Click "Analyze" on any card to start an AI workflow', 'Watch the AI Analysis panel on the right for live step progress'],
  },
  {
    icon: FolderOpen,
    title: 'My Research',
    description: 'Your full research library. Browse, filter, and manage all your research items.',
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
    description: 'Two-phase tool: first generates 5 scored research topics, then builds a full 7-chapter outline for your chosen topic.',
    tips: ['Prefill the seed from an existing research item', 'Topics are scored on Novelty and Feasibility (0-10 each)', 'Select a topic first, then click "Build Outline"'],
  },
]

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Help & Feature Guide</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {SECTIONS.map(({ icon: Icon, title, description, tips }) => {
            const isOpen = expanded === title
            return (
              <div key={title} className="rounded-xl border overflow-hidden">
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
          {/* FAQ */}
          <div className="rounded-xl border overflow-hidden">
            <div className="px-4 py-3 bg-muted/30">
              <h3 className="font-semibold text-sm">FAQ & Notes</h3>
            </div>
            <div className="px-4 py-3 space-y-2 text-xs text-muted-foreground">
              <p><span className="font-semibold text-foreground">Do I need internet?</span> All data is stored locally. AI features require internet for Groq API calls.</p>
              <p><span className="font-semibold text-foreground">Are my documents synced?</span> Yes — when online, your data syncs to Supabase automatically.</p>
              <p><span className="font-semibold text-foreground">Which citation style should I use?</span> Toggle between APA 7, MLA 9, and Chicago 17 in the Citations panel.</p>
              <p><span className="font-semibold text-foreground">Guided tour?</span> An onboarding tour is coming in a future update.</p>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t shrink-0 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">ResearchAI · Phases 1–12 complete</span>
          <Badge variant="secondary" className="text-xs">v2.0</Badge>
        </div>
      </div>
    </div>
  )
}
