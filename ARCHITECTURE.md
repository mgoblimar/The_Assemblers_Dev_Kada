# System Architecture

**Project:** Research Tool with AI & Agentic Workflows  
**Architecture Version:** 1.0  
**Date:** May 5, 2026

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend (Vite)                  │
│                    (Offline-first capable)                   │
├─────────────────────────────────────────────────────────────┤
│  ResearchForm → ResearchList → ResearchAI → Details Modal   │
│     (Input)        (View)      (Generation)   (Insights)     │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────▼─────────┐
       │ Dexie IndexedDB │
       │  (Offline DB)   │
       │ - researchItems │
       │ - aiRuns        │
       │ - outbox        │
       └─────────────────┘
               │
       ┌───────▼──────────────────────────┐
       │  Express.js Proxy (Port 3001)    │
       │  (Credential & CORS Management)  │
       ├───────────────────────────────────┤
       │ /api/groq    (Primary)            │
       │ /api/gemini  (Fallback)           │
       └───────┬────────────────┬──────────┘
               │                │
         ┌─────▼────┐    ┌─────▼────┐
         │  Groq    │    │  Gemini  │
         │  API     │    │   API    │
         │ (Free)   │    │(Prepay)  │
         └──────────┘    └──────────┘
```

## Component Architecture

### 1. Frontend Layer (React + Tailwind)

#### ResearchForm (`src/features/research/ResearchForm.tsx`)
- **Purpose:** Input research source text
- **State:** Local form state (uncontrolled)
- **Output:** Persists to Dexie via ResearchRepository
- **Validation:** Text length, non-empty check

#### ResearchList (`src/features/research/ResearchList.tsx`)
- **Purpose:** Display all research items in table, trigger insights, show details modal
- **State:** `items` (from DB), `selectedItem` (for modal), `isModalOpen`
- **Functions:** `openDetails()`, `closeDetails()`, refresh on new items
- **Modal Content:** Source text + latest Summary + latest Deep Insight outputs

#### ResearchAI (`src/features/research/ResearchAI.tsx`)
- **Purpose:** Dual AI generation buttons (Quick Summary, Deep Insight)
- **Functions:**
  - Quick Summary: Single-step Groq call, stores as `aiRun` with `type='summary'`
  - Deep Insight: Multi-step agentic workflow, stores as `aiRun` with `type='deep_insight'`
- **Output:** Markdown-formatted results shown in collapsible cards

### 2. AI Orchestration Layer (`src/lib/ai/`)

#### AI Runner (`index.ts`)
```
runAIForResearchItem(researchItemId, type: 'summary' | 'deep_insight')
├─ Fetch research item from DB
├─ Call selected provider (Groq primary, Gemini fallback)
├─ Store result as aiRun in Dexie
└─ Return structured result
```
- **Provider Selection:** Env var `VITE_AI_PROVIDER` (default: 'groq')
- **Fallback Logic:** On error, tries mock (no secondary provider fallback yet)

#### Groq Adapter (`groq.ts`)
- **Endpoint:** `http://localhost:3001/api/groq`
- **Model:** `llama-3.3-70b-versatile` (configurable)
- **Request Format:** OpenAI-compatible
  ```json
  {
    "model": "llama-3.3-70b-versatile",
    "messages": [{ "role": "user", "content": "..." }],
    "temperature": 0.7,
    "max_tokens": 2000
  }
  ```
- **Response Parse:** Extract text from `choices[0].message.content`
- **JSON Parsing:** Attempts to parse response as JSON, falls back to markdown

#### Gemini Adapter (`gemini.ts`)
- **Endpoint:** `http://localhost:3001/api/gemini`
- **Model:** `gemini-2.5-flash` (configurable)
- **Request Format:** Gemini-native
  ```json
  {
    "contents": [
      { "role": "user", "parts": [{ "text": "..." }] }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 2000
    }
  }
  ```
- **Response Parse:** Extract text from `candidates[0].content.parts[0].text`
- **Status:** Currently blocked (user account billing exhausted; 429 RESOURCE_EXHAUSTED)

#### Agentic Workflow (`agent.ts`)
- **Purpose:** Multi-step deep insight generation
- **Steps:**
  1. Analyze research item for key themes
  2. Generate research questions
  3. Synthesize actionable insights
  4. Format final output
- **Status:** Implemented but hidden from UI (outputs only shown in modal, no agent prompts/steps)
- **Provider:** Uses same Groq/Gemini adapters

### 3. Database Layer (Dexie + IndexedDB)

#### Schema

```typescript
researchItems
├─ id: string (PK)
├─ sourceText: string
├─ createdAt: date
├─ updatedAt: date
└─ syncStatus: 'local' | 'synced' | 'pending'

aiRuns
├─ id: string (PK)
├─ researchItemId: string (FK)
├─ type: 'summary' | 'deep_insight'
├─ provider: 'groq' | 'gemini' | 'agent'
├─ model: string
├─ prompt: string
├─ output: string
├─ status: 'pending' | 'completed' | 'failed'
├─ error?: string
├─ createdAt: date
└─ tokensUsed?: number

outbox
├─ id: string (PK)
├─ entity: 'researchItem' | 'aiRun'
├─ action: 'create' | 'update' | 'delete'
├─ payload: object
└─ timestamp: date
```

