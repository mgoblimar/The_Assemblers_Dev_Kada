# Technical Decisions & Rationale

**Project:** Research Tool with AI & Agentic Workflows  
**Decision Log Version:** 1.0  
**Date:** May 5, 2026

## Decision 1: Choose Groq Over Gemini as Primary Provider

**Decision:** Use Groq (llama-3.3-70b-versatile) as the primary AI provider, with Gemini as fallback.

**Context:**
- Phase 3 requires quick AI integration for hackathon
- Two main contenders: Google Gemini (free tier, then prepay) vs Groq (free tier, no prepay)
- Time constraint: Need working AI feature ASAP

**Options Considered:**

| Provider | Tier | Cost | Quota | Speed | Status |
|----------|------|------|-------|-------|--------|
| Groq | Free | $0 | 30k tokens/min | Very Fast | ✅ Selected |
| Gemini | Free | $0 initially | Limited | Standard | Fallback |
| Gemini | Prepay | Variable | Unlimited | Standard | Expensive for hackathon |
| OpenAI | Paid | $0.15-0.60/1k tokens | Per budget | Standard | Too costly |
| Claude | Paid | API rates | Per budget | Standard | Too costly |

**Decision Rationale:**
1. **Free tier availability:** Both Groq and Gemini free tier work initially
2. **No billing required:** Groq stays free indefinitely; Gemini requires prepay after quota
3. **Speed:** Groq faster inference (important for user experience)
4. **Reliability:** Groq free tier more stable (no quota surprises)
5. **Hackathon context:** No budget for prepay; speed matters for demo

**Outcome:**
- ✅ Groq set as `VITE_AI_PROVIDER=groq` in .env.example
- ✅ Gemini configured as fallback (infrastructure ready)
- ✅ Both adapters in codebase for future flexibility

**Alternative Route:**
If Groq API becomes unavailable:
1. Switch to Gemini (same prompt, different request format)
2. Or use local model (Ollama/LLaMA.cpp) with same adapter pattern

---

## Decision 2: Offline-First with IndexedDB (Dexie)

**Decision:** Use IndexedDB via Dexie for local data storage, not cloud-first.

**Context:**
- Feature requirement: "Offline-first (works without internet via local models/cache)"
- User should be able to create research items and view results offline
- Phase 4 adds cloud sync; Phase 3 should work standalone

**Options Considered:**

| Storage | Offline | Cloud Sync | Setup | Size Limit |
|---------|---------|-----------|-------|------------|
| IndexedDB + Dexie | ✅ Yes | Later (Phase 4) | Easy | ~50MB per origin |
| Supabase only | ❌ No | Built-in | Medium | Unlimited |
| SQLite + wa-sqlite | ✅ Yes | Complex | Hard | ~100MB per tab |
| LocalStorage | ✅ Yes | Manual | Very Easy | ~5MB |

**Decision Rationale:**
1. **Offline requirement:** IndexedDB + Dexie is industry standard for offline-first
2. **Easy integration:** Dexie has clean TypeScript API
3. **Sufficient size:** 50MB enough for thousands of research items + insights
4. **Future-ready:** Dexie → Supabase migration path clear for Phase 4
5. **No backend complexity:** User data stays local until Phase 4 sync
6. **Performance:** IndexedDB faster than LocalStorage for large datasets

**Outcome:**
- ✅ Dexie v4 installed
- ✅ Schema: `researchItems`, `aiRuns`, `outbox` tables
- ✅ All data operations go through `research-repository.ts`
- ✅ Outbox table prepared for Phase 4 sync

**Trade-offs:**
- ❌ Data not synced until Phase 4 (acceptable for MVP)
- ❌ Different data per browser/device (acceptable until Phase 4)
- ✅ Works offline (requirement met)

---

## Decision 3: Express.js Proxy for API Calls

**Decision:** Use Express.js middleware to proxy Groq/Gemini API calls instead of calling directly from React.

**Context:**
- API keys must be secret (cannot be in frontend code)
- React frontend cannot safely call external APIs with credentials
- Need centralized error handling and request sanitization

**Options Considered:**

| Approach | Safety | Complexity | Cost | CORS |
|----------|--------|-----------|------|------|
| Express proxy | ✅ High | Low | Free | ✅ Simple |
| Next.js API routes | ✅ High | Low | Free | ✅ Simple |
| Supabase Auth + Edge | ✅ High | Medium | Minimal | ✅ Yes |
| Direct from React | ❌ Unsafe | None | Free | ⚠️ CORS needed |

