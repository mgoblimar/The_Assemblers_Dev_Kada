# Handoff & Developer Guide

**Project:** Research Tool with AI & Agentic Workflows  
**Version:** 2.0 (Phases 1–12 Complete)  
**Date:** May 6, 2026

---

## Quick Start

### Prerequisites
- Node.js 18+ (`node --version`)
- npm
- Groq API key (free: https://console.groq.com)
- Supabase Project (URL + Anon Key)

### 1. Clone & Install
```bash
cd D:\Projects\UPM\Hackathon\DevKada\The_Assemblers_Dev_Kada
npm install
```

### 2. Configure Environment
```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:
```
# AI Config
VITE_AI_PROVIDER=groq
GROQ_API_KEY=gsk_YOUR_KEY_HERE
GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE       # optional fallback

# Model overrides (optional)
VITE_GROQ_MODEL=llama-3.3-70b-versatile
VITE_GEMINI_MODEL=gemini-2.0-flash-lite

# Supabase Config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase Database
Run the SQL script in `docs/SUPABASE_SCHEMA.sql` in your Supabase SQL Editor. This creates:
- `research_items` and `ai_runs` tables
- Row-Level Security (RLS) enabled
- Policies so users only see their own data

### 4. Start Development

**Terminal 1 — Express Proxy (AI + Scraper):**
```bash
cd apps/web && npm run server
# → http://localhost:3001
```

**Terminal 2 — Vite Dev Server:**
```bash
cd apps/web && npm run dev
# → http://localhost:5173
```

**Or both at once (from repo root):**
```bash
npm run dev:all
```

---

## Project Structure

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── index.ts                      # generateWithGroq / generateWithGemini
│   │   │   ├── groq.ts                       # Groq adapter (→ localhost:3001/api/groq)
│   │   │   ├── gemini.ts                     # Gemini adapter (→ localhost:3001/api/gemini)
│   │   │   ├── agent.ts                      # Deep Insight agentic workflow
│   │   │   ├── prompts.ts                    # All prompt builder functions
│   │   │   └── workflows/
│   │   │       ├── analysis-advisor.ts       # Phase 9 — 3-step methodology advisor
│   │   │       ├── citation-engine.ts        # Phase 10 — API search + citation format
│   │   │       ├── improvement-analyzer.ts   # Phase 11 — coherence + rewrite
│   │   │       └── topic-builder.ts          # Phase 12 — topics + outline (2 exports)
│   │   ├── data/
│   │   │   └── methodology-matrix.json       # 15 research methods for offline scoring
│   │   ├── db/
│   │   │   ├── database.ts                   # Dexie DB instance + type definitions
│   │   │   └── research-repository.ts        # DB helper functions
│   │   ├── sync/
│   │   │   ├── supabase.ts                   # Supabase JS client
│   │   │   └── outbox-processor.ts           # processOutbox + fetchRemoteData
│   │   └── utils.ts                          # cn() and other utilities
│   ├── features/
│   │   ├── auth/
│   │   │   └── Auth.tsx                      # Login / Signup page
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                   # Left nav column
│   │   │   ├── AIWorkflowPanel.tsx           # Right live step tracking column
│   │   │   └── StatusBar.tsx                 # Bottom status bar
│   │   ├── research/
│   │   │   ├── ResearchForm.tsx              # New research item form
│   │   │   └── ResearchList.tsx              # Card list + per-item actions
│   │   ├── advisor/
│   │   │   └── AnalysisAdvisor.tsx           # Phase 9 UI
│   │   ├── citations/
│   │   │   └── CitationEngine.tsx            # Phase 10 UI
│   │   ├── improve/
│   │   │   └── ImprovementAnalyzer.tsx       # Phase 11 UI
│   │   └── topics/
│   │       └── TopicBuilder.tsx              # Phase 12 UI
│   ├── shared/
│   │   └── components/ui/                    # shadcn/ui primitives
│   ├── App.tsx                               # Root — layout wiring + MainContent router
│   └── main.tsx
├── server/
│   └── index.mjs                             # Express proxy (Groq, Gemini, Puppeteer)
├── .env.example
└── package.json
```

---

## Architecture: Core Patterns

### Offline-First Outbox Pattern
All user actions → Dexie IndexedDB immediately. A background `processOutbox()` flushes pending writes to Supabase when the user is online and authenticated. On login, `fetchRemoteData(userId)` pulls any cloud-only records into local Dexie.

### Agentic Workflow Pattern
Every AI feature (Phases 3, 9–12) follows the same contract:
1. Create `aiRun` in Dexie with `status: 'pending'` and a `steps: AiRunStep[]` array
2. For each step: call AI → update `steps[i].status` in Dexie
3. Store final JSON in `aiRun.output`, set `status: 'completed'`
4. Add an outbox entry so the run syncs to Supabase
5. Return `{ runId, result }` to the component

`AIWorkflowPanel` watches `runId` and polls Dexie to render whatever steps the active workflow defines — it reads `run.steps[i].name` directly, so step labels are never hardcoded in the panel.

### Two-Phase Workflow (Topic Builder — Phase 12)
`topic-builder.ts` exports **two** separate functions, not one:
- `runTopicGenerationWorkflow(seed, researchItemId)` — generates 5 topics, returns them for user selection
- `runOutlineBuildWorkflow(topic, researchItemId)` — takes the selected topic, returns 7-chapter outline

The UI in `TopicBuilder.tsx` manages the interactive state between the two phases (topic list → selection → outline). Each call produces its own `aiRun` record in Dexie.

### Citation Engine (Phase 10) — No Proxy
Semantic Scholar (`api.semanticscholar.org`) and CrossRef (`api.crossref.org`) both support browser-direct CORS requests and require no API keys. The workflow calls both in parallel using `Promise.allSettled`, each with an `AbortSignal.timeout(8000)` guard.

---

## Database Schema

### `researchItems` (Dexie / Supabase)
| Field | Type | Notes |
|-------|------|-------|
| `id` | number (auto) | Local PK |
| `userId` | string | Supabase user UUID |
| `title` | string | Research item title |
| `sourceText` | string | Full source text |
| `url` | string? | Optional scraped URL |
| `createdAt` | Date | |
| `syncStatus` | string | `'pending' \| 'synced' \| 'error'` |

### `aiRuns` (Dexie / Supabase)
| Field | Type | Notes |
|-------|------|-------|
| `id` | number (auto) | Local PK |
| `userId` | string? | Supabase user UUID |
| `researchItemId` | number | FK → researchItems.id |
| `provider` | string | `'groq' \| 'gemini'` |
| `model` | string | Model name used |
| `prompt` | string | Workflow identifier (e.g. `'Analysis Advisor'`) |
| `output` | string | JSON-serialized result |
| `status` | string | `'pending' \| 'completed' \| 'failed'` |
| `steps` | AiRunStep[] | `[{ name, status, output? }]` |
| `createdAt` | Date | |

### `outbox` (Dexie only)
| Field | Type | Notes |
|-------|------|-------|
| `id` | number (auto) | |
| `entityType` | string | `'research_item' \| 'ai_run'` |
| `entityId` | number | FK to the entity |
| `operation` | string | `'create' \| 'update' \| 'delete'` |
| `payload` | object | Full entity snapshot |
| `status` | string | `'pending' \| 'synced' \| 'failed'` |
| `retryCount` | number | |
| `createdAt` | Date | |

---

## Adding a New AI Feature

1. **Create workflow** in `src/lib/ai/workflows/my-feature.ts`
   - Follow the pattern: create aiRun → loop steps → store output → add outbox entry → return `{ runId, result }`
2. **Add prompt builder** in `src/lib/ai/prompts.ts`
3. **Create UI component** in `src/features/my-feature/MyFeature.tsx`
   - Props must include `onRunStart: (runId: number, title: string) => void`
   - Call `onRunStart(runId, title)` immediately after workflow returns so `AIWorkflowPanel` tracks the run
4. **Add nav entry** — add a new `ActiveView` value to `Sidebar.tsx` and wire it in `App.tsx → MainContent`

---

## Git Workflow

- **Branch:** All work goes directly on `main` at the repo root
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Never use worktrees** — always work on `main` at `D:\Projects\UPM\Hackathon\DevKada\The_Assemblers_Dev_Kada`

---

## Known Limitations

| Limitation | Impact | Status |
|-----------|--------|--------|
| Last-write-wins sync | Concurrent edits from two devices may overwrite each other | Acceptable for MVP |
| Gemini requires billing | Fallback provider unavailable without Google Cloud billing activated | Low impact (Groq is stable) |
| No real-time sync | Sync is event-driven (online/login), not WebSocket-based | Acceptable for MVP |
| Soft deletes not propagated | Deleting an item locally does not delete from Supabase | Low risk for demo |
| Academic scraper needs server | Puppeteer scraping requires proxy running on port 3001 | Expected by design |
