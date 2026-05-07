import { LayoutDashboard, FolderOpen, BarChart3, Bookmark, PenLine, Lightbulb, RefreshCw, LogOut, HelpCircle, Users, Library, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import logoImg from '@/assets/Logo/LogoWhiteBG-removebg-preview.png'

export type ActiveView = 'dashboard' | 'builder' | 'research' | 'advisor' | 'citations' | 'improve' | 'topics' | 'peer-review' | 'library' | 'help'

interface SidebarProps {
  email: string
  isSyncing: boolean
  lastSynced: string
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
  onSync: () => void
  isCollapsed?: boolean
}

const DASHBOARD_ITEM = { view: 'dashboard' as const, icon: LayoutDashboard, label: 'Dashboard' }

const BUILDER_ITEMS: { view: ActiveView; icon: React.ElementType; label: string }[] = [
  { view: 'builder',   icon: BookOpen,        label: 'Research Builder' },
  { view: 'topics',    icon: Lightbulb,       label: 'Topic Builder' },
]

const TOOL_ITEMS: { view: ActiveView; icon: React.ElementType; label: string }[] = [
  { view: 'research',    icon: FolderOpen,   label: 'My Research' },
  { view: 'advisor',     icon: BarChart3,    label: 'Analysis Advisor' },
  { view: 'citations',   icon: Bookmark,     label: 'Citations' },
  { view: 'improve',     icon: PenLine,      label: 'Improve Writing' },
  { view: 'peer-review', icon: Users,        label: 'Peer Review' },
]

const CHAT_ITEMS: { view: ActiveView; icon: React.ElementType; label: string }[] = [
  { view: 'library',     icon: Library,      label: 'Ask My Library' },
]

function NavButton({ view, icon: Icon, label, activeView, onViewChange, isCollapsed }: {
  view: ActiveView
  icon: React.ElementType
  label: string
  activeView: ActiveView
  onViewChange: (v: ActiveView) => void
  isCollapsed?: boolean
}) {
  const isActive = activeView === view
  return (
    <button
      onClick={() => onViewChange(view)}
      title={isCollapsed ? label : undefined}
      className={cn(
        'flex items-center rounded text-[11px] transition-colors',
        isCollapsed ? 'justify-center w-8 h-8 mx-auto' : 'gap-1.5 px-2 py-1 w-full text-left',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  )
}

export function Sidebar({ email, isSyncing, lastSynced, activeView, onViewChange, onLogout, onSync, isCollapsed }: SidebarProps) {
  const initials = email.substring(0, 2).toUpperCase()

  return (
    <div className={cn("flex flex-col h-full bg-card transition-all duration-300", isCollapsed ? "w-12" : "w-36")}>
      {/* Brand */}
      <div className={cn("flex items-center border-b border-border shrink-0", isCollapsed ? "justify-center py-2.5" : "gap-1.5 px-2.5 py-2.5")}>
        <img src={logoImg} alt="PeerEvAI" className="h-5 w-auto object-contain shrink-0" />
        {!isCollapsed && (
          <span className="font-extrabold text-sm tracking-tight text-foreground leading-none select-none" style={{ fontFamily: 'Fraunces, serif' }}>
            Peer<span className="text-primary italic">EvAI</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-3 flex flex-col gap-px overflow-y-auto overflow-x-hidden">
        <NavButton {...DASHBOARD_ITEM} activeView={activeView} onViewChange={onViewChange} isCollapsed={isCollapsed} />

        {!isCollapsed && (
          <div className="mt-2 mb-0.5 px-1 flex items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Builder</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        {isCollapsed && <div className="h-px bg-border my-2 mx-1" />}

        {BUILDER_ITEMS.map(item => (
          <NavButton key={item.view} {...item} activeView={activeView} onViewChange={onViewChange} isCollapsed={isCollapsed} />
        ))}

        {!isCollapsed && (
          <div className="mt-2 mb-0.5 px-1 flex items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Tools</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        {isCollapsed && <div className="h-px bg-border my-2 mx-1" />}

        {TOOL_ITEMS.map(item => (
          <NavButton key={item.view} {...item} activeView={activeView} onViewChange={onViewChange} isCollapsed={isCollapsed} />
        ))}

        {!isCollapsed && (
          <div className="mt-2 mb-0.5 px-1 flex items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Chat Tools</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        {isCollapsed && <div className="h-px bg-border my-2 mx-1" />}

        {CHAT_ITEMS.map(item => (
          <NavButton key={item.view} {...item} activeView={activeView} onViewChange={onViewChange} isCollapsed={isCollapsed} />
        ))}

        {!isCollapsed && (
          <div className="mt-2 mb-0.5 px-1 flex items-center gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">Support</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        {isCollapsed && <div className="h-px bg-border my-2 mx-1" />}

        <NavButton view="help" icon={HelpCircle} label="Help & Status" activeView={activeView} onViewChange={onViewChange} isCollapsed={isCollapsed} />
      </nav>

      {/* User block */}
      <div className="px-1.5 py-1.5 border-t shrink-0">
        <div className={cn("flex items-center px-1 py-1", isCollapsed ? "justify-center" : "gap-1.5")}>
          <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">{email.split('@')[0]}</div>
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn('w-2 h-2', isSyncing && 'animate-spin')} />
                {isSyncing ? 'syncing…' : lastSynced}
              </button>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onLogout}
              title="Sign out"
            >
              <LogOut className="w-2.5 h-2.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
