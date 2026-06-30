# 🚨 LastMinute Life Saver 2.0 - Redesigned to Win

**LastMinute Life Saver 2.0** is an AI-powered tactical productivity companion engineered for high-stress scenarios (like hackathons, exam cramming, or critical product launches). It proactively plans, prioritizes, and schedules urgent tasks, bypassing last-minute panic by constructing actionable survival plans.

"The only app that panics with you — then saves you anyway."

---

## 👑 Centered Feature: "Panic Mode" Demo

The heart of the 2.0 system is **Panic Mode**—an instantaneous single-click rescue protocol built to showcase real-time value to evaluators and judges:

1. **One-Click Stressor Load**: Clicking **DEMO DATA** in the checklist immediately populates the page with an active hackathon crisis dataset (production build crash, pitch slides deck, urgent invoices).
2. **Instant AI Scheduling**: Clicking **ACTIVATE PANIC MODE** triggers a live request to our Express API. The engine evaluates deadlines, estimated efforts, relative importance levels, and calendar exclusion blocks.
3. **Rescue Plan Rendering**: In seconds, the AI outputs a complete schedule showing:
   - **Risk Score Indicator**: A custom color-coded risk badge (e.g., *89% miss risk*).
   - **The Golden Next Action**: A highlighted, concrete micro-step to start on right now.
   - **Conflict-Safe Focus Slots**: High-contrast, time-blocked focus sessions.

---

## ⚙️ Simplified, Reliable Architecture

```
                       [ Activate Panic Mode ]
                                  │
                                  ▼
                     [ Express API Proxy (server.ts) ]
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
            { Primary AI }                { Fallback AI }
              NVIDIA NIM                    Ollama Cloud
         (openai/gpt-oss-120b)           (gemma4:31b-cloud)
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                     [ Cleaned JSON Rescue Plan ]
                                  │
                                  ▼
                   [ Interactive React Dashboard ]
```

### 1. Dual-Provider Fallback Chain
*   **Primary Provider**: **NVIDIA NIM** utilizing the `openai/gpt-oss-120b` model for maximum scheduling logic performance.
*   **Fallback Provider**: **Ollama Cloud** running `gemma4:31b-cloud` as an automatic backup.
*   **Exponential Backoff Protocol**: If the primary NIM service fails, the Express server catches the exception, sleeps for `1500ms`, and retries. Upon a secondary failure, it automatically fallbacks to Ollama to ensure uninterrupted client scheduling.
*   **Provider Transparency**: The computed plan specifies the exact provider model used, visible in the header of the generated survival cards.

### 2. Client-Side Support Features
*   **Live Focus Timer**: A Pomodoro-style circle countdown clock that locks to an active task. Finishing the timer automatically updates the task's state to `completed = true` in local storage.
*   **Streak Habit Tracker**: A daily consistency log that tracks streaks. Tapping habit items increments the fire streak multiplier.
*   **Calendar Conflict Guard**: Exclude blocks of hours (e.g., team syncs) so the AI planning engine never schedules focus slots over pre-existing meetings.
*   **Nudges Timeline stream**: Real-time push notification feeds indicating check-ins and deadline alerts computed on-the-fly by the LLM.

---

## 🔑 Secure Credentials Configuration

Both NVIDIA NIM, Ollama, and Gemini keys are kept highly secure, loaded via environment variables, and processed strictly server-side in `server.ts` without client-side exposure. 

To configure your credentials locally, create a `.env` file at the root:
```env
NVIDIA_API_KEY=your-custom-nim-key
OLLAMA_API_KEY=your-custom-ollama-key
GEMINI_API_KEY=your-custom-gemini-key
AUTO_FALLBACK=true
```

---

## 🛠️ Setup & Running Instructions

To boot the full-stack environment locally, make sure you have Node.js installed, then run:

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build standalone production bundles
npm run build

# 4. Start production standalone server
npm run start
```
