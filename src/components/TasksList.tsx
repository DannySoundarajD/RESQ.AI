import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, Clock, Zap, AlertTriangle, PlusCircle, Check, Sparkles, ArrowUpDown } from "lucide-react";
import { Task } from "../types";

interface TasksListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTimerTaskId: string | null;
  onLockTimer: (task: Task) => void;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
  sortBy: string;
  onSortChange: (type: string) => void;
}

export default function TasksList({
  tasks,
  setTasks,
  activeTimerTaskId,
  onLockTimer,
  addSystemLog,
  sortBy,
  onSortChange,
}: TasksListProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimate, setEstimate] = useState("45");
  const [importance, setImportance] = useState(5);
  const [tagInput, setTagInput] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleSortChange = (type: string) => {
    onSortChange(type);
    const label = type === "dueDate" ? "Due Date" : type === "importance" ? "Importance" : type === "estimate" ? "Estimated Minutes" : "Default";
    addSystemLog(`Ordered active tasks list by ${label} in the queue before sending to solver.`, "info");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: "task-" + Date.now(),
      title: title.trim(),
      notes: notes.trim(),
      dueDate: dueDate || new Date(Date.now() + 4 * 3600 * 1000).toISOString().substring(0, 16),
      estimatedMinutes: parseInt(estimate) || 30,
      importance: Number(importance),
      tags: tagInput ? tagInput.split(",").map(t => t.trim()).filter(Boolean) : ["Personal"],
      subtasks: [],
      completed: false,
    };

    setTasks(prev => [newTask, ...prev]);
    addSystemLog(`Inserted task: "${newTask.title}" (Importance: ${newTask.importance}/5).`, "info");
    
    // reset form
    setTitle("");
    setNotes("");
    setDueDate("");
    setEstimate("45");
    setImportance(5);
    setTagInput("");
    setShowForm(false);
  };

  const handleDeleteTask = (id: string, name: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addSystemLog(`Deleted task: "${name}".`, "warning");
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        addSystemLog(`Task "${t.title}" toggled to ${nextState ? "COMPLETED" : "ACTIVE"}.`, nextState ? "success" : "info");
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtask.trim()) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...t.subtasks, { id: "sub-" + Date.now(), text: newSubtask.trim(), completed: false }]
        };
      }
      return t;
    }));
    addSystemLog(`Added subtask point to parent task.`, "info");
    setNewSubtask("");
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:h-full h-auto" id="task-list-widget">
      <div className="flex flex-col gap-2.5 mb-4 border-b border-neutral-800/40 pb-3" id="tasks-list-header">
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0" />
            Active Crisis Tasks
          </h2>
          <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">Manage your real-time stress checklist</p>
        </div>

        <div className="flex gap-2 w-full items-center justify-start mt-1">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition duration-200 cursor-pointer"
            id="btn-add-task-toggle"
          >
            <Plus className="w-3.5 h-3.5" />
            CREATE NEW TASK
          </button>
        </div>
      </div>

      {/* Sorting selector sub-bar */}
      <div className="flex flex-col gap-2 bg-neutral-950/40 border border-neutral-850 p-2.5 rounded-xl mb-4" id="task-sorting-bar">
        <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
          Queue Ordering:
        </span>
        <select
          value={sortBy}
          onChange={e => handleSortChange(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono transition cursor-pointer w-full"
          id="select-task-sort"
        >
          <option value="default">Default (As Created)</option>
          <option value="dueDate">Due Date (Earliest First)</option>
          <option value="importance">Importance (Highest First)</option>
          <option value="estimate">Estimated Mins (Shortest First)</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleAddTask} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl mb-4 space-y-3 transition duration-300" id="task-create-form">
          <div>
            <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Task Stress Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Fix Production Build Crash"
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Detailed Context</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add crucial deadline hints or technical blockers..."
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 h-16 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Deadline Time</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Estimate (Mins)</label>
              <input
                type="number"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Priority (1-5)</label>
              <select
                value={importance}
                onChange={e => setImportance(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value={5}>5 - Maximum Stress / Severe Penalty</option>
                <option value={4}>4 - High Priority</option>
                <option value={3}>3 - Medium Priority</option>
                <option value={2}>2 - Low Stress</option>
                <option value={1}>1 - Flexible / Backlog</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Hackathon, Infra, Frontend"
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition duration-200 cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Task List container */}
      <div className="flex-1 lg:overflow-y-auto overflow-visible space-y-3 pr-1 lg:max-h-full max-h-none" id="tasks-scroll-container">
        {tasks.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-neutral-800 rounded-xl" id="no-tasks-placeholder">
            <AlertTriangle className="w-8 h-8 text-neutral-600 mx-auto mb-2 animate-bounce" />
            <p className="text-xs text-neutral-400">Your task list is perfectly empty.</p>
            <p className="text-[10px] text-neutral-500 mt-1">Add tasks to initialize your secure crisis tracker!</p>
          </div>
        ) : (
          tasks.map(t => {
            const isCompleted = t.completed;
            const isTimerLocked = activeTimerTaskId === t.id;
            const isExpanded = expandedTaskId === t.id;

            return (
              <div
                key={t.id}
                className={`border rounded-xl transition duration-200 p-3 flex flex-col ${
                  isCompleted 
                    ? "bg-neutral-950/40 border-neutral-850 opacity-60" 
                    : isTimerLocked
                      ? "bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/30"
                      : "bg-neutral-950/70 border-neutral-800 hover:border-neutral-700"
                }`}
                id={`task-card-${t.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskCompleted(t.id)}
                      className={`mt-1 flex items-center justify-center w-4 h-4 rounded border transition duration-200 shrink-0 cursor-pointer ${
                        isCompleted 
                          ? "bg-emerald-600 border-emerald-500 text-white" 
                          : "border-neutral-600 hover:border-rose-500"
                      }`}
                      id={`btn-complete-${t.id}`}
                    >
                      {isCompleted && <Check className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[11px] sm:text-xs font-bold leading-tight break-words ${isCompleted ? "line-through text-neutral-500" : "text-white"}`}>
                        {t.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1 sm:mt-1.5">
                        <span className={`text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          t.importance >= 4 ? "bg-rose-950 text-rose-400 font-bold" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          Lv.{t.importance} priority
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 flex items-center gap-0.5">
                          <Clock className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                          {t.estimatedMinutes}m
                        </span>
                        {t.dueDate && (
                          <span className="text-[8px] sm:text-[9px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-1 rounded">
                            Due: {t.dueDate.replace("T", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                      className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition text-[9px] sm:text-[10px] cursor-pointer font-mono font-bold"
                      id={`btn-expand-${t.id}`}
                    >
                      {isExpanded ? "HIDE" : "SUBTASKS"}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id, t.title)}
                      className="p-1 text-neutral-500 hover:text-rose-500 hover:bg-neutral-800 rounded transition cursor-pointer"
                      id={`btn-delete-${t.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Notes + Subtasks */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-900/80 space-y-2.5" id={`task-expanded-${t.id}`}>
                    {t.notes && (
                      <p className="text-[11px] text-neutral-400 leading-relaxed bg-neutral-900/50 p-2 rounded-lg border border-neutral-900">
                        {t.notes}
                      </p>
                    )}

                    {/* Subtasks nested manager */}
                    <div>
                      <h4 className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider mb-1.5">Checklist checkpoints:</h4>
                      <div className="space-y-1.5 pl-1">
                        {t.subtasks && t.subtasks.map(sub => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSubtask(t.id, sub.id)}
                              className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition cursor-pointer ${
                                sub.completed ? "bg-emerald-600/40 border-emerald-500 text-white" : "border-neutral-700 hover:border-neutral-500"
                              }`}
                              id={`subtask-check-${sub.id}`}
                            >
                              {sub.completed && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <span className={`text-[11px] sm:text-xs ${sub.completed ? "line-through text-neutral-500" : "text-neutral-300"}`}>
                              {sub.text}
                            </span>
                          </div>
                        ))}

                        <div className="flex items-center gap-1.5 mt-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add checkpoint step..."
                            value={newSubtask}
                            onChange={e => setNewSubtask(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubtask(t.id);
                              }
                            }}
                            className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2 py-0.5 text-[11px] flex-1 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddSubtask(t.id)}
                            className="p-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Focus Lock Action - Moved below subtasks checkpoints for optimal breathing room and responsiveness */}
                    {!isCompleted && (
                      <div className="pt-2.5 border-t border-neutral-900" id={`focus-action-container-${t.id}`}>
                        <button
                          onClick={() => onLockTimer(t)}
                          className={`w-full py-1.5 rounded-lg hover:bg-neutral-800 transition text-[9px] sm:text-[10px] uppercase font-mono tracking-wider cursor-pointer border border-rose-500/20 font-bold flex items-center justify-center gap-1.5 ${
                            isTimerLocked ? "bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/20" : "bg-neutral-900 hover:bg-neutral-850 text-rose-400"
                          }`}
                          title={isTimerLocked ? "Active Focus Lock" : "Lock to focus clock"}
                          id={`btn-timer-lock-${t.id}`}
                        >
                          {isTimerLocked ? "✓ LOCKED TO FOCUS CLOCK" : "⚡ FOCUS THIS TASK"}
                        </button>
                      </div>
                    )}

                    {/* Tags block */}
                    {t.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {t.tags.map(tag => (
                          <span key={tag} className="text-[9px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-full text-neutral-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
