import { chromium } from "playwright";

async function run() {
  console.log("=== STARTING PLAYWRIGHT SECURITY AND FUNCTIONALITY TESTS ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to local development server http://localhost:3000 ...");
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    
    // 1. Verify page title & loading state
    const title = await page.title();
    console.log(`[PASS] Connected successfully. Page Title: "${title}"`);

    // 2. Scan entire DOM content for any exposed secret signatures
    const content = await page.content();
    
    const leakedNvidia = content.includes("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");
    const leakedOllama = content.includes("30980567d66e4e4daee28951c3c7dd61.arAY7BW--sI5vAT9OTpnk1dR");
    const leakedGemini = content.includes("AIzaSyABYinJ0rbpnE7QbHe8C5WZLKADRMrGb");

    console.log("\n--- Client-side DOM Key Exposure Scan ---");
    if (leakedNvidia) {
      console.error("[FAIL] ERROR: Hardcoded NVIDIA NIM key exposed in frontend DOM!");
    } else {
      console.log("[PASS] NVIDIA key is secure. Not exposed in DOM.");
    }

    if (leakedOllama) {
      console.error("[FAIL] ERROR: Hardcoded Ollama Cloud key exposed in frontend DOM!");
    } else {
      console.log("[PASS] Ollama key is secure. Not exposed in DOM.");
    }

    if (leakedGemini) {
      console.error("[FAIL] ERROR: Hardcoded Gemini key exposed in frontend DOM!");
    } else {
      console.log("[PASS] Gemini key is secure. Not exposed in DOM.");
    }

    // 3. Scan localStorage
    const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
    const leakedInLocalStorage = localStorageData.includes("AIzaSy") || localStorageData.includes("nvapi-") || localStorageData.includes("30980567");
    
    console.log("\n--- Client-side LocalStorage Key Exposure Scan ---");
    if (leakedInLocalStorage) {
      console.error("[FAIL] ERROR: Local preferences leaked actual secrets into localStorage!");
      console.log("LocalStorage dump:", localStorageData);
    } else {
      console.log("[PASS] LocalStorage is clean. No credentials saved locally.");
    }

    // 4. Test API response to make sure the app functions properly with server-side keys
    console.log("\n--- Testing API Route Proxy /api/generate-plan ---");
    const apiTestResponse = await page.evaluate(async () => {
      try {
        const res = await fetch("/api/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selected_model: "Gemini 2.5 Flash",
            auto_fallback: true,
            tasks: [
              {
                id: "test-task",
                title: "Complete security testing",
                dueDate: new Date(Date.now() + 3600 * 1000).toISOString(),
                estimatedMinutes: 30,
                importance: 5,
                completed: false,
                subtasks: [],
                notes: ""
              }
            ],
            busy_blocks: [],
            timezone: "UTC"
          })
        });
        return { status: res.status, ok: res.ok, data: await res.json() };
      } catch (err) {
        return { status: 0, ok: false, error: err.message };
      }
    });

    if (apiTestResponse.ok && apiTestResponse.data?.success) {
      console.log("[PASS] Server successfully handled Gemini routing and planning generation using secure server-side credentials!");
      console.log(`[PASS] AI Model Used Label: ${apiTestResponse.data.model_used_label}`);
    } else {
      console.error("[FAIL] API routing or execution failed:", apiTestResponse);
    }

    if (leakedNvidia || leakedOllama || leakedGemini || leakedInLocalStorage || !apiTestResponse.data?.success) {
      console.error("\n=== RESULT: TESTING FAILED (SECURITY EXPOSURE OR API ROUTING BREAKAGE) ===");
      process.exit(1);
    } else {
      console.log("\n=== RESULT: ALL SECURITY & FUNCTIONAL TESTS COMPLETED SUCCESSFULLY ===");
      console.log("No API keys are exposed to the client. The system is secure!");
      process.exit(0);
    }

  } catch (err) {
    console.error("Test execution encountered an uncaught error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
