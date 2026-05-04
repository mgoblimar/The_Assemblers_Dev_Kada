import { generateWithGemini } from './gemini'
import { generateWithGroq } from './groq'
import { db } from '@/lib/db/database'
import { buildResearchPrompt } from './prompts'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

export async function runAIForResearchItem(researchItemId: number, options?: { model?: string, provider?: 'gemini' | 'groq' }) {
  const provider = options?.provider || DEFAULT_PROVIDER
  const model = options?.model || (provider === 'gemini' 
    ? (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite')
    : (import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'))

  // create AIRun entry with pending status
  const now = new Date()
  const runId = await db.aiRuns.add({
    researchItemId,
    provider,
    model,
    prompt: '',
    output: '',
    status: 'pending',
    createdAt: now,
  })

  try {
    // load the research item
    const item = await db.researchItems.get(researchItemId)
    if (!item) throw new Error('Research item not found')

    const prompt = buildResearchPrompt(item.title, item.sourceText)

    // update the run with prompt
    await db.aiRuns.update(runId, { prompt })

    const result = provider === 'gemini' 
      ? await generateWithGemini(prompt, model)
      : await generateWithGroq(prompt, model)

    await db.aiRuns.update(runId, { output: result, status: 'completed' })

    // Add to outbox for sync
    const finalRun = await db.aiRuns.get(runId)
    if (finalRun) {
      await db.outbox.add({
        entityType: 'ai_run',
        entityId: runId,
        operation: 'create',
        payload: finalRun,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      })
    }

    return { runId, output: result }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await db.aiRuns.update(runId, { status: 'failed', output: errorMsg })
    
    // Also sync failed runs so they show up in the audit trail
    const finalRun = await db.aiRuns.get(runId)
    if (finalRun) {
      await db.outbox.add({
        entityType: 'ai_run',
        entityId: runId,
        operation: 'create',
        payload: finalRun,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      })
    }
    throw err
  }
}

export { generateWithGemini, generateWithGroq }
