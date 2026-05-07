import { db, ResearchProject, ChapterState, ChapterId } from './database'

// ─── Projects ────────────────────────────────────────────────────────────────

export async function createProject(title: string, userId?: string): Promise<ResearchProject> {
  const now = new Date()
  const payload: ResearchProject = {
    userId,
    title,
    status: 'active',
    sop: null,
    researchQuestions: [],
    objectives: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    syncStatus: 'pending',
  }
  const id = await db.researchProjects.add(payload)
  await db.outbox.add({
    userId,
    entityType: 'research_project',
    entityId: id,
    operation: 'create',
    payload: payload as unknown as Record<string, unknown>,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
  })
  const project = await db.researchProjects.get(id)
  if (!project) throw new Error('Failed to create project')
  return project
}

export async function getProjects(userId?: string): Promise<ResearchProject[]> {
  const all = userId
    ? await db.researchProjects.where('userId').equals(userId).toArray()
    : await db.researchProjects.toArray()
  return all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function getProject(id: number): Promise<ResearchProject | undefined> {
  return db.researchProjects.get(id)
}

export async function updateProject(id: number, updates: Partial<ResearchProject>): Promise<void> {
  const now = new Date()
  await db.researchProjects.update(id, { ...updates, updatedAt: now })
  await db.outbox.add({
    entityType: 'research_project',
    entityId: id,
    operation: 'update',
    payload: updates as unknown as Record<string, unknown>,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
  })
}

export async function archiveProject(id: number): Promise<void> {
  return updateProject(id, { status: 'archived' })
}

export async function completeProject(id: number): Promise<void> {
  return updateProject(id, { status: 'completed', completedAt: new Date() })
}

export async function deleteProject(id: number, userId?: string): Promise<void> {
  const now = new Date()
  await db.researchProjects.delete(id)
  
  // Also cleanup chapter states for this project
  await db.chapterStates.where('projectId').equals(id).delete()

  // Clear active project if it was deleted
  if (getActiveProjectId() === id) {
    setActiveProjectId(null)
  }

  await db.outbox.add({
    userId,
    entityType: 'research_project',
    entityId: id,
    operation: 'delete',
    payload: {},
    status: 'pending',
    retryCount: 0,
    createdAt: now,
  })
}

// ─── Chapter States ───────────────────────────────────────────────────────────

export async function getOrCreateChapterState(
  projectId: number,
  chapterId: ChapterId,
  initialStep?: ChapterState['currentStep'],
): Promise<ChapterState> {
  const existing = await db.chapterStates
    .where('[projectId+chapterId]')
    .equals([projectId, chapterId])
    .first()
  if (existing) return existing

  const now = new Date()
  const fresh: ChapterState = {
    projectId,
    chapterId,
    currentStep: initialStep ?? 'sop_input',
    stepStatus: 'awaiting_user',
    artifacts: {},
    history: [],
    updatedAt: now,
    syncStatus: 'pending',
  }
  const id = await db.chapterStates.add(fresh)
  return { ...fresh, id }
}

export async function saveChapterState(state: ChapterState): Promise<void> {
  const now = new Date()
  const updated = { ...state, updatedAt: now, syncStatus: 'pending' as const }
  if (state.id) {
    await db.chapterStates.put(updated)
  } else {
    await db.chapterStates.add(updated)
  }
}

export async function getChapterState(
  projectId: number,
  chapterId: ChapterId,
): Promise<ChapterState | undefined> {
  return db.chapterStates
    .where('[projectId+chapterId]')
    .equals([projectId, chapterId])
    .first()
}

// ─── Active project (localStorage) ───────────────────────────────────────────

const ACTIVE_KEY = 'activeProjectId'

export function getActiveProjectId(): number | null {
  const raw = localStorage.getItem(ACTIVE_KEY)
  return raw ? Number(raw) : null
}

export function setActiveProjectId(id: number | null): void {
  if (id === null) localStorage.removeItem(ACTIVE_KEY)
  else localStorage.setItem(ACTIVE_KEY, String(id))
}
