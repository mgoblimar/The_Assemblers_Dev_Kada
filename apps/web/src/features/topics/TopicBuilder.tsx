import { useEffect, useState } from 'react'
import { Lightbulb, Sparkles, Loader2, ChevronDown, ChevronUp, Check, BookOpen } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { getResearchItems } from '@/lib/db/research-repository'
import {
  runTopicGenerationWorkflow,
  runOutlineBuildWorkflow,
  type Topic,
  type OutlineSection,
} from '@/lib/ai/workflows/topic-builder'
import type { ResearchItem } from '@/lib/db/database'
import { cn } from '@/lib/utils'

interface TopicBuilderProps {
  onRunStart: (runId: number, title: string) => void
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value * 10}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground w-4">{value}</span>
    </div>
  )
}

const CHAPTER_ICONS: Record<string, string> = {
  Abstract: '📄', Introduction: '🎯', 'Literature Review': '📚',
  Methodology: '🔬', Results: '📊', Discussion: '💬', Conclusion: '🏁',
}

export function TopicBuilder({ onRunStart }: TopicBuilderProps) {
  const [items, setItems] = useState<ResearchItem[]>([])
  const [seed, setSeed] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingOutline, setLoadingOutline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [outline, setOutline] = useState<OutlineSection[] | null>(null)
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null)
  const [loadingItems, setLoadingItems] = useState(true)

  useEffect(() => {
    getResearchItems()
      .then(data => {
        setItems(data)
        if (data[0]?.id) {
          setSelectedItemId(data[0].id)
          setSeed(data[0].title)
        }
      })
      .finally(() => setLoadingItems(false))
  }, [])

  const handleGenerateTopics = async () => {
    if (!seed.trim()) return
    setLoadingTopics(true)
    setError(null)
    setTopics([])
    setSelectedTopic(null)
    setOutline(null)

    const itemId = selectedItemId ?? 0
    try {
      const { runId, result } = await runTopicGenerationWorkflow(seed, itemId)
      onRunStart(runId, seed)
      setTopics(result.topics)
      if (result.topics.length > 0) setExpandedTopic(result.topics[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Topic generation failed')
    } finally {
      setLoadingTopics(false)
    }
  }

  const handleBuildOutline = async () => {
    if (!selectedTopic) return
    setLoadingOutline(true)
    setError(null)
    setOutline(null)

    const itemId = selectedItemId ?? 0
    try {
      const { runId, outline: outlineData } = await runOutlineBuildWorkflow(selectedTopic, itemId)
      onRunStart(runId, selectedTopic.title)
      setOutline(outlineData)
      if (outlineData.length > 0) setExpandedChapter(outlineData[0].chapter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Outline generation failed')
    } finally {
      setLoadingOutline(false)
    }
  }

  return (
    <div className="px-5 py-5 max-w-2xl mx-auto w-full space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-extrabold tracking-tight">Topic Builder</h1>
          <Badge variant="secondary" className="text-xs">Phase 12</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Generates scored research topics and builds full chapter outlines.
        </p>
      </div>

      {/* Input */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Research item prefill helper */}
          {!loadingItems && items.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prefill from research item
              </label>
              <select
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedItemId ?? ''}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelectedItemId(id)
                  const found = items.find(i => i.id === id)
                  if (found) setSeed(found.title)
                }}
              >
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Research Seed
            </label>
            <Input
              placeholder="e.g. Impact of social media on student mental health"
              value={seed}
              onChange={e => setSeed(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerateTopics()}
              className="text-sm"
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerateTopics}
            disabled={loadingTopics || !seed.trim()}
          >
            {loadingTopics
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating topics…</>
              : <><Sparkles className="w-4 h-4" /> Generate Topics</>
            }
          </Button>

          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/5 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Generated Topics
            </h2>
            {selectedTopic && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Check className="w-2.5 h-2.5" /> {selectedTopic.title.slice(0, 30)}…
              </Badge>
            )}
          </div>

          {topics.map(topic => {
            const isSelected = selectedTopic?.id === topic.id
            const isExpanded = expandedTopic === topic.id
            const overallScore = Math.round((topic.noveltyScore + topic.feasibilityScore) / 2)

            return (
              <Card
                key={topic.id}
                className={cn(
                  'transition-all cursor-pointer',
                  isSelected && 'ring-2 ring-primary shadow-sm',
                  !isSelected && 'hover:shadow-sm'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold leading-snug">{topic.title}</h3>
                        <span className={cn(
                          'text-xs font-black shrink-0 px-1.5 py-0.5 rounded border',
                          overallScore >= 7 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                          overallScore >= 4 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                             'text-rose-600 bg-rose-50 border-rose-200'
                        )}>
                          {overallScore}/10
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Novelty</p>
                          <ScoreBar value={topic.noveltyScore} color="bg-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-0.5">Feasibility</p>
                          <ScoreBar value={topic.feasibilityScore} color="bg-violet-400" />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3 text-xs">
                      {topic.researchQuestions.length > 0 && (
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Research Questions</p>
                          <ul className="space-y-0.5">
                            {topic.researchQuestions.map((q, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                                <span className="text-primary mt-0.5 shrink-0">·</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {topic.hypothesis && (
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">Hypothesis</p>
                          <p className="text-muted-foreground italic">{topic.hypothesis}</p>
                        </div>
                      )}
                      {topic.noveltyReason && (
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">Novelty:</span> {topic.noveltyReason}
                        </p>
                      )}
                      {topic.feasibilityReason && (
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-foreground">Feasibility:</span> {topic.feasibilityReason}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => setSelectedTopic(isSelected ? null : topic)}
                    >
                      {isSelected ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select Topic'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Build outline CTA */}
          {selectedTopic && (
            <Button
              className="w-full gap-2"
              onClick={handleBuildOutline}
              disabled={loadingOutline}
            >
              {loadingOutline
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Building outline…</>
                : <><BookOpen className="w-4 h-4" /> Build Research Outline</>
              }
            </Button>
          )}
        </div>
      )}

      {/* Outline */}
      {outline && selectedTopic && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Research Outline
            </h2>
          </div>
          <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedTopic.title}</span>
          </div>

          <div className="space-y-2">
            {outline.map(section => (
              <Card
                key={section.chapter}
                className={cn('transition-shadow', expandedChapter === section.chapter && 'ring-1 ring-primary/20 shadow-sm')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0">
                      {CHAPTER_ICONS[section.chapter] ?? '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold">{section.chapter}</h3>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {section.suggestedLength}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.purpose}</p>
                    </div>
                    <button
                      onClick={() => setExpandedChapter(expandedChapter === section.chapter ? null : section.chapter)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {expandedChapter === section.chapter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {expandedChapter === section.chapter && section.keyPoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t pl-9">
                      <ul className="space-y-1">
                        {section.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-primary shrink-0 mt-0.5">·</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