**Decision Rationale:**
1. **Security:** API keys kept on server, never exposed to browser
2. **Simplicity:** Express is lightweight; one small server file
3. **Logging:** Can sanitize logs (log model, not keys)
4. **Flexibility:** Can add middleware later (auth, rate limiting, etc.)
5. **Portability:** Works with any deployment (Vercel, Railway, VPS)

**Outcome:**
- ✅ Express server: `server/index.mjs` (30 lines, two endpoints)
- ✅ Routes: `/api/groq` and `/api/gemini`
- ✅ Security: Logs model name only, never logs keys
- ✅ Runs on port 3001 during dev

**Alternative (Future):**
- Phase 5: Migrate to Next.js API routes for unified deployment

---

## Decision 4: Agentic Workflow for Deep Insight

**Decision:** Implement multi-step agentic workflow for "Deep Insight" generation, not single API call.

**Context:**
- "Deep Insight" should be comprehensive, not just a summary
- User requested "with deep insight remove the agentic things just the output"
- Need to generate deeper analysis, but hide intermediate steps from UI

**Options Considered:**

| Approach | Quality | Steps | Speed | Complexity |
|----------|---------|-------|-------|------------|
| Single API call | Medium | 1 | 3-5s | Low |
| Multi-step agent | ✅ High | 4 | 10-30s | Medium |
| Retrieval-Augmented | ✅ Very High | 5+ | 30s+ | High |
| Local model | Medium | Variable | Depends | High |

**Decision Rationale:**
1. **Quality:** Multi-step produces deeper insights than single call
2. **Structured:** Agent can decompose problem into steps
3. **Cacheable:** Each step output can be cached/reused
4. **Explainable:** (Internally) each step is debuggable
5. **User UX:** (Per request) show only final output, not steps

**Workflow Steps:**
1. **Analyze Themes:** Extract key topics from source
2. **Generate Questions:** Create research questions to explore
3. **Find Connections:** Link to related concepts/literature
4. **Synthesize:** Produce final actionable insights

**Outcome:**
- ✅ Agent implemented: `src/lib/ai/agent.ts`
- ✅ Each step calls Groq API with context from previous steps
- ✅ All intermediate outputs stored in `aiRuns` table
- ✅ UI shows only final output (per user request)

**Trade-offs:**
- ❌ Slower than single API call (10-30s vs 3-5s) - acceptable for "deep" work
- ✅ Better quality analysis
- ✅ Future: Can add agent-step visibility in settings

---

## Decision 5: React Hooks + TypeScript (No Redux)

**Decision:** Use React hooks for state management; no Redux, no Zustand.

**Context:**
- Phase 3 scope: Read-heavy (view research + insights)
- Main state: `researchItems[]`, `selectedItem`, `isModalOpen`
- No complex async workflows or time-travel debugging needed

**Options Considered:**

| Library | Complexity | Bundle | Learning | Use Case |
|---------|-----------|--------|----------|----------|
| React hooks | Low | 0kb | Minimal | ✅ Simple state |
| Redux | Very High | 35kb | Steep | Complex flows |
| Zustand | Medium | 2kb | Easy | Larger apps |
| Recoil | Medium | 20kb | Medium | Shared state |

**Decision Rationale:**
1. **Scope:** Not enough complexity to justify Redux overhead
2. **Team size:** One person; minimal state coordination needed
3. **Performance:** React hooks sufficient for this app size
4. **Future:** Easy to migrate to Zustand if Phase 4 gets complex

**Outcome:**
- ✅ All components use `useState`, `useEffect`
- ✅ Props passed down naturally
- ✅ Context not needed (no deep prop drilling)
- ✅ Minimal mental overhead

**Future Migration Path:**
- If Phase 4 adds user context + sync state → upgrade to Zustand
- Rule: Only add state management when truly needed

---

## Decision 6: Tailwind CSS v4 (Utility-First Styling)

**Decision:** Use Tailwind CSS v4.2.4 with utility-first approach, not CSS-in-JS or styled-components.

**Context:**
- Need fast UI styling without setup overhead
- Responsive design required for demo
- Hackathon timeline: want to move fast

**Options Considered:**

| Approach | Setup Time | Bundle Size | DX | Speed |
|----------|-----------|-------------|-----|-------|
| Tailwind | Low | 15kb (gzipped) | ✅ Great | Very fast |
| Styled-components | Medium | 25kb | Good | Normal |
| CSS Modules | Medium | 0kb | Verbose | Normal |
| Plain CSS | High | 0kb | Poor | Slow |

