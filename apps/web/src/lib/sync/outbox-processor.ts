import { db } from '../db/database'
import { supabase } from './supabase'

export async function processOutbox(includeFailed = false) {
  const query = db.outbox.where('status')
  const entries = includeFailed 
    ? await query.anyOf(['pending', 'failed']).toArray()
    : await query.equals('pending').toArray()

  for (const entry of entries) {
    try {
      let error = null

      if (entry.entityType === 'research_item') {
        // Map local camelCase to Supabase snake_case
        const { title, sourceText, createdAt } = entry.payload
        const { error: pgError } = await supabase
          .from('research_items')
          .upsert({
            id: entry.entityId,
            title,
            source_text: sourceText,
            created_at: new Date(createdAt).toISOString(),
            updated_at: new Date().toISOString(),
          })
        error = pgError
      } else if (entry.entityType === 'ai_run') {
        // Map local camelCase to Supabase snake_case
        const { researchItemId, provider, model, prompt, output, status, steps, createdAt } = entry.payload
        const { error: pgError } = await supabase
          .from('ai_runs')
          .upsert({
            id: entry.entityId,
            research_item_id: researchItemId,
            provider,
            model,
            prompt,
            output,
            status,
            steps,
            created_at: new Date(createdAt).toISOString(),
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
      
      // If it failed 3 times, mark as failed, otherwise keep as pending to try again
      await db.outbox.update(entry.id!, {
        status: newRetryCount >= 3 ? 'failed' : 'pending',
        retryCount: newRetryCount,
      })
      
      if (entry.entityType === 'research_item') {
        await db.researchItems.update(entry.entityId, { syncStatus: 'error' })
      }
    }
  }
}
