import { useState } from 'react'
import { runAIForResearchItem } from '@/lib/ai'
import { runAgenticWorkflow } from '@/lib/ai/agent'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Brain, Zap, Loader2, Bot, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleRun('summary')}
          disabled={loading}
          variant="secondary"
          size="sm"
          className="gap-2 font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none shadow-none"
        >
          {loading && type === 'summary' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          Quick Summary
        </Button>
        <Button
          onClick={() => handleRun('agent')}
          disabled={loading}
          variant="secondary"
          size="sm"
          className="gap-2 font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border-none shadow-none"
        >
          {loading && type === 'agent' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Brain className="w-3.5 h-3.5" />
          )}
          Deep Insight
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs font-medium border border-destructive/20">
          AI Error: {error}
        </div>
      )}

      {output && (
        <Card className="bg-indigo-50/30 border-none shadow-none">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {type === 'agent' ? (
                  <Bot className="w-4 h-4 text-purple-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {type === 'agent' ? 'Agent Output' : 'Summary Result'}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white border-gray-200">
                AI Generated
              </Badge>
            </div>
            <div className="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {output}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
