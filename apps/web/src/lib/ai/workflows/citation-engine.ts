import { db } from '@/lib/db/database'
import { callAIProvider, type AIProvider } from '@/lib/ai/index'
import { buildCitationPrompt } from '@/lib/ai/prompts'

export interface Reference {
  id: string
  title: string
  authors: string[]
  year: number | null
  journal: string | null
  doi: string | null
  url: string | null
  citationCount: number
  abstract: string | null
  source: 'semantic_scholar' | 'crossref'
  score: number
}

export interface CitationResult {
  query: string
  terms: string[]
  references: Reference[]
  offline: boolean
}

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'
function defaultModel(p: AIProvider) {
  if (p === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (p === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama-3.3-70b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

function extractTermsOffline(text: string): string[] {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','this','that','these','those','it','its','we','our','they','their','which','who','what','how','when','where','why','also','been','more','some','such','than','then','there','can','its'])
  const freq: Record<string, number> = {}
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)) {
    if (w.length > 4 && !stop.has(w)) freq[w] = (freq[w] || 0) + 1
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w)
}

async function searchSemanticScholar(query: string): Promise<Reference[]> {
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,citationCount,externalIds,abstract,url&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((p: Record<string, unknown>) => ({
      id: (p.paperId as string) ?? Math.random().toString(36).slice(2),
      title: (p.title as string) ?? 'Unknown title',
      authors: ((p.authors as { name: string }[]) ?? []).map(a => a.name),
      year: (p.year as number) ?? null,
      journal: null,
      doi: ((p.externalIds as Record<string, string>) ?? {}).DOI ?? null,
      url: (p.url as string) ?? null,
      citationCount: (p.citationCount as number) ?? 0,
      abstract: (p.abstract as string) ?? null,
      source: 'semantic_scholar' as const,
      score: 0,
    }))
  } catch {
    return []
  }
}

async function searchCrossRef(query: string): Promise<Reference[]> {
  try {
    const res = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5&select=DOI,title,author,issued,container-title,URL,is-referenced-by-count&mailto=research@devkada.app`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return ((data.message?.items as Record<string, unknown>[]) ?? []).map(p => {
      const doi = p.DOI as string | null ?? null
      return {
        id: doi ?? Math.random().toString(36).slice(2),
        title: Array.isArray(p.title) ? (p.title as string[])[0] : ((p.title as string) ?? 'Unknown title'),
        authors: ((p.author as { family?: string; given?: string }[]) ?? [])
          .map(a => [a.family, a.given].filter(Boolean).join(', '))
          .filter(Boolean),
        year: ((p.issued as { 'date-parts': number[][] })?.[`date-parts`]?.[0]?.[0]) ?? null,
        journal: Array.isArray(p['container-title'])
          ? (p['container-title'] as string[])[0] ?? null
          : null,
        doi,
        url: (p.URL as string) ?? (doi ? `https://doi.org/${doi}` : null),
        citationCount: (p['is-referenced-by-count'] as number) ?? 0,
        abstract: null,
        source: 'crossref' as const,
        score: 0,
      }
    })
  } catch {
    return []
  }
}

function dedupeAndRank(refs: Reference[], terms: string[]): Reference[] {
  const seen = new Set<string>()
  const unique = refs.filter(r => {
    const key = r.doi ?? r.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const termsLower = terms.map(t => t.toLowerCase())
  return unique
    .map(ref => {
      const haystack = `${ref.title} ${ref.abstract ?? ''}`.toLowerCase()
      const keywordScore = termsLower.filter(t => haystack.includes(t)).length * 20
      const recencyScore = ref.year ? Math.max(0, (ref.year - 2000) * 2) : 0
      const citationScore = Math.min(ref.citationCount / 10, 20)
      return { ...ref, score: keywordScore + recencyScore + citationScore }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

export async function runCitationWorkflow(
  researchItemId: number
): Promise<{ runId: number; result: CitationResult }> {
  const provider = DEFAULT_PROVIDER
  const model = defaultModel(provider)

  const item = await db.researchItems.get(researchItemId)
  if (!item) throw new Error('Research item not found')

  const runId = await db.aiRuns.add({
    researchItemId,
    provider,
    model,
    prompt: 'Citation Engine',
    output: '',
    status: 'pending',
    createdAt: new Date(),
    steps: [
      { name: 'Extract Terms',  status: 'pending' },
      { name: 'Search APIs',    status: 'pending' },
      { name: 'Rank Results',   status: 'pending' },
    ],
  })

  const updateStep = async (index: number, status: 'completed' | 'failed', output?: string) => {
    const run = await db.aiRuns.get(runId)
    if (!run?.steps) return
    const steps = [...run.steps]
    steps[index] = { ...steps[index], status, output }
    await db.aiRuns.update(runId, { steps })
  }

  const callAI = (prompt: string, model: string, maxTokens?: number) => callAIProvider(provider, prompt, model, maxTokens)

  try {
    const text = `${item.title}\n\n${item.sourceText}`

    // Step 1 — Extract terms
    let terms: string[]
    let offline = false

    try {
      const raw = await callAI(buildCitationPrompt(text), model)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      terms = Array.isArray(parsed) ? parsed.slice(0, 8) : extractTermsOffline(text)
    } catch {
      offline = true
      terms = extractTermsOffline(text)
    }

    await updateStep(0, 'completed', terms.slice(0, 3).join(', '))

    // Step 2 — Search APIs in parallel using top 3 terms as a combined query
    const query = terms.slice(0, 3).join(' ')
    const [ssRefs, crRefs] = await Promise.all([
      searchSemanticScholar(query),
      searchCrossRef(query),
    ])
    const combinedCount = ssRefs.length + crRefs.length
    await updateStep(1, 'completed', `${combinedCount} raw results from Semantic Scholar + CrossRef`)

    // Step 3 — Deduplicate + rank
    const references = dedupeAndRank([...ssRefs, ...crRefs], terms)
    await updateStep(2, 'completed', `${references.length} unique references ranked`)

    const result: CitationResult = { query, terms, references, offline }

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
