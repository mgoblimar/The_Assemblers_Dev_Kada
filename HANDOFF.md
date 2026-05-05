# Handoff & Developer Guide

**Project:** Research Tool with AI & Agentic Workflows  
**Version:** 1.1 (Phase 5: Sync & Auth)  
**Date:** May 5, 2026

## Quick Start

### Prerequisites
- Node.js 18+ (`node --version`)
- npm or yarn
- Groq API key (free: https://console.groq.com)
- Supabase Project (URL and Anon Key)

### 1. Clone & Install
```bash
cd d:\Projects\UPM\Hackathon\DevKada\The_Assemblers_Dev_Kada
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
GEMINI_API_KEY=AIzaSy_YOUR_KEY_HERE (optional)

# Supabase Config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase Database
Run the SQL script found in `docs/SUPABASE_SCHEMA.sql` in your Supabase SQL Editor. This will:
1. Create `research_items` and `ai_runs` tables.
2. Enable Row-Level Security (RLS).
3. Set up policies so users can only see their own data.

### 4. Start Development

**Terminal 1: Express Proxy Server (Scraper & AI)**
```bash
cd apps/web
npm run server
# Listens on http://localhost:3001
```

**Terminal 2: React Frontend (Vite)**
```bash
cd apps/web
npm run dev
# Opens http://localhost:5173
```

**Combined Command (Root)**
```bash
npm run dev:all
```

---

## Architecture: Sync & Auth (Phase 5)

ResearchAI uses an **Offline-First Outbox Pattern** to ensure reliability in unstable networks.

### 1. Local-First (Dexie)
All user actions are immediately saved to **IndexedDB (Dexie)**. Each entity (`research_item`, `ai_run`) includes a `userId` field tied to Supabase Auth.

### 2. Outbox Processor (`src/lib/sync/outbox-processor.ts`)
When an item is created/updated locally, a corresponding entry is added to the `outbox` table.
- **Sync Trigger:** The `processOutbox()` function runs automatically when the app detects it's back online or when the user logs in.
- **Push:** It `upserts` local changes to Supabase tables using the `supabase-js` client.

### 3. Cloud Recovery (`fetchRemoteData`)
On login, the app calls `fetchRemoteData(userId)` to pull any remote items not present in the local database. This enables seamless multi-device usage.

### 4. User Isolation (RLS)
Supabase **Row-Level Security** ensures that even though data is stored in shared tables, users can only read/write their own records using their JWT token.

---

## Project Structure

```
apps/web/
├── src/
│   ├── lib/
│   │   ├── ai/                        # AI Orchestration (Groq/Gemini/Agent)
│   │   ├── db/                        # Dexie Database & Repositories
│   │   └── sync/                      # Supabase Client & Outbox Logic
│   ├── features/
│   │   ├── auth/                      # Login/Signup UI
│   │   └── research/                  # Core Research Features
├── server/
│   └── index.mjs                      # Express proxy (Scraping & AI Proxy)
└── ...
```

---

## Database Schema (Sync Ready)

### ResearchItem
- `id`: Local Dexie ID (BIGINT in PG)
- `userId`: Supabase User ID (UUID)
- `title`: String
- `sourceText`: String
- `syncStatus`: 'pending' | 'synced' | 'error'

### AIRun
- `id`: Local Dexie ID
- `userId`: Supabase User ID
- `researchItemId`: FK to ResearchItem
- `prompt`: String
- `output`: String
- `steps`: JSONB (for agentic workflows)

---

## Git Workflow

1. **Feature:** `feature/sync-improvements`
2. **Branch:** Keep `main` for demo-ready code.
3. **Commit:** Use conventional commits (`feat:`, `fix:`, `docs:`).

---

## Known Limitations (Phase 5)
- **Conflict Resolution:** Currently uses "Last Write Wins".
- **Real-time:** Sync is triggered on login/online events; does not use Supabase Realtime (WebSockets) yet.
- **Soft Deletes:** Deleting an item locally does not currently trigger a remote delete in the MVP.

---

## Next Steps (Phase 6)
1. **E2E Testing:** Verify sync behavior across simulated offline states.
2. **UI Polish:** Add sync indicators (badges/toasts) for better user feedback.
3. **Performance:** Optimize `fetchRemoteData` for large datasets.
