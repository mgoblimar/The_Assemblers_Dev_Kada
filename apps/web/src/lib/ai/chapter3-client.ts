import { callAIProvider, type AIProvider } from './index'
import {
  buildDesignRecommendPrompt,
  buildInstrumentsPrompt,
  buildProcedurePrompt,
  buildAnalysisPrompt,
  buildEthicsPrompt,
  parseDesignRecommendation,
  parseSectionText,
} from './chapter3-prompts'
import type { DesignRecommendation } from './chapter3-prompts'

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'

function defaultModel(provider: AIProvider): string {
  if (provider === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (provider === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.1-8b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

const MAX_TOKENS = 4096

function ai(prompt: string): Promise<string> {
  return callAIProvider(DEFAULT_PROVIDER, prompt, defaultModel(DEFAULT_PROVIDER), MAX_TOKENS)
}

// ─── Chapter 3 AI calls ───────────────────────────────────────────────────────

export async function generateDesignRecommendation(
  sop: string,
  rqs: string[],
  foreignLit: string,
  localLit: string,
  theoreticalFramework: string,
  synthesis: string,
): Promise<DesignRecommendation> {
  const raw = await ai(buildDesignRecommendPrompt(sop, rqs, foreignLit, localLit, theoreticalFramework, synthesis))
  const result = parseDesignRecommendation(raw)
  if (!result) throw new Error('AI returned unexpected format for design recommendation. Please retry.')
  return result
}

export async function generateInstruments(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  locale: string,
  sampling: string,
): Promise<string> {
  const raw = await ai(buildInstrumentsPrompt(sop, rqs, design, locale, sampling))
  const text = parseSectionText(raw)
  if (!text) throw new Error('AI returned unexpected format for instruments. Please retry.')
  return text
}

export async function generateProcedure(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  locale: string,
  sampling: string,
): Promise<string> {
  const raw = await ai(buildProcedurePrompt(sop, rqs, design, locale, sampling))
  const text = parseSectionText(raw)
  if (!text) throw new Error('AI returned unexpected format for procedure. Please retry.')
  return text
}

export async function generateAnalysis(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  userInput?: string,
): Promise<string> {
  const raw = await ai(buildAnalysisPrompt(sop, rqs, design, userInput))
  const text = parseSectionText(raw)
  if (!text) throw new Error('AI returned unexpected format for data analysis. Please retry.')
  return text
}

export async function generateEthics(
  sop: string,
  locale: string,
  design: 'quantitative' | 'qualitative' | 'mixed',
): Promise<string> {
  const raw = await ai(buildEthicsPrompt(sop, locale, design))
  const text = parseSectionText(raw)
  if (!text) throw new Error('AI returned unexpected format for ethical considerations. Please retry.')
  return text
}
