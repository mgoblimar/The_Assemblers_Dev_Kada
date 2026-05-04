# The Assemblers DevKada 2026 Project

Research tool with AI-powered and agentic workflows, designed for a fast hackathon build with an offline-first foundation.

## Hackathon Info

- Event: DevKada 2026 Hackathon
- Team: The Assemblers
- Team size: 4
- Duration: Week-long sprint (May 3 to May 7, 2026)
- Theme: Build From Anywhere, Build Anything

## Project Vision

Build a practical research assistant that works reliably in real-world connectivity conditions:

- Fast cloud AI responses when online
- Local-first data behavior for offline resilience
- Sync to cloud storage when connection returns

The goal is to demo a complete, useful workflow first, then extend to mobile.

## Current Product Strategy

- Priority: Speed-to-demo + offline-first architecture
- Platform order: Web first, then mobile if time permits
- MVP focus: Core research flow (no auth in MVP)
- AI strategy: Cloud-first now, local model support later

## Planned Stack

### Web

- Vite
- React + TypeScript
- Tailwind CSS
- Dexie (IndexedDB) for offline/local data

### Data and Sync

- Supabase (cloud persistence)
- Local outbox + retry sync pattern

### AI Layer

- Google Gemini (cloud, free-tier friendly path)
- Provider adapter pattern for fallback and future local model support

## Core MVP Features

- Create and manage research items locally
- Run AI-assisted research/summarization
- Save AI outputs with run history
- Queue writes while offline and sync when online
- Show clear status for online/offline and pending operations

## Repo Notes

- This repository currently stores root project setup and planning
- The `docs/` folder is intentionally gitignored in this stage for local planning notes
- Implementation apps/packages will be added in subsequent steps

## Team Workflow (Hackathon)

- Build the smallest complete vertical slice first
- Keep architecture provider-agnostic for AI and portable for mobile
- Defer non-critical complexity (auth, advanced conflicts, heavy infra)

## Quick Start (Planned)

Setup commands will be added once scaffolding starts. The expected initial flow:

1. Scaffold web app with Vite + React + TypeScript
2. Add Tailwind + Dexie + Supabase client
3. Add Gemini provider integration through an adapter
4. Implement offline queue and reconnect sync

## Roadmap After MVP

- Add Expo mobile client reusing shared domain logic
- Introduce local model execution path for stronger offline AI capabilities
- Add auth and collaboration features if needed

## License

MIT. See LICENSE.
