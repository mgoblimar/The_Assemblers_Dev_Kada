# Component Reference

**Project:** Research Tool with AI & Agentic Workflows  
**Version:** 2.0 (Phase 13)  
**Date:** May 6, 2026

This document maps every UI component to its file, props, and responsibility. An AI agent reading this can immediately locate any component and understand what it does.

---

## Layout Components (`src/features/layout/`)

### `Sidebar`
**File:** `src/features/layout/Sidebar.tsx`  
**Exports:** `Sidebar`, `type ActiveView`

```typescript
type ActiveView = 'dashboard' | 'research' | 'advisor' | 'citations' | 'improve' | 'topics'

interface SidebarProps {
  email: string
  online: boolean
  isSyncing: boolean
  lastSynced: string
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
  onSync: () => void
  onHelp: () => void   // Phase 13 — opens HelpModal
}
```

**Renders:**
- Logo (BrainCircuit icon + "ResearchAI" wordmark)
- Online/Offline badge
- Nav buttons for all 6 views (phase badge on inactive items)
- HelpCircle button (below nav) → calls `onHelp`
- User block: avatar initials, username, sync button, logout button

**Width:** `w-56`  
**Controlled by:** `App.tsx` → `sidebarOpen` state (phase 13 toggle)

---

### `AIWorkflowPanel`
**File:** `src/features/layout/AIWorkflowPanel.tsx`

```typescript
interface AIWorkflowPanelProps {
  runId: number | null
  itemTitle: string | null
  onCancel: () => void
  onViewReport: (run: AIRun) => void
}
```

**Idle state:** Shows placeholder step list from `DEFAULT_PREVIEW_STEPS`.  
**Active state:** Polls Dexie every 400 ms for `db.aiRuns.get(runId)`, renders `run.steps[]` dynamically.

**Step states:** `done` (CheckCircle2/green) | `progress` (Loader2/spin) | `pending` (Circle/muted) | `failed` (XCircle/red)  
**Progress bar:** `completedCount / runSteps.length * 100`  
**Width:** `w-72`  
**Controlled by:** `App.tsx` → `panelOpen` state (phase 13 toggle)

---

### `StatusBar`
**File:** `src/features/layout/StatusBar.tsx`

```typescript
interface StatusBarProps {
  itemCount: number
  online: boolean
  outboxCount: number
}
```

**Renders:** 3-section bottom bar — IndexedDB item count | Groq API status | Outbox pending count  
**Height:** `h-7`

---

## Research Components (`src/features/research/`)

### `ResearchForm`
**File:** `src/features/research/ResearchForm.tsx`

```typescript
interface ResearchFormProps {
  userId?: string
  onItemCreated: () => void
}
```

**Inputs:**
- Title (optional text input — auto-filled from PDF filename or scraped page title)
- Content/URL/Document (textarea):
  - Plain text
  - HTTP(S) URL → `/api/scrape` Puppeteer extraction
  - Google Docs URL → converted to `/pub?output=txt` then scraped
  - PDF file upload → `extractTextFromPdfBytes()` client-side extraction

**PDF button:** Opens hidden `<input type="file" accept=".pdf">`. Reads ArrayBuffer, extracts text.  
**Google Doc button:** `prompt()` for URL, calls `toGoogleDocsExport()`, stores in textarea.  
**Attachment badge:** Shows filename + clear (×) button when file or Google Doc attached.  
**Seed Demo button:** Creates 2 sample research items for demo purposes.

**Helper functions (module-private):**
- `toGoogleDocsExport(url)` — converts edit URL to `/pub?output=txt`
- `extractTextFromPdfBytes(buffer)` — heuristic BT/ET PDF text extraction (text-embedded PDFs only)

---

### `ResearchList`
**File:** `src/features/research/ResearchList.tsx`

```typescript
interface ResearchListProps {
  userId?: string
  refreshTrigger: number
  activeRunId: number | null
  onAnalyze: (item: ResearchItem) => void
  onItemCountChange: (count: number) => void
}
```

