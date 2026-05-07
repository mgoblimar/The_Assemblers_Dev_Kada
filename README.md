<div align="center">
  <img src="apps/web/src/assets/Logo/LogoWhiteBG-removebg-preview.png" alt="PeerEvAI Logo" width="160" />

  # PeerEvAI

  **Your AI-Guided Research Paper Companion**

  [![DevKada 2026](https://img.shields.io/badge/DevKada-2026-blue?style=flat-square)](https://devkada.com)
  [![The Assemblers](https://img.shields.io/badge/Team-The%20Assemblers-purple?style=flat-square)](#)
  [![Build Anything Build from Anywhere](https://img.shields.io/badge/Theme-Build%20Anything%2C%20Build%20from%20Anywhere-orange?style=flat-square)](#)
  [![Runs Locally](https://img.shields.io/badge/Runs-Locally%20(IndexedDB)-green?style=flat-square)](#)
</div>

---

## 🧩 The Problem

Starting a research paper is hard — not because researchers lack ideas, but because **nobody ever truly teaches the structure**.

Every chapter has unspoken rules: how to frame research questions, how to connect literature to methodology, how to write objectives that actually mirror your RQs. Most students figure it out by imitation, trial and error, or not at all.

The chapters are also **sequentially dependent** in ways that are easy to break:
- A weak Chapter 1 cascades into a poorly focused Chapter 2
- A Chapter 2 that doesn't support your design leaves Chapter 3 hanging
- There is no tool that walks you through this dependency chain — just blank pages and anxiety

**PeerEvAI exists to change that.**

---

## 💡 What PeerEvAI Does

PeerEvAI is an **AI-guided academic research paper builder**. It doesn't write your paper for you — it acts like a thesis adviser that walks alongside you, asking the right questions at each step, generating drafts you can refine, and **carrying context from one chapter into the next**.

Think of it less as an AI that builds everything on its own, and more as a **structured guide that produces a real working draft** you can submit, iterate on, or hand to your adviser.

---

## 📖 Chapter Builder

The core workflow covers the first three chapters of a standard academic research paper:

| Chapter | Sections Generated |
|---------|-------------------|
| 📌 **Chapter 1** — The Problem | Background of the Study · Statement of the Problem · Research Objectives · Significance of the Study · Scope and Delimitation · Definition of Terms |
| 📚 **Chapter 2** — Review of Literature | Foreign Literature & Studies · Local Literature & Studies · Theoretical & Conceptual Framework · Synthesis |
| 🔬 **Chapter 3** — Methodology | AI-recommended Research Design · Locale & Participants · Sampling · Research Instruments · Data Collection Procedure · Data Analysis · Ethical Considerations |

> Each chapter is **gated** — Chapter 2 and 3 unlock only after Chapter 1 is complete, preserving the coherence of the research flow.

At every step, the AI generates a draft section. You review, refine, and move on. At the end of each chapter, a compiled draft is ready to **download as a formatted `.md` file**.

---

## 🛠️ Supplementary Tools

Beyond the chapter builder, PeerEvAI includes a suite of focused research utilities:

| Tool | Purpose |
|------|---------|
| 📂 **Research Items** | Manage and annotate your collected sources |
| 🧭 **Topic Builder** | Explore and narrow down research topics with AI |
| 🔗 **Citations** | Generate and format academic references in APA style |
| ✍️ **Improve Writing** | Paste any draft section and get targeted rewrite suggestions |
| 🧑‍⚖️ **Peer Review** | Get structured feedback as if from a peer reviewer |
| 📖 **Ask My Library** | Query across your saved research items using natural language |
| 📊 **Analysis Advisor** | Get guidance on the right statistical or qualitative method for your data |

---

## ⚙️ How It Works

```
1. Create a project → Enter your research topic
        ↓
2. AI generates Research Questions → You pick or edit
        ↓
3. AI generates Research Objectives → You confirm
        ↓
4. Chapter 1 sections generate one by one → Download draft
        ↓
5. Chapter 2 opens → Themes pre-filled from Ch1 → Literature sections generate
        ↓
6. Chapter 3 opens → AI reads Ch2 and recommends a Research Design with rationale
        ↓
7. Methodology sections generate → Download final draft
```

---

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| 🖥️ **Frontend** | React 19 + TypeScript + Tailwind CSS |
| 🗄️ **Local Storage** | Dexie.js (IndexedDB) — all state lives in your browser |
| 🤖 **AI Models** | Google Gemini 2.0 Flash · Llama 3.x via Groq |
| 🔄 **State** | Pure reducer state machines per chapter |
| 📝 **Rendering** | ReactMarkdown + remark-gfm for live draft preview |

</div>

> **Note:** PeerEvAI currently runs fully locally. All data is stored in your browser via IndexedDB. Cloud sync is not yet enabled.

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd The_Assemblers_Dev_Kada

# 2. Install all dependencies
npm run install:all

# 3. Set up environment variables
cd apps/web
cp .env.example .env.local
# Add your Groq / OpenRouter / Gemini API key to .env.local

# 4. Start the dev server
cd ../..
npm run dev:all
```

Then open [http://localhost:5173](http://localhost:5173) 🎉

---

## 👥 Team

**The Assemblers** — DevKada Hackathon 2026

---

## 📄 License

MIT
