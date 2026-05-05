import Dexie, { Table } from 'dexie'

export interface ResearchItem {
  id?: number
  userId?: string // Supabase user ID
  title: string
  sourceText: string
  createdAt: Date
  updatedAt: Date
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface AIRun {
  id?: number
  userId?: string // Supabase user ID
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
  userId?: string // Supabase user ID
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
    this.version(2).stores({
      researchItems: '++id, userId, createdAt, syncStatus',
      aiRuns: '++id, userId, researchItemId, createdAt',
      outbox: '++id, userId, status, createdAt',
    })
  }
}

export const db = new ResearchDatabase()
