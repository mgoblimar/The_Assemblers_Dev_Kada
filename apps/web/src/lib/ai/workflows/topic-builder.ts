import { db } from '@/lib/db/database'
import { generateWithGemini, generateWithGroq } from '@/lib/ai/index'
import { buildTopicPrompt, buildOutlinePrompt } from '@/lib/ai/prompts'

export interface Topic {
  id: string
  title: string
  subtopics: string[]
  researchQuestions: string[]
  hypothesis: string
  noveltyScore: number
  feasibilityScore: number
  noveltyReason: string
  feasibilityReason: string
}

export interface OutlineSection {
  chapter: string
  purpose: string
  keyPoints: string[]
  suggestedLength: string
}

export interface TopicResult {
  seed: string
  topics: Topic[]
  selectedTopicId: string | null
  outline: OutlineSection[] | null
  offline: boolean
}

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

export async function runTopicGenerationWorkflow(
  seed: string,
  researchItemId: number
): Promise<{ runId: number; result: Pick<TopicResult, 'seed' | 'topics' | 'offline'> }> {
  const provider = DEFAULT_PROVIDER
  const model = provider === 'gemini'
    ? (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite')
    : (import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile')

  const runId = await db.aiRuns.add({
    researchItemId,
    provider,
    model,
    prompt: 'Topic Generator',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Generate & Score Topics', status: 'pending' },
    ],
  })

  const updateStep = async (index: number, status: 'completed' | 'failed', output?: string) => {
    const run = await db.aiRuns.get(runId)
    if (!run?.steps) return
    const steps = [...run.steps]
    steps[index] = { ...steps[index], status, output }
    await db.aiRuns.update(runId, { steps })
  }

  const callAI = provider === 'gemini' ? generateWithGemini : generateWithGroq

  try {
    let topics: Topic[] = []

    let raw: string
    try {
      raw = await callAI(buildTopicPrompt(seed), model)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI request failed'
      await updateStep(0, 'failed', msg)
      await db.aiRuns.update(runId, { status: 'failed', output: msg })
      throw new Error(`Could not reach AI service. Check your connection and try again. (${msg})`)
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      await updateStep(0, 'failed', 'Invalid JSON from AI')
      await db.aiRuns.update(runId, { status: 'failed', output: raw.slice(0, 200) })
      throw new Error('AI returned an unexpected format. Please try again.')
    }

    // Accept both bare array and { topics: [...] } envelope
    const topicArray = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>)?.topics)
        ? (parsed as Record<string, unknown>).topics as Topic[]
        : null

    if (!topicArray || topicArray.length === 0) {
      await updateStep(0, 'failed', 'No topics returned')
      await db.aiRuns.update(runId, { status: 'failed', output: 'Empty topics array' })
      throw new Error('AI returned no topics. Please rephrase your seed and try again.')
    }

    topics = topicArray.slice(0, 5)
    await updateStep(0, 'completed', `${topics.length} topics generated`)

    const result = { seed, topics, offline: false }

    await db.aiRuns.update(runId, { status: 'completed', output: JSON.stringify(result) })

    return { runId, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Only update DB if not already updated in the inner handlers above
    const current = await db.aiRuns.get(runId)
    if (current?.status !== 'failed') {
      await db.aiRuns.update(runId, { status: 'failed', output: msg })
    }
    throw err
  }
}

export async function runOutlineBuildWorkflow(
  topic: Topic,
  researchItemId: number
): Promise<{ runId: number; outline: OutlineSection[] }> {
  const provider = DEFAULT_PROVIDER
  const model = provider === 'gemini'
    ? (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite')
    : (import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile')

  const runId = await db.aiRuns.add({
    researchItemId,
    provider,
    model,
    prompt: 'Outline Builder',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Build Chapter Outline', status: 'pending' },
    ],
  })

  const updateStep = async (index: number, status: 'completed' | 'failed', output?: string) => {
    const run = await db.aiRuns.get(runId)
    if (!run?.steps) return
    const steps = [...run.steps]
    steps[index] = { ...steps[index], status, output }
    await db.aiRuns.update(runId, { steps })
  }

  const callAI = provider === 'gemini' ? generateWithGemini : generateWithGroq

  try {
    const raw = await callAI(
      buildOutlinePrompt(topic.title, topic.researchQuestions, topic.hypothesis, topic.subtopics),
      model
    )

    let parsed: unknown
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      throw new Error('AI returned an unexpected format for the outline. Please try again.')
    }

    // Accept both bare array and { outline: [...] } / { chapters: [...] } envelope
    const outline: OutlineSection[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>)?.outline)
        ? (parsed as Record<string, unknown>).outline as OutlineSection[]
        : Array.isArray((parsed as Record<string, unknown>)?.chapters)
          ? (parsed as Record<string, unknown>).chapters as OutlineSection[]
          : []

    if (outline.length === 0) {
      throw new Error('AI returned an empty outline. Please try again.')
    }

    await updateStep(0, 'completed', `${outline.length} chapters outlined`)
    await db.aiRuns.update(runId, { status: 'completed', output: JSON.stringify(outline) })

    await db.outbox.add({
      entityType: 'ai_run',
      entityId: runId,
      operation: 'create',
      payload: await db.aiRuns.get(runId) as unknown as Record<string, unknown>,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    })

    return { runId, outline }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.aiRuns.update(runId, { status: 'failed', output: msg })
    throw err
  }
}
