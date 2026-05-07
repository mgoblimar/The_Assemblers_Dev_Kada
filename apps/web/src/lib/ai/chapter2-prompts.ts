import { z } from 'zod'
import { extractJSON, sanitizeText } from './prompt-utils'
import type { Citation } from '@/lib/db/database'

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const rrlTextSchema = z.object({
  text: z.string().min(1),
})

export const citationSchema = z.object({
  id: z.string(),
  authorLastName: z.string(),
  year: z.number(),
  title: z.string(),
  source: z.string(),
  scope: z.enum(['foreign', 'local', 'theoretical']),
  theme: z.string(),
  relevanceSummary: z.string(),
})

export const citationSuggestSchema = z.object({
  citations: z.array(citationSchema).min(1),
})

// ─── Parsers ──────────────────────────────────────────────────────────────────

export function parseCitationSuggest(raw: string): Citation[] | null {
  try {
    const parsed = extractJSON(raw)
    const result = citationSuggestSchema.safeParse(parsed)
    if (result.success) return result.data.citations as Citation[]
  } catch { /* fall through */ }
  return null
}

export function parseRrlText(raw: string): string | null {
  try {
    const parsed = extractJSON(raw)
    const result = rrlTextSchema.safeParse(parsed)
    if (result.success) return sanitizeText(result.data.text)
  } catch { /* fall through */ }
  // Fallback: if the model returned plain text (no JSON wrapper), accept it directly
  const trimmed = raw.trim()
  if (trimmed.length > 20) return sanitizeText(trimmed)
  return null
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildCitationSuggestPrompt(
  sop: string,
  rqs: string[],
  themes: string[],
): string {
  const rqList    = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const themeList = themes.map((t, i) => `${i + 1}. ${t}`).join('\n')

  return `You are an academic research librarian helping a Philippine university student plan their Chapter 2 (Review of Related Literature).

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Research Themes:
${themeList}

Suggest 12–16 plausible academic citations for this study. Distribute them as:
- 6–7 foreign (international) sources: "scope": "foreign"
- 4–5 local (Philippine) sources: "scope": "local"
- 2–3 theoretical sources (foundational theories/frameworks): "scope": "theoretical"

For each citation provide:
- "id": a unique slug in lowercase format "authorlastname_year_keyword" (e.g. "bandura_1977_selfefficacy")
- "authorLastName": first author's last name only
- "year": publication year (between 2000 and 2024 for empirical sources; classic theories may be older)
- "title": realistic academic title for the topic
- "source": journal name, book title, or publisher
- "scope": "foreign", "local", or "theoretical"
- "theme": which of the research themes this citation addresses
- "relevanceSummary": 1–2 sentences explaining how this work relates to the study

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All strings must be on a single line — no actual newlines inside string values.

{ "citations": [
  { "id": "...", "authorLastName": "...", "year": 2022, "title": "...", "source": "...", "scope": "foreign", "theme": "...", "relevanceSummary": "..." },
  ...
] }`
}

export function buildForeignLiteraturePrompt(
  sop: string,
  rqs: string[],
  themes: string[],
  selectedCitations?: Citation[],
): string {
  const rqList    = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const themeList = themes.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const foreignSelected = (selectedCitations ?? []).filter(c => c.scope === 'foreign')
  const citationBlock = foreignSelected.length > 0
    ? `\nProvided sources to incorporate (cite each by author and year in APA inline format):\n${foreignSelected.map(c => `- ${c.authorLastName} (${c.year}). "${c.title}". ${c.source}. — ${c.relevanceSummary}`).join('\n')}\n\nYou MUST cite all provided sources in the text. You may add additional international sources beyond this list.\n`
    : ''

  return `You are an academic research writer producing Chapter 2 (Review of Related Literature) for a Philippine university research paper.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Research Themes to cover:
${themeList}
${citationBlock}
Write the FOREIGN LITERATURE AND STUDIES section.

Requirements:
- Write 4–5 well-developed paragraphs
- Each paragraph focuses on one theme or sub-theme
- Cite AT LEAST 6 foreign (international) academic sources using APA inline format: (Last name, Year) or (Last name & Last name, Year) or (Last name et al., Year)
- Sources should be journal articles, books, or conference papers from international authors (non-Philippine)
- Discuss findings, theories, and frameworks relevant to the research
- Connect each cited work back to the current study's problem
- Use formal academic English, third-person perspective
- Do NOT use bullet points — write in flowing prose paragraphs

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n to represent paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1 (Author, Year). Sentence. \\n\\n Paragraph 2 (Author & Author, Year). Sentence. \\n\\n Paragraph 3..." }`
}

export function buildLocalLiteraturePrompt(
  sop: string,
  rqs: string[],
  themes: string[],
  foreignText: string,
  selectedCitations?: Citation[],
): string {
  const rqList    = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const themeList = themes.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const localSelected = (selectedCitations ?? []).filter(c => c.scope === 'local')
  const citationBlock = localSelected.length > 0
    ? `\nProvided Philippine sources to incorporate:\n${localSelected.map(c => `- ${c.authorLastName} (${c.year}). "${c.title}". ${c.source}. — ${c.relevanceSummary}`).join('\n')}\n\nYou MUST cite all provided sources in the text. You may add additional Philippine sources beyond this list.\n`
    : ''

  return `You are an academic research writer producing Chapter 2 for a Philippine university research paper.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Research Themes:
${themeList}

Foreign literature already written (for context, do not repeat):
"""
${foreignText.slice(0, 800)}…
"""
${citationBlock}
Write the LOCAL LITERATURE AND STUDIES section (Philippine context).

Requirements:
- Write 3–4 well-developed paragraphs
- Focus specifically on studies, reports, and literature from the Philippines
- Cite AT LEAST 4 local (Philippine) sources using APA inline format: (Last name, Year)
- Sources may include Philippine journal articles, CHED reports, DepEd studies, local university theses, Philippine government reports
- Show how the local context relates to the broader international literature
- Highlight any gaps or unique aspects of the Philippine setting
- Use formal academic English, third-person perspective
- Write in flowing prose paragraphs, no bullet points

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1 (Local Author, Year). \\n\\n Paragraph 2 (Local Author et al., Year). \\n\\n Paragraph 3..." }`
}

export function buildTheoreticalFrameworkPrompt(
  sop: string,
  rqs: string[],
  objectives: string[],
): string {
  const rqList  = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const objList = objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')

  return `You are an academic research writer producing Chapter 2 for a Philippine university research paper.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Objectives:
${objList}

Write the THEORETICAL / CONCEPTUAL FRAMEWORK section.

Requirements:
- Identify 2–3 established theories or frameworks that underpin this research
- For each theory: name it, cite the original theorist (Author, Year), explain its core principles, and connect it directly to this study
- Write 3–4 paragraphs total
- End with a brief paragraph describing the conceptual framework: how the key variables/concepts in this study relate to each other
- Use formal academic English, third-person perspective
- Flowing prose, no bullet points

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph about Theory 1 (Theorist, Year). \\n\\n Paragraph about Theory 2 (Theorist, Year). \\n\\n Conceptual framework paragraph." }`
}

export function buildSynthesisPrompt(
  sop: string,
  foreignText: string,
  localText: string,
  theoreticalText: string,
): string {
  return `You are an academic research writer producing Chapter 2 for a Philippine university research paper.

Statement of the Problem:
"""
${sop}
"""

Foreign literature summary (excerpt):
"""
${foreignText.slice(0, 600)}…
"""

Local literature summary (excerpt):
"""
${localText.slice(0, 600)}…
"""

Theoretical framework summary (excerpt):
"""
${theoreticalText.slice(0, 400)}…
"""

Write the SYNTHESIS section.

Requirements:
- Write 2 paragraphs
- Paragraph 1: Synthesize the key insights from the foreign and local literature — what do all these studies collectively say about the problem? What agreements and gaps exist?
- Paragraph 2: Explain how the present study addresses the identified gap — what does this study contribute that the reviewed literature has not yet covered? How does the theoretical framework guide the study?
- Do NOT simply summarize each source again — synthesize and connect
- Use formal academic English, third-person perspective

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Synthesis paragraph 1. \\n\\n Synthesis paragraph 2." }`
}
