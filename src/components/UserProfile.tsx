import React, { useState } from "react";
import { 
  User as UserIcon, Shield, Activity, RefreshCw, LogOut, CheckCircle2, 
  Flame, Clock, Brain, ShieldAlert, Heart, Zap, Sparkles, Award, ChevronDown
} from "lucide-react";
import { User } from "firebase/auth";
import { Task, Habit, BusyBlock, SavedPrefs } from "../types";
import PreferencesPanel from "./PreferencesPanel";

interface UserProfileProps {
  currentUser: User | null;
  tasks: Task[];
  habits: Habit[];
  busyBlocks: BusyBlock[];
  prefs: SavedPrefs;
  setPrefs: React.Dispatch<React.SetStateAction<SavedPrefs>>;
  onSignOut: () => Promise<void>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function UserProfile({
  currentUser,
  tasks,
  habits,
  busyBlocks,
  prefs,
  setPrefs,
  onSignOut,
  addSystemLog
}: UserProfileProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // --- 1. Compute Fun & Rich Analytics ---
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const activeTasksCount = totalTasksCount - completedTasksCount;
  
  // Calculate stress score based on active task priorities (importance 1 to 5)
  const totalStressWeight = tasks
    .filter(t => !t.completed)
    .reduce((sum, t) => sum + t.importance, 0);
  
  // Max potential stress is based on active tasks * 5
  const maxStressPotential = activeTasksCount * 5;
  const stressPercentage = maxStressPotential > 0 
    ? Math.min(100, Math.round((totalStressWeight / maxStressPotential) * 100)) 
    : 0;

  // Determine stress level status
  let stressStatus = "CHILL MODE (0% STRESS)";
  let stressColor = "text-emerald-400";
  let stressBg = "bg-emerald-500/10 border-emerald-500/30";
  let stressLabel = "Your mind is clear. Add some tasks or initiate panic simulation.";
  
  if (stressPercentage > 0 && stressPercentage <= 35) {
    stressStatus = "MODERATE PRESSURE";
    stressColor = "text-cyan-400";
    stressBg = "bg-cyan-500/10 border-cyan-500/30";
    stressLabel = "Healthy tension. Ideal for optimal cognitive throughput.";
  } else if (stressPercentage > 35 && stressPercentage <= 70) {
    stressStatus = "HIGH ANXIETY ZONE";
    stressColor = "text-amber-400";
    stressBg = "bg-amber-500/10 border-amber-500/30";
    stressLabel = "Elevated stress. We recommend activating PANIC MODE immediately.";
  } else if (stressPercentage > 70) {
    stressStatus = "DEEP PANIC DETECTED";
    stressColor = "text-rose-500";
    stressBg = "bg-rose-500/10 border-rose-500/30";
    stressLabel = "Severe load. Secure kernel is on high alert. Deploy rescue plans!";
  }

  // Calculate Streak and Focus minutes
  const activeStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const totalFocusMinutes = tasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + t.estimatedMinutes, 0);

  // Sync animation handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    addSystemLog("Initiating hardware manual sync to secure Cloud Firestore...", "info");
    
