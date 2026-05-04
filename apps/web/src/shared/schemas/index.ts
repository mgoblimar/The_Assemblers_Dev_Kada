export const ResearchItemSchema = {
  title: 'Research Item',
  type: 'object',
  properties: {
    id: { type: 'number' },
    title: { type: 'string', minLength: 1 },
    sourceText: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    syncStatus: { enum: ['pending', 'synced', 'error'] },
  },
  required: ['title', 'sourceText', 'syncStatus'],
}

export const AIRunSchema = {
  title: 'AI Run',
  type: 'object',
  properties: {
    id: { type: 'number' },
    researchItemId: { type: 'number' },
    provider: { type: 'string' },
    model: { type: 'string' },
    prompt: { type: 'string' },
    output: { type: 'string' },
    status: { enum: ['pending', 'completed', 'failed'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['researchItemId', 'provider', 'model', 'prompt', 'status'],
}
