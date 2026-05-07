import { z } from 'zod'
import { extractJSON, sanitizeText } from './prompt-utils'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const sectionTextSchema = z.object({
  text: z.string().min(1),
})

const designRecommendationSchema = z.object({
  design: z.enum(['quantitative', 'qualitative', 'mixed']),
  rationale: z.string().min(1),
  keyReasons: z.array(z.string().min(1)).min(1),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DesignRecommendation {
  design: 'quantitative' | 'qualitative' | 'mixed'
  rationale: string
  keyReasons: string[]
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

export function parseDesignRecommendation(raw: string): DesignRecommendation | null {
  try {
    const parsed = extractJSON(raw)
    const result = designRecommendationSchema.safeParse(parsed)
    if (result.success) return result.data
  } catch { /* fall through */ }
  return null
}

export function parseSectionText(raw: string): string | null {
  try {
    const parsed = extractJSON(raw)
    const result = sectionTextSchema.safeParse(parsed)
    if (result.success) return sanitizeText(result.data.text)
  } catch { /* fall through */ }
  const trimmed = raw.trim()
  if (trimmed.length > 20) return sanitizeText(trimmed)
  return null
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildInstrumentsPrompt(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  locale: string,
  sampling: string,
): string {
  const rqList = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const designNote = {
    quantitative: 'standardized questionnaires, rating scales, or structured survey instruments',
    qualitative:  'interview guides, focus group discussion guides, or observation checklists',
    mixed:        'both a standardized questionnaire/survey AND an interview guide or observation checklist',
  }[design]

  return `You are an academic research writer producing Chapter 3 (Research Methodology) for a Philippine university research paper.

Research Design: ${design.charAt(0).toUpperCase() + design.slice(1)} Research
Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Locale and Participants: ${locale}
Sampling: ${sampling}

Write the RESEARCH INSTRUMENTS section.

Requirements:
- Describe the instruments used to collect data: ${designNote}
- Write 2–3 paragraphs covering: what instrument(s) will be used, how they are structured (number of items, parts/sections, response format), validity and reliability considerations, and how they were developed or adapted
- Mention pilot testing or expert validation if appropriate
- Be specific to the research questions listed above
- Use formal academic English, third-person perspective, future tense ("The researcher will use…")
- Flowing prose, no bullet points

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1. \\n\\n Paragraph 2. \\n\\n Paragraph 3." }`
}

export function buildProcedurePrompt(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  locale: string,
  sampling: string,
): string {
  const rqList = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')

  return `You are an academic research writer producing Chapter 3 for a Philippine university research paper.

Research Design: ${design.charAt(0).toUpperCase() + design.slice(1)} Research
Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

Locale and Participants: ${locale}
Sampling: ${sampling}

Write the DATA COLLECTION PROCEDURE section.

Requirements:
- Write 3–4 paragraphs describing the step-by-step procedure for collecting data
- Cover: obtaining permission/clearances from the institution, orienting/briefing participants, administering instruments, retrieval of instruments/data, and any follow-up steps
- Mention the timeline (before data collection, during, after)
- Emphasize ethical conduct: voluntary participation, informed consent, confidentiality
- Use future tense ("The researcher will…") and formal academic English
- Flowing prose, no numbered steps or bullets in the final text

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1. \\n\\n Paragraph 2. \\n\\n Paragraph 3." }`
}

export function buildAnalysisPrompt(
  sop: string,
  rqs: string[],
  design: 'quantitative' | 'qualitative' | 'mixed',
  userInput?: string,
): string {
  const rqList = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')
  const analysisNote = {
    quantitative: 'statistical tools such as frequency counts, percentages, means, standard deviations, t-tests, ANOVA, Pearson r, or regression analysis as appropriate to each research question',
    qualitative:  'thematic analysis, content analysis, or grounded theory coding (open, axial, selective), triangulation of data sources',
    mixed:        'both statistical analysis for quantitative data and thematic/content analysis for qualitative data, with integration/triangulation at the interpretation stage',
  }[design]

  const userInputBlock = userInput?.trim()
    ? `\nResearcher's planned analysis approach (incorporate and expand on this):\n"""\n${userInput.trim()}\n"""\n`
    : ''

  return `You are an academic research writer producing Chapter 3 for a Philippine university research paper.

Research Design: ${design.charAt(0).toUpperCase() + design.slice(1)} Research
Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}
${userInputBlock}
Write the DATA ANALYSIS section.

Requirements:
- Write 2–3 paragraphs describing how data will be analyzed
- For each research question (or group of questions), identify the specific statistical or analytical technique that will be used: ${analysisNote}
- If a researcher's analysis approach was provided above, incorporate and expand on it with academic language — do not ignore it
- Explain why each technique is appropriate for the type of data and research question
- Mention the software or tools that will be used (e.g., SPSS, Microsoft Excel, NVivo, Atlas.ti, manual coding)
- Use future tense ("The researcher will…") and formal academic English
- Flowing prose, no bullet points

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1. \\n\\n Paragraph 2. \\n\\n Paragraph 3." }`
}

export function buildDesignRecommendPrompt(
  sop: string,
  rqs: string[],
  foreignLit: string,
  localLit: string,
  theoreticalFramework: string,
  synthesis: string,
): string {
  const rqList = rqs.map((q, i) => `${i + 1}. ${q}`).join('\n')

  // Truncate each section to stay within token budget
  const trimForeign     = foreignLit.slice(0, 900)
  const trimLocal       = localLit.slice(0, 900)
  const trimTheory      = theoreticalFramework.slice(0, 600)
  const trimSynthesis   = synthesis.slice(0, 500)

  return `You are an academic research methodologist advising a Filipino university student on their Chapter 3 methodology.

Analyze the study context below and recommend the single most appropriate research design: quantitative, qualitative, or mixed methods.

Statement of the Problem:
"""
${sop}
"""

Research Questions:
${rqList}

--- Literature Review Summary (Chapter 2) ---

Foreign Studies:
${trimForeign || '(not yet available)'}

Local Studies (Philippines):
${trimLocal || '(not yet available)'}

Theoretical Framework:
${trimTheory || '(not yet available)'}

Synthesis / Research Gap:
${trimSynthesis || '(not yet available)'}

---

To determine the recommendation:
1. If the research questions measure, count, or test relationships between variables → lean toward QUANTITATIVE
2. If the research questions explore experiences, meanings, or perceptions → lean toward QUALITATIVE
3. If both types of questions are present, or if the literature uses both → lean toward MIXED
4. Consider what designs were used in the cited foreign and local studies
5. Consider what the theoretical framework implies about appropriate methodology

Provide a definitive recommendation with 3 concrete, study-specific reasons (not generic definitions).
The rationale should reference the actual research questions and literature context above.

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
{
  "design": "quantitative" | "qualitative" | "mixed",
  "rationale": "2–3 sentence explanation referencing the specific research questions and literature findings",
  "keyReasons": [
    "Specific reason 1 tied to this study",
    "Specific reason 2 tied to this study",
    "Specific reason 3 tied to this study"
  ]
}`
}

export function buildEthicsPrompt(
  sop: string,
  locale: string,
  design: 'quantitative' | 'qualitative' | 'mixed',
): string {
  return `You are an academic research writer producing Chapter 3 for a Philippine university research paper.

Research Design: ${design.charAt(0).toUpperCase() + design.slice(1)} Research
Statement of the Problem:
"""
${sop}
"""

Locale and Participants: ${locale}

Write the ETHICAL CONSIDERATIONS section.

Requirements:
- Write 2–3 paragraphs addressing the ethical dimensions of conducting this research in the Philippines
- Cover ALL of the following: informed consent, voluntary participation and right to withdraw, confidentiality and anonymity of participants, secure storage of data, potential risks and how they will be mitigated, researcher's obligations, and any institutional ethics approval process
- Reference the Data Privacy Act of 2012 (Republic Act No. 10173) where applicable for data protection
- Use future tense ("The researcher will…") and formal academic English
- Flowing prose, no bullet points

IMPORTANT: Respond with ONLY a single valid JSON object. No preamble, no markdown fences.
All text must be on a single line — use \\n for paragraph breaks, NOT actual newlines.

{ "text": "Paragraph 1. \\n\\n Paragraph 2. \\n\\n Paragraph 3." }`
}
