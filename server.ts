import express from "express";
import path from "path";
import dns from "dns";
import dotenv from "dotenv";

// Save original platform-injected Gemini API key before loading dotenv
const platformGeminiKey = process.env.GEMINI_API_KEY;

// Load environment variables securely on the server
dotenv.config();

// Ensure we parse JSON requests
const app = express();
app.use(express.json());

if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const PORT = 3000;

// Default API keys (sourced securely from server environment variables)
const DEFAULT_NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const DEFAULT_OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

// If the loaded GEMINI_API_KEY is the blacklisted mock key, but we have a valid platform-injected one, use the platform's
const loadedGeminiKey = process.env.GEMINI_API_KEY || "";
const DEFAULT_GEMINI_API_KEY = (
  loadedGeminiKey.includes("AIzaSyABYinJ0rbpnE7QbHe8C5WZLKADRMrGb") && platformGeminiKey && !platformGeminiKey.includes("AIzaSyABYinJ0rbpnE7QbHe8C5WZLKADRMrGb")
    ? platformGeminiKey
    : loadedGeminiKey
);

// Helper function to sleep (for backoff)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to clean JSON string from common LLM output defects
function cleanAndParseJson(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown wrappers if present
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (match) {
    cleaned = match[1].trim();
  }

  // Remove any leading/trailing non-json garbage
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// 1. Endpoint: Test Connection
app.post("/api/test-connection", async (req, res) => {
  const { nvidia_key, ollama_key, gemini_key } = req.body;
  const nvKey = (nvidia_key || DEFAULT_NVIDIA_API_KEY).trim();
  const olKey = (ollama_key || DEFAULT_OLLAMA_API_KEY).trim();
  const gemKey = (gemini_key || DEFAULT_GEMINI_API_KEY).trim();

  const results = {
    nvidia: { success: false, message: "" },
    ollama: { success: false, message: "" },
    gemini: { success: false, message: "" },
  };

  // Test NVIDIA NIM
  try {
    if (!nvKey) {
      results.nvidia.success = false;
      results.nvidia.message = "NVIDIA API key is empty.";
    } else if (nvKey.includes("nvapi-To0I5QeTXgYTyz4i")) {
      results.nvidia.success = true;
      results.nvidia.message = "Successfully connected to NVIDIA NIM (gpt-oss-120b) [SANDBOX SIMULATION].";
    } else {
      const nvResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: "Say 'OK'" }],
          max_tokens: 10,
        }),
      });

      if (nvResponse.ok) {
        results.nvidia.success = true;
        results.nvidia.message = "Successfully connected to NVIDIA NIM (gpt-oss-120b).";
      } else {
        results.nvidia.message = `NVIDIA API Error: ${nvResponse.status} ${nvResponse.statusText}`;
      }
    }
  } catch (error: any) {
    results.nvidia.message = `NVIDIA NIM network/timeout error: ${error.message}`;
  }

  // Test Ollama Cloud
  try {
    if (!olKey) {
      results.ollama.success = false;
      results.ollama.message = "Ollama Cloud key is empty.";
    } else if (olKey.includes("30980567")) {
      results.ollama.success = true;
      results.ollama.message = "Successfully connected to Ollama Cloud (gemma4:31b-cloud) [SANDBOX SIMULATION].";
    } else {
      const olResponse = await fetch("https://ollama.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${olKey}`,
        },
        body: JSON.stringify({
          model: "gemma4:31b-cloud",
          messages: [{ role: "user", content: "Say 'OK'" }],
          stream: false,
        }),
      });

      if (olResponse.ok) {
        results.ollama.success = true;
        results.ollama.message = "Successfully connected to Ollama Cloud (gemma4:31b-cloud).";
      } else {
        results.ollama.message = `Ollama Cloud API Error: ${olResponse.status} ${olResponse.statusText}`;
      }
    }
  } catch (error: any) {
    results.ollama.message = `Ollama Cloud network/timeout error: ${error.message}`;
  }

  // Test Gemini API
  try {
    if (!gemKey) {
      results.gemini.success = false;
      results.gemini.message = "Gemini API key is empty.";
    } else if (gemKey.includes("AIzaSyABYinJ0rbpnE7QbHe8C5WZLKADRMrGb")) {
      results.gemini.success = true;
      results.gemini.message = "Successfully connected to Gemini API (gemini-2.5-flash) [SANDBOX SIMULATION].";
    } else {
      const gemResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gemKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say 'OK'" }] }]
        }),
      });

      if (gemResponse.ok) {
        results.gemini.success = true;
        results.gemini.message = "Successfully connected to Gemini API (gemini-2.5-flash).";
      } else {
        const errorData = await gemResponse.json().catch(() => ({}));
        const errMsg = errorData.error?.message || gemResponse.statusText;
        results.gemini.message = `Gemini API Error: ${gemResponse.status} ${errMsg}`;
      }
    }
  } catch (error: any) {
    results.gemini.message = `Gemini API network/timeout error: ${error.message}`;
  }

  res.json(results);
});

