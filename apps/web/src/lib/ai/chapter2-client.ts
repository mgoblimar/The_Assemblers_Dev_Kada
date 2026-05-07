import { callAIProvider, type AIProvider } from './index'
import type { Citation } from '@/lib/db/database'
import {
  buildCitationSuggestPrompt,
  buildForeignLiteraturePrompt,
  buildLocalLiteraturePrompt,
  buildTheoreticalFrameworkPrompt,
  buildSynthesisPrompt,
  parseCitationSuggest,
  parseRrlText,
} from './chapter2-prompts'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'

function defaultModel(provider: AIProvider): string {
  if (provider === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (provider === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.1-8b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

// Sections need more tokens — literature paragraphs can be long
const MAX_TOKENS = 6000

function ai(prompt: string): Promise<string> {
  return callAIProvider(DEFAULT_PROVIDER, prompt, defaultModel(DEFAULT_PROVIDER), MAX_TOKENS)
}

// ─── Chapter 2 AI calls ───────────────────────────────────────────────────────

export async function suggestCitations(
  sop: string,
  rqs: string[],
  themes: string[],
): Promise<Citation[]> {
  const raw = await ai(buildCitationSuggestPrompt(sop, rqs, themes))
  const citations = parseCitationSuggest(raw)
  if (!citations) throw new Error('AI returned unexpected format for citation suggestions. Please retry.')
  return citations
}

export async function generateForeignLiterature(
  sop: string,
  rqs: string[],
  themes: string[],
  selectedCitations?: Citation[],
): Promise<string> {
  const raw = await ai(buildForeignLiteraturePrompt(sop, rqs, themes, selectedCitations))
  const text = parseRrlText(raw)
  if (!text) throw new Error('AI returned unexpected format for foreign literature. Please retry.')
  return text
}

export async function generateLocalLiterature(
  sop: string,
  rqs: string[],
  themes: string[],
  foreignText: string,
  selectedCitations?: Citation[],
): Promise<string> {
  const raw = await ai(buildLocalLiteraturePrompt(sop, rqs, themes, foreignText, selectedCitations))
  const text = parseRrlText(raw)
  if (!text) throw new Error('AI returned unexpected format for local literature. Please retry.')
  return text
}

export async function generateTheoreticalFramework(
  sop: string,
  rqs: string[],
  objectives: string[],
): Promise<string> {
  const raw = await ai(buildTheoreticalFrameworkPrompt(sop, rqs, objectives))
  const text = parseRrlText(raw)
  if (!text) throw new Error('AI returned unexpected format for theoretical framework. Please retry.')
  return text
}

export async function generateSynthesis(
  sop: string,
  foreignText: string,
  localText: string,
  theoreticalText: string,
): Promise<string> {
  const raw = await ai(buildSynthesisPrompt(sop, foreignText, localText, theoreticalText))
  const text = parseRrlText(raw)
  if (!text) throw new Error('AI returned unexpected format for synthesis. Please retry.')
  return text
}
