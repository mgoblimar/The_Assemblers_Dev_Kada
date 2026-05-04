import { useEffect, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { processOutbox } from '@/lib/sync/outbox-processor'
import { supabase } from '@/lib/sync/supabase'
import { Auth } from '@/features/auth/Auth'
import { Session } from '@supabase/supabase-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // 1. Auth Listener (Run once)
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

  // 3. Sync Trigger (Depends on session and online status)
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
      // 1. Clear Supabase
      if (session) {
        await supabase.from('ai_runs').delete().eq('user_id', session.user.id)
        await supabase.from('research_items').delete().eq('user_id', session.user.id)
      }
      
      // 2. Clear Local Dexie
      const { db } = await import('@/lib/db/database')
      await db.researchItems.clear()
      await db.aiRuns.clear()
      await db.outbox.clear()
      
      setRefreshTrigger(prev => prev + 1)
      alert('Demo data reset successfully!')
    } catch (err) {
      console.error('Reset failed:', err)
      alert('Reset failed. Check console.')
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Research Tool</h1>
            <p className="text-xs text-gray-500 mt-1">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="text-xs text-gray-500 animate-pulse">Syncing...</span>
            )}
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {online ? '🟢 Online' : '🔴 Offline'}
            </div>
            {online && (
              <button 
                onClick={() => triggerSync(true)}
                disabled={isSyncing}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Force Sync (Retries errors)"
              >
                🔄
              </button>
            )}
            <button 
              onClick={handleReset}
              disabled={isSyncing}
              className="p-2 hover:bg-red-100 rounded-full transition-colors"
              title="Reset Demo Data"
            >
              🗑️
            </button>
            <button 
              onClick={handleLogout}
              className="text-xs text-gray-600 hover:text-red-600 ml-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Form */}
        <ResearchForm onItemCreated={handleItemCreated} />

        {/* List */}
        <ResearchList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}

export default App
