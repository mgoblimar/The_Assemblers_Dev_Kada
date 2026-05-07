import Dexie, { Table } from 'dexie'

export interface ResearchItem {
  id?: number
  userId?: string
  title: string
  sourceText: string
  createdAt: Date
  updatedAt: Date
  syncStatus: 'pending' | 'synced' | 'error'
}

export interface AIRun {
  id?: number
  userId?: string
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
  userId?: string
  entityType: 'research_item' | 'ai_run' | 'research_project' | 'chapter_state'
  entityId: number
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: Date
  updatedAt?: Date
}

// ─── Research Project ────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'completed' | 'archived'
export type ChapterId = 'chapter-1' | 'chapter-2' | 'chapter-3' | 'chapter-4' | 'chapter-5'

export interface ResearchProject {
  id?: number
  userId?: string
  title: string
  status: ProjectStatus
  /** Validated SOP text — written after chapter 1 step 1 is accepted */
  sop: string | null
  researchQuestions: string[]
  objectives: string[]
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  syncStatus: 'pending' | 'synced' | 'error'
}

// ─── Chapter State ───────────────────────────────────────────────────────────

export type ChapterStepId =
  // ── Chapter 1 ──────────────────────────────────────────
  | 'sop_input'
  | 'sop_validate'
  | 'rq_suggest'
  | 'rq_select'
  | 'rq_validate'
  | 'obj_suggest'
  | 'obj_select'
  | 'obj_validate'
  | 'generate_sections'
  | 'ch1_references_generate'
  | 'compile_draft'
  | 'done'
  // ── Chapter 2 ──────────────────────────────────────────
  | 'rrl_theme_input'
  | 'rrl_citations_suggest'
  | 'rrl_citations_select'
  | 'rrl_foreign_generate'
  | 'rrl_local_generate'
  | 'rrl_theoretical_generate'
  | 'rrl_synthesis_generate'
  | 'rrl_done'
  // ── Chapter 3 ──────────────────────────────────────────
  | 'method_design_ai'
  | 'method_design_select'
  | 'method_locale_input'
  | 'method_sampling_input'
  | 'method_instrument_generate'
  | 'method_procedure_generate'
  | 'method_analysis_input'
  | 'method_analysis_generate'
  | 'method_ethics_generate'
  | 'method_done'

export type StepStatus = 'idle' | 'awaiting_user' | 'running_ai' | 'failed' | 'done'

export interface ValidationResult {
  ok: boolean
  score: number        // 0–100 quality score from AI
  issues: string[]
  suggestions: string[]
  attempt: number
}

export interface RqSuggestion {
  text: string
  rationale: string
  type: 'descriptive' | 'comparative' | 'causal' | 'exploratory'
}

export interface ObjSuggestion {
  text: string
  mapsToQuestion: string
}

export interface DefinitionEntry {
  term: string
  definition: string
}

export interface Citation {
  id: string                // slug: "authorlastname_year_keyword"
  authorLastName: string
  year: number
  title: string
  source: string            // journal / book / publisher name
  scope: 'foreign' | 'local' | 'theoretical'
  theme: string             // which research theme this citation addresses
  relevanceSummary: string  // 1–2 sentence annotation
}

export interface ChapterArtifacts {
  // ── Chapter 1 ────────────────────────────────────────────
  sopDraft?: string
  sopValidation?: ValidationResult
  rqSuggestions?: RqSuggestion[]
  selectedRqs?: string[]
  rqValidation?: ValidationResult
  objSuggestions?: ObjSuggestion[]
  selectedObjectives?: string[]
  objValidation?: ValidationResult
  background?: string
  scopeDelimitation?: string
  significance?: string
  definitions?: DefinitionEntry[]
  compiledDraft?: string
  ch1_references?: string   // formatted APA reference list (markdown, separate from draft)

  // ── Chapter 2 ────────────────────────────────────────────
  ch2_themes?: string[]
  ch2_suggestedCitations?: Citation[]
  ch2_selectedCitationIds?: string[]
  ch2_foreignLiterature?: string
  ch2_localLiterature?: string
  ch2_theoreticalFramework?: string
  ch2_synthesis?: string
  ch2_compiledDraft?: string

  // ── Chapter 3 ────────────────────────────────────────────
  ch3_designRecommendation?: {
    design: 'quantitative' | 'qualitative' | 'mixed'
    rationale: string
    keyReasons: string[]
  }
  ch3_researchDesign?: 'quantitative' | 'qualitative' | 'mixed'
  ch3_localeDescription?: string
  ch3_samplingDescription?: string
  ch3_instrumentsSection?: string
  ch3_procedureSection?: string
  ch3_analysisInput?: string
  ch3_analysisSection?: string
  ch3_ethicsSection?: string
  ch3_compiledDraft?: string
}

export interface ChapterHistoryEntry {
  step: ChapterStepId
  at: string // ISO string — Date not serializable cleanly in Dexie JSON
  note?: string
}

export interface ChapterState {
  id?: number
  projectId: number
  chapterId: ChapterId
  currentStep: ChapterStepId
  stepStatus: StepStatus
  artifacts: ChapterArtifacts
  history: ChapterHistoryEntry[]
  updatedAt: Date
  syncStatus: 'pending' | 'synced' | 'error'
}

// ─── Database ────────────────────────────────────────────────────────────────

export class ResearchDatabase extends Dexie {
  researchItems!: Table<ResearchItem>
  aiRuns!: Table<AIRun>
  outbox!: Table<OutboxEntry>
  researchProjects!: Table<ResearchProject>
  chapterStates!: Table<ChapterState>

  constructor() {
    super('ResearchDB')
    this.version(2).stores({
      researchItems: '++id, userId, createdAt, syncStatus',
      aiRuns: '++id, userId, researchItemId, createdAt',
      outbox: '++id, userId, status, createdAt',
    })
    this.version(3).stores({
      researchItems: '++id, userId, createdAt, syncStatus',
      aiRuns: '++id, userId, researchItemId, createdAt',
      outbox: '++id, userId, status, createdAt',
      researchProjects: '++id, userId, status, updatedAt, syncStatus',
      chapterStates: '++id, projectId, chapterId, [projectId+chapterId]',
    })
  }
}

export const db = new ResearchDatabase()
