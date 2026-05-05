# Technical Decisions & Rationale

**Project:** Research Tool with AI & Agentic Workflows  
**Decision Log Version:** 2.0  
**Date:** May 6, 2026

---

## Decision 1: Choose Groq Over Gemini as Primary Provider

**Decision:** Use Groq (llama-3.3-70b-versatile) as primary AI provider; Gemini as fallback.

**Context:** Phase 3 required quick AI integration. Groq offers a free tier with no billing required and very fast inference. Gemini requires prepay after quota exhaustion.

**Options Considered:**

| Provider | Tier | Cost | Speed | Status |
|----------|------|------|-------|--------|
| Groq | Free | $0 | Very Fast | ✅ Selected |
| Gemini | Free then prepay | Variable | Standard | Fallback |
| OpenAI | Paid | $0.15–0.60/1k tokens | Standard | Too costly |

**Outcome:** Groq set as `VITE_AI_PROVIDER=groq`; both adapters kept in codebase.

---

## Decision 2: Offline-First with IndexedDB (Dexie)

**Decision:** Use IndexedDB via Dexie for local data storage; sync to Supabase via outbox.

**Context:** Core requirement: "works offline." All user data must survive network loss.

**Options Considered:**

| Storage | Offline | Cloud Sync | Complexity |
|---------|---------|-----------|------------|
| IndexedDB + Dexie | ✅ Yes | Via outbox | Low |
| Supabase only | ❌ No | Built-in | Medium |
| LocalStorage | ✅ Yes | Manual | Very Low, 5 MB limit |

**Outcome:** Dexie v4 with `researchItems`, `aiRuns`, `outbox` tables. Outbox pattern syncs to Supabase when online.

---

## Decision 3: Express.js Proxy for AI API Calls

**Decision:** Use Express.js to proxy Groq/Gemini calls, keeping API keys server-side.

**Context:** API keys must not be in frontend code. CORS restrictions and credential security.

**Outcome:** `server/index.mjs` — `/api/groq`, `/api/gemini`, `/api/scrape`. Logs model name only, never logs keys or request bodies.

---

## Decision 4: Agentic Workflow with `steps[]` Tracking

**Decision:** Every AI workflow creates an `aiRun` record with a `steps[]` array that gets updated in real-time as each step completes.

**Context:** Hackathon judging criteria includes "agentic" behavior. Users and judges need visibility into what the AI is doing.

**Workflow contract:**
1. Create `aiRun` in Dexie with `steps: [{ name, status: 'pending' }]`
2. After each AI call: update `steps[i].status` to `'completed'` or `'failed'`
3. Store final JSON in `aiRun.output`, set `status: 'completed'`
4. Add outbox entry for sync
5. Return `{ runId, result }`

**Outcome:** `AIWorkflowPanel` reads `run.steps[i].name` dynamically — no hardcoded step labels in the panel. Any workflow's steps display correctly.

---

## Decision 5: React Hooks Only (No Redux/Zustand)

**Decision:** Use React `useState`/`useEffect` for all state. No external state manager.

**Context:** App state is mostly component-local (form state, selected item, loading flags). The one piece of cross-component state (`activeRunId`) is lifted to `App.tsx` and passed down as props.

**Outcome:** Simple, minimal bundle, easy to understand. If complexity grows, Zustand would be the natural upgrade path.

---

## Decision 6: Tailwind CSS v4 + shadcn/ui

**Decision:** Utility-first styling with Tailwind v4; shadcn/ui for accessible component primitives (Button, Badge, Card, Input, Select, Toaster).

**Outcome:** Consistent design system with minimal custom CSS. Components look polished without heavy UI framework overhead.

---

## Decision 7: TypeScript Strict Mode

**Decision:** `"strict": true` in `tsconfig.json`. No `any` types allowed.

**Rationale:** Hackathon codebase handed off to other developers. Strict types serve as inline documentation and catch bugs at compile time.

---

## Decision 8: Vite (Not Create React App)

**Decision:** Vite v8 as build tool.

**Rationale:** Instant HMR (< 100 ms), 10× faster builds than CRA, industry standard for React in 2024+.

---

## Decision 9: Supabase Sync Deferred to Phase 5

**Decision:** Phases 2–4 are fully offline; Supabase sync added in Phase 5.

**Rationale:** Separate concerns. Phase 3 focused on AI, not sync. Outbox table pre-created so migration was seamless.

---

