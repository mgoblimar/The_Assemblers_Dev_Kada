import { useState } from 'react'

interface Props {
  onConfirm: (title: string) => void
  onCancel: () => void
}

export function NewProjectDialog({ onConfirm, onCancel }: Props) {
  const [title, setTitle] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (t.length < 3) return
    onConfirm(t)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">New Research Project</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Give your research a working title. You can refine it later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-title" className="block text-sm font-medium text-foreground mb-1.5">
              Project Title
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Impact of Social Media on Academic Performance"
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {title.trim().length > 0 && title.trim().length < 3 && (
              <p className="text-xs text-amber-500 mt-1">Please enter at least 3 characters.</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium
                         text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={title.trim().length < 3}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium
                         text-primary-foreground hover:bg-primary/90
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
