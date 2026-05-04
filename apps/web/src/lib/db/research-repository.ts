import { db, ResearchItem } from './database'

export async function createResearchItem(
  title: string,
  sourceText: string,
): Promise<ResearchItem> {
  const now = new Date()
  const id = await db.researchItems.add({
    title,
    sourceText,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
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
  await db.researchItems.update(id, {
    ...updates,
    updatedAt: new Date(),
  })
}

export async function deleteResearchItem(id: number): Promise<void> {
  await db.researchItems.delete(id)
}
