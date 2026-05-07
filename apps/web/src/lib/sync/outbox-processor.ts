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
            user_id: entry.userId,
            title,
            source_text: sourceText,
            created_at: new Date(createdAt as string).toISOString(),
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
            user_id: entry.userId,
            research_item_id: researchItemId,
            provider,
            model,
            prompt,
            output,
            status,
            steps,
            created_at: new Date(createdAt as string).toISOString(),
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

export async function fetchRemoteData(userId: string) {
  console.log('[SYNC] Pulling remote data for user:', userId)
  
  // 1. Fetch research items
  const { data: remoteItems, error: itemsError } = await supabase
    .from('research_items')
    .select('*')
    .eq('user_id', userId)

  if (itemsError) throw itemsError

  for (const item of remoteItems || []) {
    const local = await db.researchItems.get(item.id)
    if (!local) {
      await db.researchItems.add({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        sourceText: item.source_text,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        syncStatus: 'synced'
      })
    }
  }

  // 2. Fetch AI runs
  const { data: remoteRuns, error: runsError } = await supabase
    .from('ai_runs')
    .select('*')
    .eq('user_id', userId)

  if (runsError) throw runsError

  for (const run of remoteRuns || []) {
    const local = await db.aiRuns.get(run.id)
    if (!local) {
      await db.aiRuns.add({
        id: run.id,
        userId: run.user_id,
        researchItemId: run.research_item_id,
        provider: run.provider,
        model: run.model,
        prompt: run.prompt,
        output: run.output,
        status: run.status,
        steps: run.steps,
        createdAt: new Date(run.created_at)
      })
    }
  }
}
