import { describe, it, expect } from 'vitest'
import { buildResearchPrompt, buildAgenticPrompt } from './prompts'

describe('AI Prompt Builder', () => {
  it('should build a research prompt correctly', () => {
    const title = 'Fusion Energy'
    const content = 'Data about fusion.'
    const prompt = buildResearchPrompt(title, content)
    
    expect(prompt).toContain('Title: Fusion Energy')
    expect(prompt).toContain('Content:\nData about fusion.')
  })

  it('should return empty string if title or content is missing', () => {
    expect(buildResearchPrompt('', 'content')).toBe('')
    expect(buildResearchPrompt('title', '')).toBe('')
  })

  it('should build agentic prompts correctly', () => {
    expect(buildAgenticPrompt('summarize', 'test')).toContain('Summarize this: test')
    expect(buildAgenticPrompt('categorize', 'test')).toContain('Categorize this research')
  })
})
