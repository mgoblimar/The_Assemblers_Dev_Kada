import { db } from '../db/database'
import { callAIProvider, type AIProvider } from './index'
import { buildAgenticPrompt } from './prompts'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'

function defaultModel(provider: AIProvider): string {
  if (provider === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (provider === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.1-8b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

export async function runAgenticWorkflow(researchItemId: number, onRunCreated?: (runId: number) => void) {
  const provider = DEFAULT_PROVIDER
  const model = defaultModel(provider)

  const now = new Date()
  
  const item = await db.researchItems.get(researchItemId)
  if (!item) throw new Error('Item not found')

  const runId = await db.aiRuns.add({
    researchItemId,
    userId: item.userId,
    provider,
    model,
    prompt: 'Agentic Workflow',
    output: '',
    status: 'pending',
    createdAt: now,
    steps: [
      { name: 'Summarize', status: 'pending' },
      { name: 'Extract Actions', status: 'pending' },
      { name: 'Categorize', status: 'pending' },
    ]
  })

  // Notify caller immediately so the panel can start polling
  onRunCreated?.(runId)

  try {
    const steps: { name: string, status: 'pending' | 'completed' | 'failed', output?: string }[] = [
      { name: 'Summarize', status: 'pending' },
      { name: 'Extract Actions', status: 'pending' },
      { name: 'Categorize', status: 'pending' },
    ]

    const callAI = (prompt: string, model: string, maxTokens?: number) => callAIProvider(provider, prompt, model, maxTokens)

    // Step 1: Summarize (cap at 1024 — summary outputs are ~200–500 tokens)
    steps[0].status = 'completed'
    const summary = await callAI(buildAgenticPrompt('summarize', item.sourceText), model, 1024)
    steps[0].output = summary
    await db.aiRuns.update(runId, { steps: [...steps], output: `SUMMARY:\n${summary}` })

    // Delay to stay within TPM limits
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Step 2: Extract Actions
    steps[1].status = 'completed'
    const actions = await callAI(buildAgenticPrompt('actions', summary), model, 1024)
    steps[1].output = actions
    await db.aiRuns.update(runId, { steps: [...steps], output: `SUMMARY:\n${summary}\n\nACTIONS:\n${actions}` })

    // Delay to stay within TPM limits
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Step 3: Categorize
    steps[2].status = 'completed'
    const category = await callAI(buildAgenticPrompt('categorize', summary), model, 256)
    steps[2].output = category
    
    const combinedOutput = `### 📋 Summary\n${summary}\n\n### 🚀 Action Items\n${actions}\n\n**Category:** ${category}`
    
    await db.aiRuns.update(runId, { 
      steps: [...steps], 
      status: 'completed', 
      output: combinedOutput 
    })

    // Add to outbox
    const finalRun = await db.aiRuns.get(runId)
    if (finalRun) {
      await db.outbox.add({
        userId: item.userId,
        entityType: 'ai_run',
        entityId: runId,
        operation: 'create',
        payload: finalRun as unknown as Record<string, unknown>,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      })
    }

    return { runId, output: steps.map(s => s.output).join('\n\n') }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    await db.aiRuns.update(runId, { status: 'failed', output: errorMsg })
    
    // Add failed run to outbox
    const finalRun = await db.aiRuns.get(runId)
    if (finalRun) {
      await db.outbox.add({
        userId: item.userId,
        entityType: 'ai_run',
        entityId: runId,
        operation: 'create',
        payload: finalRun as unknown as Record<string, unknown>,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
      })
    }
    throw err
  }
}
