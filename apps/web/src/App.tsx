import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { Sidebar, type ActiveView } from '@/features/layout/Sidebar'
import { AIWorkflowPanel } from '@/features/layout/AIWorkflowPanel'
import { Auth } from '@/features/auth/Auth'
import { HelpAndStatusView } from '@/features/help/HelpAndStatusView'
import { processOutbox, fetchRemoteData } from '@/lib/sync/outbox-processor'
import { supabase } from '@/lib/sync/supabase'
import { runAgenticWorkflow } from '@/lib/ai/agent'
import { db } from '@/lib/db/database'
import type { AIRun, ResearchItem } from '@/lib/db/database'
import { Session } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

import { ThemeProvider, ThemeToggle, useTheme } from '@/components/ThemeProvider'

import logoWhite from '@/assets/Logo/LogoWhiteBG-removebg-preview.png'

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from '@/shared/components/ui/toaster'
import { AnalysisAdvisor } from '@/features/advisor/AnalysisAdvisor'
import { CitationEngine } from '@/features/citations/CitationEngine'
import { ImprovementAnalyzer } from '@/features/improve/ImprovementAnalyzer'
import { TopicBuilder } from '@/features/topics/TopicBuilder'
import { PeerReview } from '@/features/peer-review/PeerReview'
import { AskLibrary } from '@/features/library/AskLibrary'
import { LandingPage } from '@/features/landing/LandingPage'
import { ResearchDetailsModal } from '@/features/research/ResearchDetailsModal'
import { Plus, Trash2, PanelLeft, PanelRight, Home, BrainCircuit } from 'lucide-react'
import { DashboardOverview } from '@/features/layout/DashboardOverview'
import { ProjectsDirectory } from '@/features/builder/ProjectsDirectory'
import { ProjectWorkspace } from '@/features/builder/ProjectWorkspace'
import { getActiveProjectId, setActiveProjectId, getProjects } from '@/lib/db/project-repository'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage isAuthenticated={!!session} />} />
          <Route 
            path="/login" 
            element={session ? <Navigate to="/dashboard" replace /> : <Auth defaultMode="login" />} 
          />
          <Route 
            path="/signup" 
            element={session ? <Navigate to="/dashboard" replace /> : <Auth defaultMode="signup" />} 
          />
          <Route 
            path="/dashboard/*" 
            element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}

