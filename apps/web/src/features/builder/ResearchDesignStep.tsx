import type { ReactElement } from 'react'
import type { ChapterState } from '@/lib/db/database'

type Design = 'quantitative' | 'qualitative' | 'mixed'

interface Props {
  state: ChapterState
  onSelect: (design: Design) => void
  aiRunning: boolean
}

// SVG icons for each design type — no emojis
function QuantIcon() {
  return (
    <svg className="size-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function QualIcon() {
  return (
    <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  )
}

function MixedIcon() {
  return (
    <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}

const DESIGNS: { value: Design; label: string; description: string; Icon: () => ReactElement }[] = [
  {
    value: 'quantitative',
    label: 'Quantitative',
    description: 'Uses numerical data, surveys, and statistical analysis to measure variables and test hypotheses.',
    Icon: QuantIcon,
  },
  {
    value: 'qualitative',
    label: 'Qualitative',
    description: 'Uses interviews, observations, and thematic analysis to understand experiences and meanings.',
    Icon: QualIcon,
  },
  {
    value: 'mixed',
    label: 'Mixed Methods',
    description: 'Combines both quantitative and qualitative approaches for a more comprehensive understanding.',
    Icon: MixedIcon,
  },
]

export function ResearchDesignStep({ state, onSelect, aiRunning }: Props) {
  const current = state.artifacts.ch3_researchDesign

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
          Research Design
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Choose the research design that best fits your study. This determines how Chapter 3 is written.
        </p>
      </div>

      <div className="grid gap-3">
        {DESIGNS.map(design => {
          const isSelected = current === design.value
          return (
            <button
              key={design.value}
              type="button"
              onClick={() => onSelect(design.value)}
              disabled={aiRunning}
              className={`w-full text-left rounded border p-4 transition-all cursor-pointer
                ${isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 p-2 rounded border flex-shrink-0
                  ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30'}`}>
                  <design.Icon />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem' }}>
                      {design.label}
                    </p>
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{design.description}</p>
                </div>
                <div className={`mt-1 size-4 rounded-sm border-2 flex-shrink-0 flex items-center justify-center
                  ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                  {isSelected && (
                    <svg viewBox="0 0 10 8" className="size-2.5 text-primary-foreground fill-current">
                      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {current && (
        <p className="text-xs text-muted-foreground text-center">
          Click your selection again to confirm and proceed.
        </p>
      )}
    </div>
  )
}
