import { db } from '@/lib/db/database'
import { generateWithGemini, generateWithGroq } from '@/lib/ai/index'
import { buildImprovementPrompt } from '@/lib/ai/prompts'

export interface ParagraphFeedback {
  text: string
  coherenceScore: number
  issues: string[]
  suggestion: string
}

export interface ImprovementResult {
  sectionType: string
  overallScore: number
  coherenceSummary: string
  argumentIssues: string[]
  gaps: string[]
  paragraphs: ParagraphFeedback[]
  topRewrite: { original: string; improved: string } | null
  offline: boolean
}

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

function splitParagraphsOffline(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 20)
    .slice(0, 6)
    .map(p => p.slice(0, 300))
}

export async function runImprovementWorkflow(
  researchItemId: number
): Promise<{ runId: number; result: ImprovementResult }> {
  const provider = DEFAULT_PROVIDER
  const model = provider === 'gemini'
    ? (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite')
    : (import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile')

  const item = await db.researchItems.get(researchItemId)
  if (!item) throw new Error('Research item not found')

  const runId = await db.aiRuns.add({
    researchItemId,
    provider,
    model,
    prompt: 'Improvement Analyzer',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Classify & Segment',      status: 'pending' },
      { name: 'Coherence & Argument Audit', status: 'pending' },
      { name: 'Gap Detection & Rewrite', status: 'pending' },
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
  const text = `${item.title}\n\n${item.sourceText}`

  try {
    // Step 1 — Classify + segment
    let sectionType = 'general'
    let paragraphs: string[] = []
    let offline = false

    try {
      const raw = await callAI(buildImprovementPrompt('segment', text), model)
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      sectionType = parsed.sectionType ?? 'general'
      paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : splitParagraphsOffline(text)
    } catch {
      offline = true
      paragraphs = splitParagraphsOffline(text)
    }

    if (paragraphs.length === 0) paragraphs = splitParagraphsOffline(text)
    await updateStep(0, 'completed', `${paragraphs.length} paragraphs · section: ${sectionType}`)

    // Step 2 — Coherence + argument audit
    let overallScore = 5
    let coherenceSummary = 'AI analysis unavailable.'
    let paragraphFeedback: { coherenceScore: number; issues: string[]; suggestion: string }[] = []
    let argumentIssues: string[] = []
    let gaps: string[] = []

    if (!offline) {
      try {
        const auditInput = paragraphs.map((p, i) => `[${i + 1}] ${p}`).join('\n\n')
        const raw = await callAI(buildImprovementPrompt('audit', auditInput, sectionType), model)
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
        overallScore = typeof parsed.overallScore === 'number' ? parsed.overallScore : 5
        coherenceSummary = parsed.coherenceSummary ?? ''
        paragraphFeedback = Array.isArray(parsed.paragraphFeedback) ? parsed.paragraphFeedback : []
        argumentIssues = Array.isArray(parsed.argumentIssues) ? parsed.argumentIssues : []
        gaps = Array.isArray(parsed.gaps) ? parsed.gaps : []
      } catch {
        offline = true
      }
    }

    await updateStep(1, 'completed', `Overall score: ${overallScore}/10 · ${argumentIssues.length} issues found`)

    // Step 3 — Rewrite weakest paragraph
    let topRewrite: ImprovementResult['topRewrite'] = null

    if (!offline && paragraphs.length > 0) {
      const weakestIdx = paragraphFeedback.reduce(
        (minI, fb, i) => (fb.coherenceScore < (paragraphFeedback[minI]?.coherenceScore ?? 11) ? i : minI),
        0
      )
      const weakest = paragraphs[weakestIdx] ?? paragraphs[0]

      try {
        const raw = await callAI(buildImprovementPrompt('rewrite', weakest), model)
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
        if (parsed.improved) {
          topRewrite = { original: weakest, improved: parsed.improved }
        }
      } catch {
        /* skip rewrite on error */
      }
    }

    await updateStep(2, 'completed', topRewrite ? 'Rewrite example generated' : 'Skipped (offline)')

    // Merge paragraph texts + feedback
    const mergedParagraphs: ParagraphFeedback[] = paragraphs.map((text, i) => ({
      text,
      coherenceScore: paragraphFeedback[i]?.coherenceScore ?? 5,
      issues: paragraphFeedback[i]?.issues ?? [],
      suggestion: paragraphFeedback[i]?.suggestion ?? '',
    }))

    const result: ImprovementResult = {
      sectionType,
      overallScore,
      coherenceSummary,
      argumentIssues,
      gaps,
      paragraphs: mergedParagraphs,
      topRewrite,
      offline,
    }

    await db.aiRuns.update(runId, { status: 'completed', output: JSON.stringify(result) })

    await db.outbox.add({
      entityType: 'ai_run',
      entityId: runId,
      operation: 'create',
      payload: await db.aiRuns.get(runId) as unknown as Record<string, unknown>,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    })

    return { runId, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.aiRuns.update(runId, { status: 'failed', output: msg })
    throw err
  }
}
