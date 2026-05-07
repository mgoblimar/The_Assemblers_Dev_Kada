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
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Research Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build your research paper chapter by chapter with AI guidance.
        </p>
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
            <svg className="size-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">No projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first research project to get started.</p>
          </div>
          <button
            type="button"
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5
                       text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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
            className="h-40 rounded-xl border-2 border-dashed border-border
                       flex flex-col items-center justify-center gap-2
                       text-muted-foreground hover:text-foreground hover:border-primary/50
                       hover:bg-muted/30 transition-all group"
          >
            <div className="size-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="h-40 rounded-xl border border-border bg-card p-5 text-left
                         hover:border-primary/50 hover:shadow-sm transition-all
                         flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                  {project.title}
                </p>
                <span className={`inline-block flex-shrink-0 text-xs px-2 py-0.5 rounded border font-medium capitalize ${STATUS_STYLES[project.status]}`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {project.researchQuestions.length > 0 && (
                    <span>{project.researchQuestions.length} RQs</span>
                  )}
                  {project.objectives.length > 0 && (
                    <span>{project.objectives.length} objectives</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</p>
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