**Decision Rationale:**
1. **Speed:** Quickest to style (utility classes)
2. **Consistency:** Design tokens in config (spacing, colors, etc.)
3. **Bundle:** Small gzipped size
4. **Responsive:** Built-in mobile-first helpers
5. **Tailwind v4:** New CSS engine, faster parsing

**Outcome:**
- ✅ Tailwind v4.2.4 configured
- ✅ Config in `tailwind.config.ts`
- ✅ Global styles in `src/index.css`
- ✅ Components use `className=` utility classes

---

## Decision 7: TypeScript Strict Mode

**Decision:** Enable TypeScript strict mode; all code must be fully typed.

**Context:**
- Hackathon codebase will be handed off
- Better DX for future developers
- Catches bugs early

**Options Considered:**

| Setting | Type Safety | Errors | Development Speed |
|---------|-----------|--------|-------------------|
| Strict: true | ✅ Maximum | Many (early) | Slower upfront |
| Strict: false | ⚠️ Partial | Few | Faster initially |

**Decision Rationale:**
1. **Handoff:** Future developers need confidence in types
2. **Bugs:** Strict mode catches errors at compile time
3. **Refactoring:** Large refactors safer with strict types
4. **Documentation:** Types serve as inline documentation

**Outcome:**
- ✅ `tsconfig.json`: `"strict": true`
- ✅ No `any` types allowed
- ✅ All props, functions, returns typed
- ✅ Build fails on type errors (good)

**Mitigation:**
- If needed, `// @ts-ignore` comments allowed with justification

---

## Decision 8: Vite (Not Create React App)

**Decision:** Use Vite as the build tool, not Create React App.

**Context:**
- Need fast HMR (Hot Module Replacement) for dev experience
- Smaller build, faster startup
- Vite is modern standard (2024+)

**Options Considered:**

| Tool | Build Time | Dev Time | Maturity | Size |
|------|-----------|----------|----------|------|
| Vite | ✅ Very Fast | ✅ Instant HMR | ✅ Mature | Small |
| CRA | Slow | Slow HMR | Mature | Larger |
| Next.js | Medium | Fast | Very Mature | Large |

**Decision Rationale:**
1. **DX:** Vite's HMR is instant (< 100ms)
2. **Speed:** Builds 10x faster than CRA
3. **Modern:** Industry standard for React 2024+
4. **Simplicity:** No complex config (works out-of-the-box)

**Outcome:**
- ✅ Vite v8.0.10 configured
- ✅ `vite.config.ts` minimal config
- ✅ `npm run dev` starts in < 1 second
- ✅ Changes hot-reload instantly

---

## Decision 9: Phase 4 = Supabase Sync (Defer Cloud)

**Decision:** Phase 4 (not Phase 3) will add Supabase sync; Phase 3 is offline-only.

**Context:**
- Phase 3 deadline: AI integration working
- Adding cloud sync would delay Phase 3
- Two-phase approach: Local first, then cloud

**Rationale:**
1. **MVP scope:** Phase 3 focused on AI, not sync
2. **Risk:** Cloud sync adds complexity (conflicts, auth, etc.)
3. **Time:** Separate concerns into separate phases
4. **Testing:** Easier to test each phase independently

**Outcome:**
- ✅ Phase 3: Offline-first, local data only
- ✅ Phase 4: Supabase Auth + DB sync
- ✅ Outbox table pre-created for Phase 4 implementation

---

## Decision 10: Dual Insight Buttons (Not Dropdown)

**Decision:** Show "Generate Summary" and "Generate Deep Insight" as two separate buttons, not a dropdown.

**Context:**
- User can run both workflows on same research item
- Different insights answer different questions
- UX clarity

**Options Considered:**

| Layout | Discoverability | Clicks | Mobile-Friendly |
|--------|-----------------|--------|-----------------|
| Two buttons | ✅ Clear | 1 | ✅ Yes |
| Dropdown | Medium | 2+ | ⚠️ Awkward |
| Tabs | OK | 1+ | ⚠️ Tabs can be fiddly |

**Decision Rationale:**
1. **Clarity:** Both options immediately visible
2. **Independence:** Each can run separately or in sequence
3. **Mobile:** Buttons easier to tap than dropdown
4. **Consistency:** Matches common UI patterns

**Outcome:**
- ✅ ResearchAI component has two buttons
- ✅ Each shows separate loading state
- ✅ Each can have independent card for result

---

## Decision 11: Outputs-Only Modal (No Prompts/Steps)

**Decision:** Details modal shows only AI outputs; does not display prompts, intermediate steps, or metadata.

