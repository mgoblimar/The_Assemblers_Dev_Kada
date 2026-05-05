# System Architecture

**Project:** Research Tool with AI & Agentic Workflows  
**Architecture Version:** 2.0  
**Date:** May 6, 2026

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      React 19 Frontend (Vite)                        │
│                      Offline-first, 3-column layout                  │
├──────────────┬───────────────────────────────────┬───────────────────┤
│   Sidebar    │         Main Content              │  AIWorkflowPanel  │
│  (nav/sync)  │  Dashboard / Advisor / Citations  │ (live step track) │
│              │  Improve / Topics / Research      │                   │
└──────────────┴─────────────┬─────────────────────┴───────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     Dexie IndexedDB         │
              │  (Offline-first local DB)   │
              │  researchItems / aiRuns     │
              │  outbox                     │
              └──────┬──────────────┬───────┘
                     │              │
          ┌──────────▼──────┐  ┌───▼────────────────────┐
          │  Express Proxy  │  │  Supabase (Cloud)      │
          │  (Port 3001)    │  │  research_items/ai_runs │
          │  /api/groq      │  │  Auth (JWT / RLS)      │
          │  /api/gemini    │  └────────────────────────┘
          │  /api/scrape    │
          └────┬───────┬────┘
               │       │
         ┌─────▼──┐ ┌──▼──────┐
         │  Groq  │ │ Gemini  │
         │  API   │ │  API    │
         └────────┘ └─────────┘

Browser also calls directly (no proxy needed — CORS-enabled):
  api.semanticscholar.org   (Phase 10 — Citation Engine)
  api.crossref.org          (Phase 10 — Citation Engine)