## Decision 10: Local Methodology Matrix for Phase 9 (Analysis Advisor)

**Decision:** Ship a static `methodology-matrix.json` with 15 pre-scored research methods instead of asking the AI to recommend methods cold.

**Context:** Phase 9 Analysis Advisor needs to recommend analytical methods. Options:
1. Ask AI to recommend methods directly (fully dynamic, but no constraints, inconsistent output)
2. Ship a local JSON matrix and use AI only for classification + guide writing (structured, reliable, works offline)

**Options Considered:**

| Approach | Offline | Consistency | Control | Speed |
|----------|---------|------------|---------|-------|
| AI recommends methods cold | ❌ No | ⚠️ Variable | Low | Slow |
| Local matrix + AI classification | ✅ Yes | ✅ Consistent | High | Fast |
| Hardcoded heuristics only | ✅ Yes | ✅ Consistent | High | Instant |

**Decision Rationale:**
1. **Offline scoring:** Matrix scoring works with no AI call — fallback guaranteed
2. **Consistency:** Always the same 15 methods, always ranked the same way
3. **Control:** We decide which methods are valid; AI only handles natural-language classification
4. **Quality:** Keyword overlap scoring is deterministic and explainable

**Matrix contents:** 15 methods across quantitative (Pearson correlation, linear regression, multiple regression, t-tests, ANOVA, chi-square, logistic regression), qualitative (thematic analysis, grounded theory, content analysis, case study, discourse analysis), and mixed methods (convergent, sequential explanatory, sequential exploratory). Each entry has `keywords[]` for scoring.

**Outcome:** `lib/data/methodology-matrix.json` (static, bundled). AI calls in `analysis-advisor.ts` handle classification (Step 1) and guide generation (Step 3). Scoring (Step 2) is pure local computation.

---

## Decision 11: Browser-Direct API Calls for Citation Engine (Phase 10)

**Decision:** Call Semantic Scholar and CrossRef APIs directly from the browser, not through the Express proxy.

**Context:** Phase 10 Citation Engine needs to search academic paper databases. Options:
1. Route through Express proxy (adds latency, requires server running)
2. Call academic APIs directly from browser (simpler, faster)

**Options Considered:**

| Approach | Requires Server | Latency | Key Required | CORS |
|----------|----------------|---------|-------------|------|
| Via Express proxy | ✅ Yes | +round-trip | Optional | Solved |
| Browser-direct | ❌ No | Minimal | No | ✅ Both APIs support it |

**Decision Rationale:**
1. **No API keys needed:** Semantic Scholar and CrossRef both offer CORS-enabled public endpoints
2. **No proxy dependency:** Citation Engine works even if the Express server isn't running
3. **Simpler code:** No proxy route to add or maintain
4. **Parallel fetching:** Browser can call both APIs simultaneously with `Promise.allSettled`

**Safeguards:**
- `AbortSignal.timeout(8000)` on both calls to prevent hanging
- `Promise.allSettled` so one API failure doesn't block results from the other
- Dedup by DOI + title similarity after merging results

**Outcome:** `citation-engine.ts` calls `api.semanticscholar.org` and `api.crossref.org` directly from the browser. Zero proxy changes needed.

---

## Decision 12: Client-Side Citation Formatting (Phase 10)

**Decision:** Format citations (APA 7, MLA 9, Chicago 17) entirely in the browser with a `formatCitation(ref, style)` pure function. Do not call AI to format citations.

**Context:** Citation formatting is deterministic. Using AI adds latency and risks hallucinated formats.

**Decision Rationale:**
1. **Instant toggle:** Switching APA → MLA → Chicago reformat all cards with no network call
2. **No AI cost:** Deterministic rules, no token spend
3. **Correctness:** Rules can be precisely encoded; AI paraphrases them

**Outcome:** `formatCitation(ref, style)` in `CitationEngine.tsx` — handles author name formatting, title italics, publisher format, DOI links per style guide.

---

## Decision 13: 3-Pipeline AI Call Strategy for Improvement Analyzer (Phase 11)

**Decision:** Use 3 sequential AI calls (segment → audit → rewrite), not 5+ separate calls for each paragraph.

**Context:** Early Phase 11 design called for one AI audit call per paragraph. For a 6-paragraph document that's 6+ calls.

**Options Considered:**