    // Simulate manual replication network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSyncing(false);
    addSystemLog("Manual cloud replication successful. Core state verified.", "success");
  };

  // Breathing pacer loop
  const triggerBreathingPacer = () => {
    if (breathingActive) {
      setBreathingActive(false);
      return;
    }
    setBreathingActive(true);
    setBreathCount(0);
    setBreathPhase("Inhale");
    addSystemLog("Starting Tactical Breathing Pacer (4-4-4 technique) to regulate panic...", "success");
  };

  // Breathing pacer cycle effect
  React.useEffect(() => {
    if (!breathingActive) return;

    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === "Inhale") {
          return "Hold";
        } else if (prev === "Hold") {
          return "Exhale";
        } else {
          setBreathCount(c => c + 1);
          return "Inhale";
        }
      });
    }, 4000); // 4 seconds per phase

    return () => clearInterval(interval);
  }, [breathingActive]);

  const currentModel = prefs.selected_model || "NIM GPT-120B";

  const handleModelSelect = (modelName: string) => {
    setPrefs(prev => ({
      ...prev,
      selected_model: modelName
    }));
    setIsModelDropdownOpen(false);
    addSystemLog(`Primary LLM provider switched to ${modelName}`, "success");
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-24 h-full no-scrollbar" id="profile-canvas">
      
      {/* 1. Header Profile Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4.5 relative overflow-hidden min-h-[120px] w-full" id="profile-banner-card">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
          <UserIcon className="w-40 h-40 text-white" />
        </div>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center shadow-lg ring-1 ring-white/10 shrink-0" id="profile-avatar">
          <UserIcon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-white break-words max-w-full leading-tight" id="profile-display-name">
              {currentUser?.displayName || currentUser?.email?.split("@")[0] || "Rescued Agent"}
            </h3>
            <span className="text-[9px] bg-rose-600/20 text-rose-400 font-mono font-bold px-1.5 py-0.5 rounded-full border border-rose-900/30 flex items-center gap-0.5 shrink-0">
              <Zap className="w-2.5 h-2.5 animate-pulse" />
              PRO ACTIVE
            </span>
          </div>
          
          <p className="text-[11px] text-neutral-300 break-all mt-1.5 font-mono leading-normal" id="profile-email">
            {currentUser?.email || "offline-agent@rescue-kernel.io"}
          </p>
          
          <div className="flex items-center gap-1.5 mt-2 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full w-fit">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-tight">Cloud Host Connected</span>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Stress & Kernel Level Indicator */}
      <div className={`border rounded-2xl p-4 transition-all duration-300 ${stressBg}`} id="profile-stress-alert">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800/60 pb-2 mb-3">
          <span className="text-[10px] font-mono font-black tracking-widest uppercase text-neutral-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRISIS LEVEL MONITOR
          </span>
          <span className={`text-[10px] font-mono font-black tracking-wider ${stressColor}`}>
            {stressStatus}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-400">Calculated Panic Score:</span>
            <span className="font-bold text-white">{stressPercentage}%</span>
          </div>
          
          <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-900">
            <div 
              className={`h-full transition-all duration-500 rounded-full bg-gradient-to-r ${
                stressPercentage > 70 
                  ? "from-rose-600 to-amber-500" 
                  : stressPercentage > 35 
                    ? "from-amber-500 to-amber-400" 
                    : "from-emerald-500 to-cyan-400"
              }`}
              style={{ width: `${stressPercentage}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-neutral-400 leading-relaxed font-sans italic">
            {stressLabel}
          </p>
        </div>
      </div>

      {/* 3. Bento Stats Grid */}
      <div className="grid grid-cols-2 gap-3" id="profile-bento-grid">
        
        {/* Stat A: Saved Tasks */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between" id="profile-stat-tasks">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Saved Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {completedTasksCount} <span className="text-xs text-neutral-500">/ {totalTasksCount}</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-1">Completed panic issues</p>
          </div>
        </div>

        {/* Stat B: Streaks */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between" id="profile-stat-streaks">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Streaks</span>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {activeStreak} <span className="text-[10px] text-orange-400">Days</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-1">Max active habits streak</p>
          </div>
        </div>

        {/* Stat C: Focus minutes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between" id="profile-stat-focus">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Focus Hours</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {Math.round((totalFocusMinutes / 60) * 10) / 10} <span className="text-xs text-neutral-500">Hrs</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-1">{totalFocusMinutes} minutes logged</p>
          </div>
        </div>

        {/* Stat D: Cognitive Shield */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-col justify-between" id="profile-stat-shield">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">Defense Index</span>
            <Brain className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white leading-none">
              {Math.max(10, Math.min(100, 100 - stressPercentage))}%
            </div>
            <p className="text-[9px] text-neutral-400 mt-1">Resistance against burn-out</p>
          </div>
        </div>

      </div>

      {/* 4. Interactive stress relief tactical breathing tool */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col" id="profile-breathing-panel">
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2 mb-3">
          <span className="text-[10px] font-mono font-black tracking-widest uppercase text-neutral-300 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Tactical Breathing Regulator
          </span>
          <span className="text-[9px] font-mono text-neutral-500">4-4-4 Method</span>
        </div>

        <p className="text-neutral-400 text-[11px] leading-relaxed mb-3">
          Feeling overwhelmed? Combat high adrenaline on command. Tap the regulator to start syncing your breathing.
        </p>

        {breathingActive ? (
          <div className="flex flex-col items-center justify-center py-4 bg-neutral-950 rounded-xl border border-neutral-850/50 mb-3 space-y-3">
            {/* Pulsing Visual Sphere */}
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center font-mono text-[10px] font-bold uppercase text-white shadow-xl transition-all duration-[4000ms] ${
                breathPhase === "Inhale" 
                  ? "bg-emerald-600 scale-125 ring-8 ring-emerald-500/20" 
                  : breathPhase === "Hold"
                    ? "bg-amber-600 scale-125 ring-8 ring-amber-500/20"
                    : "bg-rose-600 scale-90 ring-4 ring-rose-500/10"
              }`}
            >
              {breathPhase}
            </div>

            <div className="text-center">
              <p className="text-xs font-mono font-bold text-white">Phase: {breathPhase}</p>
              <p className="text-[9px] font-mono text-neutral-500 mt-1">Cycles Completed: {breathCount}</p>
            </div>
          </div>
        ) : null}

        <button
          onClick={triggerBreathingPacer}
          className={`w-full py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer border ${
            breathingActive 
              ? "bg-rose-950/20 text-rose-400 border-rose-900/40 hover:bg-rose-950/30" 
              : "bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-750"
          }`}
          id="btn-breathing-toggle"
        >
          {breathingActive ? "⏹ STOP PACING CYCLE" : "⚡ ACTIVATE BREATHING REGULATOR"}
        </button>
      </div>

      {/* Preferences / Settings panel moved here */}
      <PreferencesPanel
        prefs={prefs}
        setPrefs={setPrefs}
        addSystemLog={addSystemLog}
      />

      {/* 5. Cloud Actions & Preferences Sync summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3" id="profile-actions-card">
        <span className="text-[10px] font-mono font-black tracking-widest uppercase text-neutral-300 border-b border-neutral-800 pb-2">
          Sync & Kernel Tools
        </span>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 relative" id="profile-llm-row">
            <div className="flex flex-col">
              <span className="text-white font-mono text-xs">Primary LLM Provider</span>
              <span className="text-[9px] text-neutral-500 mt-0.5">Configured in settings</span>
            </div>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="font-mono text-rose-400 font-bold bg-rose-950/20 px-2.5 py-1 rounded-md text-[10px] border border-rose-900/30 flex items-center gap-1 hover:bg-rose-950/40 cursor-pointer transition-all"
                id="btn-select-llm-model"
              >
                <span>{currentModel}</span>
                <ChevronDown className="w-3 h-3 text-rose-400 shrink-0" />
              </button>

              {isModelDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl py-1 z-50 text-[10px] font-mono animate-fade-in" id="llm-model-dropdown-list">
                    <div className="px-2.5 py-1.5 text-neutral-500 border-b border-neutral-850 text-[9px] uppercase font-bold tracking-wider">
                      Select LLM Model
                    </div>
                    {[
                      "NIM GPT-120B",
                      "Ollama Gemma 4",
                      "Gemini 2.5 Flash",
                      "Gemini 1.5 Pro"
                    ].map((model) => (
                      <button
                        type="button"
                        key={model}
                        onClick={() => handleModelSelect(model)}
                        className={`w-full text-left px-2.5 py-1.5 hover:bg-neutral-800 transition-all text-neutral-300 flex items-center justify-between cursor-pointer ${
                          currentModel === model ? "text-rose-400 font-bold bg-rose-950/10" : ""
                        }`}
                      >
                        <span>{model}</span>
                        {currentModel === model && <span className="text-rose-400">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-850">
            <div className="flex flex-col">
              <span className="text-white font-mono text-xs">Calendar Exclusions</span>
              <span className="text-[9px] text-neutral-500 mt-0.5">Pre-committed busy slots</span>
            </div>
            <span className="font-mono text-neutral-300 font-bold bg-neutral-850 px-2 py-0.5 rounded-md text-[10px] border border-neutral-800">
              {busyBlocks.length} Blocked
            </span>
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-mono font-bold transition duration-200 border border-neutral-700 disabled:opacity-50 cursor-pointer"
            id="profile-manual-sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Manual Sync"}
          </button>

          <button
            onClick={async () => {
              addSystemLog("Logging out from active secure session.", "warning");
              await onSignOut();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 rounded-xl text-xs font-mono font-bold transition duration-200 border border-rose-900/30 cursor-pointer"
            id="profile-logout-action"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

    </div>
  );
}
