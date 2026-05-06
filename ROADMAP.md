# Product Roadmap

**Project:** Research Tool with AI & Agentic Workflows  
**Last Updated:** May 6, 2026

---

## ✅ Completed — Phases 1–12 (Core Platform)

| Phase | Name | Key Deliverables |
|-------|------|-----------------|
| 1 | Foundation | Vite + React 19 + TypeScript + Express proxy |
| 2 | Offline Database | Dexie IndexedDB schema, ResearchForm, ResearchList |
| 3 | AI Integration | Groq adapter, agentic workflow, Deep Insight |
| 4 | Academic Scraper | Puppeteer scraper with academic selectors |
| 5 | Supabase Sync & Auth | Outbox pattern, RLS, Cloud Recovery |
| 6–8 | Layout Overhaul | 3-column layout, Sidebar, AIWorkflowPanel, StatusBar |
| 9 | Analysis Advisor | 15-method matrix, 3-step methodology recommender |
| 10 | Citation Engine | Semantic Scholar + CrossRef, APA/MLA/Chicago formatting |
| 11 | Improvement Analyzer | Coherence scoring, gap detection, paragraph rewrites |
| 12 | Topic Builder | Scored topic generation + 7-chapter outline builder |

---

## ✅ Completed — Phase 13 (UX & Feature Fixes)

| Issue | Fix | Status |
|-------|-----|--------|
| Dashboard AI Runs counter non-functional | Wired to `db.aiRuns.count()` | ✅ Done |
| Dashboard Citations counter non-functional | Wired to Citation Engine run count | ✅ Done |
| My Research filter not applied | `filteredItems` now derived from filter state | ✅ Done |
| Dropdown data mismatch (wrong userId) | `userId` prop added to all 4 feature panels | ✅ Done |
| Topic Builder non-functional | Fixed by userId mismatch fix | ✅ Done |
| PDF upload | `extractTextFromPdfBytes()` + file input in ResearchForm | ✅ Done |
| Google Docs integration | URL converter → existing Puppeteer scraper | ✅ Done |
| Help section | `HelpModal` accessible via sidebar HelpCircle button | ✅ Done |
| Sidebar toggle | `PanelLeft` button in top bar, persisted via localStorage | ✅ Done |
| AI Panel toggle | `PanelRight` button in top bar, persisted via localStorage | ✅ Done |

---

## 🔜 Planned — Phase 14 (Polish & Demo)

| Item | Priority | Notes |
|------|----------|-------|
| Onboarding guided tour | Medium | Tooltip-based step-by-step walkthrough for new users |
| Loading skeletons | Low | Skeleton cards in ResearchList while data loads |
| Toast alerts | Low | "Sync Success", "AI Complete", "Scrape Success" |
| Final demo seeding | High | High-quality demo research items with pre-generated insights |
| Export to Markdown/PDF | Medium | Export a research item + its AI outputs |
| Soft delete sync | Low | Propagate local deletes to Supabase |
| Sidebar icon-only collapse | Low | w-14 icon mode vs full hide (current: full hide) |
| PDF OCR support | Low | Use Tesseract.js for scanned/image PDFs |
| Google Drive OAuth | Low | Access private Google Docs via OAuth flow |
| Search across items | Medium | `searchQuery` from top bar applied to ResearchList |

---

## 💡 Future Ideas (Not Scheduled)

- Collaborative editing (multi-user research rooms)
- PDF/DOCX export of full research reports
- Integration with Zotero or Mendeley
- Real-time Supabase WebSocket sync
- Custom AI model support (bring-your-own API key)
- Local model support (Ollama / LLaMA.cpp) for full offline AI
- Mobile app (Expo / React Native)
- Browser extension for one-click research item creation from any webpage

---

## Architecture Stability

| Layer | Stability | Notes |
|-------|-----------|-------|
| Database schema (Dexie) | Stable | v2, no planned migrations |
| Supabase tables | Stable | RLS-enabled, outbox synced |
| AI provider (Groq) | Stable | Free tier, fallback Gemini configured |
| Express proxy | Stable | `/api/groq`, `/api/gemini`, `/api/scrape` |
| External APIs (Semantic Scholar, CrossRef) | Stable | No keys required, CORS-enabled |
| React component tree | Stable | 3-column layout fixed |
| Workflow pattern | Stable | All workflows follow same aiRun + steps[] contract |
