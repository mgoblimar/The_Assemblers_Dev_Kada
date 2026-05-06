# AIPeer: Your AI Research Peer Reviewer

**DevKada 2026 Hackathon | The Assemblers**

**AIPeer** is a high-performance, offline-first research assistant that bridges the gap between artificial intelligence and rigorous academic peer review. It serves as an "agentic peer in your pocket," helping scholars and professional researchers organize, analyze, and validate their research libraries with surgical precision.

## 🚀 The Core Vision
The name **AIPeer** represents the perfect synergy of **AI Intelligence** and **Research Peer Review**. While traditional AI tools focus on generation, AIPeer focuses on **validation, critical analysis, and synthesis**, mirroring the role of a highly qualified research peer.

---

## 🏗️ Architecture Overview

### 1. Offline-First Foundation (Local-First)
*   **Database:** Powered by **Dexie (IndexedDB)** for robust browser-side storage.
*   **Availability:** Every action (creation, editing, AI execution) is possible offline.
*   **Outbox Pattern:** Changes are queued locally and automatically synchronized to the cloud when a connection is restored.

### 2. Agentic AI Layer (The "Peer" Reviewer)
*   **Multi-Step Workflow:** Unlike simple summarizers, our agent performs a 3-step pipeline: **Summarize → Extract Actions → Categorize**.
*   **Advanced Advisors:** Specialized workflows for Methodology Analysis, Citation Discovery, and Improvement Suggestions.
*   **History & Audit:** Every AI execution is stored as an "AI Run" with a full timeline of steps and outputs.

### 3. Real-time Sync & Security
*   **Backend:** **Supabase** handles cloud persistence and real-time data broadcasting.
*   **Security:** Full **Supabase Auth** integration with Row-Level Security (RLS) to ensure user data privacy.

---

## 📈 The Implementation Journey (Phases)

| Phase | Feature | Description |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation** | Vite + TS + Tailwind setup. |
| **Phase 2** | **Offline CRUD** | Research input/list with local persistence. |
| **Phase 3** | **Cloud AI** | Gemini/Groq adapters and Agentic Workflows. |
| **Phase 4** | **Academic Scrape**| Puppeteer-based deep scraping for science portals. |
| **Phase 5** | **Cloud Sync** | Outbox processor and Supabase integration. |
| **Phase 6** | **Advisor** | AI-driven methodology and gap analysis. |
| **Phase 7** | **Citations** | Academic reference discovery and formatting. |
| **Phase 8-13**| **Expert Suite** | Thesis outlines, bias detection, and local LLMs. |
| **Phase 14**| **Launch & Polish**| Final hardening, testing, and professional UX with AIPeer branding. |

---

## 🛠️ Technical Stack
*   **Frontend:** React 19, TypeScript, Shadcn UI, Tailwind CSS.
*   **Local DB:** Dexie.js (IndexedDB).
*   **Cloud DB/Auth:** Supabase.
*   **AI Models:** Google Gemini 2.0 Flash, Llama 3.3 (via Groq).
*   **Server:** Node.js Express Proxy (for API security and Scraping).
*   **Testing:** Vitest.

---

## 🏃 Quick Start for Collaborators

Follow these steps exactly to get the project running on your local machine.

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd The_Assemblers_Dev_Kada
```

### 2. Install All Dependencies
We use a unified command to install packages for the Frontend, the Backend Server, and the Root.
```bash
npm run install:all
```

### 3. Setup Environment Variables
You must set up your keys for the AI and Sync to work.
1.  Navigate to the web app folder: `cd apps/web`
2.  Create a local env file: `cp .env.example .env.local`
3.  Open `.env.local` and paste the **Supabase URL**, **Anon Key**, and **Groq/Gemini API Keys**.
    *   *Ask the team lead for these keys if you don't have them.*

### 4. Run the Development Environment
Go back to the project root and start everything:
```bash
# Return to root if you are in apps/web
cd ../.. 

# Start Frontend (Port 5173) + Backend Server (Port 3001)
npm run dev:all
```

### 5. Open the App
Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💡 Demo Script
1.  **Landing Page:** Explore the new **AIPeer** landing page showcasing the AI + Peer Review synergy.
2.  **Go Offline:** Create a research item to show local persistence.
3.  **Reconnect:** Watch the "Synced" badge turn green as data hits Supabase.
4.  **Agentic Run:** Trigger "Deep Insight" to show the multi-step AI workflow.
5.  **Web Scraping:** Paste a Wikipedia link to see the app ingest a live webpage.

---

## 📝 License
MIT | The Assemblers 2026
