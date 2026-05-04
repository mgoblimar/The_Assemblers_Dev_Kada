import { useEffect, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { processOutbox } from '@/lib/sync/outbox-processor'
import { supabase } from '@/lib/sync/supabase'
import { Auth } from '@/features/auth/Auth'
import { Session } from '@supabase/supabase-js'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { 
  LogOut, 
  RotateCw, 
  Trash2, 
  Cloud, 
  CloudOff, 
  Loader2,
  BrainCircuit
} from 'lucide-react'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Online/Offline Listeners
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 3. Sync Trigger
  useEffect(() => {
    if (session && online) {
      triggerSync()
    }
  }, [session?.user?.id, online])

  const triggerSync = async (force = false) => {
    if (isSyncing || !session) return
    setIsSyncing(true)
    try {
      await processOutbox(force)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to clear all local and remote data for this demo?')) return
    
    setIsSyncing(true)
    try {
      if (session) {
        await supabase.from('ai_runs').delete().eq('user_id', session.user.id)
        await supabase.from('research_items').delete().eq('user_id', session.user.id)
      }
      
      const { db } = await import('@/lib/db/database')
      await db.researchItems.clear()
      await db.aiRuns.clear()
      await db.outbox.clear()
      
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Reset failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleItemCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
    if (online && session) triggerSync()
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary rounded-lg p-1.5 shadow-lg shadow-primary/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">Research<span className="text-primary">AI</span></span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{session.user.email}</span>
              <Badge variant={online ? "success" : "warning"} className="h-5 gap-1 text-[10px] uppercase tracking-wider font-bold">
                {online ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {online ? 'Cloud Active' : 'Offline Mode'}
              </Badge>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-1.5">
              {online && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => triggerSync(true)}
                  disabled={isSyncing}
                  className="rounded-full hover:bg-slate-100"
                  title="Force Sync"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleReset}
                disabled={isSyncing}
                className="rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                title="Reset Data"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12 space-y-12">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back, {session.user.email?.split('@')[0]}
          </h2>
          <p className="text-lg text-slate-500 font-medium">
            What are we researching today?
          </p>
        </section>

        {/* Action Section */}
        <section>
          <ResearchForm onItemCreated={handleItemCreated} />
        </section>

        {/* Content Section */}
        <section className="pb-20">
          <ResearchList refreshTrigger={refreshTrigger} />
        </section>
      </main>
      
      {/* Mobile Status Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-2 bg-white/80 backdrop-blur-md border-t flex justify-center">
        <Badge variant={online ? "success" : "warning"} className="gap-1.5 px-4 py-1">
          {online ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          {online ? 'Online' : 'Offline'}
        </Badge>
      </div>
    </div>
  )
}

export default App
