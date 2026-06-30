import React, { useState } from "react";
import { Settings, Cpu, Layers, RefreshCw, CheckCircle, AlertTriangle, Key, Sparkles, Eye, EyeOff } from "lucide-react";
import { SavedPrefs, sanitizeApiKey } from "../types";

interface PreferencesPanelProps {
  prefs: SavedPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<SavedPrefs>>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function PreferencesPanel({
  prefs,
  setPrefs,
  addSystemLog,
}: PreferencesPanelProps) {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    tested: boolean;
    nvidiaOk: boolean;
    nvidiaMsg: string;
    ollamaOk: boolean;
    ollamaMsg: string;
    geminiOk: boolean;
    geminiMsg: string;
  } | null>(null);

  // Form states matching saved pref records
  const [nvKey, setNvKey] = useState(sanitizeApiKey(prefs.nvidia_key));
  const [olKey, setOlKey] = useState(sanitizeApiKey(prefs.ollama_key));
  const [gemKey, setGemKey] = useState(sanitizeApiKey(prefs.gemini_key));
  const [showNv, setShowNv] = useState(false);
  const [showOl, setShowOl] = useState(false);
  const [showGem, setShowGem] = useState(false);
  const [fallback, setFallback] = useState(prefs.auto_fallback);
  const [whStart, setWhStart] = useState(prefs.working_hours_start);
  const [whEnd, setWhEnd] = useState(prefs.working_hours_end);
  const [tz, setTz] = useState(prefs.timezone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setNvKey(sanitizeApiKey(prefs.nvidia_key));
    setOlKey(sanitizeApiKey(prefs.ollama_key));
    setGemKey(sanitizeApiKey(prefs.gemini_key));
    setFallback(prefs.auto_fallback);
    setWhStart(prefs.working_hours_start || "09:00");
    setWhEnd(prefs.working_hours_end || "17:00");
    setTz(prefs.timezone || "America/Los_Angeles");
  }, [prefs]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNv = sanitizeApiKey(nvKey);
    const cleanOl = sanitizeApiKey(olKey);
    const cleanGem = sanitizeApiKey(gemKey);
    const updated: SavedPrefs = {
      nvidia_key: cleanNv,
      ollama_key: cleanOl,
      gemini_key: cleanGem,
      auto_fallback: fallback,
      working_hours_start: whStart,
      working_hours_end: whEnd,
      timezone: tz,
      selected_model: prefs.selected_model || "NIM GPT-120B",
    };
    setPrefs(updated);
    setNvKey(cleanNv);
    setOlKey(cleanOl);
    setGemKey(cleanGem);
    addSystemLog("Updated credentials configuration in EncryptedSharedPreferences.", "success");
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestEndpoints = async () => {
    setTesting(true);
    setTestResults(null);
    addSystemLog("Running live ping diagnostics to NVIDIA, Ollama, and Gemini Cloud servers...", "info");

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nvidia_key: nvKey,
          ollama_key: olKey,
          gemini_key: gemKey,
        }),
      });

      const data = await response.json();
      setTestResults({
        tested: true,
        nvidiaOk: data.nvidia.success,
        nvidiaMsg: data.nvidia.message,
        ollamaOk: data.ollama.success,
        ollamaMsg: data.ollama.message,
        geminiOk: data.gemini.success,
        geminiMsg: data.gemini.message,
      });

      if (data.nvidia.success && data.ollama.success && data.gemini.success) {
        addSystemLog("All three AI provider gateways verified and online!", "success");
      } else {
        addSystemLog("Connection diagnostics completed with partial or failed responses.", "warning");
      }
    } catch (err: any) {
      addSystemLog(`Diagnostics network failure: ${err.message}`, "error");
      setTestResults({
        tested: true,
        nvidiaOk: false,
        nvidiaMsg: `NIM timeout or network blocking: ${err.message}`,
        ollamaOk: false,
        ollamaMsg: "Ollama gateway offline.",
        geminiOk: false,
        geminiMsg: `Gemini API network failure: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col h-full lg:h-[480px] min-h-[440px]" id="preferences-panel-widget">
      
      {/* Title info */}
      <div className="border-b border-neutral-800 pb-3 mb-4 shrink-0">
        <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
          <Settings className="w-4 h-4 text-neutral-400" />
          Secure AI Gateways
        </h2>
        <p className="text-[10px] text-neutral-400">Keys are processed server-side in Express API proxy</p>
      </div>

      <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0" id="prefs-form">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          
          {/* NVIDIA Key */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase mb-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                NVIDIA NIM API Key
              </span>
              <span className="text-[8px] bg-neutral-950 border border-neutral-800 text-neutral-500 px-1.5 py-0.2 rounded uppercase">Primary</span>
            </label>
            <div className="relative">
              <Key className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type={showNv ? "text" : "password"}
                value={nvKey}
                onChange={e => setNvKey(e.target.value)}
                placeholder="•••••••• [Server-Configured Default]"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg pl-8 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNv(!showNv)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
              >
                {showNv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Ollama Key */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase mb-1">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Ollama Cloud Access Key
              </span>
              <span className="text-[8px] bg-neutral-950 border border-neutral-800 text-neutral-500 px-1.5 py-0.2 rounded uppercase">Fallback</span>
            </label>
            <div className="relative">
              <Key className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type={showOl ? "text" : "password"}
                value={olKey}
                onChange={e => setOlKey(e.target.value)}
                placeholder="•••••••• [Server-Configured Default]"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg pl-8 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowOl(!showOl)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
              >
                {showOl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase mb-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                Gemini API Key
              </span>
              <span className="text-[8px] bg-neutral-950 border border-neutral-800 text-neutral-500 px-1.5 py-0.2 rounded uppercase">Flexible</span>
            </label>
            <div className="relative">
              <Key className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type={showGem ? "text" : "password"}
                value={gemKey}
                onChange={e => setGemKey(e.target.value)}
                placeholder="•••••••• [Server-Configured Default]"
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg pl-8 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGem(!showGem)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
              >
                {showGem ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Fallback & Time settings */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-neutral-400 uppercase cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={fallback}
                  onChange={e => setFallback(e.target.checked)}
                  className="rounded border-neutral-800 text-amber-500 focus:ring-amber-500"
                />
                Auto Fallback
              </label>
              <span className="text-[8px] text-neutral-500 mt-0.5 leading-tight">Switch provider if primary NIM errors</span>
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">Timezone</label>
              <input
                type="text"
                value={tz}
                onChange={e => setTz(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded px-2 py-0.5 text-[10px] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Working hours bounds */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">Shift Start</label>
              <input
                type="time"
                value={whStart}
                onChange={e => setWhStart(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded px-2 py-0.5 text-[10px] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase mb-0.5">Shift End</label>
              <input
                type="time"
                value={whEnd}
                onChange={e => setWhEnd(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded px-2 py-0.5 text-[10px] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Test Diagnostics and Save */}
        <div className="pt-4 border-t border-neutral-800 space-y-2 shrink-0">
          {testResults && (
            <div className="bg-neutral-950 border border-neutral-850 p-2 rounded-lg text-[10px] font-mono space-y-1 animate-fade-in" id="test-diagnostics-results">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${testResults.nvidiaOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></span>
                <span className="text-neutral-300">NVIDIA:</span>
                <span className={testResults.nvidiaOk ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {testResults.nvidiaOk ? "CONNECTED" : "FAILED"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${testResults.ollamaOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></span>
                <span className="text-neutral-300">Ollama:</span>
                <span className={testResults.ollamaOk ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {testResults.ollamaOk ? "CONNECTED" : "FAILED"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${testResults.geminiOk ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></span>
                <span className="text-neutral-300">Gemini:</span>
                <span className={testResults.geminiOk ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {testResults.geminiOk ? "CONNECTED" : "FAILED"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTestEndpoints}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 text-[11px] font-mono tracking-wider transition cursor-pointer"
              id="btn-test-ping"
            >
              {testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              )}
              PING CHECK
            </button>
 
            <button
              type="submit"
              className={`flex-1 px-3 py-2 font-black text-[11px] font-mono tracking-wider rounded-xl transition cursor-pointer shadow uppercase ${
                saveSuccess
                  ? "bg-emerald-500 hover:bg-emerald-600 text-neutral-950"
                  : "bg-amber-500 hover:bg-amber-600 text-neutral-950"
              }`}
              id="btn-save-prefs"
            >
              {saveSuccess ? "✓ SAVED SECURELY" : "SAVE SETTINGS"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
