# Project Progress Tracker

**Project:** Research Tool with AI & Agentic Workflows  
**Status:** Phases 1–12 Complete  
**Last Updated:** May 6, 2026

## Phase Completion Status

### ✅ Phase 1: Foundation & Setup (100% Complete)
- Vite project scaffold with React 19 + TypeScript
- Tailwind CSS v4.2.4 configured
- Git repository initialized, .gitignore set up
- Express.js proxy server (port 3001)

### ✅ Phase 2: Offline-First Database & UI (100% Complete)
- Dexie IndexedDB schema: `researchItems`, `aiRuns`, `outbox`
- Research form with validation (title + source text input)
- Research list view with card display
- Data persistence to local database

### ✅ Phase 3: AI Integration & Agentic Workflows (100% Complete)
- Express proxy with `/api/groq` and `/api/gemini` routes
- Groq AI adapter (primary provider, llama-3.3-70b-versatile)
- Gemini AI adapter (fallback provider)
- Dual insight generation: Summary & Deep Insight (agentic)
- Agentic workflow infrastructure with `steps[]` tracking per `aiRun`

### ✅ Phase 4: High-Fidelity Academic Scraping (100% Complete)
- Puppeteer-based deep scraping in proxy server
- Academic-specific selectors (Nature, Springer, ScienceDirect, PubMed)
- Smart content extraction with fallback mechanisms

### ✅ Phase 5: Supabase Sync & Auth (100% Complete)
- Supabase Auth integration (Login/Signup UI)
- Dexie schema updated with `userId` and versioning
- Outbox processor pushes local changes to Supabase
- Cloud Recovery: Pulls remote data into local Dexie on login

### ✅ Phase 6–8: UI Polish & Layout Overhaul (100% Complete)
- 3-column app layout: Sidebar + Main + AIWorkflowPanel
- `Sidebar` component with navigation, user info, online/offline indicator, sync controls
- `AIWorkflowPanel` — live step tracking from `aiRun.steps[]`, progress bar, cancel/view-report
- `StatusBar` with item count, online indicator, outbox count
- Top bar with search input, "New Research" button, reset button
- Dashboard with stat cards (Research Items, AI Runs, Citations)

### ✅ Phase 9: Analysis Advisor (100% Complete)
- `AnalysisAdvisor` feature panel (sidebar nav: "Advisor")
- 3-step agentic workflow: Classify+Extract → Match Methods → Generate Guide
- 15-method local methodology matrix (`methodology-matrix.json`) — scored offline
- Paradigm detection (quantitative / qualitative / mixed) with confidence %
- Top-3 method recommendations ranked by keyword overlap + keyword scoring
- Step-by-step guide generation for highest-ranked method
- Cached results loaded from `aiRuns` where `prompt === 'Analysis Advisor'`

### ✅ Phase 10: Reference & Citation Engine (100% Complete)
- `CitationEngine` feature panel (sidebar nav: "Citations")
- 3-step agentic workflow: Extract Terms → Search APIs → Rank & Deduplicate
- Live search against Semantic Scholar + CrossRef (browser-direct, no proxy needed)
- Ranking: keyword overlap × 20 + recency × 2 + citation count / 10 (capped at 20)
- APA 7, MLA 9, Chicago 17 formatting (pure client-side, instant toggle)
- Copy-one and copy-all buttons with 1800 ms toast feedback
- Expandable cards: abstract, source badge, citation count, DOI, external link

### ✅ Phase 11: Research Improvement Analyzer (100% Complete)
- `ImprovementAnalyzer` feature panel (sidebar nav: "Improve")
- 3-step agentic workflow: Classify+Segment → Coherence+Argument Audit → Gap+Rewrite
- Overall coherence score (0–10) with color-coded bar
- Argument issue list (amber) and gap detection list (rose)
- Paragraph-level breakdown with per-paragraph coherence score, issues, suggestion
- Before/after rewrite for weakest paragraph
- Offline fallback: regex paragraph splitting, default scores
- Cached results loaded from `aiRuns` where `prompt === 'Improvement Analyzer'`

### ✅ Phase 12: Topic Builder (100% Complete)
- `TopicBuilder` feature panel (sidebar nav: "Topics")
- Two-phase interactive workflow:
  1. **Topic Generation** — AI generates 5 scored topics (novelty + feasibility, 0–10 each)
  2. **Outline Building** — AI builds 7-chapter outline for user-selected topic
