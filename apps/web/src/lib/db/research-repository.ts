import { db, ResearchItem, AIRun } from './database'

export async function createResearchItem(
  title: string,
  sourceText: string,
): Promise<ResearchItem> {
  const now = new Date()
  const payload = {
    title,
    sourceText,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending' as const,
  }
  const id = await db.researchItems.add(payload)

  // Add to outbox
  await db.outbox.add({
    entityType: 'research_item',
    entityId: id,
    operation: 'create',
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
  })

  const item = await db.researchItems.get(id)
  if (!item) throw new Error('Failed to create research item')
  return item
}

export async function getResearchItems(): Promise<ResearchItem[]> {
  return db.researchItems.orderBy('createdAt').reverse().toArray()
}

export async function getResearchItem(id: number): Promise<ResearchItem | undefined> {
  return db.researchItems.get(id)
}

export async function updateResearchItem(
  id: number,
  updates: Partial<ResearchItem>,
): Promise<void> {
  const now = new Date()
  await db.researchItems.update(id, {
    ...updates,
    updatedAt: now,
  })

  // Add to outbox for update
  await db.outbox.add({
    entityType: 'research_item',
    entityId: id,
    operation: 'update',
    payload: updates,
    status: 'pending',
    retryCount: 0,
    createdAt: now,
  })
}

export async function deleteResearchItem(id: number): Promise<void> {
  await db.researchItems.delete(id)
}

export async function getLatestAIRunForResearchItem(
  researchItemId: number,
): Promise<AIRun | undefined> {
  const runs = await db.aiRuns
    .where('researchItemId')
    .equals(researchItemId)
    .sortBy('createdAt')

  return runs[runs.length - 1]
}

export async function getInsightRunsForResearchItem(
  researchItemId: number,
): Promise<{ summaryRun?: AIRun; deepRun?: AIRun }> {
  const runs = await db.aiRuns
    .where('researchItemId')
    .equals(researchItemId)
    .sortBy('createdAt')

  const summaryRuns = runs.filter((run) => !run.steps || run.steps.length === 0)
  const deepRuns = runs.filter((run) => run.steps && run.steps.length > 0)

  return {
    summaryRun: summaryRuns[summaryRuns.length - 1],
    deepRun: deepRuns[deepRuns.length - 1],
  }
}
