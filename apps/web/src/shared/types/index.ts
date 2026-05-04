export type SyncStatus = 'pending' | 'synced' | 'error'
export type OperationType = 'create' | 'update' | 'delete'
export type AIStatus = 'pending' | 'completed' | 'failed'

export interface ResearchItemType {
  id?: number
  title: string
  sourceText: string
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

export interface AIRunType {
  id?: number
  researchItemId: number
  provider: string
  model: string
  prompt: string
  output: string
  status: AIStatus
  createdAt: Date
}
