import { db } from '@/lib/db/database'
import { generateWithGemini, generateWithGroq } from '@/lib/ai/index'
import { buildAdvisorPrompt } from '@/lib/ai/prompts'
import matrix from '@/lib/data/methodology-matrix.json'

export interface MethodRecommendation {
  id: string
  name: string
  paradigm: string
  description: string
  when_to_use: string[]
  data_types: string[]
  sample_size: string
  tools: string[]
  complexity: string
  score: number
  rank: number
}

export interface AdvisorResult {
  paradigm: 'quantitative' | 'qualitative' | 'mixed'
  confidence: number
  variables: string[]
  sample_size: string | null
  data_types: string[]
  research_design: string
  key_features: string[]
  recommendations: MethodRecommendation[]
  guide: string
  offline: boolean
}

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'groq') || 'groq'

function detectParadigmOffline(text: string): 'quantitative' | 'qualitative' | 'mixed' {
  const s = text.toLowerCase()
  const quant = /\b(quantitative|regression|anova|correlation|survey|statistics|coefficient|p-value|sample size|hypothesis|t-test|chi-square|mean|variance|frequency)\b/.test(s)
  const qual  = /\b(qualitative|thematic|narrative|interview|ethnograph|grounded|discourse|content analysis|case study|observation|focus group)\b/.test(s)
  if (quant && qual) return 'mixed'
  if (quant) return 'quantitative'
  if (qual)  return 'qualitative'
  return 'quantitative'
}

function scoreMethod(method: typeof matrix.methods[0], paradigm: string, text: string): number {
  const s = text.toLowerCase()
  let score = 0

  if (method.paradigm === paradigm) score += 40
  else if (paradigm === 'mixed') score += 20

  const keywordMatches = method.keywords.filter(k => s.includes(k.toLowerCase())).length
  score += keywordMatches * 10

  if (method.complexity === 'basic') score += 5

  return score
}

function rankMethods(paradigm: string, text: string): MethodRecommendation[] {
  const scored = matrix.methods
    .map((m, _i) => ({
      ...m,
      score: scoreMethod(m, paradigm, text),
      rank: 0,
    }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m, i) => ({ ...m, rank: i + 1 }))

  if (scored.length === 0) {
    const fallback = matrix.methods
      .filter(m => m.paradigm === paradigm || paradigm === 'mixed')
      .slice(0, 3)
      .map((m, i) => ({ ...m, score: 30, rank: i + 1 }))
    return fallback
  }

  return scored
}

export async function runAnalysisAdvisorWorkflow(researchItemId: number): Promise<{ runId: number; result: AdvisorResult }> {
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
    prompt: 'Analysis Advisor',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Classify & Extract', status: 'pending' },
      { name: 'Match Methods',      status: 'pending' },
      { name: 'Generate Guide',     status: 'pending' },
    ],
  })

  const updateStep = async (
    index: number,
    status: 'completed' | 'failed',
    output?: string
  ) => {
    const run = await db.aiRuns.get(runId)
    if (!run?.steps) return
    const steps = [...run.steps]
    steps[index] = { ...steps[index], status, output }
    await db.aiRuns.update(runId, { steps })
  }

  const callAI = provider === 'gemini' ? generateWithGemini : generateWithGroq

  try {
    const text = `${item.title}\n\n${item.sourceText}`

    // Step 1+2 combined: Classify + Extract (single AI call, falls back offline)
    let analysis: Omit<AdvisorResult, 'recommendations' | 'guide' | 'offline'>
    let offline = false

    try {
      const raw = await callAI(buildAdvisorPrompt('classify_extract', text), model)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      analysis = JSON.parse(cleaned)
    } catch {
      offline = true
      const paradigm = detectParadigmOffline(text)
      analysis = {
        paradigm,
        confidence: 0.6,
        variables: [],
        sample_size: null,
        data_types: [],
        research_design: 'Could not detect — AI unavailable',
        key_features: [],
      }
    }

    await updateStep(0, 'completed', `Paradigm: ${analysis.paradigm} (${Math.round(analysis.confidence * 100)}% confidence)`)

    // Step 3: Match methods locally (no AI call)
    const recommendations = rankMethods(analysis.paradigm, text)
    await updateStep(1, 'completed', `Top match: ${recommendations[0]?.name ?? 'None'}`)

    // Step 4: Generate guide for top method
    let guide = ''
    if (recommendations.length > 0 && !offline) {
      try {
        guide = await callAI(
          buildAdvisorPrompt('guide', recommendations[0].name, text.slice(0, 400)),
          model
        )
      } catch {
        guide = `To conduct ${recommendations[0].name}: 1. Prepare your data ensuring it meets the method's requirements. 2. Choose appropriate software (${recommendations[0].tools.slice(0, 2).join(' or ')}). 3. Run the analysis following the software's standard procedure. 4. Check assumptions and interpret the output statistics. 5. Report results following APA or your field's standard format.`
      }
    } else if (recommendations.length > 0) {
      guide = `To conduct ${recommendations[0].name}: 1. Prepare your data ensuring it meets the method's requirements. 2. Choose appropriate software (${recommendations[0].tools.slice(0, 2).join(' or ')}). 3. Run the analysis following the software's standard procedure. 4. Check assumptions and interpret the output statistics. 5. Report results following your field's standard format.`
    }

    await updateStep(2, 'completed', `Guide generated for ${recommendations[0]?.name}`)

    const result: AdvisorResult = { ...analysis, recommendations, guide, offline }

    await db.aiRuns.update(runId, {
      status: 'completed',
      output: JSON.stringify(result),
    })

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
