# PeerEvAI — Your AI Research Guide

**DevKada 2026 Hackathon | The Assemblers**
*Build Anything, Build from Anywhere*

---

## The Problem

Starting a research paper is hard — not because researchers lack ideas, but because nobody ever truly teaches the structure. Every chapter has unspoken rules: how to frame research questions, how to connect literature to methodology, how to write an objectives section that actually mirrors your RQs. Most students figure it out by imitation, by trial and error, or not at all.

The chapters are also sequentially dependent in ways that are easy to break. A weak Chapter 1 cascades into a poorly focused Chapter 2. A Chapter 2 that doesn't support your research design leaves Chapter 3 hanging. There is no tool that walks you through this dependency chain step by step — just blank pages and anxiety.

**PeerEvAI** exists to change that.

---

## What PeerEvAI Does

PeerEvAI is an AI-guided academic research paper builder. It doesn't write your paper for you — it acts like a thesis adviser that walks alongside you, asking the right questions at each step, generating drafts you can refine, and carrying context from one chapter into the next.

Think of it less as an AI that builds everything on its own, and more as a structured guide that produces a real working draft you can actually submit, iterate on, or hand to your adviser.

### Chapter Builder

The core workflow covers the first three chapters of a standard academic research paper:

| Chapter | Content |
|---------|---------|
| **Chapter 1** | Background of the Study, Statement of the Problem, Research Objectives, Significance of the Study, Scope and Delimitation, Definition of Terms |
| **Chapter 2** | Review of Related Literature — Foreign Studies, Local Studies, Theoretical & Conceptual Framework, Synthesis |
| **Chapter 3** | Research Methodology — AI-recommended research design (Quantitative / Qualitative / Mixed), Locale & Participants, Sampling, Instruments, Procedure, Data Analysis, Ethical Considerations |

Each chapter is gated: Chapter 2 and 3 unlock only after Chapter 1 is complete, preserving the dependency chain that makes research coherent.

At every step, the AI generates a draft section. You review it, refine it, and move on. At the end of each chapter, a compiled draft is ready to download as a formatted `.md` file.

### Supplementary Tools

Beyond the chapter builder, PeerEvAI includes a suite of focused research utilities:

- **Research Items** — Manage and annotate your collected sources
- **Topic Builder** — Explore and narrow down research topics with AI assistance
- **Citations** — Generate and format academic references in APA style
- **Improve Writing** — Paste any draft section and get targeted rewrite suggestions
- **Peer Review** — Get structured feedback on your writing as if from a peer reviewer
- **Ask My Library** — Query across your saved research items using natural language
- **Analysis Advisor** — Get guidance on which statistical or qualitative analysis method fits your data

---

## How It Works

1. Create a project and enter your research topic (SOP — Statement of the Problem)
2. PeerEvAI generates Research Questions → you pick or edit them
3. PeerEvAI generates Research Objectives aligned to your RQs → you confirm
4. PeerEvAI writes each section of Chapter 1 with references
5. Chapter 2 opens: themes are pre-populated from Chapter 1; you confirm and watch literature sections generate
6. Chapter 3 opens: AI reads your Chapter 2 literature and recommends a research design with rationale; you proceed through methodology sections
7. Download each chapter as a clean `.md` file ready for further formatting

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Local DB:** Dexie.js (IndexedDB) — all chapter state persists locally in the browser
- **AI:** Google Gemini 2.0 Flash via OpenRouter, Llama 3.x via Groq
- **State:** Pure reducer state machines per chapter (no external state library)

> **Note:** PeerEvAI currently runs fully locally. All data is stored in your browser via IndexedDB. Cloud sync is not yet enabled.

---

## Quick Start

```bash
# Clone
git clone <repo-url>
cd The_Assemblers_Dev_Kada

# Install
npm run install:all

# Configure environment
cd apps/web
cp .env.example .env.local
# Add your Groq / OpenRouter / Gemini API key to .env.local

# Run
cd ../..
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173)

---

## Team

The Assemblers — DevKada 2026

---

## License

MIT