```

---

## Component Architecture

### 1. Layout Layer (`src/features/layout/`)

#### Sidebar (`Sidebar.tsx`)
- **Purpose:** Primary navigation, user info, sync controls
- **Props:** `email`, `online`, `isSyncing`, `lastSynced`, `activeView`, `onViewChange`, `onLogout`, `onSync`
- **Nav links:** Dashboard, Advisor, Citations, Improve, Topics
- **Indicators:** Online/offline badge, last-synced timestamp, sync button

#### AIWorkflowPanel (`AIWorkflowPanel.tsx`)
- **Purpose:** Live display of any active or recently completed `aiRun`
- **Props:** `runId`, `itemTitle`, `onCancel`, `onViewReport`
- **Behavior:** Polls Dexie for `aiRun` by `runId`, renders `run.steps[]` dynamically (no hardcoded step labels), shows progress bar, cancel button
- **Idle state:** Renders `DEFAULT_PREVIEW_STEPS` placeholder

#### StatusBar (`StatusBar.tsx`)
- **Purpose:** Persistent bottom bar with system state
- **Shows:** Research item count, online/offline indicator, outbox queue count

---

### 2. Feature Panels (`src/features/`)

#### Dashboard (`App.tsx → MainContent`)
- Stat cards: Research Items count, AI Runs (—), Citations (—)
- Inline `ResearchForm` (toggleable via "New Research" button)
- `ResearchList` — card list with Analyze / Delete per item

#### AnalysisAdvisor (`features/advisor/AnalysisAdvisor.tsx`)
- Select research item → run 3-step workflow → show paradigm + method cards + guide
- Caches last result from `aiRuns` where `prompt === 'Analysis Advisor'`

#### CitationEngine (`features/citations/CitationEngine.tsx`)
- Select research item → run 3-step workflow → show ranked reference cards
- Style toggle (APA / MLA / Chicago) reformats client-side without re-fetching
- Copy-one and copy-all with toast feedback

#### ImprovementAnalyzer (`features/improve/ImprovementAnalyzer.tsx`)
- Select research item → run 3-step workflow → show score + issues + paragraph breakdown + rewrite
- Caches last result from `aiRuns` where `prompt === 'Improvement Analyzer'`

#### TopicBuilder (`features/topics/TopicBuilder.tsx`)
- Two-phase interactive workflow:
  1. Seed input + "Generate Topics" → 5 scored topic cards
  2. User selects topic → "Build Outline" → 7-chapter outline
- Each phase creates a separate `aiRun` record

---

### 3. AI Orchestration Layer (`src/lib/ai/`)

#### Adapters
- `index.ts` — exports `generateWithGroq(prompt, model)` and `generateWithGemini(prompt, model)`
- `groq.ts` — POSTs to `localhost:3001/api/groq` (OpenAI-compatible format)
- `gemini.ts` — POSTs to `localhost:3001/api/gemini` (Gemini-native format)

#### Prompt Builders (`prompts.ts`)
```typescript
buildAdvisorPrompt(step: 'classify_extract' | 'guide', input: string, context?: string): string
buildCitationPrompt(text: string): string
buildImprovementPrompt(step: 'segment' | 'audit' | 'rewrite', input: string, context?: string): string
buildTopicPrompt(seed: string): string
buildOutlinePrompt(title: string, questions: string[], hypothesis: string, subtopics: string[]): string
```

#### Workflows (`lib/ai/workflows/`)

| File | Phases | Steps | Prompt |
|------|--------|-------|--------|
| `agent.ts` | 3 | 4 | Themes → Questions → Connections → Synthesize |
| `analysis-advisor.ts` | 9 | 3 | Classify+Extract → Match Methods (local) → Guide |
| `citation-engine.ts` | 10 | 3 | Extract Terms → Search APIs → Rank+Dedupe |
| `improvement-analyzer.ts` | 11 | 3 | Segment → Audit → Rewrite |
| `topic-builder.ts` | 12 | 1+1 | Generate Topics / Build Outline (separate calls) |

Each workflow:
1. Creates an `aiRun` record in Dexie with `status: 'pending'` and `steps[]`
2. Updates each step to `'completed'` or `'failed'` in real-time
3. Stores final JSON output in `aiRun.output`
4. Adds an outbox entry for Supabase sync
5. Returns `{ runId, result }` to the calling component

#### Local Data (`lib/data/`)
- `methodology-matrix.json` — 15 research methods for Phase 9 offline scoring
  - Fields per method: `id`, `name`, `paradigm`, `description`, `when_to_use`, `data_types`, `sample_size`, `tools`, `keywords`, `complexity`

---

### 4. Database Layer (`src/lib/db/`)

#### Dexie Schema (`database.ts`)
```typescript
researchItems
  id: number (PK, auto-increment)
  userId: string
  title: string
  sourceText: string
  url?: string
  createdAt: Date
  syncStatus: 'pending' | 'synced' | 'error'

aiRuns
  id: number (PK, auto-increment)
  userId?: string
  researchItemId: number (FK)
  provider: 'groq' | 'gemini'
  model: string
  prompt: string          // e.g. 'Analysis Advisor', 'Citation Engine'
  output: string          // JSON-serialized result
  status: 'pending' | 'completed' | 'failed'
  steps: AiRunStep[]      // [{ name, status, output? }]
  createdAt: Date

outbox
  id: number (PK, auto-increment)
  entityType: 'research_item' | 'ai_run'
  entityId: number
  operation: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: Date
