# Features & Requirements

**Project:** Research Tool with AI & Agentic Workflows  
**Feature Version:** 2.0  
**Date:** May 6, 2026

## Overview

A research tool that is **AI and agentic powered**, works **offline-first** (via local IndexedDB and free AI APIs), and helps researchers analyze, improve, synthesize, and cite research findings. Phases 1–12 are complete.

---

## Core Features

### ✅ Feature 1: Research Input & Management
**Status:** Implemented (Phase 2)  
**Description:** Create and store research items locally

- User enters a title and source text (article excerpt, notes, abstract, etc.)
- Text immediately persisted to local IndexedDB (Dexie)
- Research items displayed in a card list with action buttons
- Works completely offline; no internet required to save items

**Technical:**
- `ResearchForm.tsx` — form component
- `ResearchList.tsx` — card list + per-item actions
- Stores to `researchItems` table in Dexie

---

### ✅ Feature 2: Quick Summary Generation (AI)
**Status:** Implemented (Phase 3)  
**Description:** Single-step AI summary of research text

- Click "Analyze" on any research item to trigger the agentic workflow
- Groq (llama-3.3-70b-versatile) generates a structured summary
- Result persists to `aiRuns` table

**Technical:**
- Provider: Groq via Express proxy at `localhost:3001/api/groq`
- Stored as `aiRun` with `prompt='Summarize'`

---

### ✅ Feature 3: Deep Insight Agentic Workflow
**Status:** Implemented (Phase 3)  
**Description:** Multi-step agentic workflow for comprehensive analysis

- 4-step pipeline: Analyze Themes → Generate Questions → Find Connections → Synthesize
- Each step is a separate Groq call; all steps tracked in `aiRun.steps[]`
- Live step tracking visible in the AIWorkflowPanel (right column)
- Final output stored as `aiRun`

---

### ✅ Feature 4: Supabase Auth & Cloud Sync
**Status:** Implemented (Phase 5)  
**Description:** User authentication and cross-device sync

- Email/password login and signup via Supabase Auth
- Outbox pattern: all local writes queued, flushed to Supabase when online
- `fetchRemoteData` on login pulls cloud items into local Dexie
- Row-Level Security ensures each user only accesses their own data

**Technical:**
- `supabase.ts` — Supabase JS client
- `outbox-processor.ts` — `processOutbox()` and `fetchRemoteData()`
- Supabase tables: `research_items`, `ai_runs` (RLS enabled)

---

### ✅ Feature 5: Academic URL Scraping
**Status:** Implemented (Phase 4)  
**Description:** Deep scrape academic paper URLs to populate source text

- User pastes a URL; proxy server scrapes full article text
- Puppeteer with academic-specific selectors (Nature, Springer, ScienceDirect, PubMed)
- Falls back to generic content extraction on unknown domains

**Technical:**
- Implemented in `server/index.mjs` via Puppeteer
- Endpoint: `POST /api/scrape`

---

### ✅ Feature 6: 3-Column App Layout
**Status:** Implemented (Phase 6–8)  
**Description:** Full-app layout with sidebar navigation, main content, and AI workflow panel

- **Sidebar** — nav links (Dashboard, Advisor, Citations, Improve, Topics), user email, online/offline badge, sync controls, logout
- **Main content** — scrollable area for current view
- **AIWorkflowPanel** — live step tracker for any active `aiRun`; shows step names, status icons, progress bar; cancel and view-report actions
- **StatusBar** — item count, online indicator, outbox queue count
- **Top bar** — search input, "New Research" button, reset demo button

**Technical:**
- `Sidebar.tsx`, `AIWorkflowPanel.tsx`, `StatusBar.tsx` in `features/layout/`
- `AIWorkflowPanel` reads `run.steps[]` from Dexie live — no hardcoded step labels

---

### ✅ Feature 7: Analysis Advisor (Phase 9)
**Status:** Implemented  
**Description:** AI-powered research methodology recommender

**User Flow:**
```
1. Navigate to "Advisor" in sidebar
2. Select a research item from dropdown
3. Click "Analyze Methodology"
4. AI classifies paradigm + extracts keywords
5. Local scoring matches against 15-method matrix
6. AI generates step-by-step guide for top method
7. Results displayed: paradigm badge, top-3 methods ranked, guide panel
```

