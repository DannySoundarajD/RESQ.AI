import React, { useEffect, useRef } from "react";
import { Clock, Play, Pause, Square, AlertCircle, CheckCircle, Volume2 } from "lucide-react";
import { Task } from "../types";
import { playFocusCompleteSound } from "../utils/audio";

interface FocusTimerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTimerTaskId: string | null;
  setActiveTimerTaskId: (id: string | null) => void;
  timerSecondsLeft: number;
  setTimerSecondsLeft: React.Dispatch<React.SetStateAction<number>>;
  timerRunning: boolean;
  setTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function FocusTimer({
  tasks,
  setTasks,
  activeTimerTaskId,
  setActiveTimerTaskId,
  timerSecondsLeft,
  setTimerSecondsLeft,
  timerRunning,
  setTimerRunning,
  addSystemLog,
}: FocusTimerProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeTask = tasks.find(t => t.id === activeTimerTaskId);

  useEffect(() => {
    if (timerRunning && timerSecondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            playFocusCompleteSound();
            if (activeTimerTaskId) {
              setTasks(prevTasks => prevTasks.map(t => t.id === activeTimerTaskId ? { ...t, completed: true } : t));
              addSystemLog(`🎯 Pomodoro Focus Slot completed! Task "${activeTask?.title}" marked as COMPLETED.`, "success");
              setActiveTimerTaskId(null);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSecondsLeft, activeTimerTaskId, activeTask]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    if (!activeTimerTaskId) {
      // Automatically grab the first active task if none locked
      const firstActive = tasks.find(t => !t.completed);
      if (firstActive) {
        setActiveTimerTaskId(firstActive.id);
        addSystemLog(`Auto-locked focus clock to task: "${firstActive.title}"`, "info");
      } else {
        addSystemLog("Cannot run timer: Please create or load active tasks first.", "warning");
        return;
      }
    }
    setTimerRunning(true);
    addSystemLog("Focus block countdown started. Stay locked in!", "info");
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    addSystemLog("Focus timer paused.", "info");
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerSecondsLeft(25 * 60);
    setActiveTimerTaskId(null);
    addSystemLog("Focus session aborted. Timer reset to 25:00.", "warning");
  };

  const forceCompleteTask = () => {
    if (activeTimerTaskId) {
      setTasks(prev => prev.map(t => t.id === activeTimerTaskId ? { ...t, completed: true } : t));
      addSystemLog(`Manually finished focused task: "${activeTask?.title}".`, "success");
      stopTimer();
    }
  };

  // Calculate percentage of remaining time relative to default 25-minute Pomodoro (1500 seconds)
  const percentLeft = (timerSecondsLeft / (25 * 60)) * 100;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center" id="focus-timer-widget">
      
      {/* Title info */}
      <div className="w-full flex items-start justify-between mb-3">
        <div className="text-left">
          <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <Clock className="w-4 h-4 text-rose-500 shrink-0" />
            Live Focus Clock
          </h2>
          <p className="text-[10px] text-neutral-400">Lock into Pomodoro micro-intervals</p>
        </div>
        <button
          onClick={playFocusCompleteSound}
          className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition border border-neutral-850"
          title="Test focus completion sound cue"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Circle visualization */}
      <div className="relative w-36 h-36 flex items-center justify-center my-2" id="timer-radial-container">
        {/* SVG Circle indicator */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="60"
            className="stroke-neutral-800 stroke-[5px] fill-transparent"
          />
          <circle
            cx="72"
            cy="72"
            r="60"
            className="stroke-rose-600 stroke-[6px] fill-transparent transition-all duration-1000"
            strokeDasharray={2 * Math.PI * 60}
            strokeDashoffset={2 * Math.PI * 60 * (1 - percentLeft / 100)}
          />
        </svg>

        <div className="text-center z-10 select-none">
          <div className="text-2xl font-black font-mono tracking-wider text-white">
            {formatTime(timerSecondsLeft)}
          </div>
          <span className="text-[9px] font-mono bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800 block mt-1">
            {timerRunning ? "BURNING" : "PAUSED"}
          </span>
        </div>
      </div>

      {/* Locked task details */}
      <div className="w-full bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl mb-4 min-h-[45px] flex flex-col justify-center">
        {activeTask ? (
          <div>
            <span className="text-[8px] font-mono text-rose-400 font-extrabold tracking-widest block uppercase">Locked Target:</span>
            <span className="text-xs font-bold text-neutral-100 truncate block mt-0.5">{activeTask.title}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-neutral-500 text-[11px] font-mono select-none">
            <AlertCircle className="w-3.5 h-3.5 text-neutral-600" />
            <span>Clock unlocked. No focus target.</span>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-2 w-full" id="timer-control-buttons">
        {timerRunning ? (
          <button
            onClick={pauseTimer}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs rounded-xl border border-neutral-700 transition cursor-pointer"
            id="btn-timer-pause"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            PAUSE
          </button>
        ) : (
          <button
            onClick={startTimer}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-xl font-bold transition cursor-pointer shadow-lg"
            id="btn-timer-start"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            START
          </button>
        )}

        <button
          onClick={stopTimer}
          disabled={!activeTimerTaskId}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition text-neutral-400 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Abort focus countdown"
          id="btn-timer-abort"
        >
          <Square className="w-4 h-4 fill-neutral-400" />
        </button>

        {activeTimerTaskId && (
          <button
            onClick={forceCompleteTask}
            className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
            title="Force Complete Active Target"
            id="btn-timer-force-complete"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
