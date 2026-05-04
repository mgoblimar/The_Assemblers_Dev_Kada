import { useState } from 'react'
import { runAIForResearchItem } from '@/lib/ai'

interface Props {
  researchItemId?: number | null
}

export function ResearchAI({ researchItemId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)

  if (!researchItemId) return null

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const res = await runAIForResearchItem(researchItemId)
      setOutput(res.output)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleRun}
        disabled={loading}
        className="text-sm text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Running AI…' : 'Generate Summary'}
      </button>

      {error && <div className="mt-2 text-sm text-red-600">Error: {error}</div>}
      {output && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-800 whitespace-pre-wrap">{output}</div>
      )}
    </div>
  )
}
