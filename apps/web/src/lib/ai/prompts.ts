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
