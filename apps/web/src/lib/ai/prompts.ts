export function buildAdvisorPrompt(step: 'classify_extract' | 'guide', input: string, context?: string): string {
  switch (step) {
    case 'classify_extract':
      return `You are a research methodology expert. Analyze this research text and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Required fields:
{
  "paradigm": "quantitative" | "qualitative" | "mixed",
  "confidence": number between 0 and 1,
  "variables": ["list of identified variables or constructs"],
  "sample_size": "estimated sample size as a string, or null if not mentioned",
  "data_types": ["types of data used: continuous, categorical, text, etc."],
  "research_design": "brief description of the research design",
  "key_features": ["3-5 characteristics relevant to method selection"]
}

Research text:
${input}`

    case 'guide':
      return `You are a research methodology expert. Write a practical step-by-step guide for conducting the following analysis method in the context of this research.

Analysis method: ${input}
Research context: ${context ?? ''}

Provide exactly 5 numbered steps. Each step should be 1–2 sentences. Cover: data preparation, software setup, running the analysis, interpreting results, and reporting. Use plain text — no markdown, no headers, just the numbered list.`

    default:
      return ''
  }
}

export function buildCitationPrompt(text: string): string {
  return `Extract 5-8 specific academic search terms from the following research text. These will be used to search Semantic Scholar and CrossRef for relevant papers.

Return ONLY a JSON array of strings — no explanation, no markdown, no code fences. Each term should be a specific concept, methodology, or topic (2-4 words preferred).

Example output: ["machine learning", "neural networks", "image classification"]

Research text:
${text.slice(0, 800)}`
}

export function buildImprovementPrompt(
  step: 'segment' | 'audit' | 'rewrite',
  input: string,
  context?: string
): string {
  switch (step) {
    case 'segment':
      return `You are a research writing expert. Analyze this text and return ONLY a valid JSON object — no markdown, no code fences.

{
  "sectionType": "introduction" | "literature_review" | "methodology" | "results" | "discussion" | "conclusion" | "abstract" | "general",
  "paragraphs": ["paragraph 1 text (up to 300 chars)", "paragraph 2 text", ...]
}

Split into 2–6 logical paragraphs. If the text is short, keep as 1–2 paragraphs. Truncate each to 300 characters in the output.

Text:
${input.slice(0, 2000)}`

    case 'audit':
      return `You are a research writing expert. Analyze these research paragraphs and return ONLY a valid JSON object — no markdown, no code fences.

{
  "overallScore": <number 0–10>,
  "coherenceSummary": "<2-sentence summary of overall writing quality>",
  "paragraphFeedback": [
    { "coherenceScore": <0–10>, "issues": ["issue 1", "issue 2"], "suggestion": "<1-sentence improvement>" }
  ],
  "argumentIssues": ["global issue 1", "global issue 2", "global issue 3"],
  "gaps": ["missing element 1", "missing element 2"]
}

Section type: ${context ?? 'general'}
Paragraphs:
${input}`

    case 'rewrite':
      return `You are a research writing expert. Rewrite the following weak paragraph to be clearer, more coherent, and better argued. Return ONLY a JSON object — no markdown, no code fences.

{
  "improved": "<the rewritten paragraph — same length or shorter, same voice>"
}

Original paragraph:
${input}`

    default:
      return ''
  }
}

export function buildTopicPrompt(seed: string): string {
  return `You are a research planning expert. Generate exactly 5 distinct research topics based on this seed and return ONLY a valid JSON array — no markdown, no code fences.

[
  {
    "id": "topic-1",
    "title": "<specific, publishable research topic title>",
    "subtopics": ["subtopic 1", "subtopic 2", "subtopic 3"],
    "researchQuestions": ["RQ1 as a question?", "RQ2 as a question?"],
    "hypothesis": "<one testable hypothesis statement>",
    "noveltyScore": <1–10, 10=very understudied>,
    "feasibilityScore": <1–10, 10=easily achievable in 6 months>,
    "noveltyReason": "<1 sentence>",
    "feasibilityReason": "<1 sentence>"
  }
]

Seed: ${seed}

Make the 5 topics meaningfully different — vary the angle, method, and scope.`
}

export function buildOutlinePrompt(
  title: string,
  questions: string[],
  hypothesis: string,
  subtopics: string[]
): string {
  return `You are a research planning expert. Generate a complete 7-chapter research outline and return ONLY a valid JSON array — no markdown, no code fences.

[
  {
    "chapter": "Abstract",
    "purpose": "<1-sentence purpose>",
    "keyPoints": ["point 1", "point 2", "point 3"],
    "suggestedLength": "150–250 words"
  }
]

Include all 7 chapters in order: Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion.

Topic: ${title}
Research questions: ${questions.join(' | ')}
Hypothesis: ${hypothesis}
Subtopics to address: ${subtopics.join(', ')}`
}

export function buildResearchPrompt(title: string, content: string) {
  if (!title || !content) return ''
  return `Act as a senior research analyst. Provide a professional, high-signal summary of the research titled "${title}". 

Structure:
1. **EXECUTIVE SUMMARY**: (3-4 sentences focusing on key breakthroughs and impact)
2. **KEY INSIGHTS**: (3 bullet points)

Avoid conversational filler like "Here is the summary". Use a professional, objective tone.

Content:
${content}`
}

export function buildAgenticPrompt(step: 'summarize' | 'actions' | 'categorize', input: string) {
  switch (step) {
    case 'summarize':
      return `Provide a concise, professional executive summary of this research. Max 3 sentences. Focus on the 'So What?' and technical significance. No introductory text.\n\nInput: ${input}`
    case 'actions':
      return `Extract 3-5 high-impact actionable items from this summary. 
Format: Bulleted list with bolded action verbs. 
Constraint: No introductory or concluding remarks. Just the list.\n\nSummary: ${input}`
    case 'categorize':
      return `Analyze the following summary and select the single most relevant category from: [TECH, HEALTH, BUSINESS, SUSTAINABILITY, POLICY]. 
Constraint: Output ONLY the category name in ALL CAPS. No explanation.\n\nSummary: ${input}`
    default:
      return ''
  }
}
