import { useEffect, useState } from 'react'
import { ResearchItem } from '@/lib/db/database'
import { getResearchItems } from '@/lib/db/research-repository'
import { ResearchAI } from './ResearchAI'

interface ResearchListProps {
  refreshTrigger: number
}

export function ResearchList({ refreshTrigger }: ResearchListProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getResearchItems()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research items')
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading research items...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-8">
          No research items yet. Create one to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Research Items ({items.length})</h2>
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                item.syncStatus === 'synced'
                  ? 'bg-green-100 text-green-800'
                  : item.syncStatus === 'error'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {item.syncStatus}
            </span>
          </div>

          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            {item.sourceText}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-3">
              <ResearchAI researchItemId={item.id} />
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
