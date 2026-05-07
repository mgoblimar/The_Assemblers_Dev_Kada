import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { Sidebar, type ActiveView } from '@/features/layout/Sidebar'
import { AIWorkflowPanel } from '@/features/layout/AIWorkflowPanel'
import { StatusBar } from '@/features/layout/StatusBar'
import { Auth } from '@/features/auth/Auth'
import { HelpModal } from '@/features/help/HelpModal'
import { processOutbox, fetchRemoteData } from '@/lib/sync/outbox-processor'
import { supabase } from '@/lib/sync/supabase'
import { runAgenticWorkflow } from '@/lib/ai/agent'
import { db } from '@/lib/db/database'
import type { AIRun, ResearchItem } from '@/lib/db/database'
import { Session } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

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
import { Search, Plus, Trash2, PanelLeft, PanelRight, Home } from 'lucide-react'
import { DashboardOverview } from '@/features/layout/DashboardOverview'
import { ProjectsDirectory } from '@/features/builder/ProjectsDirectory'
import { ProjectWorkspace } from '@/features/builder/ProjectWorkspace'
import { getActiveProjectId, setActiveProjectId } from '@/lib/db/project-repository'

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
  )
}

function Dashboard({ session }: { session: Session }) {
  const navigate = useNavigate()
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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [activeRunTitle, setActiveRunTitle] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outboxCount, setOutboxCount] = useState(0)
  const [aiRunCount, setAiRunCount] = useState(0)
  const [citationCount, setCitationCount] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
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

  // AI run counts
  useEffect(() => {
    db.aiRuns.count().then(setAiRunCount)
    db.aiRuns.where('prompt').equals('Citation Engine').count().then(setCitationCount)
  }, [refreshTrigger])

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
      {/* 3-column body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — hidden on mobile, togglable on desktop */}
        {sidebarOpen && (
          <div className="hidden md:flex">
            <Sidebar
              email={session.user.email ?? ''}
              online={online}
              isSyncing={isSyncing}
              lastSynced={lastSynced}
              activeView={activeView}
              onViewChange={(view) => {
                setActiveView(view)
                localStorage.setItem('activeView', view)
              }}
              onLogout={() => supabase.auth.signOut()}
              onSync={() => triggerSync(true)}
              onHelp={() => setShowHelp(true)}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="h-14 border-b flex items-center gap-2 px-3 shrink-0 bg-background/80 backdrop-blur-md">
            {/* Sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground shrink-0"
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm bg-muted/40 border-0 focus-visible:ring-1"
                placeholder="Search your research…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/')}
              title="Go to Landing Page"
            >
              <Home className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={handleReset}
              title="Reset demo data"
              disabled={isSyncing}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            {topBarAction && (
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
                onClick={topBarAction.onClick}
              >
                <Plus className="w-3.5 h-3.5" />
                {topBarAction.label}
              </Button>
            )}

            {/* AI panel toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-foreground shrink-0 hidden lg:flex"
              onClick={togglePanel}
              title={panelOpen ? 'Close AI panel' : 'Open AI panel'}
            >
              <PanelRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <MainContent
              userId={session.user.id}
              activeView={activeView}
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
              aiRunCount={aiRunCount}
              citationCount={citationCount}
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
        </div>

        {/* AI panel — hidden on mobile, togglable on desktop */}
        {panelOpen && (
          <div className="hidden lg:flex">
            <AIWorkflowPanel
              runId={activeRunId}
              itemTitle={activeRunTitle}
              onCancel={() => { setActiveRunId(null); setActiveRunTitle(null) }}
              onViewReport={handleViewReport}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <StatusBar itemCount={itemCount} online={online} outboxCount={outboxCount} />

      {/* Help modal */}
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />

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
  aiRunCount: number
  citationCount: number
  onNavigateToView: (view: ActiveView) => void
  onTogglePanel: () => void
  activeProjectId: number | null
  onOpenProject: (id: number) => void
  onBackToDirectory: () => void
  showNewProjectDialog: boolean
  onNewProjectDialogChange: (open: boolean) => void
}

function MainContent({ userId, activeView, showForm, onItemCreated, onToggleForm, refreshTrigger, analyzingItemId, onAnalyze, onViewDetails, onRunStart, onItemCountChange, itemCount, aiRunCount, citationCount, onNavigateToView, onTogglePanel, activeProjectId, onOpenProject, onBackToDirectory, showNewProjectDialog, onNewProjectDialogChange }: MainContentProps) {
  if (activeView === 'builder') {
    return (
      <div className="px-5 py-5 max-w-3xl mx-auto w-full">
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

  if (activeView === 'research') {
    return (
      <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto w-full">
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
      showForm={showForm}
      onItemCreated={onItemCreated}
      onToggleForm={onToggleForm}
      onNavigateToView={onNavigateToView}
      onTogglePanel={onTogglePanel}
      onAnalyze={onAnalyze}
      onViewDetails={onViewDetails}
      analyzingItemId={analyzingItemId}
      refreshTrigger={refreshTrigger}
      onItemCountChange={onItemCountChange}
    />
  )
}

export default App
