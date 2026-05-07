import { callAIProvider, type AIProvider } from './index'
import type { RqSuggestion, ObjSuggestion, DefinitionEntry, ValidationResult } from '@/lib/db/database'
import {
  buildSopValidatePrompt,
  buildRqSuggestPrompt,
  buildRqValidatePrompt,
  buildObjSuggestPrompt,
  buildObjValidatePrompt,
  buildGenerateSectionsPrompt,
  buildCompileDraftPrompt,
  buildReferencesPrompt,
  parseValidation,
  parseRqSuggestions,
  parseObjSuggestions,
  parseSections,
  parseCompiledDraft,
  parseReferences,
} from './chapter1-prompts'

// ─── Provider config ──────────────────────────────────────────────────────────

const DEFAULT_PROVIDER = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'cerebras'

function defaultModel(provider: AIProvider): string {
  if (provider === 'gemini')   return import.meta.env.VITE_GEMINI_MODEL   || 'gemini-2.0-flash-lite'
  if (provider === 'cerebras') return import.meta.env.VITE_CEREBRAS_MODEL || 'llama3.1-8b'
  return import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile'
}

const MAX_TOKENS_JSON     = 1024
const MAX_TOKENS_SECTIONS = 6000   // llama3.1-8b context = 8192 total; prompt ~1k tokens, leaves ~7k for output
const MAX_TOKENS_DRAFT    = 8192   // compile step (kept for legacy, no longer called by default)

function ai(prompt: string, maxTokens = MAX_TOKENS_JSON): Promise<string> {
  const provider = DEFAULT_PROVIDER
  const model    = defaultModel(provider)
  return callAIProvider(provider, prompt, model, maxTokens)
}

// ─── Chapter 1 AI calls ───────────────────────────────────────────────────────

export async function validateSop(sop: string): Promise<ValidationResult> {
  const raw = await ai(buildSopValidatePrompt(sop))
  return parseValidation(raw)
}

export async function suggestRqs(sop: string): Promise<RqSuggestion[]> {
  const raw = await ai(buildRqSuggestPrompt(sop))
  return parseRqSuggestions(raw)
}

export async function validateRqs(sop: string, selectedRqs: string[]): Promise<ValidationResult> {
  const raw = await ai(buildRqValidatePrompt(sop, selectedRqs))
  return parseValidation(raw)
}

export async function suggestObjectives(
  sop: string,
  selectedRqs: string[],
): Promise<ObjSuggestion[]> {
  const raw = await ai(buildObjSuggestPrompt(sop, selectedRqs))
  return parseObjSuggestions(raw)
}

export async function validateObjectives(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
): Promise<ValidationResult> {
  const raw = await ai(buildObjValidatePrompt(sop, selectedRqs, selectedObjectives))
  return parseValidation(raw)
}

export interface GeneratedSections {
  background: string
  scopeDelimitation: string
  significance: string
  definitions: DefinitionEntry[]
}

export async function generateSections(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
): Promise<GeneratedSections> {
  const raw = await ai(buildGenerateSectionsPrompt(sop, selectedRqs, selectedObjectives), MAX_TOKENS_SECTIONS)
  const result = parseSections(raw)
  if (!result) throw new Error('AI returned unexpected format for sections. Please retry.')
  return result
}

export async function generateReferences(
  background: string,
  significance: string,
  scopeDelimitation: string,
): Promise<string> {
  const raw = await ai(buildReferencesPrompt(background, significance, scopeDelimitation), 2000)
  const result = parseReferences(raw)
  if (!result) throw new Error('AI returned unexpected format for references. Please retry.')
  return result
}

export async function compileDraft(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
  background: string,
  scopeDelimitation: string,
  significance: string,
  definitions: DefinitionEntry[],
): Promise<string> {
  const raw = await ai(
    buildCompileDraftPrompt(sop, selectedRqs, selectedObjectives, background, scopeDelimitation, significance, definitions),
    MAX_TOKENS_DRAFT,
  )
  const markdown = parseCompiledDraft(raw)
  if (!markdown) throw new Error('AI returned unexpected format for draft. Please retry.')
  return markdown
}
