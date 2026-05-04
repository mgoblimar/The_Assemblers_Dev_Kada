import { db } from '../db/database'
import { supabase } from './supabase'

export async function processOutbox() {
  const pendingEntries = await db.outbox
    .where('status')
    .equals('pending')
    .toArray()

  for (const entry of pendingEntries) {
    try {
      let error = null

      if (entry.entityType === 'research_item') {
        const { error: pgError } = await supabase
          .from('research_items')
          .upsert({
            id: entry.entityId,
            ...entry.payload,
            updated_at: new Date().toISOString(),
          })
        error = pgError
      } else if (entry.entityType === 'ai_run') {
        const { error: pgError } = await supabase
          .from('ai_runs')
          .upsert({
            id: entry.entityId,
            ...entry.payload,
          })
        error = pgError
      }

      if (error) throw error

      await db.outbox.update(entry.id!, {
        status: 'synced',
        updatedAt: new Date(),
      })

      // Update the actual entity's sync status if applicable
      if (entry.entityType === 'research_item') {
        await db.researchItems.update(entry.entityId, { syncStatus: 'synced' })
      }
    } catch (err) {
      console.error('Failed to sync outbox entry:', entry.id, err)
      const newRetryCount = (entry.retryCount || 0) + 1
      await db.outbox.update(entry.id!, {
        status: newRetryCount > 3 ? 'failed' : 'pending',
        retryCount: newRetryCount,
      })
      
      if (entry.entityType === 'research_item') {
        await db.researchItems.update(entry.entityId, { syncStatus: 'error' })
      }
    }
  }
}
