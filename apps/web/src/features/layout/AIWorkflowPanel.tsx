import { useEffect, useState } from 'react'
import { Sparkles, CheckCircle2, Circle, Loader2, X, FileText, XCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { db } from '@/lib/db/database'
import type { AIRun } from '@/lib/db/database'
import { cn } from '@/lib/utils'

interface AIWorkflowPanelProps {
  runId: number | null
  itemTitle: string | null
  onCancel: () => void
  onViewReport: (run: AIRun) => void
}

const DEFAULT_PREVIEW_STEPS = ['Summarize', 'Extract Actions', 'Categorize']

type StepState = 'done' | 'progress' | 'pending' | 'failed'

export function AIWorkflowPanel({ runId, itemTitle, onCancel, onViewReport }: AIWorkflowPanelProps) {
  const [run, setRun] = useState<AIRun | null>(null)

  useEffect(() => {
    if (!runId) {
      setRun(null)
      return
    }

    let cancelled = false

    const poll = async () => {
      const r = await db.aiRuns.get(runId)
      if (!cancelled && r) setRun(r)
    }

    poll()
    const interval = setInterval(poll, 400)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [runId])

  if (!runId || !run) {
    return (
      <div className="w-52 shrink-0 border-l bg-muted/10 flex flex-col">
        <PanelHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center py-6">
          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary/30" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Click <span className="font-semibold text-foreground">Analyze</span> on a research item to run the AI pipeline
          </p>
          <div className="w-full mt-1 space-y-1.5">
            {DEFAULT_PREVIEW_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 opacity-30">
                <span className="w-4 h-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
                  {i + 1}
                </span>
                <span className="text-[11px] text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const runSteps = run.steps ?? []
  const completedCount = runSteps.filter(s => s.status === 'completed').length
  const progress = runSteps.length > 0 ? Math.round((completedCount / runSteps.length) * 100) : 0
  const isDone = run.status === 'completed'
  const isFailed = run.status === 'failed'
  const isRunning = run.status === 'pending'

  const getStepState = (i: number): StepState => {
    const dbStep = runSteps[i]
    if (!dbStep) return 'pending'
    if (dbStep.status === 'completed') return 'done'
    if (dbStep.status === 'failed') return 'failed'
    if (isRunning) return 'progress'
    return 'pending'
  }

  return (
    <div className="w-52 shrink-0 border-l bg-muted/10 flex flex-col">
      <PanelHeader isRunning={isRunning} />

      {/* Item subtitle */}
      <div className="px-3 py-1.5 border-b bg-muted/20 shrink-0">
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          <span className="font-medium text-foreground/70">Analyzing: </span>
          {itemTitle}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="relative flex flex-col gap-3">
          <div className="absolute left-[7px] top-4 bottom-4 w-px bg-border" />
          {runSteps.map((dbStep, i) => {
            const state = getStepState(i)
            return (
              <div key={i} className="flex items-start gap-2 relative z-10">
                <StepIcon state={state} />
                <div className="flex-1 min-w-0 pt-px">
                  <p className={cn(
                    'text-[11px] font-semibold leading-snug',
                    state === 'done'     ? 'text-foreground' :
                    state === 'progress' ? 'text-primary' :
                    state === 'failed'   ? 'text-destructive' :
                                          'text-muted-foreground'
                  )}>
                    {dbStep.name}
                  </p>
                  {state === 'done' && dbStep?.output && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {dbStep.output.slice(0, 80)}…
                    </p>
                  )}
                  {state === 'progress' && (
                    <p className="text-[10px] text-primary mt-0.5">Running…</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress + actions */}
      <div className="px-3 py-2.5 border-t shrink-0 space-y-2">
        {isFailed && (
          <p className="text-[10px] text-destructive font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Analysis failed — check API keys
          </p>
        )}
        <div>
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isFailed ? 'bg-destructive' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-7 text-[11px]"
            onClick={onCancel}
          >
            <X className="w-2.5 h-2.5 mr-1" />
            {isDone || isFailed ? 'Close' : 'Cancel'}
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-[11px]"
            disabled={!isDone}
            onClick={() => {
              if (run) {
                onViewReport(run)
              }
            }}
          >
            <FileText className="w-2.5 h-2.5 mr-1" />
            Report
          </Button>
        </div>
      </div>
    </div>
  )
}

function PanelHeader({ isRunning }: { isRunning?: boolean }) {
  return (
    <div className="h-9 flex items-center gap-1.5 px-3 border-b shrink-0">
      <Sparkles className="w-3 h-3 text-primary" />
      <span className="font-bold text-[11px]">AI Analysis</span>
      {isRunning && <Loader2 className="w-3 h-3 animate-spin text-primary ml-auto" />}
    </div>
  )
}

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case 'done':     return <CheckCircle2 className="w-[14px] h-[14px] text-emerald-500 shrink-0 mt-0.5" />
    case 'progress': return <Loader2      className="w-[14px] h-[14px] text-primary shrink-0 mt-0.5 animate-spin" />
    case 'failed':   return <XCircle      className="w-[14px] h-[14px] text-destructive shrink-0 mt-0.5" />
    default:         return <Circle       className="w-[14px] h-[14px] text-muted-foreground/30 shrink-0 mt-0.5" />
  }
}