function Dashboard({ session }: { session: Session }) {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [online, setOnline] = useState(navigator.onLine)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
    const isSyncingRef = useRef(false)
  const [lastSynced, setLastSynced] = useState('not synced')
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const saved = localStorage.getItem('activeView') as ActiveView | null
    // If a project was open when the user left, restore the builder view
    const hadProject = !!localStorage.getItem('activeProjectId')
    if (saved && saved !== 'dashboard') return saved
    if (hadProject) return 'builder'
    return 'dashboard'
  })
  const [showForm, setShowForm] = useState(false)
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [activeRunTitle, setActiveRunTitle] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outboxCount, setOutboxCount] = useState(0)
  const [aiRunCount, setAiRunCount] = useState(0)
  const [citationCount, setCitationCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('sidebar-open') !== 'false')
  const [panelOpen, setPanelOpen] = useState(() => localStorage.getItem('panel-open') !== 'false')
  const [selectedResearchItemId, setSelectedResearchItemId] = useState<number | null>(null)
  const [analyzingItemId, setAnalyzingItemId] = useState<number | null>(null)
  const [activeProjectId, setActiveProjectIdState] = useState<number | null>(() => getActiveProjectId())
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)

  // Close the builder dialog when the user navigates away from the directory
  useEffect(() => {
    if (activeView !== 'builder' || activeProjectId !== null) {
      setShowNewProjectDialog(false)
    }
  }, [activeView, activeProjectId])

  // Auth sync
  useEffect(() => {
    if (!session) return
    fetchRemoteData(session.user.id).then(() => setRefreshTrigger(p => p + 1))
  }, [session])

  // Online/offline
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const triggerSync = useCallback(async (force = false) => {
    if (isSyncingRef.current || !session) return
    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      await processOutbox(force)
      setRefreshTrigger(p => p + 1)
      setLastSynced(`synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
    } catch {
      /* no-op */
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [session])

  // Auto-sync when online
  useEffect(() => {
    if (session && online) triggerSync()
  }, [online, session, triggerSync])

  // Outbox count
  useEffect(() => {
    db.outbox.where('status').equals('pending').count().then(setOutboxCount)
  }, [refreshTrigger])

  // AI run counts & project count
  useEffect(() => {
    db.aiRuns.count().then(setAiRunCount)
    db.aiRuns.where('prompt').equals('Citation Engine').count().then(setCitationCount)
    getProjects(session.user.id).then(projects => setProjectCount(projects.length))
  }, [refreshTrigger, session.user.id])

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem('sidebar-open', String(next))
      return next
    })
  }

  const togglePanel = () => {
    setPanelOpen(prev => {
      const next = !prev
      localStorage.setItem('panel-open', String(next))
      return next
    })
  }

  const handleOpenProject = (id: number) => {
    setActiveProjectId(id)
    setActiveProjectIdState(id)
    setActiveView('builder')
    localStorage.setItem('activeView', 'builder')
  }

  const handleBackToDirectory = () => {
    setActiveProjectId(null)
    setActiveProjectIdState(null)
  }

  const handleAnalyze = async (item: ResearchItem) => {
    if (!item.id) return
    setAnalyzingItemId(item.id)
    setActiveRunTitle(item.title)
    setActiveRunId(null)
    try {
      await runAgenticWorkflow(item.id, (runId) => {
        // Called as soon as the DB record is created — panel starts polling immediately
        setActiveRunId(runId)
      })
      setRefreshTrigger(p => p + 1)
    } catch {
      setActiveRunTitle(null)
      setActiveRunId(null)
    } finally {
      setAnalyzingItemId(null)
    }
  }

  const handleViewReport = (run: AIRun) => {
    setSelectedResearchItemId(run.researchItemId)
    // Reset the panel so it returns to idle after viewing the report
    setActiveRunId(null)
    setActiveRunTitle(null)
  }

  const handleItemCreated = () => {
    setRefreshTrigger(p => p + 1)
    setShowForm(false)
    if (online && session) triggerSync()
  }

  const handleReset = async () => {
    if (!confirm('Clear all local and remote data for this demo?')) return
    setIsSyncing(true)
    try {
      if (session) {
        await supabase.from('ai_runs').delete().eq('user_id', session.user.id)
        await supabase.from('research_items').delete().eq('user_id', session.user.id)
      }
      await db.researchItems.clear()
      await db.aiRuns.clear()
      await db.outbox.clear()
      setRefreshTrigger(p => p + 1)
      setActiveRunId(null)
      setActiveRunTitle(null)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleItemCountChange = useCallback((count: number) => {
    setItemCount(count)
  }, [])

  // Context-aware top bar action — only shown when meaningful for the current view
  const topBarAction =
    activeView === 'research'
      ? { label: 'New Research', onClick: () => setShowForm(v => !v) }
      : activeView === 'builder' && activeProjectId === null
        ? { label: 'New Project', onClick: () => setShowNewProjectDialog(true) }
        : null

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Persistent Top Header */}
      <header className="h-10 border-b flex items-center justify-between px-4 bg-card shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img 
              src={logoWhite} 
              alt="PeerEvAI Logo" 
              className="h-7 w-auto object-contain"
            />
            <span className="font-extrabold text-lg tracking-tight text-foreground select-none" style={{ fontFamily: 'Fraunces, serif' }}>
              Peer<span className="text-primary italic">EvAI</span>
            </span>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Sidebar toggle */}
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer"
          >
            <PanelLeft className={cn("w-3 h-3 transition-transform duration-300", !sidebarOpen && "rotate-180")} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {topBarAction && (
            <button
              onClick={topBarAction.onClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              {topBarAction.label}
            </button>
          )}

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigate('/')}
              title="Landing page"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Home className="w-3 h-3" />
            </button>

            <button
              onClick={handleReset}
              title="Reset demo data"
              disabled={isSyncing}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* AI panel toggle */}
            <button
              onClick={togglePanel}
              title={panelOpen ? 'Close AI panel' : 'Open AI panel'}
              className="w-7 h-7 hidden lg:flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <PanelRight className="w-3 h-3" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col border-r bg-card shrink-0 z-10 transition-all duration-300">
          <Sidebar
            email={session.user.email ?? ''}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
            activeView={activeView}
            onViewChange={(view) => {
              setActiveView(view)
              localStorage.setItem('activeView', view)
            }}
            onLogout={() => supabase.auth.signOut()}
            onSync={() => triggerSync(true)}
            isCollapsed={!sidebarOpen}
          />
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden relative">
          <div className="flex-1 overflow-y-auto min-h-0">
            <MainContent
              userId={session.user.id}
              activeView={activeView || 'dashboard'}
              showForm={showForm}
              onItemCreated={handleItemCreated}
              onToggleForm={() => setShowForm(v => !v)}
              refreshTrigger={refreshTrigger}
              analyzingItemId={analyzingItemId}
              onAnalyze={handleAnalyze}
              onViewDetails={setSelectedResearchItemId}
              onRunStart={(runId, title) => { setActiveRunId(runId); setActiveRunTitle(title) }}
              onItemCountChange={handleItemCountChange}
              itemCount={itemCount}
              online={online}
              outboxCount={outboxCount}
              aiRunCount={aiRunCount}
              citationCount={citationCount}
              projectCount={projectCount}
              onNavigateToView={(view) => {
                setActiveView(view)
                localStorage.setItem('activeView', view)
              }}
              onTogglePanel={togglePanel}
              activeProjectId={activeProjectId}
              onOpenProject={handleOpenProject}
              onBackToDirectory={handleBackToDirectory}
              showNewProjectDialog={showNewProjectDialog}
              onNewProjectDialogChange={setShowNewProjectDialog}
            />
          </div>
        </section>

        {/* AI panel */}
        {panelOpen && (
          <aside className="hidden lg:flex flex-col border-l bg-card shrink-0 z-10">
            <AIWorkflowPanel
              runId={activeRunId}
              itemTitle={activeRunTitle}
              onCancel={() => { setActiveRunId(null); setActiveRunTitle(null) }}
              onViewReport={handleViewReport}
            />
          </aside>
        )}
      </main>

      {/* Research Details Modal */}
      <ResearchDetailsModal
        itemId={selectedResearchItemId}
        onClose={() => setSelectedResearchItemId(null)}
      />
    </div>
  )
}

interface MainContentProps {
  userId: string
  activeView: ActiveView
  showForm: boolean
  onItemCreated: () => void
  onToggleForm: () => void
  refreshTrigger: number
  analyzingItemId: number | null
  onAnalyze: (item: ResearchItem) => void
  onViewDetails: (itemId: number) => void
  onRunStart: (runId: number, title: string) => void
  onItemCountChange: (count: number) => void
  itemCount: number
  online: boolean
  outboxCount: number
  aiRunCount: number
  citationCount: number
  projectCount: number
  onNavigateToView: (view: ActiveView) => void
  onTogglePanel: () => void
  activeProjectId: number | null
  onOpenProject: (id: number) => void
  onBackToDirectory: () => void
  showNewProjectDialog: boolean
  onNewProjectDialogChange: (open: boolean) => void
}

function MainContent({ userId, activeView, showForm, onItemCreated, onToggleForm, refreshTrigger, analyzingItemId, onAnalyze, onViewDetails, onRunStart, onItemCountChange, itemCount, online, outboxCount, aiRunCount, citationCount, projectCount, onNavigateToView, onTogglePanel, activeProjectId, onOpenProject, onBackToDirectory, showNewProjectDialog, onNewProjectDialogChange }: MainContentProps) {
  if (activeView === 'builder') {
    return (
      <div className="px-5 py-5 max-w-4xl mx-auto w-full">
        {activeProjectId !== null
          ? <ProjectWorkspace projectId={activeProjectId} onBack={onBackToDirectory} />
          : (
            <ProjectsDirectory
              userId={userId}
              onOpenProject={onOpenProject}
              showDialog={showNewProjectDialog}
              onDialogOpenChange={onNewProjectDialogChange}
            />
          )
        }
      </div>
    )
  }

  if (activeView === 'advisor')   return <AnalysisAdvisor onRunStart={onRunStart} userId={userId} />
  if (activeView === 'citations') return <CitationEngine onRunStart={onRunStart} userId={userId} />
  if (activeView === 'improve')   return <ImprovementAnalyzer onRunStart={onRunStart} userId={userId} />
  if (activeView === 'topics')    return <TopicBuilder onRunStart={onRunStart} userId={userId} />
  if (activeView === 'peer-review') return <PeerReview onRunStart={onRunStart} userId={userId} />
  if (activeView === 'library')     return <AskLibrary userId={userId} />
  if (activeView === 'help')        return <HelpAndStatusView itemCount={itemCount} online={online} outboxCount={outboxCount} />

  if (activeView === 'research') {
    return (
      <div className="px-5 py-5 space-y-5 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Research</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {itemCount} item{itemCount !== 1 ? 's' : ''} in your library
          </p>
        </div>
        {showForm && (
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <ResearchForm userId={userId} onItemCreated={onItemCreated} />
          </div>
        )}
        <ResearchList
          userId={userId}
          refreshTrigger={refreshTrigger}
          analyzingItemId={analyzingItemId}
          onAnalyze={onAnalyze}
          onViewDetails={onViewDetails}
          onItemCountChange={onItemCountChange}
        />
      </div>
    )
  }

  return (
    <DashboardOverview
      userId={userId}
      itemCount={itemCount}
      aiRunCount={aiRunCount}
      citationCount={citationCount}
      projectCount={projectCount}
      showForm={showForm}
      onItemCreated={onItemCreated}
      onToggleForm={onToggleForm}
      onNavigateToView={onNavigateToView}
      onTogglePanel={onTogglePanel}
      onOpenProject={onOpenProject}
      refreshTrigger={refreshTrigger}
      onItemCountChange={onItemCountChange}
    />
  )
}

export default App