**Output sections:**
- Paradigm badge (Quantitative / Qualitative / Mixed Methods) + confidence %
- Method cards #1/#2/#3 with complexity badge, suitability score, key features
- Collapsible step-by-step guide for the top-ranked method
- Cached — reloads last result when re-selecting same item

**Technical:**
- Workflow: `lib/ai/workflows/analysis-advisor.ts`
- Prompts: `buildAdvisorPrompt('classify_extract' | 'guide', ...)`
- Local data: `lib/data/methodology-matrix.json` (15 methods, scored offline)
- `aiRun.prompt = 'Analysis Advisor'`

---

### ✅ Feature 8: Reference & Citation Engine (Phase 10)
**Status:** Implemented  
**Description:** Search academic APIs and generate formatted citations

**User Flow:**
```
1. Navigate to "Citations" in sidebar
2. Select a research item
3. Click "Find References"
4. AI extracts key terms from source text
5. Semantic Scholar + CrossRef queried in parallel (browser-direct)
6. Results deduped and ranked by relevance
7. Toggle APA / MLA / Chicago style — formats instantly
8. Copy individual citations or copy-all
```

**Output sections:**
- Reference cards: title, authors, year, venue/journal, source badge, citation count, DOI, abstract
- Style toggle (APA 7 / MLA 9 / Chicago 17) reformats all without re-fetching
- Copy button per card + "Copy All [N] Citations" button with 1800 ms toast
- External link to paper

**Technical:**
- Workflow: `lib/ai/workflows/citation-engine.ts`
- APIs: Semantic Scholar `api.semanticscholar.org` + CrossRef `api.crossref.org` (CORS-enabled, no proxy)
- Ranking: `dedupeAndRank(refs, terms)` — keyword overlap × 20 + recency × 2 + citation count / 10
- Formatting: pure client-side `formatCitation(ref, style)` function
- `aiRun.prompt = 'Citation Engine'`

---

### ✅ Feature 9: Research Improvement Analyzer (Phase 11)
**Status:** Implemented  
**Description:** Coherence scoring, argument auditing, gap detection, and rewrite suggestions

**User Flow:**
```
1. Navigate to "Improve" in sidebar
2. Select a research item
3. Click "Analyze Writing"
4. AI classifies section type and segments into paragraphs
5. AI audits coherence, argument strength, gaps
6. AI rewrites the weakest paragraph
7. Results displayed: score overview, issues, paragraph breakdown, before/after rewrite
```

**Output sections:**
- Overall score (0–10) with color-coded bar (green ≥7, amber ≥4, rose <4)
- Section type badge (Introduction, Methodology, Results, etc.)
- Argument issues list (amber)
- Gaps detected list (rose)
- Paragraph breakdown — collapsible cards with per-paragraph score, issues, suggestion
- Before/after rewrite for the weakest paragraph
- Offline fallback: regex paragraph splitting + default scores

**Technical:**
- Workflow: `lib/ai/workflows/improvement-analyzer.ts`
- Prompts: `buildImprovementPrompt('segment' | 'audit' | 'rewrite', ...)`
- `aiRun.prompt = 'Improvement Analyzer'`

---

### ✅ Feature 10: Topic Builder (Phase 12)
**Status:** Implemented  
**Description:** AI-generated research topics with scores, then a full chapter outline

**User Flow:**
```
1. Navigate to "Topics" in sidebar
2. Select a research item (auto-fills seed) or type a custom seed
3. Click "Generate Topics"
4. AI returns 5 topics, each scored on Novelty (0–10) + Feasibility (0–10)
5. Expand any topic: research questions, hypothesis, score rationale
6. Click "Select Topic" to choose one
7. Click "Build Research Outline"
8. AI returns 7-chapter outline (Abstract → Conclusion)
9. Expand each chapter: purpose, key points, suggested word count
```

**Output sections — Topics:**
- 5 topic cards with overall score badge (average of novelty + feasibility)
- Novelty bar (blue) and Feasibility bar (violet)
- Expandable detail: research questions, hypothesis, novelty reason, feasibility reason
- Selected topic highlighted with primary ring + check badge

**Output sections — Outline:**
- 7 chapter cards: Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion
- Each card: emoji icon, purpose, suggested word count
- Expandable key points list

**Technical:**
- Workflow: `lib/ai/workflows/topic-builder.ts`
  - `runTopicGenerationWorkflow(seed, researchItemId)` → `{ runId, result }`
  - `runOutlineBuildWorkflow(topic, researchItemId)` → `{ runId, outline }`