#### Repository (`src/lib/db/research-repository.ts`)
- **Methods:**
  - `createResearchItem(sourceText)` → ResearchItem
  - `getResearchItems()` → ResearchItem[]
  - `getResearchItemById(id)` → ResearchItem | null
  - `createAIRun(researchItemId, run)` → AIRun
  - `getLatestAIRunForResearchItem(id)` → AIRun | null
  - `getLatestSummaryRun(researchItemId)` → AIRun | null
  - `getLatestDeepInsightRun(researchItemId)` → AIRun | null
  - `getAllAIRuns(researchItemId)` → AIRun[]

### 4. Server Layer (Express Proxy)

#### Express Server (`server/index.mjs`)
- **Port:** 3001
- **Purpose:** Secure server-side API calls (hide credentials from browser)
- **Routes:**

**POST `/api/groq`**
```
Body: { model, messages, temperature, max_tokens }
Response: { choices: [{ message: { content } }] }
```
- Reads `GROQ_API_KEY` from env
- Forwards to Groq API
- Logs: model name only, never logs keys

**POST `/api/gemini`**
```
Body: { contents, generationConfig }
Response: { candidates: [{ content: { parts } }] }
```
- Reads `GEMINI_API_KEY` from env
- Forwards to Gemini API
- Logs: model name only, never logs keys

## Data Flow

### Creating a Research Item
```
ResearchForm
  └─ User enters source text
  └─ Form.onSubmit() calls createResearchItem()
  └─ Data stored in Dexie researchItems table
  └─ List re-renders, item appears in ResearchList
```

### Generating Quick Summary
```
ResearchList → ResearchAI (Quick Summary button)
  └─ Calls runAIForResearchItem(id, 'summary')
  └─ AI Runner fetches research item from DB
  └─ Calls Groq adapter (via localhost:3001/api/groq)
  └─ Groq API returns text
  └─ Creates aiRun entry with type='summary'
  └─ Returns to ResearchAI component
  └─ Result displayed in collapsible card
```

### Generating Deep Insight
```
ResearchList → ResearchAI (Deep Insight button)
  └─ Calls runAgenticWorkflow(id)
  └─ AI Runner fetches research item
  └─ Calls agent.ts multi-step orchestrator
  └─ Each step calls Groq (or Gemini on fallback)
  └─ Final synthesized insight stored as aiRun
  └─ Result displayed in ResearchAI card
```

### Viewing Full Insights
```
ResearchList (View Details button)
  └─ openDetails(item)
  └─ Modal shows:
     - Source text
     - Latest Summary (via getLatestSummaryRun)
     - Latest Deep Insight (via getLatestDeepInsightRun)
```

## Security Model

### API Key Protection
- **Frontend:** Never contains API keys
- **Server:** Express proxy holds keys, reads from `.env.local`
- **Logging:** Logs model name only, never logs request body or keys
- **Transport:** All calls to Groq/Gemini use HTTPS

### .env.local (Not Tracked)
```
VITE_AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...
```

### .gitignore
```
.env
.env.local
.env.*.local
node_modules/
dist/
```

## Offline-First Design

1. **All user data stored in IndexedDB locally**
2. **Dexie persists across browser refreshes**
3. **AI results cached locally (no re-fetch needed)**
4. **Outbox table queues changes for later sync** (Phase 4)
5. **Mock fallback if API unavailable** (current: sync only, not async)

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2.5 | UI framework |
| **Language** | TypeScript | Latest | Type safety |
| **Build** | Vite | 8.0.10 | Fast bundler |
| **Styling** | Tailwind CSS | 4.2.4 | Utility CSS |
| **Database** | Dexie | Latest | IndexedDB wrapper |
| **State** | React hooks | Built-in | Component state |
| **Server** | Express.js | Latest | API proxy |
| **AI Providers** | Groq, Gemini | Latest | AI inference |
| **Auth** | Supabase Auth | (Phase 4) | User management |
| **Sync DB** | Supabase | (Phase 4) | Cloud storage |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_AI_PROVIDER` | `groq` | Primary AI provider |
| `GROQ_API_KEY` | - | Groq authentication |
| `GEMINI_API_KEY` | - | Gemini authentication |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Override Groq model |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Override Gemini model |

## Deployment Considerations

### Frontend Build
```
npm run build → dist/ folder
```

### Server Deployment
```
Node.js + Express required
PORT 3001 must be available (or configurable)
```

### Environment Requirements
- Groq API key (free tier)
- Gemini API key (optional, if using as fallback)
- Node.js 18+

## Future Phases (Architecture Roadmap)

- **Phase 6:** Analysis Advisor (AI Methodologist)
- **Phase 7:** Reference & Citation Engine
- **Phase 8-13:** Research Improvement Analyzer, Topic Generator, and Local LLM Integration
- **Phase 14:** Final Polish, Testing & Production Launch
