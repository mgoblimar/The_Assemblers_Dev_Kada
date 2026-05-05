# Features & Requirements

**Project:** Research Tool with AI & Agentic Workflows  
**Feature Version:** 1.0  
**Date:** May 5, 2026

## Overview

A research tool that is **AI and agentic powered**, works **offline-first** (via local cache and free AI APIs), and helps researchers analyze, improve, and synthesize research findings.

## Core Features

### ✅ Feature 1: Research Input & Management
**Status:** Implemented (Phase 2)  
**Description:** Create and store research items locally

- User enters research source text (any text: article excerpt, notes, paper abstract, etc.)
- Text is immediately persisted to local IndexedDB (Dexie)
- Research items displayed in a table with:
  - Source text preview
  - Creation timestamp
  - Action buttons (View Details, Generate Summary, Generate Insight, Delete)
- Works completely offline
- No internet required to save research items

**Technical:**
- Uses `ResearchForm.tsx` component
- Stores to `researchItems` table in Dexie
- Validation: non-empty text, max 5000 characters

---

### ✅ Feature 2: Quick Summary Generation (AI)
**Status:** Implemented (Phase 3)  
**Description:** Single-step AI summary of research text

- Click "Generate Summary" button on any research item
- Groq API (llama-3.3-70b-versatile) receives full source text
- Returns a concise 150-300 word summary
- Result persists to `aiRuns` table with `type='summary'`
- Summary displayed in collapsible card under source text
- Fallback: Mock summary if API unavailable

**Technical:**
- Provider: Groq (free tier, no billing required)
- Model: llama-3.3-70b-versatile (configurable)
- Temperature: 0.7 (balanced creativity)
- Max tokens: 2000
- Endpoint: `http://localhost:3001/api/groq`

**User Flow:**
```
1. User clicks "Generate Summary"
2. Shows loading indicator
3. API call to Groq (via Express proxy)
4. Result displayed in 3-5 seconds
5. Persisted locally for offline access
```

---

### ✅ Feature 3: Deep Insight Generation (Agentic)
**Status:** Implemented (Phase 3, outputs hidden)  
**Description:** Multi-step agentic workflow for comprehensive analysis

- Click "Generate Deep Insight" button on any research item
- Agentic workflow executes 4 steps:
  1. **Analyze Themes:** Extract key topics/themes from source
  2. **Generate Questions:** Create 3-5 research questions
  3. **Find Connections:** Link to related concepts
  4. **Synthesize Insights:** Provide actionable recommendations
- Each step calls Groq API
- Final output is **1000-2000 word structured analysis**
- Result persists to `aiRuns` table with `type='deep_insight'`
- **Currently:** Only final output shown (no prompts, no intermediate steps per user request)

**Technical:**
- Provider: Groq with agentic orchestration
- Uses `agent.ts` for multi-step workflow
- Each step is separate API call (allows caching/optimization later)
- Total execution time: 10-30 seconds

**User Flow:**
```
1. User clicks "Generate Deep Insight"
2. Shows loading + step indicator
3. Each step calls Groq API sequentially
4. Final synthesized insight displayed
5. Persisted to DB (all intermediate steps also stored)
```

---

### ✅ Feature 4: Details Modal (Full Insight View)
**Status:** Implemented (Phase 3)  
**Description:** Full-screen modal viewing of research item with all insights

- Click "View Details" on any research item
- Modal shows:
  - **Top Section:** Original source text (read-only)
  - **Bottom Section:** Two insight cards side-by-side
    - Left: **Latest Summary** (Quick Summary output)
    - Right: **Latest Deep Insight** (Agentic workflow output)
- Each insight shows markdown-formatted text
- Insights are read-only (outputs only, no prompts visible)
- Close button or click outside to dismiss modal

**Technical:**
- Component: `ResearchList.tsx` (modal state)
- Uses `getLatestSummaryRun()` and `getLatestDeepInsightRun()` helpers
- Markdown rendering with syntax highlighting
- Full-screen overlay with 95% viewport width/height

**User Flow:**
```
1. User clicks "View Details"
2. Modal opens with fade-in animation
3. Source text and latest insights displayed
4. User can scroll to read full insight text
5. Click close or press ESC to dismiss
```

---

### 🟡 Feature 5: Research Improvement Analyzer
**Status:** Partially Implemented (Phase 3)  
**Description:** Suggest improvements to research methodology, bias detection, gap analysis

- (Infrastructure exists in agentic workflow)
- Currently hidden from UI (Phase 3 outputs-only view)
- Will be enhanced in Phase 5 as separate feature button:
  - "Analyze Research Quality"
  - "Detect Potential Bias"
  - "Identify Knowledge Gaps"

**Future Technical:**
- Separate agentic workflow distinct from "Deep Insight"
- Focus on critical analysis, not just summarization
- Could include rubric-based scoring

---

### 🟡 Feature 6: Reference Finder
**Status:** Not Implemented (Phase 4+)  
**Description:** Extract and suggest related papers, articles, or topics

- Parse source text for references
- Generate search queries for related work
- Suggest links to follow
- Cache suggestions locally

