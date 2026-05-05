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

const PIPELINE_STEPS = [
  'Summarize',
  'Extract Actions',
  'Categorize',
  'Citation Search',
  'Generate Outline',
]

type StepState = 'done' | 'progress' | 'pending' | 'failed' | 'future'

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
      <div className="w-72 shrink-0 border-l bg-muted/10 flex flex-col">
        <PanelHeader />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center py-8">
          <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary/30" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click <span className="font-semibold text-foreground">Analyze</span> on a research item to run the AI pipeline
          </p>
          <div className="w-full mt-2 space-y-2">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2.5 opacity-30">
                <span className="w-5 h-5 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const runSteps = run.steps ?? []
  const completedCount = runSteps.filter(s => s.status === 'completed').length
  const progress = Math.round((completedCount / PIPELINE_STEPS.length) * 100)
  const isDone = run.status === 'completed'
  const isFailed = run.status === 'failed'
  const isRunning = run.status === 'pending'

  const getStepState = (i: number): StepState => {
    const dbStep = runSteps[i]
    if (!dbStep) return 'future'
    if (dbStep.status === 'completed') return 'done'
    if (dbStep.status === 'failed') return 'failed'
    if (isRunning) return 'progress'
    return 'pending'
  }

  return (
    <div className="w-72 shrink-0 border-l bg-muted/10 flex flex-col">
      <PanelHeader isRunning={isRunning} />

      {/* Item subtitle */}
      <div className="px-4 py-2.5 border-b bg-muted/20 shrink-0">
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          <span className="font-medium text-foreground/70">Analyzing: </span>
          {itemTitle}
        </p>
      </div>

      {/* Steps */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="relative flex flex-col gap-4">
          <div className="absolute left-[9px] top-5 bottom-5 w-px bg-border" />
          {PIPELINE_STEPS.map((stepName, i) => {
            const state = getStepState(i)
            const dbStep = runSteps[i]
            return (
              <div key={stepName} className="flex items-start gap-3 relative z-10">
                <StepIcon state={state} />
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={cn(
                    'text-sm font-semibold leading-snug',
                    state === 'done'     ? 'text-foreground' :
                    state === 'progress' ? 'text-primary' :
                    state === 'failed'   ? 'text-destructive' :
                                          'text-muted-foreground'
                  )}>
                    {stepName}
                  </p>
                  {state === 'done' && dbStep?.output && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {dbStep.output.slice(0, 90)}…
                    </p>
                  )}
                  {state === 'progress' && (
                    <p className="text-[11px] text-primary mt-0.5">Running…</p>
                  )}
                  {state === 'future' && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5 uppercase tracking-wide font-medium">
                      Phase {i >= 3 ? (i === 3 ? '10' : '12') : '—'} · Coming soon
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress + actions */}
      <div className="px-4 py-3 border-t shrink-0 space-y-3">
        {isFailed && (
          <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Analysis failed — check API keys
          </p>
        )}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isFailed ? 'bg-destructive' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onCancel}
            disabled={isDone || isFailed}
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            disabled={!isDone}
            onClick={() => run && onViewReport(run)}
          >
            <FileText className="w-3 h-3 mr-1" />
            View Report
          </Button>
        </div>
      </div>
    </div>
  )
}

function PanelHeader({ isRunning }: { isRunning?: boolean }) {
  return (
    <div className="h-14 flex items-center gap-2 px-4 border-b shrink-0">
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="font-bold text-sm">AI Analysis</span>
      {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
    </div>
  )
}

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case 'done':     return <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 shrink-0 mt-0.5" />
    case 'progress': return <Loader2      className="w-[18px] h-[18px] text-primary shrink-0 mt-0.5 animate-spin" />
    case 'failed':   return <XCircle      className="w-[18px] h-[18px] text-destructive shrink-0 mt-0.5" />
    default:         return <Circle       className="w-[18px] h-[18px] text-muted-foreground/30 shrink-0 mt-0.5" />
  }
}