**Context:**
- User feedback: "with deep insight remove the agentic things just the output"
- UX clarity: End users don't care about prompts; they want insights
- Could add "show prompts" toggle in future if desired

**Rationale:**
1. **User focus:** Researchers want insights, not internals
2. **Clarity:** Less visual clutter in modal
3. **Future:** Easy to add toggle later if needed

**Outcome:**
- ✅ Modal shows: Source text + Latest Summary + Latest Deep Insight
- ✅ No prompts, no agent steps, no metadata
- ✅ Markdown-formatted output only

**Toggle idea (Phase 5):**
```
[ Show internals ]
← Reveals prompts, steps, tokens, etc.
```

---

## Decision 12: Free Tools Only (No Paid Services)

**Decision:** Use only free-tier services for hackathon (Groq free, Supabase free tier, no paid APIs).

**Context:**
- Hackathon budget: $0 (no credit cards to expense)
- Demo should work without ongoing costs
- Free tiers provide enough for MVP

**Services Used:**

| Service | Free Tier | Cost After | Used For |
|---------|-----------|------------|----------|
| Groq | 30k tokens/min | Free | AI inference |
| Supabase | 50k MAU + 500MB DB | Overage charges | Auth + Sync (Phase 4) |
| Railway/Render | $5/month free tier | $7-50+/month | Hosting |
| GitHub | Free | Pro $4/month | Version control |

**Outcome:**
- ✅ Phase 3 costs: $0
- ✅ Phase 4 costs: $0 (within Supabase free tier)
- ✅ Demo deployable for free
- ✅ If app grows → upgrade to paid tiers later

---

## Decision 13: Express.js (Not Full Backend Framework)

**Decision:** Use lightweight Express.js for API proxy, not Django/FastAPI/NestJS.

**Context:**
- Only need simple proxy (route, forward, return)
- No database in backend (data stored in IndexedDB)
- Want minimal operations overhead

**Options Considered:**

| Framework | Lines of Code | Setup Time | Overhead |
|-----------|---------------|-----------|----------|
| Express.js | ~30 | 2 min | Minimal |
| FastAPI | ~50-100 | 5 min | Light |
| Django | ~100+ | 15 min | Heavy |
| NestJS | ~100+ | 15 min | Heavy |

**Decision Rationale:**
1. **Simplicity:** Proxy is very simple (one file)
2. **Speed:** Express starts instantly
3. **Familiarity:** Node/JavaScript
4. **Deployment:** Works anywhere Node runs

**Outcome:**
- ✅ `server/index.mjs` (simple Express setup)
- ✅ Two routes: `/api/groq`, `/api/gemini`
- ✅ No database, no ORM, no complex routing

---

## Decision 14: Mock Fallback for Offline Testing

**Decision:** Provide mock responses when APIs are unavailable (error fallback, not true offline AI).

**Context:**
- Real offline AI requires local models (complex)
- Demo needs to work even if Groq API is down
- Mock data good enough for testing UI

**Current Implementation:**
```typescript
// If Groq API fails → return mock summary
// Allows UI testing without API
```

**Future Enhancement (Phase 5):**
- Integrate local model (Ollama) for true offline AI
- Would require Docker or standalone binary
- Out of scope for current hackathon

---

## Summary: Decision Checklist

| Area | Decision | Rationale |
|------|----------|-----------|
| **AI Provider** | Groq primary, Gemini fallback | Free, reliable, fast |
| **Database** | IndexedDB + Dexie | Offline-first, local |
| **API Calls** | Express proxy | Security, flexibility |
| **Deep Analysis** | Multi-step agent | Quality insights |
| **State** | React hooks | Simple, sufficient |
| **Styling** | Tailwind CSS | Fast, modern |
| **Types** | TypeScript strict | Safety, handoff |
| **Build** | Vite | Speed, DX |
| **Phases** | Sync in Phase 4 | Focused scope |
| **UI** | Dual buttons | Clarity, mobile-friendly |
| **Modal** | Outputs-only | User focus |
| **Cost** | Free tier only | Hackathon budget |
| **Backend** | Lightweight Express | Minimal, simple |
| **Offline** | Mock fallback now | Local AI Phase 5+ |

---

## Revision History

| Date | Decision | Change |
|------|----------|--------|
| 2026-05-05 | All v1 | Initial documentation |

## How to Update This Document

When making significant decisions:
1. Add new section with format: `## Decision N: Title`
2. Include Context, Options, Rationale, Outcome
3. Update Summary table
4. Update Revision History
5. Commit to git with description
