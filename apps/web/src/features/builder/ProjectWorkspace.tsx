import { useCallback, useEffect, useState } from 'react'
import type { ResearchProject, ChapterState } from '@/lib/db/database'
import { getProject, getOrCreateChapterState } from '@/lib/db/project-repository'
import { Chapter1Wizard } from './Chapter1Wizard'
import { Chapter2Wizard } from './Chapter2Wizard'
import { Chapter3Wizard } from './Chapter3Wizard'

interface Props {
  projectId: number
  onBack: () => void
}

type ChapterId = 'chapter-1' | 'chapter-2' | 'chapter-3' | 'chapter-4' | 'chapter-5'

const CHAPTERS: { id: ChapterId; label: string; subtitle: string }[] = [
  { id: 'chapter-1', label: 'Chapter 1', subtitle: 'Introduction' },
  { id: 'chapter-2', label: 'Chapter 2', subtitle: 'Review of Literature' },
  { id: 'chapter-3', label: 'Chapter 3', subtitle: 'Methodology' },
]

// Chapters 4 and 5 are hidden for the demo
const COMING_SOON: ChapterId[] = []

export function ProjectWorkspace({ projectId, onBack }: Props) {
  const [project, setProject]           = useState<ResearchProject | null>(null)
  const [activeChapter, setActiveChapter] = useState<ChapterId>('chapter-1')
  const [ch1State, setCh1State]          = useState<ChapterState | null>(null)

  useEffect(() => {
    getProject(projectId).then(p => setProject(p ?? null))
  }, [projectId])

  // Load Ch1 state so Chapter2Wizard can pre-populate research themes
  useEffect(() => {
    getOrCreateChapterState(projectId, 'chapter-1').then(setCh1State).catch(() => null)
  }, [projectId])

  // Re-fetch when Chapter 1 signals completion, so Ch2/Ch3 tabs unlock immediately
  const handleCh1Done = useCallback(() => {
    getOrCreateChapterState(projectId, 'chapter-1').then(setCh1State).catch(() => null)
  }, [projectId])

  const ch1Done = ch1State?.currentStep === 'done' || ch1State?.currentStep === 'compile_draft'
  const isDisabled = (id: ChapterId) =>
    COMING_SOON.includes(id) || (id === 'chapter-2' && !ch1Done) || (id === 'chapter-3' && !ch1Done)

  return (
    <div className="space-y-4">
      {/* Workspace header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="size-8 rounded border border-border flex items-center justify-center
                     text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Back to projects"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-foreground leading-tight"
              title={project?.title}
              style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
            {project?.title ?? 'Loading…'}
          </h1>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Academic Research Paper</p>
        </div>
      </div>

      {/* Chapter tabs */}
      <div className="flex items-stretch border-b border-border">
        {CHAPTERS.map(ch => {
          const disabled = isDisabled(ch.id)
          const isActive = activeChapter === ch.id
          const isComingSoon = COMING_SOON.includes(ch.id)
          return (
            <button
              key={ch.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveChapter(ch.id)}
              className={`flex-1 px-4 py-2.5 text-center transition-all border-b-2 -mb-px
                ${isActive
                  ? 'border-b-primary text-primary bg-primary/5'
                  : disabled
                    ? 'border-b-transparent text-muted-foreground cursor-not-allowed opacity-40'
                    : 'border-b-transparent text-muted-foreground hover:text-foreground hover:border-b-border cursor-pointer'
                }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide">{ch.label}</p>
              <p className="text-[10px] mt-0.5 text-current opacity-75">
                {isComingSoon ? 'Coming soon' : ch.subtitle}
              </p>
            </button>
          )
        })}
      </div>

      {/* Unlock hint */}
      {!ch1Done && (
        <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded px-4 py-2 text-center">
          Complete Chapter 1 to unlock Chapters 2 and 3.
        </p>
      )}

      {/* Active chapter content */}
      {activeChapter === 'chapter-1' && (
        <Chapter1Wizard 
          projectId={projectId} 
          onDone={handleCh1Done} 
          onGoToNext={() => setActiveChapter('chapter-2')} 
        />
      )}
      {activeChapter === 'chapter-2' && ch1Done && (
        <Chapter2Wizard 
          projectId={projectId} 
          ch1State={ch1State} 
          onGoToNext={() => setActiveChapter('chapter-3')} 
        />
      )}
      {activeChapter === 'chapter-3' && ch1Done && (
        <Chapter3Wizard projectId={projectId} onGoToNext={onBack} />
      )}
    </div>
  )
}
