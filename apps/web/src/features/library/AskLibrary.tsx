import { useEffect, useRef, useState } from 'react'
import { Library, Send, Loader2, Bot, User, BookOpen } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { getResearchItems } from '@/lib/db/research-repository'
import { generateWithGroq } from '@/lib/ai/index'
import { buildLibraryQueryPrompt } from '@/lib/ai/prompts'
import type { ResearchItem } from '@/lib/db/database'

interface AskLibraryProps {
  userId?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  keyInsights?: string[]
  citedItems?: string[]
  followUpQuestions?: string[]
}

function extractJSON(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/g, '').trim()
  const arrStart = s.indexOf('['), arrEnd = s.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(s.slice(arrStart, arrEnd + 1)) } catch { /* fall through */ }
  }
  const objStart = s.indexOf('{'), objEnd = s.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(s.slice(objStart, objEnd + 1)) } catch { /* fall through */ }
  }
  return JSON.parse(s)
}

function scoreRelevance(item: ResearchItem, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const haystack = `${item.title} ${item.sourceText}`.toLowerCase()
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0)
}

const SUGGESTIONS = [
  'What are the common themes?',
  'What methodology gaps exist?',
  'Summarize my research library',
]

export function AskLibrary({ userId }: AskLibraryProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getResearchItems(userId).then(setItems).finally(() => setLoadingItems(false))
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || loading) return
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setQuery('')
    setLoading(true)

    try {
      if (items.length === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Your library is empty. Add research items from the Dashboard, then come back to ask questions about them.',
        }])
        return
      }

      const ranked = [...items]
        .map(item => ({ item, score: scoreRelevance(item, trimmed) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ item }) => ({ title: item.title, excerpt: item.sourceText.slice(0, 400) }))

      const model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
      const raw = await generateWithGroq(buildLibraryQueryPrompt(trimmed, ranked), model)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = extractJSON(raw) as any

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: typeof parsed?.answer === 'string' ? parsed.answer : raw,
        keyInsights: Array.isArray(parsed?.keyInsights) ? parsed.keyInsights : [],
        citedItems: Array.isArray(parsed?.citedItems)
          ? (parsed.citedItems as number[]).map(i => ranked[i - 1]?.title).filter(Boolean)
          : [],
        followUpQuestions: Array.isArray(parsed?.followUpQuestions) ? parsed.followUpQuestions : [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not process that query. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 py-5 max-w-2xl mx-auto w-full flex flex-col" style={{ height: 'calc(100vh - 7.5rem)' }}>
      <div className="shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Ask My Library</h1>
          <Badge variant="secondary" className="text-xs">RAG</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions across all your saved research.{' '}
          {!loadingItems && (
            <span className="font-medium">{items.length} item{items.length !== 1 ? 's' : ''} in your library.</span>
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pb-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Ask anything about your research</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Your library is searched automatically. The most relevant items are used as context.
              </p>
            </div>
            {!loadingItems && items.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}

            <div className="max-w-[82%] space-y-2">
              <Card className={msg.role === 'user' ? 'bg-primary text-primary-foreground border-0' : ''}>
                <CardContent className="px-3 py-2.5">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </CardContent>
              </Card>

              {msg.role === 'assistant' && msg.keyInsights && msg.keyInsights.length > 0 && (
                <div className="space-y-1 pl-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Key Insights</p>
                  {msg.keyInsights.map((ins, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-primary shrink-0">·</span>{ins}
                    </div>
                  ))}
                </div>
              )}

              {msg.role === 'assistant' && msg.citedItems && msg.citedItems.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-1">
                  {msg.citedItems.map((title, j) => (
                    <Badge key={j} variant="secondary" className="text-[10px]">
                      {(title as string).slice(0, 28)}{(title as string).length > 28 ? '…' : ''}
                    </Badge>
                  ))}
                </div>
              )}

              {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pl-1">
                  {msg.followUpQuestions.map((q, j) => (
                    <button
                      key={j}
                      onClick={() => send(q as string)}
                      className="text-[11px] px-2 py-0.5 rounded border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                      {q as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <Card><CardContent className="px-3 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </CardContent></Card>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 pt-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(query)}
            placeholder={items.length === 0 ? 'Add research items first…' : 'Ask about your library…'}
            disabled={loading || loadingItems || items.length === 0}
            className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => send(query)} disabled={loading || !query.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
