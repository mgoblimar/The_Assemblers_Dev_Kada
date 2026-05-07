import type { ValidationResult } from '@/lib/db/database'

// Score >= this allows "Continue anyway"
export const CONTINUE_ANYWAY_THRESHOLD = 50

interface Props {
  validation: ValidationResult
  onContinueAnyway?: () => void
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Good — almost there'
  if (score >= 65) return 'Acceptable'
  if (score >= 50) return 'Needs improvement'
  return 'Needs significant work'
}

export function ValidationFeedbackPanel({ validation, onContinueAnyway }: Props) {
  if (validation.ok) return null

  const canContinue = validation.score >= CONTINUE_ANYWAY_THRESHOLD

  return (
    <div className="rounded border border-amber-300/60 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800/50 overflow-hidden">
      {/* Score bar */}
      <div className="px-4 pt-3.5 pb-3 border-b border-amber-200/70 dark:border-amber-800/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">Academic Quality Score</span>
          <span className={`text-xl font-bold tabular-nums ${scoreColor(validation.score)}`}
                style={{ fontFamily: 'var(--font-heading)' }}>
            {validation.score}<span className="text-sm font-normal text-amber-600 dark:text-amber-500">/100</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-amber-200 dark:bg-amber-800/50">
          <div
            className={`h-full transition-all duration-500 ${scoreBg(validation.score)}`}
            style={{ width: `${validation.score}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-amber-700 dark:text-amber-400 italic">{scoreLabel(validation.score)}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-500">
            {validation.score >= 65 ? 'Passes at 65+' : `${65 - validation.score} pts to auto-pass`}
          </span>
        </div>
      </div>

      {/* Issues + suggestions */}
      <div className="px-4 py-3 space-y-3 text-sm">
        {validation.issues.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400 mb-1.5">Issues to address</p>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300">
              {validation.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-amber-500">▸</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400 mb-1.5">Suggestions</p>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300">
              {validation.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-amber-500">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.attempt > 1 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-500">Attempt {validation.attempt}</p>
        )}
      </div>

      {/* Continue anyway */}
      {canContinue && onContinueAnyway && (
        <div className="px-4 pb-3.5">
          <div className="rounded border border-amber-300/60 bg-amber-100/50 dark:bg-amber-900/30 px-3 py-2 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Score <strong>{validation.score}/100</strong> — you may continue with your current draft.
            </p>
            <button
              type="button"
              onClick={onContinueAnyway}
              className="shrink-0 text-xs font-semibold text-amber-900 dark:text-amber-300 underline underline-offset-2 hover:text-amber-700 whitespace-nowrap cursor-pointer"
            >
              Continue anyway →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
