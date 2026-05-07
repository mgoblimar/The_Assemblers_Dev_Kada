import { z } from 'zod'
import type { RqSuggestion, ObjSuggestion, DefinitionEntry, ValidationResult } from '@/lib/db/database'
import { extractJSON as extractJSONShared } from './prompt-utils'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const validationResultSchema = z.object({
  ok: z.boolean(),
  score: z.number().min(0).max(100).default(50),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
})

export const rqSuggestionSchema = z.object({
  text: z.string(),
  rationale: z.string().default(''),
  type: z.enum(['descriptive', 'comparative', 'causal', 'exploratory']).default('descriptive'),
})

export const rqSuggestionsSchema = z.object({
  questions: z.array(rqSuggestionSchema),
})

export const objSuggestionSchema = z.object({
  text: z.string(),
  mapsToQuestion: z.string().default(''),
})

export const objSuggestionsSchema = z.object({
  objectives: z.array(objSuggestionSchema),
})

export const definitionEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
})

export const sectionsSchema = z.object({
  background: z.string(),
  scopeDelimitation: z.string(),
  significance: z.string(),
  definitions: z.array(definitionEntrySchema).default([]),
})

export const compiledDraftSchema = z.object({
  markdown: z.string(),
})

export const referencesSchema = z.object({
  references: z.array(z.string()),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ValidatedValidation = z.infer<typeof validationResultSchema>
export type ValidatedRqSuggestions = z.infer<typeof rqSuggestionsSchema>
export type ValidatedObjSuggestions = z.infer<typeof objSuggestionsSchema>
export type ValidatedSections = z.infer<typeof sectionsSchema>
export type ValidatedReferences = z.infer<typeof referencesSchema>

// ─── JSON extraction utility ──────────────────────────────────────────────────
// Delegated to shared prompt-utils to avoid duplication across chapter prompts.

export function extractJSON(raw: string): unknown {
  return extractJSONShared(raw)
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────

export function buildSopValidatePrompt(sop: string): string {
  return `You are an academic research methodologist reviewing a Statement of the Problem (SOP) for a research paper written by an undergraduate student.

Evaluate the SOP below on a scale of 0–100 based on these criteria:
1. Identifies a specific, researchable problem (0–25 pts)
2. Explains why the problem exists and its scope (0–25 pts)
3. Identifies who is affected (0–25 pts)
4. Written in formal academic language (0–25 pts)

SOP to evaluate:
"""
${sop}
"""

Set "ok" to true if score >= 65 (the student has a workable SOP worth developing further).
Set "ok" to false if score < 65 (needs significant revision before proceeding).

Respond with ONLY a JSON object (no preamble, no explanation):
{
  "ok": true | false,
  "score": 0-100,
  "issues": ["specific issue 1", "specific issue 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2"]
}

Keep issues and suggestions concise and actionable. Max 3 of each.`
}

export function buildRqSuggestPrompt(sop: string): string {
  return `You are an academic research methodologist. Based on the following validated Statement of the Problem, generate 4-6 focused research questions.

Each research question must:
- Be answerable through research
- Be specific and measurable
- Directly address the problem stated in the SOP
- Have a clear type (descriptive, comparative, causal, or exploratory)

Statement of the Problem:
"""
${sop}
"""

Respond with ONLY a JSON object (no preamble):
{
  "questions": [
    {
      "text": "Full research question here?",
      "rationale": "Why this question matters for the SOP",
      "type": "descriptive" | "comparative" | "causal" | "exploratory"
    }
  ]
}`
}

export function buildRqValidatePrompt(sop: string, selectedRqs: string[]): string {
  const rqList = selectedRqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  return `You are an academic research methodologist. Evaluate whether the following research questions are appropriate and sufficient for the given Statement of the Problem.

Statement of the Problem:
"""
${sop}
"""

Selected Research Questions:
${rqList}

Score 0–100. Set "ok" to true if score >= 65.

Check that:
1. Each question directly addresses the SOP
2. Together they cover the scope of the problem
3. They are specific and researchable
4. There are no contradictions or redundancies
5. They are in proper academic question format

Respond with ONLY a JSON object (no preamble):
{
  "ok": true | false,
  "score": 0-100,
  "issues": ["issue 1"],
  "suggestions": ["suggestion 1"]
}

Max 3 issues and 3 suggestions.`
}

export function buildObjSuggestPrompt(sop: string, selectedRqs: string[]): string {
  const rqList = selectedRqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  return `You are an academic research methodologist. Based on the Statement of the Problem and Research Questions, generate specific, measurable research objectives.

For each research question, generate at least one corresponding objective. Also include a general objective that covers the overall aim of the research.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Each objective must:
- Start with an action verb (e.g., "To determine", "To compare", "To identify", "To analyze")
- Be measurable and achievable
- Map clearly to a research question

Respond with ONLY a JSON object (no preamble):
{
  "objectives": [
    {
      "text": "To [verb] [what] in [context]",
      "mapsToQuestion": "The research question this addresses, or 'General' for the overall objective"
    }
  ]
}`
}

export function buildObjValidatePrompt(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
): string {
  const rqList = selectedRqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const objList = selectedObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')
  return `You are an academic research methodologist. Evaluate whether the following research objectives align properly with the Statement of the Problem and Research Questions.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Selected Objectives:
${objList}

Score 0–100. Set "ok" to true if score >= 65.

Check that:
1. Each objective uses an action verb
2. Objectives collectively address all research questions
3. They are achievable within a realistic research scope
4. There is at least one general/overall objective
5. No objective is vague or unmeasurable

Respond with ONLY a JSON object (no preamble):
{
  "ok": true | false,
  "score": 0-100,
  "issues": ["issue 1"],
  "suggestions": ["suggestion 1"]
}

Max 3 issues and 3 suggestions.`
}

export function buildGenerateSectionsPrompt(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
): string {
  const rqList = selectedRqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const objList = selectedObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')
  return `You are an academic research writer producing Chapter 1 sections for a Philippine university research paper. Write in formal academic English, third-person perspective.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Objectives:
${objList}

Generate these four sections:

---
SECTION 1 — Background of the Study
Write AT LEAST 5 substantial paragraphs covering:
- Paragraph 1: Global/international context of the problem with 2-3 foreign citations
- Paragraph 2: More foreign studies and theoretical frameworks, with 1-2 foreign citations
- Paragraph 3: Philippine/local context — how the problem manifests in the Philippines, with 1-2 local citations
- Paragraph 4: More local Philippine studies, with 1-2 local citations
- Paragraph 5: The specific gap this study addresses and why it is important now

Citation format: (Last name et al., Year) or (Last name & Last name, Year) for two authors, (Last name, Year) for one. Use plausible, realistic academic citations appropriate to the topic. Mix journal articles, conference papers, and government/institutional reports.

IMPORTANT: Include AT LEAST 3 foreign (international) citations and AT LEAST 3 local (Philippine) citations throughout the background.

---
SECTION 2 — Scope and Delimitation
Write 1-2 paragraphs covering: what the study covers, the target population, geographic coverage (specific Philippine region/institution if applicable), time frame, variables studied, and what is explicitly NOT covered.

---
SECTION 3 — Significance of the Study
Write 2-3 paragraphs naming specific beneficiaries and explaining the concrete value of the findings to each: students, practitioners, institutions, policymakers, future researchers.

---
SECTION 4 — Definition of Terms
Provide 6-8 key technical or specialized terms used in the study with operational definitions (how each term is used in THIS study specifically).

---
IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences, no trailing text.
All string values must be on a single line — use \\n to represent paragraph breaks, NOT actual newlines.

{
  "background": "Paragraph 1 text (Author, Year). \\n\\n Paragraph 2 text (Author & Author, Year). \\n\\n Paragraph 3 text (Local Author, Year). \\n\\n Paragraph 4 text (Local Author et al., Year). \\n\\n Paragraph 5 text.",
  "scopeDelimitation": "Paragraph 1. \\n\\n Paragraph 2.",
  "significance": "Paragraph 1. \\n\\n Paragraph 2. \\n\\n Paragraph 3.",
  "definitions": [
    { "term": "Term Name", "definition": "As used in this study, [term] refers to..." }
  ]
}`
}

export function buildReferencesPrompt(
  background: string,
  significance: string,
  scopeDelimitation: string,
): string {
  // Truncate so we stay within the model's context window
  const textSample = [background, significance, scopeDelimitation]
    .join('\n\n')
    .slice(0, 3000)

  return `You are an academic librarian. Extract every unique inline citation from the text below and generate a properly formatted APA 7th edition reference list.

Text containing inline citations:
"""
${textSample}
"""

Rules:
- Include each citation exactly once (deduplicate)
- Order alphabetically by first author's last name
- Do NOT include any URLs or DOIs — the reference text only
- Use realistic, plausible metadata: author names, year, article title, journal name, volume, issue, page range
- For Philippine authors, use realistic Philippine journal names (e.g., Philippine Journal of Science, CHED Education Research Journal, Asia Pacific Journal of Education)
- Format exactly: Last, F. M., & Last, F. M. (Year). Title of article. Journal Name, Volume(Issue), pages.

Respond with ONLY a valid JSON object (no preamble, no markdown fences):
{
  "references": [
    "Last, F. M. (Year). Full title of article. Journal Name, Vol(Issue), pp-pp.",
    "Last, F. M., & Last, F. M. (Year). Full title of article. Journal Name, Vol(Issue), pp-pp."
  ]
}`
}

export function buildCompileDraftPrompt(
  sop: string,
  selectedRqs: string[],
  selectedObjectives: string[],
  background: string,
  scopeDelimitation: string,
  significance: string,
  definitions: DefinitionEntry[],
): string {
  const rqList = selectedRqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const objList = selectedObjectives.map((o, i) => `${i + 1}. ${o}`).join('\n')
  const defList = definitions.map(d => `- **${d.term}**: ${d.definition}`).join('\n')

  return `You are an academic research writer. Compile a complete, polished Chapter 1 of a research paper using the provided content. Write in formal academic English, third-person perspective.

Use the provided content exactly — do not add new facts, do not contradict the provided text.

--- CONTENT TO COMPILE ---

STATEMENT OF THE PROBLEM:
${sop}

RESEARCH QUESTIONS:
${rqList}

OBJECTIVES:
${objList}

BACKGROUND OF THE STUDY:
${background}

SCOPE AND DELIMITATION:
${scopeDelimitation}

SIGNIFICANCE OF THE STUDY:
${significance}

DEFINITION OF TERMS:
${defList}

--- INSTRUCTIONS ---

Output a complete Chapter 1 in well-structured Markdown with these sections in order:
1. Chapter 1: Introduction (heading)
2. Background of the Study
3. Statement of the Problem
4. Research Questions
5. Objectives of the Study
6. Scope and Delimitation
7. Significance of the Study
8. Definition of Terms

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences, no trailing text.
The entire markdown output must be inside the "markdown" string value on a single JSON line.
Use \\n for newlines inside the string value — do NOT use actual newlines inside the JSON string.

{
  "markdown": "# Chapter 1: Introduction\\n\\n## Background of the Study\\n\\nText here...\\n\\n## Statement of the Problem\\n\\n..."
}`
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function parseValidation(raw: string): ValidationResult {
  const parsed = extractJSON(raw)
  const result = validationResultSchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, score: 0, issues: ['AI returned an unexpected format.'], suggestions: ['Try again.'], attempt: 0 }
  }
  return { ...result.data, attempt: 0 }
}

export function parseRqSuggestions(raw: string): RqSuggestion[] {
  const parsed = extractJSON(raw)
  // Accept { questions: [...] } or bare array
  const envelope = rqSuggestionsSchema.safeParse(
    Array.isArray(parsed) ? { questions: parsed } : parsed
  )
  if (!envelope.success) return []
  return envelope.data.questions
}

export function parseObjSuggestions(raw: string): ObjSuggestion[] {
  const parsed = extractJSON(raw)
  const envelope = objSuggestionsSchema.safeParse(
    Array.isArray(parsed) ? { objectives: parsed } : parsed
  )
  if (!envelope.success) return []
  return envelope.data.objectives
}

export function parseSections(raw: string): ValidatedSections | null {
  const parsed = extractJSON(raw)
  const result = sectionsSchema.safeParse(parsed)
  if (!result.success) return null
  return result.data
}

export function parseCompiledDraft(raw: string): string | null {
  const parsed = extractJSON(raw)
  const result = compiledDraftSchema.safeParse(parsed)
  if (!result.success) return null
  return result.data.markdown
}

export function parseReferences(raw: string): string | null {
  const parsed = extractJSON(raw)
  // Accept { references: [...] } or a bare array
  const result = referencesSchema.safeParse(
    Array.isArray(parsed) ? { references: parsed } : parsed
  )
  if (!result.success || result.data.references.length === 0) return null

  const lines = result.data.references.map((citation, i) => {
    // Build a Google Scholar search URL from the citation text — always reachable,
    // no hallucinated DOIs. Encodes the full citation string as the query.
    const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(citation.trim())}`
    return `${i + 1}. ${citation.trim()}  \n   [🔍 Search on Google Scholar](${scholarUrl})`
  })

  return '## References\n\n' + lines.join('\n\n')
}
