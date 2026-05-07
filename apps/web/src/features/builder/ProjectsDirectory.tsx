import { useEffect, useState } from 'react'
import type { ResearchProject } from '@/lib/db/database'
import { createProject, getProjects } from '@/lib/db/project-repository'
import { NewProjectDialog } from './NewProjectDialog'

interface Props {
  userId?: string
  onOpenProject: (projectId: number) => void
  /** Controlled open state for the dialog — pass from parent to let the top bar trigger it */
  showDialog?: boolean
  /** Called when the dialog should open or close — keep parent in sync */
  onDialogOpenChange?: (open: boolean) => void
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES: Record<ResearchProject['status'], string> = {
  active:    'bg-primary/8 text-primary border-primary/30',
  completed: 'bg-secondary/10 text-secondary border-secondary/30',
  archived:  'bg-muted text-muted-foreground border-border',
}

export function ProjectsDirectory({ userId, onOpenProject, showDialog: controlledOpen, onDialogOpenChange }: Props) {
  const [projects, setProjects]         = useState<ResearchProject[]>([])
  const [loading, setLoading]           = useState(true)
  const [internalOpen, setInternalOpen] = useState(false)

  // Controlled takes precedence; fall back to internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  function openDialog() {
    if (onDialogOpenChange) onDialogOpenChange(true)
    else setInternalOpen(true)
  }

  function closeDialog() {
    if (onDialogOpenChange) onDialogOpenChange(false)
    else setInternalOpen(false)
  }

  async function loadProjects() {
    setLoading(true)
    try {
      const list = await getProjects(userId)
      setProjects(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [userId])

  async function handleCreate(title: string) {
    closeDialog()
    const project = await createProject(title, userId)
    if (project.id !== undefined) {
      onOpenProject(project.id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Research Projects
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build your academic research paper chapter by chapter with AI guidance.
        </p>
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded border border-border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center space-y-4 border border-dashed border-border rounded">
          <div className="size-12 rounded border border-border bg-muted/40 flex items-center justify-center">
            <svg className="size-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
              No research projects yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">Begin your academic work by creating your first project.</p>
          </div>
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-1.5
                       text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Start a Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* New project card */}
          <button
            type="button"
            onClick={openDialog}
            className="h-36 rounded border-2 border-dashed border-border
                       flex flex-col items-center justify-center gap-2
                       text-muted-foreground hover:text-primary hover:border-primary/60
                       hover:bg-primary/5 transition-all group cursor-pointer"
          >
            <div className="size-10 rounded border border-current/20 bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-medium">New Project</span>
          </button>

          {projects.map(project => (
            <button
              key={project.id}
              type="button"
              onClick={() => project.id !== undefined && onOpenProject(project.id)}
              title={project.title}
              className="min-h-36 h-auto rounded border border-border bg-card p-4 text-left
                         hover:border-primary/40 hover:shadow-md transition-all
                         flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex flex-col items-start gap-2 mb-3">
                <p className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors"
                   style={{ fontFamily: 'var(--font-heading)' }}>
                  {project.title}
                </p>
                <span className={`inline-block flex-shrink-0 text-[10px] px-2 py-0.5 rounded border font-semibold uppercase tracking-wide capitalize ${STATUS_STYLES[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {project.researchQuestions.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      {project.researchQuestions.length} RQs
                    </span>
                  )}
                  {project.objectives.length > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {project.objectives.length} objectives
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground border-t border-border pt-2">{formatDate(project.updatedAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && (
        <NewProjectDialog
          onConfirm={handleCreate}
          onCancel={closeDialog}
        />
      )}
    </div>
  )
}
