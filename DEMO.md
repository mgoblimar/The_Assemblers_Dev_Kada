# Hackathon Demo Script: The Assemblers Research Tool

This script ensures a smooth, 3-5 minute presentation of the core features.

## Setup
1.  **Browser:** Open the app at `http://localhost:5173`.
2.  **Supabase:** Open the `research_items` table in the Supabase Dashboard.
3.  **App State:** Log in and click the **🗑️ (Reset)** button to start fresh.
4.  **Network:** Ensure you are **Online** for the start.

## Part 1: Offline-First Reliability (1 min)
1.  **Action:** Open DevTools and set Network to **Offline**.
2.  **Talk:** "Our tool is built for researchers in the field who don't always have reliable internet. Watch as I create a research item while completely offline."
3.  **Action:** Enter Title ("Mars Colony Logistics") and click **Create**.
4.  **Point Out:** The red **Offline** badge and the yellow **pending** sync status.
5.  **Talk:** "The data is safely stored in IndexedDB on my device. It won't be lost."

## Part 2: Seamless Cloud Sync (1 min)
1.  **Action:** Turn Network back to **Online**.
2.  **Point Out:** The **Syncing...** indicator and then the green **synced** badge.
3.  **Action:** Switch to the Supabase tab and click **Refresh**.
4.  **Talk:** "As soon as I'm back online, the Outbox processor pushes my changes to Supabase. Our cloud database is now perfectly in sync with my local device."

## Part 3: Agentic AI Workflow (1 min)
1.  **Action:** Click the **[Seed Demo Data]** button in the form.
2.  **Talk:** "Instead of just simple summaries, we use an Agentic Workflow to extract deeper value."
3.  **Action:** Click **Deep Insight (Agent)** on a research item.
4.  **Talk:** "The agent is now performing multiple steps: it summarizes the text, identifies specific actionable items, and automatically categorizes the research."
5.  **Point Out:** The different sections in the AI output.

## Part 4: Conclusion (30 sec)
1.  **Talk:** "We've combined the reliability of local-first architecture with the power of cloud AI and multi-step agents. This ensures researchers never lose data and always gain insights. Thank you!"

## Contingency (The "Plan B")
*   **AI Fails:** "Our adapter architecture has a built-in mock fallback, so even if the AI provider is down, the demo continues with sample results."
*   **Sync Fails:** Use the **🔄 (Force Sync)** button to retry any failed entries manually.
