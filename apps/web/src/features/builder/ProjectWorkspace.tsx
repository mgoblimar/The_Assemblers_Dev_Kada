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
  { id: 'chapter-4', label: 'Chapter 4', subtitle: 'Results & Discussion' },
  { id: 'chapter-5', label: 'Chapter 5', subtitle: 'Conclusion' },
]

// Chapters 4 and 5 are not yet implemented
const COMING_SOON: ChapterId[] = ['chapter-4', 'chapter-5']

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

  const ch1Done = ch1State?.currentStep === 'done'
  const isDisabled = (id: ChapterId) =>
    COMING_SOON.includes(id) || (id === 'chapter-2' && !ch1Done) || (id === 'chapter-3' && !ch1Done)

  return (
    <div className="space-y-6">
      {/* Workspace header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="size-8 rounded-lg border border-border flex items-center justify-center
                     text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to projects"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {project?.title ?? 'Loading…'}
          </h1>
          <p className="text-xs text-muted-foreground">Research Project</p>
        </div>
      </div>

      {/* Chapter tabs */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
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
              className={`flex-shrink-0 rounded-lg border px-4 py-2.5 text-left transition-all
                ${isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : disabled
                    ? 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50'
                    : 'border-border bg-card text-foreground hover:border-primary/50'
                }`}
            >
              <p className="text-xs font-semibold">{ch.label}</p>
              <p className="text-[10px] text-current opacity-70 mt-0.5">
                {isComingSoon ? 'Coming soon' : ch.subtitle}
              </p>
            </button>
          )
        })}
      </div>

      {/* Unlock hint */}
      {!ch1Done && (
        <p className="text-xs text-muted-foreground text-center">
          Complete Chapter 1 to unlock Chapters 2 and 3.
        </p>
      )}

      {/* Active chapter content */}
      {activeChapter === 'chapter-1' && (
        <Chapter1Wizard projectId={projectId} onDone={handleCh1Done} />
      )}
      {activeChapter === 'chapter-2' && ch1Done && (
        <Chapter2Wizard projectId={projectId} ch1State={ch1State} />
      )}
      {activeChapter === 'chapter-3' && ch1Done && (
        <Chapter3Wizard projectId={projectId} />
      )}
    </div>
  )
}
