import { LayoutDashboard, FolderOpen, BarChart3, Bookmark, PenLine, Lightbulb, RefreshCw, BrainCircuit, LogOut, HelpCircle, Users, Library, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'

export type ActiveView = 'dashboard' | 'builder' | 'research' | 'advisor' | 'citations' | 'improve' | 'topics' | 'peer-review' | 'library'

interface SidebarProps {
  email: string
  online: boolean
  isSyncing: boolean
  lastSynced: string
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
  onSync: () => void
  onHelp: () => void
}

const BUILDER_ITEMS: { view: ActiveView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'builder',   icon: BookOpen,        label: 'Research Builder' },
]

const TOOL_ITEMS: { view: ActiveView; icon: React.ElementType; label: string }[] = [
  { view: 'research',    icon: FolderOpen,   label: 'My Research' },
  { view: 'advisor',     icon: BarChart3,    label: 'Analysis Advisor' },
  { view: 'citations',   icon: Bookmark,     label: 'Citations' },
  { view: 'improve',     icon: PenLine,      label: 'Improve Writing' },
  { view: 'topics',      icon: Lightbulb,    label: 'Topic Builder' },
  { view: 'peer-review', icon: Users,        label: 'Peer Review' },
  { view: 'library',     icon: Library,      label: 'Ask My Library' },
]

function NavButton({ view, icon: Icon, label, activeView, onViewChange }: {
  view: ActiveView
  icon: React.ElementType
  label: string
  activeView: ActiveView
  onViewChange: (v: ActiveView) => void
}) {
  return (
    <button
      onClick={() => onViewChange(view)}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-left',
        activeView === view
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
    </button>
  )
}

export function Sidebar({ email, online, isSyncing, lastSynced, activeView, onViewChange, onLogout, onSync, onHelp }: SidebarProps) {
  const initials = email.substring(0, 2).toUpperCase()

  return (
    <div className="w-56 shrink-0 border-r bg-muted/20 flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b gap-2.5 shrink-0">
        <div className="bg-primary rounded-lg p-1.5 shadow-md shadow-primary/20">
          <BrainCircuit className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-extrabold text-lg tracking-tight">
          Dev<span className="text-primary">Kada</span>
        </span>
      </div>

      {/* Status badge */}
      <div className="px-3 py-2.5 shrink-0">
        <div className={cn(
          'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full',
          online
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', online ? 'bg-emerald-500' : 'bg-amber-400')} />
          {online ? 'Cloud Active' : 'Offline Mode'}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 flex flex-col gap-0.5 overflow-y-auto">
        {/* Primary items */}
        {BUILDER_ITEMS.map(item => (
          <NavButton key={item.view} {...item} activeView={activeView} onViewChange={onViewChange} />
        ))}

        {/* Tools section */}
        <div className="mt-3 mb-1 px-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Tools</span>
        </div>

        {TOOL_ITEMS.map(item => (
          <NavButton key={item.view} {...item} activeView={activeView} onViewChange={onViewChange} />
        ))}

        {/* Help */}
        <button
          onClick={onHelp}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full text-left text-muted-foreground hover:bg-muted hover:text-foreground mt-1"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">Help & Guide</span>
        </button>
      </nav>

      {/* User block */}
      <div className="p-3 border-t shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{email.split('@')[0]}</div>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-2.5 h-2.5', isSyncing && 'animate-spin')} />
              {isSyncing ? 'syncing…' : lastSynced}
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
