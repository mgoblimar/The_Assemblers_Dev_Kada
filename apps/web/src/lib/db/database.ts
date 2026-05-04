import Dexie, { Table } from 'dexie'

export interface ResearchItem {
  id?: number
  title: string
  sourceText: string
  createdAt: Date
  updatedAt: Date
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface AIRun {
  id?: number
  researchItemId: number
  provider: string
  model: string
  prompt: string
  output: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
  steps?: {
    name: string
    status: 'pending' | 'completed' | 'failed'
    output?: string
  }[]
}

export interface OutboxEntry {
  id?: number
  entityType: 'research_item' | 'ai_run'
  entityId: number
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, any>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: Date
  updatedAt?: Date
}

export class ResearchDatabase extends Dexie {
  researchItems!: Table<ResearchItem>
  aiRuns!: Table<AIRun>
  outbox!: Table<OutboxEntry>

  constructor() {
    super('ResearchDB')
    this.version(1).stores({
      researchItems: '++id, createdAt, syncStatus',
      aiRuns: '++id, researchItemId, createdAt',
      outbox: '++id, status, createdAt',
    })
  }
}

export const db = new ResearchDatabase()