- Prompts: `buildTopicPrompt(seed)`, `buildOutlinePrompt(title, questions, hypothesis, subtopics)`
- Two separate `aiRun` records (one per phase)

---

## Feature Matrix

| Feature | Phase | Status | Provider | AI Calls |
|---------|-------|--------|----------|----------|
| Research Input & Management | 2 | ✅ Done | IndexedDB | 0 |
| Quick Summary | 3 | ✅ Done | Groq | 1 |
| Deep Insight (Agentic) | 3 | ✅ Done | Groq | 4 |
| Academic URL Scraper | 4 | ✅ Done | Puppeteer | 0 |
| Supabase Auth & Sync | 5 | ✅ Done | Supabase | 0 |
| 3-Column Layout | 6–8 | ✅ Done | React | 0 |
| Analysis Advisor | 9 | ✅ Done | Groq | 2 |
| Reference & Citation Engine | 10 | ✅ Done | Groq + Public APIs | 1 |
| Research Improvement Analyzer | 11 | ✅ Done | Groq | 3 |
| Topic Builder | 12 | ✅ Done | Groq | 2 |

---

## User Workflows

### Workflow 1: Create and Analyze Research
```
1. Log in (Supabase Auth)
2. Click "New Research" → fill title + source text (or paste URL to scrape)
3. Item appears in dashboard list
4. Click "Analyze" → Deep Insight agentic workflow runs
5. Watch live step progress in AIWorkflowPanel (right column)
6. Read structured insight in the panel
```

### Workflow 2: Get Methodology Advice
```
1. Navigate to "Advisor" in sidebar
2. Select research item from dropdown
3. Click "Analyze Methodology"
4. Read paradigm classification + top 3 method recommendations
5. Expand step-by-step guide for best method
```

### Workflow 3: Find and Format References
```
1. Navigate to "Citations" in sidebar
2. Select research item
3. Click "Find References"
4. Browse ranked academic papers
5. Toggle APA / MLA / Chicago style
6. Click "Copy All" to grab all citations at once
```

### Workflow 4: Improve Writing Quality
```
1. Navigate to "Improve" in sidebar
2. Select research item
3. Click "Analyze Writing"
4. Review coherence score + argument issues + gaps
5. Expand paragraph breakdown to find weakest section
6. Use suggested rewrite as a starting point
```

### Workflow 5: Generate Topics and Outline
```
1. Navigate to "Topics" in sidebar
2. Select a research item or type a seed phrase
3. Click "Generate Topics"
4. Review 5 scored topics; expand for details
5. Select best topic
6. Click "Build Research Outline"
7. Review 7-chapter outline with key points
```

---

## Acceptance Criteria — Phases 9–12

### Phase 9: Analysis Advisor
- [x] Paradigm classified (quantitative / qualitative / mixed) with confidence %
- [x] Top 3 methods recommended from 15-method local matrix
- [x] Step-by-step guide generated for top method
- [x] Cached result reloaded on revisit
- [x] Offline fallback (keyword regex detection, local scoring)

### Phase 10: Citation Engine
- [x] Key terms extracted from research text
- [x] Semantic Scholar + CrossRef searched in parallel
- [x] Results deduped and ranked by relevance
- [x] APA 7 / MLA 9 / Chicago 17 formatting works client-side
- [x] Copy individual + copy all with toast feedback

### Phase 11: Improvement Analyzer
- [x] Section type detected (Introduction, Methodology, etc.)
- [x] Overall coherence score produced
- [x] Argument issues and gaps listed
- [x] Per-paragraph breakdown with issues + suggestion
- [x] Before/after rewrite for weakest paragraph
- [x] Offline fallback (regex paragraph splitting)

### Phase 12: Topic Builder
- [x] 5 topics generated with novelty + feasibility scores
- [x] Research questions and hypothesis per topic
- [x] User can select a topic interactively
- [x] 7-chapter outline generated for selected topic
- [x] Each chapter has purpose, key points, suggested word count
- [x] Both workflows stored as separate `aiRun` entries

---

## Known Limitations

1. Gemini fallback requires active billing on Google Cloud account
2. Academic scraper needs proxy server running (localhost:3001)
3. Last-write-wins sync — no granular conflict resolution
4. Citation Engine searches live APIs — results vary by network latency
5. No PDF/DOCX file upload yet (source text is manual paste or URL scrape)
