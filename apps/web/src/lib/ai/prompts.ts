export function buildResearchPrompt(title: string, content: string) {
  if (!title || !content) return ''
  return `Summarize and extract key insights from the following research content:\n\nTitle: ${title}\n\nContent:\n${content}`
}

export function buildAgenticPrompt(step: 'summarize' | 'actions' | 'categorize', input: string) {
  switch (step) {
    case 'summarize':
      return `Summarize this: ${input}`
    case 'actions':
      return `Extract actionable items from this summary: ${input}`
    case 'categorize':
      return `Categorize this research into one of: TECH, HEALTH, BUSINESS, OTHER. Input: ${input}`
    default:
      return ''
  }
}
