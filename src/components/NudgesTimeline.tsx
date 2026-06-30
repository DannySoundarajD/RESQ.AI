import React, { useEffect, useRef } from "react";
import { BellRing, Check, Info, Trash2, ShieldAlert, Volume2 } from "lucide-react";
import { playNudgeSound } from "../utils/audio";

interface NudgesTimelineProps {
  simulatedNudgesHistory: Array<{ id: string; time: string; title: string; body: string; type: string }>;
  setSimulatedNudgesHistory: React.Dispatch<React.SetStateAction<Array<{ id: string; time: string; title: string; body: string; type: string }>>>;
}

export default function NudgesTimeline({
  simulatedNudgesHistory,
  setSimulatedNudgesHistory,
}: NudgesTimelineProps) {
  const prevLengthRef = useRef(simulatedNudgesHistory.length);

  useEffect(() => {
    if (simulatedNudgesHistory.length > prevLengthRef.current) {
      playNudgeSound();
    }
    prevLengthRef.current = simulatedNudgesHistory.length;
  }, [simulatedNudgesHistory]);

  const handleClearNudges = () => {
    setSimulatedNudgesHistory([]);
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col lg:h-full h-auto" id="nudges-timeline-widget">
      
      {/* Title info */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <BellRing className="w-4 h-4 text-rose-500 shrink-0" />
            Nudge Alerts Stream
          </h2>
          <p className="text-[10px] text-neutral-400">Future scheduled notifications computed by LLM</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={playNudgeSound}
            className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition border border-neutral-850"
            title="Test nudge sound notification"
          >
            <Volume2 className="w-3 h-3" />
          </button>

          {simulatedNudgesHistory.length > 0 && (
            <button
              onClick={handleClearNudges}
              className="text-[9px] font-mono text-neutral-500 hover:text-white uppercase transition cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Stream body */}
      <div className="flex-1 lg:overflow-y-auto overflow-visible space-y-2.5 lg:max-h-full max-h-none pr-1" id="nudges-scroll-container">
        {simulatedNudgesHistory.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-800 rounded-xl" id="no-nudges-placeholder">
            <BellRing className="w-6 h-6 text-neutral-700 mx-auto mb-2 animate-pulse" />
            <p className="text-[10px] text-neutral-500 font-mono">No notifications scheduled.</p>
            <p className="text-[9px] text-neutral-600 mt-0.5">Activate <b>PANIC MODE</b> to compute alerts</p>
          </div>
        ) : (
          simulatedNudgesHistory.map(n => {
            const isCritical = n.type === "DEADLINE_SOON" || n.type === "START_NOW";
            
            return (
              <div
                key={n.id}
                className={`border rounded-xl p-3 flex items-start gap-2.5 transition hover:border-neutral-700 bg-neutral-950/80 ${
                  isCritical ? "border-rose-950/60" : "border-neutral-800"
                }`}
                id={`nudge-alert-${n.id}`}
              >
                {/* Visual Category Dot/Pill */}
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  n.type === "DEADLINE_SOON"
                    ? "bg-rose-500 animate-ping"
                    : n.type === "START_NOW"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-sky-400"
                }`}></div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-extrabold font-mono tracking-wide ${
                      isCritical ? "text-rose-400" : "text-sky-400"
                    }`}>
                      {n.title}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500 shrink-0">
                      {n.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-normal mt-0.5">
                    {n.body}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-neutral-900/50">
                    <span className="text-[8px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-mono uppercase">
                      {n.type}
                    </span>
                    <span className="text-[8px] text-neutral-400 flex items-center gap-0.5 font-mono">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      Broadcast Armed
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