**Technical:**
- Requires integration with external reference APIs (future)
- Or use agentic workflow to suggest search terms
- Storage in `aiRuns` with `type='references'`

---

### 🟡 Feature 7: Topic Maker/Analyzer
**Status:** Not Implemented (Phase 4+)  
**Description:** Automatically extract and organize topics from research

- Extract named entities, concepts, themes
- Build topic graph
- Suggest related research directions
- Organize by topic clusters

**Technical:**
- Could use Groq with structured output
- Store topics in new `topics` table
- Visualize as graph or hierarchy

---

### ⏳ Feature 8: User Authentication
**Status:** Not Implemented (Phase 4)  
**Description:** Sign up, log in, manage research across devices

- Supabase Auth integration (50k MAU free tier)
- Email + password login
- Persist user context in React (via Supabase client)
- Future: Google/GitHub OAuth

**Technical:**
- Supabase Auth client in React
- JWT tokens stored in localStorage
- Add user_id to researchItems, aiRuns

---

### ⏳ Feature 9: Cloud Sync (Supabase)
**Status:** Not Implemented (Phase 4)  
**Description:** Sync research items and insights to cloud database

- Outbox pattern for offline edits
- Automatic sync when online
- Conflict resolution (last-write-wins)
- Data recovery from cloud

**Technical:**
- Supabase PostgreSQL tables mirror Dexie schema
- Outbox table tracks pending changes
- Sync triggered on user login + interval polling
- Use `supabase-js` client

---

## Feature Matrix

| Feature | MVP | Phase | Status | Provider | Priority |
|---------|-----|-------|--------|----------|----------|
| Research Input | ✅ | 2 | Done | IndexedDB | Critical |
| Quick Summary | ✅ | 3 | Done | Groq | Critical |
| Deep Insight | ✅ | 3 | Done | Groq | Critical |
| Details Modal | ✅ | 3 | Done | React | Critical |
| Academic Scraper| ✅ | 4 | Done | Puppeteer | High |
| User Auth | - | 5 | Not Started | Supabase | High |
| Cloud Sync | - | 5 | Not Started | Supabase | High |
| Advisor Agent | - | 7 | Not Started | Groq | Medium |

## Feature Dependencies

```
Phase 2: Research Input
  ↓
Phase 3: AI Features (Summary, Deep Insight, Modal)
  ↓
Phase 4: Authentication + Cloud Sync
  ↓
Phase 5: Advanced Features (Reference Finder, Topic Analyzer)
```

## User Workflows

### Workflow 1: Quick Research Summary
```
1. Paste research text into form
2. Click "Create Research Item"
3. Item appears in list
4. Click "Generate Summary"
5. Read summary in expandable card
6. Click "View Details" to see full summary in modal
```
**Time:** 2-3 minutes  
**Requires:** Internet (for Groq API)  
**Can be done offline:** Only if summary already generated

---

### Workflow 2: Deep Analysis
```
1. Have research item in list
2. Click "Generate Deep Insight"
3. Wait for agentic workflow (10-30 sec)
4. View structured analysis in card
5. Click "View Details" for full modal view
6. Save insights locally (automatic via Dexie)
```
**Time:** 5-10 minutes  
**Requires:** Internet  
**Can reference:** Multiple research items simultaneously

---

### Workflow 3: Offline Usage (Phase 2+)
```
1. Create research items while online
2. Generate summaries + insights while online
3. Go offline
4. Can still view all research items + insights
5. Cannot generate new summaries until online again
```

---

### Workflow 4: Sync Across Devices (Phase 4+)
```
1. Create account with Supabase Auth
2. Add research items on device A
3. Open app on device B, log in
4. See all research from device A (synced)
5. Add new item on device B
6. Device A auto-syncs when online
```

---

## Acceptance Criteria

### For Phase 3 (Current)
- [x] Create and persist research items locally
- [x] Generate summaries with Groq API
- [x] Generate deep insights with agentic workflow
- [x] View summaries and insights in full-screen modal
- [x] All data works offline after initial generation
- [x] UI is responsive and polished

### For Phase 4
- [ ] User can sign up and log in
- [ ] Research items sync to Supabase
- [ ] Changes offline are queued and synced online
- [ ] Multiple devices see same research

### For Phase 5+
- [ ] Advanced features (reference finder, topic analyzer) shipped
- [ ] Performance optimized (< 2s load, < 5s deep insight)
- [ ] E2E tests covering all workflows

## Known Limitations

1. **No real-time sync yet** (Phase 4)
2. **Gemini API blocked** (user account billing exhausted)
3. **Agent steps not visible to user** (by design, Phase 3 outputs-only)
4. **No user account** (Phase 4)
5. **No conflict resolution for offline edits** (Phase 4)
6. **No rate limiting** (low priority for hackathon)

## Future Enhancements

- [ ] Support for file uploads (PDF, DOCX parsing)
- [ ] Export insights to markdown/PDF
- [ ] Share research collections
- [ ] Collaborative editing (multi-user)
- [ ] Custom AI models (bring your own API key)
- [ ] Local model support (Ollama, LLaMA.cpp)
- [ ] Research citation generation
- [ ] Audit trail / version history