```

#### Repository (`research-repository.ts`)
- `getResearchItems()` → `ResearchItem[]`
- `createResearchItem(data)` → `ResearchItem`
- `getLatestAIRun(researchItemId)` → `AIRun | null`

---

### 5. Sync Layer (`src/lib/sync/`)

#### `supabase.ts`
- Exports single Supabase JS client (reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)

#### `outbox-processor.ts`
- `processOutbox(force?)` — iterates pending outbox entries, upserts to Supabase tables, marks synced
- `fetchRemoteData(userId)` — on login, pulls remote records missing from local Dexie

---

### 6. Server Layer (`server/index.mjs`)

| Route | Purpose | Calls |
|-------|---------|-------|
| `POST /api/groq` | AI proxy — keeps key server-side | `api.groq.com` |
| `POST /api/gemini` | AI proxy — keeps key server-side | Gemini API |
| `POST /api/scrape` | Puppeteer academic scraper | Target URL |

---

### 7. External APIs (Browser-Direct)

| API | URL | Auth | Used By |
|-----|-----|------|---------|
| Semantic Scholar | `api.semanticscholar.org/graph/v1/paper/search` | None | Citation Engine |
| CrossRef | `api.crossref.org/works` | None | Citation Engine |

Both APIs support CORS for browser requests and require no API key. Calls use `AbortSignal.timeout(8000)`.

---

## Data Flow

### Agentic Workflow (any feature panel)
```
User clicks "Run" button
  └─ Component calls runXxxWorkflow(researchItemId)
  └─ Workflow creates aiRun in Dexie (status: 'pending', steps[])
  └─ Workflow updates steps as each AI call completes
  └─ AIWorkflowPanel (right column) polls Dexie for runId, renders steps live
  └─ Workflow stores final output in aiRun.output (JSON)
  └─ Workflow adds outbox entry for Supabase sync
  └─ Component receives { runId, result } and renders results
```

### Citation Search (Phase 10)
```
CitationEngine calls runCitationWorkflow(researchItemId)
  └─ Step 1: Groq extracts key terms from source text
  └─ Step 2: Semantic Scholar + CrossRef searched IN PARALLEL (browser-direct)
  └─ Step 3: dedupeAndRank() scores and sorts results
  └─ CitationEngine renders reference cards
  └─ Style toggle calls formatCitation(ref, style) client-side — no new fetch
```

### Supabase Sync
```
User creates research item / AI run completes
  └─ outbox entry added: { entityType, entityId, operation, payload, status: 'pending' }
  └─ App detects online + session → processOutbox()
  └─ Each pending entry → supabase.from(table).upsert(payload)
  └─ Entry status → 'synced'
```

---

## Security Model

- **API keys** never in frontend; all LLM calls go through Express proxy
- **Supabase RLS** ensures users read/write only their own rows (`auth.uid() = user_id`)
- **External academic APIs** (Semantic Scholar, CrossRef) require no keys
- **No secrets** committed — `.env.local` in `.gitignore`
- **Logging** — proxy logs model name only, never logs request body or keys

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 19.x | UI framework |
| Language | TypeScript | 5.x | Type safety (strict mode) |
| Build | Vite | 8.x | Fast bundler |
| Styling | Tailwind CSS | 4.x | Utility CSS |
| UI Components | shadcn/ui | Latest | Accessible component primitives |
| Icons | lucide-react | Latest | Icon set |
| Database | Dexie | 4.x | IndexedDB wrapper |
| State | React hooks | Built-in | Component & app state |
| Server | Express.js | Latest | AI proxy + scraper |
| Auth/Sync | Supabase | Latest | Auth (JWT) + cloud DB (PostgreSQL) |
| AI (primary) | Groq | Latest | llama-3.3-70b-versatile |
| AI (fallback) | Gemini | Latest | gemini-2.0-flash-lite |
| Scraping | Puppeteer | Latest | Academic URL scraping |

---

## Environment Variables

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `VITE_AI_PROVIDER` | `groq` | Yes | Primary AI provider |
| `VITE_GROQ_MODEL` | `llama-3.3-70b-versatile` | No | Override Groq model |
| `VITE_GEMINI_MODEL` | `gemini-2.0-flash-lite` | No | Override Gemini model |
| `GROQ_API_KEY` | — | Yes | Groq authentication (server-side) |
| `GEMINI_API_KEY` | — | No | Gemini authentication (server-side) |
| `VITE_SUPABASE_URL` | — | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | — | Yes | Supabase public anon key |
