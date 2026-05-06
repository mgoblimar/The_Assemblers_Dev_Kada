import { generateWithGemini } from './gemini'
import { generateWithGroq } from './groq'
import { generateWithCerebras } from './cerebras'
import { db } from '@/lib/db/database'
import { buildResearchPrompt } from './prompts'

export type AIProvider = 'gemini' | 'groq' | 'cerebras'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'

function defaultModel(provider: AIProvider): string {
  if (provider === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (provider === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.3-70b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

export function callAIProvider(provider: AIProvider, prompt: string, model: string, maxTokens?: number): Promise<string> {
  if (provider === 'gemini')   return generateWithGemini(prompt, model, maxTokens)
  if (provider === 'cerebras') return generateWithCerebras(prompt, model, maxTokens)
  return generateWithGroq(prompt, model, maxTokens)
}

export async function runAIForResearchItem(researchItemId: number, options?: { model?: string, provider?: AIProvider }) {
  const provider = options?.provider || DEFAULT_PROVIDER
  const model = options?.model || defaultModel(provider)

  const now = new Date()
  
  // load the research item to get userId
  const item = await db.researchItems.get(researchItemId)
  if (!item) throw new Error('Research item not found')

  // create AIRun entry with pending status
  const runId = await db.aiRuns.add({
    researchItemId,
    userId: item.userId,
    provider,
    model,
    prompt: '',
    output: '',
    status: 'pending',
    createdAt: now,
  })

  try {
    const prompt = buildResearchPrompt(item.title, item.sourceText)

    // update the run with prompt
    await db.aiRuns.update(runId, { prompt })

    const result = await callAIProvider(provider, prompt, model)

    await db.aiRuns.update(runId, { output: result, status: 'completed' })

    // Add to outbox for sync
    const finalRun = await db.aiRuns.get(runId)
    if (finalRun) {
      await db.outbox.add({
        userId: item.userId,
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
        userId: item.userId,
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

export { generateWithGemini, generateWithGroq, generateWithCerebras }
