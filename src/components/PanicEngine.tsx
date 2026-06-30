import React, { useState, useEffect } from "react";
import { AlertCircle, Flame, ShieldAlert, Sparkles, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowRight, Clock, HelpCircle } from "lucide-react";
import { Task, BusyBlock, SavedPrefs, PlanningResponse } from "../types";

interface PanicEngineProps {
  tasks: Task[];
  busyBlocks: BusyBlock[];
  prefs: SavedPrefs;
  planningResponse: PlanningResponse | null;
  setPlanningResponse: React.Dispatch<React.SetStateAction<PlanningResponse | null>>;
  isAiLoading: boolean;
  setIsAiLoading: (loading: boolean) => void;
  setSimulatedNudgesHistory: React.Dispatch<React.SetStateAction<Array<{ id: string; time: string; title: string; body: string; type: string }>>>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function PanicEngine({
  tasks,
  busyBlocks,
  prefs,
  planningResponse,
  setPlanningResponse,
  isAiLoading,
  setIsAiLoading,
  setSimulatedNudgesHistory,
  addSystemLog,
}: PanicEngineProps) {
  const [loadingStep, setLoadingStep] = useState(0);
  const [panicElapsedTime, setPanicElapsedTime] = useState(0);
  const [panicTimerInterval, setPanicTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const steps = [
    "Harvesting active stressor checklist...",
    "Validating calendar exclusion collisions...",
    "Querying primary NVIDIA NIM (gpt-oss-120b)...",
    "Engaging backoff protocols...",
    "Executing Ollama (gemma4:31b) fallback route...",
    "Stripping formatting wrappers & rendering results..."
  ];

  // Loading steps animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAiLoading) {
      setLoadingStep(0);
      setPanicElapsedTime(0);
      
      const startTime = Date.now();
      const timeInterval = setInterval(() => {
        setPanicElapsedTime(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
      setPanicTimerInterval(timeInterval);

      interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev < 2) return prev + 1; // NIM steps
          return prev;
        });
      }, 1200);
    } else {
      if (panicTimerInterval) clearInterval(panicTimerInterval);
      setPanicTimerInterval(null);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (panicTimerInterval) clearInterval(panicTimerInterval);
    };
  }, [isAiLoading]);

  const handlePanicRescue = async () => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      addSystemLog("Rescue aborted: Active task list is empty or all tasks are completed! Please add tasks first.", "warning");
      return;
    }

    setIsAiLoading(true);
    setPlanningResponse(null);
    addSystemLog("🚨 Panic Mode Activated! Initiating Real-Time Survival Solver...", "warning");
    addSystemLog("Polling local conflict constraints...", "info");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nvidia_key: prefs.nvidia_key,
          ollama_key: prefs.ollama_key,
          gemini_key: prefs.gemini_key,
          selected_model: prefs.selected_model,
          auto_fallback: prefs.auto_fallback,
          tasks: activeTasks.map(t => ({
            task_local_id: t.id,
            title: t.title,
            due_iso: t.dueDate,
            estimated_minutes: t.estimatedMinutes,
            importance: t.importance,
            notes: t.notes
          })),
          busy_blocks: busyBlocks.map(b => ({
            label: b.label,
            start_iso: b.start,
            end_iso: b.end
          })),
          timezone: prefs.timezone,
          working_hours: {
            start: prefs.working_hours_start,
            end: prefs.working_hours_end
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to output plan.");
      }

      const payload = await response.json();
      if (payload.success && payload.data) {
        const parsedPlan: PlanningResponse = payload.data;
        setPlanningResponse(parsedPlan);
        
        // Populate nudges in local tracker
        if (parsedPlan.nudges && parsedPlan.nudges.length > 0) {
          const freshNudges = parsedPlan.nudges.map((n, idx) => ({
            id: `nudge-${Date.now()}-${idx}`,
            time: n.fire_at_iso ? n.fire_at_iso.substring(11, 16) : "12:00",
            title: n.title || "Proactive Ping",
            body: n.body || "Start focused slot now.",
            type: n.type || "CHECK_IN"
          }));
          setSimulatedNudgesHistory(freshNudges);
        }

        addSystemLog(`Rescue plan successfully drafted in ${panicElapsedTime}s via ${parsedPlan.model_used_label}!`, "success");
      } else {
        throw new Error("Malformatted payload received from Express server.");
      }
    } catch (error: any) {
      addSystemLog(`Rescue engine failure: ${error.message}`, "error");
      addSystemLog("Please ensure your secure AI keys are correct in Settings.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-6 shadow-xl flex flex-col lg:h-full h-auto relative lg:overflow-hidden overflow-visible" id="panic-engine-widget">
      
      {/* Visual glowing highlight overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

      {/* Centerpiece panic call-to-action */}
      <div className="text-center pb-3.5 sm:pb-5 border-b border-neutral-800 shrink-0" id="panic-header">
        <h2 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight font-display uppercase flex items-center justify-center gap-2">
          <Flame className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
          The Survival Engine
        </h2>
        <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">
          Compute absolute focus slots and actionable next steps in 1-click
        </p>

        {/* Dynamic Big Red Panic Button */}
        <div className="mt-4 relative inline-block">
          {isAiLoading && (
            <span className="absolute inset-0 rounded-full bg-rose-600/30 blur-xl animate-ping"></span>
          )}
          <button
            onClick={handlePanicRescue}
            disabled={isAiLoading}
            className={`px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-black text-xs sm:text-sm font-mono tracking-wider sm:tracking-widest uppercase transition duration-300 shadow-2xl relative select-none cursor-pointer ${
              isAiLoading
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                : "bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white border-2 border-rose-400/40 transform hover:scale-105 active:scale-95"
            }`}
            id="btn-trigger-panic"
          >
            {isAiLoading ? "RESCUING IN PROGRESS..." : "⚡ ACTIVATE PANIC MODE"}
          </button>
        </div>
      </div>

      {/* Main result viewer */}
      <div className="flex-1 flex flex-col min-h-0 pt-3 sm:pt-4">
        {isAiLoading ? (
          <div className="text-center py-8 sm:py-12 flex flex-col items-center justify-center" id="panic-loading-container">
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 animate-spin mb-3 sm:mb-4" />
            <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-300">
              ELAPSED TIME: <span className="text-rose-500">{panicElapsedTime}s</span>
            </div>
            
            <div className="mt-3 sm:mt-4 bg-neutral-950 border border-neutral-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl max-w-sm text-center">
              <span className="text-[9px] sm:text-[10px] text-amber-500 uppercase font-mono tracking-wider font-bold block mb-0.5 sm:mb-1">
                Active Operation
              </span>
              <p className="text-[11px] sm:text-xs text-neutral-300 font-mono animate-pulse">
                {steps[loadingStep] || "Processing schedules with high-performance LLM..."}
              </p>
            </div>

            <div className="mt-4 sm:mt-6 flex gap-1 items-center justify-center text-[9px] sm:text-[10px] text-neutral-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping mr-1"></span>
              <span>NVIDIA NIM dual-provider fallback loop engaged</span>
            </div>
          </div>
        ) : planningResponse ? (
          <div className="flex-1 flex flex-col min-h-0" id="rescue-plan-results">
            
            {/* Header info bar of results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 mb-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] sm:text-xs text-neutral-300 font-bold tracking-tight">RESCUE PLAN GENERATED</span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 shrink-0 self-start sm:self-auto">
                <Layers className="w-2.5 h-2.5 text-sky-400" />
                <span>Provider: {planningResponse.model_used_label}</span>
              </div>
            </div>

            {/* List of priority schedule cards */}
            <div className="flex-1 lg:overflow-y-auto overflow-visible space-y-3 sm:space-y-4 pr-1 pb-4" id="rescue-cards-scroll">
              {planningResponse.priorities && planningResponse.priorities.map((p, idx) => {
                const matchedTask = tasks.find(t => t.id === p.task_local_id);
                const taskName = matchedTask ? matchedTask.title : `Task ${idx + 1}`;
                const riskPercent = Math.round(p.risk_of_missing.probability_0_to_1 * 100);
                
                return (
                  <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 sm:p-4 relative hover:border-neutral-700 transition duration-150" id={`rescue-card-${idx}`}>
                    
                    {/* Urgency Rank and Title block */}
                    <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2.5 border-b border-neutral-900 pb-2 mb-2">
                      <div className="flex items-start gap-1.5 min-w-0">
                        <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 bg-rose-950/80 text-rose-400 rounded-full flex items-center justify-center font-mono font-black text-[10px] sm:text-xs shrink-0 border border-rose-500/30">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-[11px] sm:text-xs font-black text-white truncate uppercase tracking-tight">
                            {taskName}
                          </h4>
                          <p className="text-[9px] sm:text-[10px] text-neutral-400 leading-normal mt-0.5 italic">
                            &ldquo;{p.reason}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Urgency miss risk status card */}
                      <div className={`px-1.5 py-0.5 rounded shrink-0 font-mono self-start xs:self-auto ${
                        riskPercent >= 75 
                           ? "bg-rose-950/50 border border-rose-500/30 text-rose-400" 
                          : riskPercent >= 45
                            ? "bg-amber-950/50 border border-amber-500/30 text-amber-400"
                            : "bg-emerald-950/50 border border-emerald-500/30 text-emerald-400"
                      }`}>
                        <div className="text-[8px] sm:text-[9px] font-black">{riskPercent}% MISS RISK</div>
                      </div>
                    </div>

                    {/* Next Immediate Action Step Block */}
                    <div className="bg-rose-950/10 border border-rose-500/20 rounded-lg p-2 sm:p-2.5 mb-2.5">
                      <div className="flex items-center gap-1 text-[9px] font-mono font-black text-rose-400 uppercase tracking-wider mb-0.5">
                        <ArrowRight className="w-3 h-3" />
                        Next Immediate Micro-Step
                      </div>
                      <p className="text-[11px] sm:text-xs text-neutral-250 font-bold leading-normal">
                        {p.next_action}
                      </p>
                    </div>

                    {/* Focus schedule blocks inside plan */}
                    <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] font-mono text-neutral-400">
                      {p.schedule_blocks && p.schedule_blocks.map((blk, sidx) => {
                        const startStr = blk.start_iso ? blk.start_iso.substring(11, 16) : "00:00";
                        const endStr = blk.end_iso ? blk.end_iso.substring(11, 16) : "00:00";
                        
                        return (
                          <div key={sidx} className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-bold text-neutral-300">
                              SLOT: {startStr} - {endStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {p.risk_of_missing && (
                      <div className="mt-2 pt-2 border-t border-neutral-900 flex items-start gap-1 leading-normal max-w-full">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[9px] sm:text-[10px] font-mono text-neutral-400">
                          <b className="text-amber-500">Why:</b> {p.risk_of_missing.why}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-neutral-800 rounded-xl" id="panic-idle-placeholder">
            <AlertCircle className="w-12 h-12 text-neutral-700 mx-auto mb-3 animate-pulse" />
            <p className="text-xs text-neutral-300 font-bold">Panic Mode is currently idle.</p>
            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
              When stressors start piling up, hit the red button above. The AI will cross-examine deadlines, calendar meetings, and deploy instant micro-steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
