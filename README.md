# ResearchAI: Agentic Research Assistant

**DevKada 2026 Hackathon | The Assemblers**

ResearchAI is a high-performance, offline-first research assistant that combines local-first reliability with the power of agentic AI and seamless cloud synchronization.

## 🚀 The Core Vision
Researchers often work in environments with unstable connectivity. ResearchAI ensures that **no insight is lost** by prioritizing local persistence while leveraging cloud AI and databases whenever a connection is available.

---

## 🏗️ Architecture Overview

### 1. Offline-First Foundation (Local-First)
*   **Database:** Powered by **Dexie (IndexedDB)** for robust browser-side storage.
*   **Availability:** Every action (creation, editing, AI execution) is possible offline.
*   **Outbox Pattern:** Changes are queued locally and automatically synchronized to the cloud when a connection is restored.

### 2. Agentic AI Layer
*   **Multi-Step Workflow:** Unlike simple summarizers, our agent performs a 3-step pipeline: **Summarize → Extract Actions → Categorize**.
*   **Provider Agnostic:** Built with an adapter pattern supporting both **Google Gemini** and **Groq (Llama 3)**.
*   **History & Audit:** Every AI execution is stored as an "AI Run" with a full timeline of steps and outputs.

### 3. Real-time Sync & Security
*   **Backend:** **Supabase** handles cloud persistence and real-time data broadcasting.
*   **Security:** Full **Supabase Auth** integration with Row-Level Security (RLS) to ensure user data privacy.

---

## 📈 The Implementation Journey (Phases)

| Phase | Milestone | Key Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | Vite + React + Tailwind + Dexie setup. |
| **Phase 2** | **Offline CRUD** | Research input/list with local persistence. |
| **Phase 3** | **Cloud AI** | Gemini/Groq adapters and AI Run history. |
| **Phase 4** | **Cloud Sync** | Outbox processor and Supabase integration. |
| **Phase 5** | **Polish & Demo** | Shadcn UI modernization and Demo seeding. |
| **Phase 6** | **Security** | Supabase Auth and private RLS policies. |
| **Phase 7** | **Web Scraping** | Smart link detection and text extraction. |
| **Phase 8** | **Academic Upgrade** | Puppeteer-based deep scraping for science portals. |

---

## 🛠️ Technical Stack
*   **Frontend:** React 19, TypeScript, Shadcn UI, Tailwind CSS.
*   **Local DB:** Dexie.js (IndexedDB).
*   **Cloud DB/Auth:** Supabase.
*   **AI Models:** Google Gemini 2.0 Flash, Llama 3.3 (via Groq).
*   **Server:** Node.js Express Proxy (for API security and Scraping).
*   **Testing:** Vitest.

---

## 🏃 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Supabase Account
*   Gemini/Groq API Keys

### Installation
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Fill in your Supabase and AI keys
```

### Running the App
```bash
# Start the Proxy Server (Port 3001)
npm run server

# Start the Web App (Vite)
npm run dev
```

---

## 💡 Demo Script
1.  **Go Offline:** Create a research item to show local persistence.
2.  **Reconnect:** Watch the "Synced" badge turn green as data hits Supabase.
3.  **Agentic Run:** Trigger "Deep Insight" to show the multi-step AI workflow.
4.  **Web Scraping:** Paste a Wikipedia link to see the app ingest a live webpage.

---

## 📝 License
MIT | The Assemblers 2026
