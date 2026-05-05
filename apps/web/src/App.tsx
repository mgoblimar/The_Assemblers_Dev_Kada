import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { Sidebar, type ActiveView } from '@/features/layout/Sidebar'
import { AIWorkflowPanel } from '@/features/layout/AIWorkflowPanel'
import { StatusBar } from '@/features/layout/StatusBar'
import { Auth } from '@/features/auth/Auth'
import { processOutbox, fetchRemoteData } from '@/lib/sync/outbox-processor'
import { supabase } from '@/lib/sync/supabase'
import { runAgenticWorkflow } from '@/lib/ai/agent'
import { db } from '@/lib/db/database'
import type { AIRun, ResearchItem } from '@/lib/db/database'
import { Session } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Toaster } from '@/shared/components/ui/toaster'
import { AnalysisAdvisor } from '@/features/advisor/AnalysisAdvisor'
import { CitationEngine } from '@/features/citations/CitationEngine'
import { Search, Plus, Database, Trash2, BarChart3, Bookmark, PenLine, Lightbulb, Construction } from 'lucide-react'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState('not synced')
  const [activeView, setActiveView] = useState<ActiveView>('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [activeRunTitle, setActiveRunTitle] = useState<string | null>(null)
  const [itemCount, setItemCount] = useState(0)
  const [outboxCount, setOutboxCount] = useState(0)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRemoteData(session.user.id).then(() => setRefreshTrigger(p => p + 1))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) fetchRemoteData(s.user.id).then(() => setRefreshTrigger(p => p + 1))
    })
    return () => subscription.unsubscribe()
  }, [])

  // Online/offline
  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Auto-sync when online
  useEffect(() => {
    if (session && online) triggerSync()
  }, [session?.user?.id, online])

  // Outbox count
  useEffect(() => {
    db.outbox.where('status').equals('pending').count().then(setOutboxCount)
  }, [refreshTrigger])

  const triggerSync = async (force = false) => {
    if (isSyncing || !session) return
    setIsSyncing(true)
    try {
      await processOutbox(force)
      setRefreshTrigger(p => p + 1)
      setLastSynced(`synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
    } catch {
      /* no-op */
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAnalyze = async (item: ResearchItem) => {
    if (!item.id) return
    setActiveRunTitle(item.title)
    setActiveRunId(null)
    try {
      const { runId } = await runAgenticWorkflow(item.id)
      setActiveRunId(runId)
      setRefreshTrigger(p => p + 1)
    } catch {
      setActiveRunTitle(null)
    }
  }

  const handleViewReport = (_run: AIRun) => {
    setRefreshTrigger(p => p + 1)
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

  if (!session) return <Auth />

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* 3-column body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:flex">
          <Sidebar
            email={session.user.email ?? ''}
            online={online}
            isSyncing={isSyncing}
            lastSynced={lastSynced}
            activeView={activeView}
            onViewChange={setActiveView}
            onLogout={() => supabase.auth.signOut()}
            onSync={() => triggerSync(true)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="h-14 border-b flex items-center gap-3 px-4 shrink-0 bg-background/80 backdrop-blur-md">
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
              className="w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={handleReset}
              title="Reset demo data"
              disabled={isSyncing}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold"
              onClick={() => { setActiveView('dashboard'); setShowForm(v => !v) }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Research
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <MainContent
              userId={session.user.id}
              activeView={activeView}
              showForm={showForm}
              onItemCreated={handleItemCreated}
              refreshTrigger={refreshTrigger}
              activeRunId={activeRunId}
              onAnalyze={handleAnalyze}
              onRunStart={(runId, title) => { setActiveRunId(runId); setActiveRunTitle(title) }}
              onItemCountChange={handleItemCountChange}
              itemCount={itemCount}
            />
          </div>
        </div>

        {/* AI panel — hidden on mobile */}
        <div className="hidden lg:flex">
          <AIWorkflowPanel
            runId={activeRunId}
            itemTitle={activeRunTitle}
            onCancel={() => { setActiveRunId(null); setActiveRunTitle(null) }}
            onViewReport={handleViewReport}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar itemCount={itemCount} online={online} outboxCount={outboxCount} />
      
      {/* Toasts */}
      <Toaster />
    </div>
  )
}

interface MainContentProps {
  userId: string
  activeView: ActiveView
  showForm: boolean
  onItemCreated: () => void
  refreshTrigger: number
  activeRunId: number | null
  onAnalyze: (item: ResearchItem) => void
  onRunStart: (runId: number, title: string) => void
  onItemCountChange: (count: number) => void
  itemCount: number
}

function MainContent({ userId, activeView, showForm, onItemCreated, refreshTrigger, activeRunId, onAnalyze, onRunStart, onItemCountChange, itemCount }: MainContentProps) {
  if (activeView === 'advisor')   return <AnalysisAdvisor onRunStart={onRunStart} />
  if (activeView === 'citations') return <CitationEngine onRunStart={onRunStart} />
  if (activeView === 'improve')   return <ComingSoon icon={PenLine}    title="Improve Writing"   phase="11" desc="Per-section coherence scoring, gap detection, and rewrite suggestions." />
  if (activeView === 'topics')    return <ComingSoon icon={Lightbulb}  title="Topic Builder"     phase="12" desc="Generates scored topic trees and full research chapter outlines." />

  return (
    <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto w-full">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {itemCount} item{itemCount !== 1 ? 's' : ''} in your local database
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Research Items" value={itemCount} icon={Database} />
        <StatCard label="AI Runs" value="—" icon={BarChart3} />
        <StatCard label="Citations" value="—" icon={Bookmark} phase="10" />
      </div>

      {/* Form toggle */}
      {showForm && (
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <ResearchForm userId={userId} onItemCreated={onItemCreated} />
        </div>
      )}

      {/* List */}
      <ResearchList
        userId={userId}
        refreshTrigger={refreshTrigger}
        activeRunId={activeRunId}
        onAnalyze={onAnalyze}
        onItemCountChange={onItemCountChange}
      />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, phase }: { label: string; value: string | number; icon: React.ElementType; phase?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {phase && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">P{phase}</Badge>}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  )
}

function ComingSoon({ icon: Icon, title, phase, desc }: { icon: React.ElementType; title: string; phase: string; desc: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary/50" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <Badge variant="secondary" className="text-xs">Phase {phase}</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-medium">
        <Construction className="w-3.5 h-3.5" />
        Coming soon
      </div>
    </div>
  )
}

export default App
