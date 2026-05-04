import { useState } from 'react'
import { createResearchItem } from '@/lib/db/research-repository'

interface ResearchFormProps {
  onItemCreated: () => void
}

export function ResearchForm({ onItemCreated }: ResearchFormProps) {
  const [title, setTitle] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !sourceText.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createResearchItem(title, sourceText)
      setTitle('')
      setSourceText('')
      onItemCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create research item')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setLoading(true)
    try {
      const demoItems = [
        { 
          title: 'The Future of Neural Interfaces', 
          text: 'Recent breakthroughs in high-bandwidth neural interfaces are allowing for direct brain-to-computer communication with lower latency than ever before. Companies like Neuralink and Synchron are leading the way in clinical trials...' 
        },
        { 
          title: 'Sustainable Fusion Energy 2026', 
          text: 'The latest results from the ITER project suggest that Q-factor sustainability is finally within reach. Commercial fusion power plants are being projected for the early 2030s, promising carbon-free baseload power.' 
        }
      ]
      
      for (const item of demoItems) {
        await createResearchItem(item.title, item.text)
      }
      onItemCreated()
    } catch (err) {
      setError('Failed to seed data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">New Research Item</h2>
        <button 
          type="button" 
          onClick={handleSeed}
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          [Seed Demo Data]
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter research title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Source Text / Content
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste your research content here..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Creating...' : 'Create Research Item'}
      </button>
    </form>
  )
}