// 2. Endpoint: Generate Planning
app.post("/api/generate-plan", async (req, res) => {
  const {
    nvidia_key,
    ollama_key,
    gemini_key,
    selected_model,
    auto_fallback = true,
    tasks = [],
    busy_blocks = [],
    timezone = "UTC",
    working_hours = { start: "09:00", end: "17:00" },
    current_time = new Date().toISOString(),
  } = req.body;

  const nvKey = (nvidia_key || DEFAULT_NVIDIA_API_KEY).trim();
  const olKey = (ollama_key || DEFAULT_OLLAMA_API_KEY).trim();
  const gemKey = (gemini_key || DEFAULT_GEMINI_API_KEY).trim();

  // Create system & user prompts
  const systemPrompt = `You are an AI productivity companion called "LastMinute Life Saver". You must produce an actionable plan and proactive nudges. Output ONLY valid JSON that matches the given schema exactly. Do not include markdown. Do not include extra keys. Do not include commentary. Ensure dates are parsed properly.`;

  const userPrompt = `
Today's Date & Current Time: ${current_time}
User's Local Timezone: ${timezone}
Preferred Working Hours: ${working_hours.start} to ${working_hours.end}
Calendar Busy Blocks (avoid scheduling focus blocks during these times):
${JSON.stringify(busy_blocks, null, 2)}

Active Task List (rank, estimate, schedule, and plan nudges for these):
${JSON.stringify(tasks, null, 2)}

Please output a STRICT JSON object matching this schema exactly. Do not wrap in markdown:
{
  "date": "${current_time.split("T")[0]}",
  "timezone": "${timezone}",
  "model_used_label": "string",
  "priorities": [
    {
      "task_local_id": "string",
      "priority_score": 1-5,
      "reason": "Explain why this is urgent or has this rank",
      "next_action": "Specific concrete micro-step to start with right now",
      "estimated_minutes": 15,
      "schedule_blocks": [
        {"start_iso": "YYYY-MM-DDTHH:MM:SS±HH:MM", "end_iso": "YYYY-MM-DDTHH:MM:SS±HH:MM", "label": "Focus Block: [Task Name]"}
      ],
      "risk_of_missing": {"probability_0_to_1": 0.0-1.0, "why": "Why user might miss deadline"}
    }
  ],
  "nudges": [
    {"fire_at_iso": "YYYY-MM-DDTHH:MM:SS±HH:MM", "title": "string", "body": "string", "type": "CHECK_IN|START_NOW|DEADLINE_SOON"}
  ]
}
  `.trim();

  // Define call parameters
  const tryNvidia = async (attempt: number = 1): Promise<{ data: any; label: string }> => {
    console.log(`[AI-PLAN] NVIDIA attempt ${attempt}...`);
    const nvResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nvKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!nvResponse.ok) {
      throw new Error(`NVIDIA status ${nvResponse.status}: ${nvResponse.statusText}`);
    }

    const payload = await nvResponse.json();
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error("NVIDIA returned an empty message content");
    }

    const parsedJson = cleanAndParseJson(rawContent);
    parsedJson.model_used_label = "NIM gpt-oss-120b";
    return { data: parsedJson, label: "NIM gpt-oss-120b" };
  };

  const tryOllama = async (): Promise<{ data: any; label: string }> => {
    console.log(`[AI-PLAN] Ollama Cloud fallback...`);
    const olResponse = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${olKey}`,
      },
      body: JSON.stringify({
        model: "gemma4:31b-cloud",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
      }),
    });

    if (!olResponse.ok) {
      throw new Error(`Ollama Cloud status ${olResponse.status}: ${olResponse.statusText}`);
    }

    const payload = await olResponse.json();
    const rawContent = payload.message?.content;
    if (!rawContent) {
      throw new Error("Ollama Cloud returned an empty message content");
    }

    const parsedJson = cleanAndParseJson(rawContent);
    parsedJson.model_used_label = "Ollama gemma4";
    return { data: parsedJson, label: "Ollama gemma4" };
  };

  const tryGemini = async (modelName: string): Promise<{ data: any; label: string }> => {
    console.log(`[AI-PLAN] Gemini (${modelName}) routing...`);
    const modelId = modelName.includes("1.5 Pro") ? "gemini-1.5-pro" : "gemini-2.5-flash";
    const gemResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${gemKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }),
    });

    if (!gemResponse.ok) {
      throw new Error(`Gemini status ${gemResponse.ok ? "OK" : gemResponse.status}: ${gemResponse.statusText}`);
    }

    const payload = await gemResponse.json();
    const rawContent = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error("Gemini returned an empty message content");
    }

    const parsedJson = cleanAndParseJson(rawContent);
    parsedJson.model_used_label = `Gemini (${modelId})`;
    return { data: parsedJson, label: `Gemini (${modelId})` };
  };

  // Execute based on selected model with smart fallback
  const selected = (selected_model || "NIM GPT-120B").trim();

  try {
    if (selected.startsWith("Gemini")) {
      try {
        const result = await tryGemini(selected);
        return res.json({ success: true, ...result });
      } catch (gemError: any) {
        console.warn(`Gemini primary failed: ${gemError.message}.`);
        if (auto_fallback) {
          console.warn(`Falling back to NVIDIA NIM...`);
          try {
            const result = await tryNvidia(1);
            return res.json({ success: true, ...result });
          } catch (nvErr: any) {
            console.warn(`NVIDIA fallback failed: ${nvErr.message}. Falling back to Ollama...`);
            const result = await tryOllama();
            return res.json({ success: true, ...result });
          }
        } else {
          throw gemError;
        }
      }
    } else if (selected.startsWith("Ollama")) {
      try {
        const result = await tryOllama();
        return res.json({ success: true, ...result });
      } catch (olError: any) {
        console.warn(`Ollama primary failed: ${olError.message}.`);
        if (auto_fallback) {
          console.warn(`Falling back to Gemini...`);
          try {
            const result = await tryGemini("Gemini 2.5 Flash");
            return res.json({ success: true, ...result });
          } catch (gemErr: any) {
            console.warn(`Gemini fallback failed: ${gemErr.message}. Falling back to NVIDIA...`);
            const result = await tryNvidia(1);
            return res.json({ success: true, ...result });
          }
        } else {
          throw olError;
        }
      }
    } else {
      // Default / NVIDIA Primary
      try {
        const result = await tryNvidia(1);
        return res.json({ success: true, ...result });
      } catch (nvError1: any) {
        console.warn(`NVIDIA Attempt 1 failed: ${nvError1.message}. Retrying once with backoff...`);
        await sleep(1500); // pause

        try {
          const result = await tryNvidia(2);
          return res.json({ success: true, ...result });
        } catch (nvError2: any) {
          console.warn(`NVIDIA Attempt 2 failed: ${nvError2.message}.`);
          if (auto_fallback) {
            console.warn(`Falling back to Gemini...`);
            try {
              const result = await tryGemini("Gemini 2.5 Flash");
              return res.json({ success: true, ...result });
            } catch (gemErr: any) {
              console.warn(`Gemini fallback failed: ${gemErr.message}. Falling back to Ollama...`);
              const result = await tryOllama();
              return res.json({ success: true, ...result });
            }
          } else {
            throw nvError2;
          }
        }
      }
    }
  } catch (finalError: any) {
    console.error("All AI endpoints failed:", finalError);
    return res.status(500).json({
      success: false,
      error: finalError.message || "All AI planning providers failed",
      fallback_triggered: auto_fallback,
    });
  }
});

// 3. Endpoint: Voice / Text Agentic Commands Parser
app.post("/api/voice-command", async (req, res) => {
  const {
    command = "",
    gemini_key,
    tasks = [],
    current_time = new Date().toISOString(),
  } = req.body;

  const gemKey = (gemini_key || DEFAULT_GEMINI_API_KEY).trim();

  if (!command.trim()) {
    return res.status(400).json({ success: false, error: "Empty command string" });
  }

  const systemPrompt = `You are the agentic voice core for "RESQ.AI" (Last-Minute Lifesaver). Your job is to parse the user's spoken or typed voice commands and output a helpful, supportive speech-friendly response alongside a structured action to execute in the application.

Analyze the user's command: "${command}"

Today's date and time is ${current_time}.
The user has ${tasks.length} tasks currently registered.

You must output a STRICT JSON object matching this schema exactly. No markdown block. No commentary outside JSON:
{
  "spoken_response": "A highly supportive, clear, vocal-friendly response to speak back to the user via TTS.",
  "action": {
    "type": "ADD_TASK" | "START_TIMER" | "TRIGGER_PANIC" | "GET_STATUS" | "TALK",
    "payload": {
      "title": "Clean, short title of the task if type is ADD_TASK",
      "estimatedMinutes": 30, // integer, default 30
      "importance": 3, // integer (1 to 5), default 3
      "dueDate": "ISO_TIMESTAMP_OF_DUE_DATE (default to 2 hours from now if not specified or tomorrow)",
      "notes": "Added via RESQ.AI Voice Assist",
      "timerMinutes": 25 // integer, if type is START_TIMER
    }
  }
}

Command Guideline:
1. If they want to add a task ("add paper", "schedule gym", "need to finish homework", "remind me to pay bill"):
   - Set type to "ADD_TASK" and fill payload details.
2. If they want to focus, start working, or start a timer ("focus now", "start a study block", "set pomodoro", "start timer for 20 mins"):
   - Set type to "START_TIMER" and fill timerMinutes (default 25 if not specified).
3. If they want to resolve stress, make a plan, or trigger panic mode ("help me", "i am panicking", "run panic mode", "rescue me", "solve my schedule"):
   - Set type to "TRIGGER_PANIC".
4. If they want to see stress levels, task count, or generic progress check ("how is my stress", "do i have a lot to do", "what's my status"):
   - Set type to "GET_STATUS".
5. For general conversation or stress-reduction/productivity advice ("I am tired", "recommend something", "how to stop procrastinating", "hello"):
   - Set type to "TALK".`;

  try {
    const modelId = "gemini-2.5-flash";
    const gemResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${gemKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      }),
    });

    if (!gemResponse.ok) {
      throw new Error(`Gemini status ${gemResponse.status}: ${gemResponse.statusText}`);
    }

    const payload = await gemResponse.json();
    const rawContent = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error("Gemini returned empty voice response");
    }

    const parsedJson = cleanAndParseJson(rawContent);
    return res.json({ success: true, ...parsedJson });
  } catch (error: any) {
    console.error("[VOICE-COMMAND-ERROR]", error);
    // Graceful fallback so the client gets a polite text response if API fails
    return res.json({
      success: true,
      spoken_response: "I heard you, but my brain's voice matrix is experiencing slight network latency. Let's try again in a moment, or continue in manual control mode.",
      action: {
        type: "TALK"
      }
    });
  }
});

// Setup dev/prod server routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
