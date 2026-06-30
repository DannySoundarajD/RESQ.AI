import React, { useState } from "react";
import { Flame, Plus, Check, Dumbbell, Zap, Trash2 } from "lucide-react";
import { Habit } from "../types";

interface HabitTrackerProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function HabitTracker({
  habits,
  setHabits,
  addSystemLog,
}: HabitTrackerProps) {
  const [newHabit, setNewHabit] = useState("");

  const getTodayString = () => {
    // Return mock date aligned with environment local time: 2026-06-26
    return "2026-06-26";
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim()) return;

    const habit: Habit = {
      id: "habit-" + Date.now(),
      name: newHabit.trim(),
      streak: 0,
      completedDays: [],
    };

    setHabits(prev => [...prev, habit]);
    addSystemLog(`Registered daily discipline loop: "${habit.name}"`, "success");
    setNewHabit("");
  };

  const toggleHabitToday = (id: string) => {
    const today = getTodayString();
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isCompletedToday = h.completedDays.includes(today);
        let nextDays = [...h.completedDays];
        let nextStreak = h.streak;

        if (isCompletedToday) {
          nextDays = nextDays.filter(d => d !== today);
          nextStreak = Math.max(0, nextStreak - 1);
          addSystemLog(`Removed daily completion check for habit: "${h.name}".`, "warning");
        } else {
          nextDays.push(today);
          nextStreak = nextStreak + 1;
          addSystemLog(`Completed daily habit: "${h.name}"! Streak multiplied to ${nextStreak} days in a row. Keep going!`, "success");
        }

        return { ...h, completedDays: nextDays, streak: nextStreak };
      }
      return h;
    }));
  };

  const handleDeleteHabit = (id: string, name: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    addSystemLog(`Removed habit: "${name}" from tracking.`, "warning");
  };

  const today = getTodayString();

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg" id="habit-tracker-widget">
      
      {/* Title info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            Discipline Streaks
          </h2>
          <p className="text-[10px] text-neutral-400">Daily completions build habit fire multipliers</p>
        </div>
      </div>

      {/* Add new habit form */}
      <form onSubmit={handleAddHabit} className="flex gap-1.5 mb-3">
        <input
          type="text"
          placeholder="New habit name..."
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Habit items list */}
      <div className="space-y-2 lg:max-h-[145px] max-h-none lg:overflow-y-auto overflow-visible pr-1">
        {habits.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-neutral-800 rounded-xl" id="no-habits-placeholder">
            <p className="text-[10px] text-neutral-500 font-mono">No habits created yet.</p>
          </div>
        ) : (
          habits.map(h => {
            const isDoneToday = h.completedDays.includes(today);
            return (
              <div
                key={h.id}
                className={`flex items-center justify-between p-2.5 border rounded-xl transition ${
                  isDoneToday
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                }`}
                id={`habit-card-${h.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => toggleHabitToday(h.id)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                      isDoneToday
                        ? "bg-amber-500 border-amber-400 text-neutral-950"
                        : "border-neutral-700 hover:border-amber-500"
                    }`}
                  >
                    {isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  </button>

                  <div className="min-w-0">
                    <span className={`text-xs font-semibold block truncate ${isDoneToday ? "line-through opacity-75" : "text-white"}`}>
                      {h.name}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono text-neutral-400">
                      <Flame className={`w-3.5 h-3.5 ${h.streak > 0 ? "text-amber-500 animate-pulse" : "text-neutral-600"}`} />
                      <span>STREAK: <b>{h.streak} DAYS</b></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteHabit(h.id, h.name)}
                  className="text-neutral-500 hover:text-rose-500 p-1 rounded hover:bg-neutral-900 transition cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
