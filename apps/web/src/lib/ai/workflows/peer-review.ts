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
  const objStart = s.indexOf('{'), objEnd = s.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(s.slice(objStart, objEnd + 1)) } catch { /* fall through */ }
  }
  return JSON.parse(s)
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter(v => typeof v === 'string')
  return []
}

function normalizeSkeptic(raw: unknown): SkepticResult {
  const r = (raw ?? {}) as Record<string, unknown>
  const severity = r.severity as string
  return {
    verdict: typeof r.verdict === 'string' ? r.verdict : 'No verdict provided',
    weaknesses: toStringArray(r.weaknesses),
    methodologyGaps: toStringArray(r.methodologyGaps),
    counterarguments: toStringArray(r.counterarguments),
    severity: ['minor', 'moderate', 'major'].includes(severity)
      ? (severity as SkepticResult['severity'])
      : 'moderate',
  }
}

function normalizeAdvocate(raw: unknown): AdvocateResult {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    verdict: typeof r.verdict === 'string' ? r.verdict : 'No verdict provided',
    strengths: toStringArray(r.strengths),
    contributions: toStringArray(r.contributions),
    rebuttals: toStringArray(r.rebuttals),
    potential: typeof r.potential === 'string' ? r.potential : '',
  }
}

function normalizeSynthesis(raw: unknown): SynthesisResult {
  const r = (raw ?? {}) as Record<string, unknown>
  const verdicts = ['Accept', 'Accept with minor revisions', 'Major revisions required', 'Reject and resubmit']
  const score = Number(r.consensusScore)
  return {
    overallVerdict: verdicts.includes(r.overallVerdict as string)
      ? (r.overallVerdict as string)
      : 'Accept with minor revisions',
    consensusScore: Number.isFinite(score) ? Math.min(10, Math.max(1, score)) : 5,
    priorityActions: toStringArray(r.priorityActions),
    summary: typeof r.summary === 'string' ? r.summary : '',
  }
}

export type PeerReviewPhase = 'skeptic' | 'advocate' | 'synthesis'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

export async function runPeerReviewWorkflow(
  researchItemId: number,
  text: string,
  onPhaseChange?: (phase: PeerReviewPhase) => void
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

  // JSON responses are small — cap tokens to avoid blowing past TPM limits
  const MAX_TOKENS = 1024
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  try {
    // Step 1: Skeptic
    onPhaseChange?.('skeptic')
    const skepticRaw = await generateWithGroq(buildPeerReviewPrompt('skeptic', text), model, MAX_TOKENS)
    const skeptic = normalizeSkeptic(extractJSON(skepticRaw))
    await updateStep(0, 'completed', skeptic.verdict)

    await delay(1500)

    // Step 2: Advocate
    onPhaseChange?.('advocate')
    const advocateRaw = await generateWithGroq(buildPeerReviewPrompt('advocate', text, skeptic.verdict), model, MAX_TOKENS)
    const advocate = normalizeAdvocate(extractJSON(advocateRaw))
    await updateStep(1, 'completed', advocate.verdict)

    await delay(1500)

    // Step 3: Synthesis
    onPhaseChange?.('synthesis')
    const synthesisRaw = await generateWithGroq(buildPeerReviewPrompt('synthesis', text, skeptic.verdict, advocate.verdict), model, MAX_TOKENS)
    const synthesis = normalizeSynthesis(extractJSON(synthesisRaw))
    await updateStep(2, 'completed', `${synthesis.overallVerdict} · ${synthesis.consensusScore}/10`)

    const result: PeerReviewResult = { skeptic, advocate, synthesis }
    await db.aiRuns.update(runId, { status: 'completed', output: JSON.stringify(result) })

    return { runId, result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.aiRuns.update(runId, { status: 'failed', output: msg })
    throw err
  }
}