| Approach | AI Calls | Total Time | Consistency |
|----------|----------|-----------|------------|
| One call per paragraph | 6+ | 30–60 s | ⚠️ Variable per call |
| Batch all paragraphs in one audit call | 1 | 5–10 s | ✅ Consistent |
| 3-step pipeline (segment → batch audit → rewrite) | 3 | 10–20 s | ✅ Consistent |

**Decision Rationale:**
1. **Speed:** 3 calls vs 6+ keeps total time reasonable
2. **Coherence:** Batch audit call sees all paragraphs together — can evaluate flow and transition quality, not just isolated paragraphs
3. **Cost:** Fewer tokens overall; batch prompt is more efficient than 6 individual prompts

**Outcome:** `improvement-analyzer.ts` — Step 1 segments, Step 2 batch-audits all paragraphs in one call (numbered `[1]`…`[N]`), Step 3 rewrites only the single weakest paragraph.

---

## Decision 14: Two-Phase Interactive Workflow for Topic Builder (Phase 12)

**Decision:** Split Topic Builder into two separately invokable workflow functions with a user selection step in between, rather than one end-to-end automated workflow.

**Context:** The desired UX for Phase 12 is:
1. Generate multiple topic options
2. **User picks one**
3. Build a full outline for the selected topic

A single automated workflow can't accommodate user interaction mid-run.

**Options Considered:**

| Approach | User Control | UX Complexity | Implementation |
|----------|-------------|---------------|----------------|
| One workflow, all automated | ❌ No user choice | Simple | One function |
| Two workflows + UI state machine | ✅ Full user choice | Medium | Two functions |
| Streaming + pause | ✅ Yes | High | Complex |

**Decision Rationale:**
1. **User agency:** Researchers should choose their own topic, not accept whatever the AI picks
2. **Reusability:** `runTopicGenerationWorkflow` and `runOutlineBuildWorkflow` are independently useful (and independently testable)
3. **`aiRun` integrity:** Two separate runs make it easy to track which outline belongs to which topic selection decision
4. **Simplicity:** Two clean functions with clear contracts are easier to maintain than one stateful function with a pause mechanism

**Outcome:** `topic-builder.ts` exports:
- `runTopicGenerationWorkflow(seed, researchItemId)` → `{ runId, result: { topics[] } }`
- `runOutlineBuildWorkflow(topic, researchItemId)` → `{ runId, outline[] }`

`TopicBuilder.tsx` owns the state machine: `topics[]` + `selectedTopic` + `outline[]`.

---

## Decision 15: AIWorkflowPanel Reads Steps Dynamically

**Decision:** `AIWorkflowPanel` renders step names from `run.steps[i].name` (read from Dexie), not from a hardcoded `PIPELINE_STEPS` array.

**Context:** Original implementation hardcoded 5 step labels (`['Summarize', 'Extract Actions', 'Categorize', 'Citation Search', 'Generate Outline']`). Phase 9 uses 3 steps with completely different names.

**Problem:** Hardcoded steps would show wrong labels for every new workflow added.

**Decision Rationale:** Each workflow defines its own step names at `aiRun` creation time. The panel should trust the DB, not its own hardcoded list.

**Outcome:** Panel iterates `runSteps.map((dbStep, i) => ...)` and displays `dbStep.name`. Adding a new workflow with any step names automatically displays correctly in the panel with zero panel code changes.

---

## Summary: Decision Checklist

| Area | Decision | Phase |
|------|----------|-------|
| AI Provider | Groq primary, Gemini fallback | 3 |
| Database | IndexedDB + Dexie (offline-first) | 2 |
| AI Proxy | Express.js — keeps keys server-side | 3 |
| Deep Analysis | Multi-step agent with steps[] tracking | 3 |
| State | React hooks (no Redux/Zustand) | 3 |
| Styling | Tailwind v4 + shadcn/ui | 1–8 |
| Types | TypeScript strict mode | 1 |
| Build | Vite | 1 |
| Sync | Supabase outbox pattern (Phase 5) | 5 |
| Methodology data | Local JSON matrix for offline scoring | 9 |
| Citation APIs | Browser-direct (no proxy needed) | 10 |
| Citation format | Pure client-side formatCitation() | 10 |
| Audit strategy | Batch 3-call pipeline, not per-paragraph | 11 |
| Topic workflow | Two separate functions + UI state machine | 12 |
| Panel steps | Dynamic from run.steps[], not hardcoded | 8 |

---

## Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-05-05 | 1.0 | Initial documentation (Decisions 1–14) |
| 2026-05-06 | 2.0 | Added Decisions 10–15 covering Phases 9–12 |
