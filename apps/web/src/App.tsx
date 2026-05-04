import { useEffect, useState } from 'react'
import './App.css'
import { ResearchForm } from '@/features/research/ResearchForm'
import { ResearchList } from '@/features/research/ResearchList'
import { processOutbox } from '@/lib/sync/outbox-processor'

function App() {
  const [online, setOnline] = useState(navigator.onLine)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      triggerSync()
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial sync check
    if (navigator.onLine) {
      triggerSync()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const triggerSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      await processOutbox()
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleItemCreated = () => {
    // Trigger refresh of the list
    setRefreshTrigger((prev) => prev + 1)
    if (online) triggerSync()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Research Tool</h1>
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
                onClick={triggerSync}
                disabled={isSyncing}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                title="Manual Sync"
              >
                🔄
              </button>
            )}
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
