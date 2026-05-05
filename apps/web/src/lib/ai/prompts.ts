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
