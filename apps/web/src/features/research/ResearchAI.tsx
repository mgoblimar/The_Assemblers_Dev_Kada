import { useState } from 'react'
import { runAIForResearchItem } from '@/lib/ai'
import { runAgenticWorkflow } from '@/lib/ai/agent'

interface Props {
  researchItemId?: number | null
}

export function ResearchAI({ researchItemId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [type, setType] = useState<'summary' | 'agent'>('summary')

  if (!researchItemId) return null

  const handleRun = async (mode: 'summary' | 'agent') => {
    setLoading(true)
    setError(null)
    setOutput(null)
    setType(mode)
    try {
      const res = mode === 'summary' 
        ? await runAIForResearchItem(researchItemId)
        : await runAgenticWorkflow(researchItemId)
      setOutput(res.output)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          onClick={() => handleRun('summary')}
          disabled={loading}
          className="text-xs text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading && type === 'summary' ? 'Running…' : 'Quick Summary'}
        </button>
        <button
          onClick={() => handleRun('agent')}
          disabled={loading}
          className="text-xs text-white bg-purple-600 px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading && type === 'agent' ? 'Thinking…' : 'Deep Insight (Agent)'}
        </button>
      </div>

      {error && <div className="mt-2 text-sm text-red-600">Error: {error}</div>}
      {output && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 whitespace-pre-wrap">
          <div className="font-bold mb-1 text-indigo-700">{type === 'agent' ? '🤖 Agent Output' : '✨ Summary'}</div>
          {output}
        </div>
      )}
    </div>
  )
}