- Each phase is a separate `aiRun` entry in Dexie
- Prefill seed from any existing research item via dropdown
- Expandable topic cards: research questions, hypothesis, novelty/feasibility rationale
- Chapter outline with purpose, key points, suggested word count
- Stored in outbox for Supabase sync

---

## Current Working State

**Functional Features:**
- ✅ Create research items offline
- ✅ Deep-scrape academic URLs (Puppeteer)
- ✅ View research list with local data
- ✅ Generate Quick Summary with Groq
- ✅ Generate Deep Insight with agentic workflow
- ✅ Sync to/from Supabase (outbox pattern)
- ✅ User authentication (Supabase Auth)
- ✅ Analysis Advisor (methodology recommender)
- ✅ Reference & Citation Engine (Semantic Scholar + CrossRef)
- ✅ Research Improvement Analyzer (coherence, gaps, rewrite)
- ✅ Topic Builder (scored topics + chapter outline)
- ✅ Live AI step tracking in AIWorkflowPanel
- ✅ Offline fallbacks on every AI workflow

**Known Limitations:**
- ⚠️ Gemini API fallback requires prepay billing to be active
- ⚠️ Academic scraper (Puppeteer) requires running proxy server on port 3001
- ⚠️ Soft deletes not propagated remotely (last-write-wins sync)

---

## AI Provider Status

| Provider | Status | Model | Free Tier | Cost |
|----------|--------|-------|-----------|------|
| **Groq** | ✅ Primary | llama-3.3-70b-versatile | Yes | Free |
| **Gemini** | ⚠️ Fallback | gemini-2.0-flash-lite | Requires billing | Prepay |

---

## File Structure

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── index.ts                      (AI runner — generateWithGroq/Gemini)
│   │   │   ├── groq.ts                       (Groq adapter)
│   │   │   ├── gemini.ts                     (Gemini adapter)
│   │   │   ├── agent.ts                      (Deep Insight agentic workflow)
│   │   │   ├── prompts.ts                    (All prompt builders)
│   │   │   └── workflows/
│   │   │       ├── analysis-advisor.ts       (Phase 9)
│   │   │       ├── citation-engine.ts        (Phase 10)
│   │   │       ├── improvement-analyzer.ts   (Phase 11)
│   │   │       └── topic-builder.ts          (Phase 12)
│   │   ├── data/
│   │   │   └── methodology-matrix.json       (15 research methods, offline scoring)
│   │   ├── db/
│   │   │   ├── database.ts                   (Dexie schema & types)
│   │   │   └── research-repository.ts        (DB helpers)
│   │   ├── sync/
│   │   │   ├── supabase.ts                   (Supabase client)
│   │   │   └── outbox-processor.ts           (Push/pull Supabase)
│   │   └── utils.ts
│   ├── features/
│   │   ├── auth/
│   │   │   └── Auth.tsx                      (Login/Signup UI)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx                   (Nav, user info, sync controls)
│   │   │   ├── AIWorkflowPanel.tsx           (Live step tracker)
│   │   │   └── StatusBar.tsx                 (Item count, online, outbox)
│   │   ├── research/
│   │   │   ├── ResearchForm.tsx
│   │   │   └── ResearchList.tsx
│   │   ├── advisor/
│   │   │   └── AnalysisAdvisor.tsx           (Phase 9)
│   │   ├── citations/
│   │   │   └── CitationEngine.tsx            (Phase 10)
│   │   ├── improve/
│   │   │   └── ImprovementAnalyzer.tsx       (Phase 11)
│   │   └── topics/
│   │       └── TopicBuilder.tsx              (Phase 12)
│   ├── shared/
│   │   └── components/ui/                    (shadcn/ui components)
│   ├── App.tsx
│   └── main.tsx
├── server/
│   └── index.mjs                             (Express proxy — Groq, Gemini, Puppeteer)
├── .env.local                                (API keys — not tracked)
└── .env.example
```

---

## Environment Variables Required

```
VITE_AI_PROVIDER=groq
VITE_GROQ_MODEL=llama-3.3-70b-versatile
VITE_GEMINI_MODEL=gemini-2.0-flash-lite
GROQ_API_KEY=<your_groq_key>
GEMINI_API_KEY=<your_gemini_key>
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```
