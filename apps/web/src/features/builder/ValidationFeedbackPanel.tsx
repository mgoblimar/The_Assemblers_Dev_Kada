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
    <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Score bar */}
      <div className="px-4 pt-4 pb-3 border-b border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-amber-800">Quality Score</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreColor(validation.score)}`}>
            {validation.score}<span className="text-sm font-normal text-amber-700">/100</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-amber-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scoreBg(validation.score)}`}
            style={{ width: `${validation.score}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-amber-700">{scoreLabel(validation.score)}</span>
          <span className="text-xs text-amber-600">
            {validation.score >= 65 ? 'Passes automatically at 65+' : `${65 - validation.score} pts to auto-pass`}
          </span>
        </div>
      </div>

      {/* Issues + suggestions */}
      <div className="px-4 py-3 space-y-3 text-sm">
        {validation.issues.length > 0 && (
          <div>
            <p className="font-semibold text-amber-800 mb-1">Issues to address:</p>
            <ul className="space-y-1 text-amber-700">
              {validation.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div>
            <p className="font-semibold text-amber-800 mb-1">Suggestions:</p>
            <ul className="space-y-1 text-amber-700">
              {validation.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-amber-500">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.attempt > 1 && (
          <p className="text-xs text-amber-600">Attempt {validation.attempt}</p>
        )}
      </div>

      {/* Continue anyway */}
      {canContinue && onContinueAnyway && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-amber-300 bg-amber-100/60 px-3 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800">
              Your score is <strong>{validation.score}/100</strong>. You can continue with your current draft and refine it later.
            </p>
            <button
              type="button"
              onClick={onContinueAnyway}
              className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 whitespace-nowrap"
            >
              Continue anyway →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
