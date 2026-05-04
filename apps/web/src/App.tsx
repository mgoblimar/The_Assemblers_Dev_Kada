import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Research Tool</h1>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {online ? 'Online' : 'Offline'}
          </div>
        </div>

        <p className="text-gray-600 mb-4">Phase 1 Foundation - Coming Soon</p>

        <button
          onClick={() => setCount((count) => count + 1)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          count is {count}
        </button>
      </div>
    </div>
  )
}

export default App
