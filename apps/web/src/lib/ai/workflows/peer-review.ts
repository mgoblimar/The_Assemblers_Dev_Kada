import { db } from '@/lib/db/database'
import { generateWithGroq } from '@/lib/ai/index'
import { buildPeerReviewPrompt } from '@/lib/ai/prompts'

export interface SkepticResult {
  verdict: string
  weaknesses: string[]
  methodologyGaps: string[]
  counterarguments: string[]
  severity: 'minor' | 'moderate' | 'major'
}

export interface AdvocateResult {
  verdict: string
  strengths: string[]
  contributions: string[]
  rebuttals: string[]
  potential: string
}

export interface SynthesisResult {
  overallVerdict: string
  consensusScore: number
  priorityActions: string[]
  summary: string
}

export interface PeerReviewResult {
  skeptic: SkepticResult
  advocate: AdvocateResult
  synthesis: SynthesisResult
}

function extractJSON(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/g, '').trim()
  const arrStart = s.indexOf('['), arrEnd = s.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(s.slice(arrStart, arrEnd + 1)) } catch { /* fall through */ }
  }
  const objStart = s.indexOf('{'), objEnd = s.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(s.slice(objStart, objEnd + 1)) } catch { /* fall through */ }
  }
  return JSON.parse(s)
}

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

export async function runPeerReviewWorkflow(
  researchItemId: number,
  text: string
): Promise<{ runId: number; result: PeerReviewResult }> {
  const model = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'

  const runId = await db.aiRuns.add({
    researchItemId,
    provider: DEFAULT_PROVIDER,
    model,
    prompt: 'Peer Review',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Skeptic Analysis', status: 'pending' },
      { name: 'Advocate Response', status: 'pending' },
      { name: 'Editorial Synthesis', status: 'pending' },
    ],
  })

  const updateStep = async (index: number, status: 'completed' | 'failed' | 'pending', output?: string) => {
    const run = await db.aiRuns.get(runId)
    if (!run?.steps) return
    const steps = [...run.steps]
    steps[index] = { ...steps[index], status, output }
    await db.aiRuns.update(runId, { steps })
  }

  try {
    await updateStep(0, 'pending')
    const skepticRaw = await generateWithGroq(buildPeerReviewPrompt('skeptic', text), model)
    const skeptic = extractJSON(skepticRaw) as SkepticResult
    await updateStep(0, 'completed', skeptic.verdict)

    await updateStep(1, 'pending')
    const advocateRaw = await generateWithGroq(buildPeerReviewPrompt('advocate', text, skeptic.verdict), model)
    const advocate = extractJSON(advocateRaw) as AdvocateResult
    await updateStep(1, 'completed', advocate.verdict)

    await updateStep(2, 'pending')
    const synthesisRaw = await generateWithGroq(buildPeerReviewPrompt('synthesis', text, skeptic.verdict, advocate.verdict), model)
    const synthesis = extractJSON(synthesisRaw) as SynthesisResult
    await updateStep(2, 'completed', `${synthesis.overallVerdict} · ${synthesis.consensusScore}/10`)

    const result: PeerReviewResult = { skeptic, advocate, synthesis }
    await db.aiRuns.update(runId, { status: 'completed', output: JSON.stringify(result) })

    return { runId, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const current = await db.aiRuns.get(runId)
    if (current?.status !== 'failed') {
      await db.aiRuns.update(runId, { status: 'failed', output: msg })
    }
    throw err
  }
}