**Filter:** `'all' | 'quantitative' | 'qualitative' | 'mixed'`  
Filter chips shown above the list. `filteredItems` derived from `items` using `detectItemType(item)` (mirrors `ResearchCard`'s `detectType`).  
When filtered and empty: "No [type] items found" + "Clear filter" link.

**Data:** Loads from `getResearchItems(userId)` + per-item AI run counts from Dexie.  
**Details modal:** `Dialog` from shadcn/ui — shows full source text + all `aiRuns` for the item as a timeline.

---

### `ResearchCard`
**File:** `src/features/research/ResearchCard.tsx`

```typescript
interface ResearchCardProps {
  item: ResearchItem
  aiRunCount: number
  isAnalyzing: boolean
  onAnalyze: (item: ResearchItem) => void
  onViewDetails: (item: ResearchItem) => void
}
```

**Type detection:** `detectType(title, text)` → `'quantitative' | 'qualitative' | 'mixed' | 'research'`  
Using keyword regex against title+text. Result shown as color-coded badge.

**Footer actions:**
- Improve (ghost button → navigates to Improve Writing)
- Cite (ghost button → navigates to Citations)
- Analyze (primary button → triggers agentic workflow)

**Sync badge:** Cloud/CloudOff icon + `syncStatus` label.

---

## Feature Panel Components

### `AnalysisAdvisor`
**File:** `src/features/advisor/AnalysisAdvisor.tsx`

```typescript
interface AnalysisAdvisorProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string   // Phase 13 fix: passed to getResearchItems()
}
```

**Flow:** Select item → "Analyze Methodology" → 3-step workflow → paradigm badge + method cards + guide  
**Caching:** Reloads last result from `aiRuns` where `prompt === 'Analysis Advisor'`

---

### `CitationEngine`
**File:** `src/features/citations/CitationEngine.tsx`

```typescript
interface CitationEngineProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string   // Phase 13 fix
}
```

**Flow:** Select item → "Find References" → 3-step workflow → ranked reference cards with style toggle  
**Style toggle:** APA 7 / MLA 9 / Chicago 17 (client-side, no re-fetch)  
**Copy:** Per-card + "Copy All" with 1800 ms toast

---

### `ImprovementAnalyzer`
**File:** `src/features/improve/ImprovementAnalyzer.tsx`

```typescript
interface ImprovementAnalyzerProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string   // Phase 13 fix
}
```

**Flow:** Select item → "Analyze Writing" → 3-step workflow → score card + issues + paragraph breakdown + before/after rewrite  
**Caching:** Reloads last result from `aiRuns` where `prompt === 'Improvement Analyzer'`

---

### `TopicBuilder`
**File:** `src/features/topics/TopicBuilder.tsx`

```typescript
interface TopicBuilderProps {
  onRunStart: (runId: number, title: string) => void
  userId?: string   // Phase 13 fix
}
```

**Two-phase interactive flow:**
1. Input seed → "Generate Topics" → 5 scored topic cards
2. Select a topic → "Build Research Outline" → 7-chapter outline

**Topic card:** title, overall score badge, novelty bar (blue), feasibility bar (violet), expandable detail  
**Outline card:** emoji icon, chapter name, purpose, word count suggestion, expandable key points

---

## Help Components (`src/features/help/`)

### `HelpModal`
**File:** `src/features/help/HelpModal.tsx` *(created Phase 13)*

```typescript
interface HelpModalProps {
  open: boolean
  onClose: () => void
}
```

**Renders:** Full-screen overlay (fixed inset-0, backdrop-blur) with centered card (max-w-2xl, 90vh max).

**Sections (accordion, one at a time):**
| Section | Icon |
|---------|------|
| Dashboard | LayoutDashboard |
| My Research | FolderOpen |
| Analysis Advisor | BarChart3 |
| Citations | Bookmark |
| Improve Writing | PenLine |
| Topic Builder | Lightbulb |

Each section: description paragraph + 3 usage tips bullet list.

**FAQ block:** Always visible below accordion. Covers: internet requirement, sync behavior, citation styles, onboarding tour (future).

**Footer:** "ResearchAI · Phases 1–12 complete" label + v2.0 badge.

**Triggered by:** HelpCircle button in `Sidebar` → `onHelp` prop → `showHelp` state in `App.tsx`.

---

## Shared UI Components (`src/shared/components/ui/`)

Built on shadcn/ui primitives. Components used:

| Component | Used In |
|-----------|---------|
| `Button` | All features |
| `Input` | ResearchForm, TopicBuilder |
| `Textarea` | ResearchForm |
| `Card`, `CardContent`, `CardHeader` | All features |
| `Badge` | ResearchCard, HelpModal, TopicBuilder, ImprovementAnalyzer |
| `Dialog`, `DialogContent` | ResearchList (details modal) |
| `ScrollArea` | ResearchList details dialog |
| `Select` | (replaced by native `<select>` in feature panels for simplicity) |
| `Toaster` | Root App.tsx — displays toasts |
| `toast()` | ResearchForm (scrape/save feedback) |
| `Label` | ResearchForm |

---

## App Root (`src/App.tsx`)

**Root state managed in App:**

| State | Type | Source | Purpose |
|-------|------|--------|---------|
| `session` | `Session\|null` | Supabase | Auth gate |
| `online` | boolean | `navigator.onLine` events | Network indicator |
| `refreshTrigger` | number | Incremented on data change | Re-query all lists |
| `isSyncing` | boolean | Sync operations | Spinner in Sidebar |
| `lastSynced` | string | After sync | Label in Sidebar |
| `activeView` | `ActiveView` | User nav click | Which panel to show |
| `showForm` | boolean | "New Research" button | Toggle form in Dashboard |
| `searchQuery` | string | Top bar input | Passed to lists (future) |
| `activeRunId` | `number\|null` | After workflow start | AIWorkflowPanel tracking |
| `activeRunTitle` | `string\|null` | After workflow start | AIWorkflowPanel subtitle |
| `itemCount` | number | ResearchList callback | StatusBar + StatCard |
| `outboxCount` | number | Dexie query | StatusBar |
| `aiRunCount` | number | Dexie query *(Phase 13)* | Dashboard StatCard |
| `citationCount` | number | Dexie query *(Phase 13)* | Dashboard StatCard |
| `showHelp` | boolean | HelpCircle click *(Phase 13)* | HelpModal open |
| `sidebarOpen` | boolean | localStorage *(Phase 13)* | Toggle Sidebar |
| `panelOpen` | boolean | localStorage *(Phase 13)* | Toggle AIWorkflowPanel |

**`MainContent` sub-component** routes `activeView` to the correct feature panel or Dashboard view. Receives all necessary props from App.

**Toggle buttons in top bar:**
- Left: `PanelLeft` icon button → `setSidebarOpen(v => !v)` + `localStorage.setItem`
- Right: `PanelRight` icon button (desktop only) → `setPanelOpen(v => !v)` + `localStorage.setItem`
