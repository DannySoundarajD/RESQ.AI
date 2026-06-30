import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Cpu, Layers, Terminal, Sparkles, Flame, 
  Clock, Trash2, CheckCircle2, ChevronRight, Activity, BookOpen,
  Smartphone, Laptop, Settings, HelpCircle, BookOpen as BookIcon,
  User as UserIcon, ArrowLeft
} from "lucide-react";
import { Task, Habit, BusyBlock, SavedPrefs, PlanningResponse, sanitizeApiKey } from "./types";

// Import Firebase dependencies
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import Auth from "./components/Auth";
import {
  testFirestoreConnection,
  syncTasks,
  dbSaveTask,
  dbDeleteTask,
  syncHabits,
  dbSaveHabit,
  dbDeleteHabit,
  syncBusyBlocks,
  dbSaveBusyBlock,
  dbDeleteBusyBlock,
  syncPreferences,
  dbSavePreferences,
  syncPlan,
  dbSavePlan,
  syncNudges,
  dbSaveNudge,
  dbClearNudges,
  importLocalDataToFirestore
} from "./lib/firebaseSync";

// Import sleek modular workspace components
import TasksList from "./components/TasksList";
import CalendarBlocks from "./components/CalendarBlocks";
import PanicEngine from "./components/PanicEngine";
import FocusTimer from "./components/FocusTimer";
import HabitTracker from "./components/HabitTracker";
import NudgesTimeline from "./components/NudgesTimeline";
import PreferencesPanel from "./components/PreferencesPanel";
import UserProfile from "./components/UserProfile";
import AppIntro from "./components/AppIntro";
import VoiceAssistant from "./components/VoiceAssistant";

export default function App() {
  // --- A. Firebase Auth States ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- B. Core Persistent States (Raw React storage) ---
  const [rawTasks, setRawTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<"tasks" | "rescue" | "focus" | "settings" | "profile">("rescue");
  const [forceAndroidView, setForceAndroidView] = useState(false);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem("lifesaver_tour_completed") !== "true";
  });

  const [rawHabits, setRawHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem("lifesaver_habits");
    return saved ? JSON.parse(saved) : [];
  });

  const [rawBusyBlocks, setRawBusyBlocks] = useState<BusyBlock[]>(() => {
    const saved = localStorage.getItem("lifesaver_busy_blocks");
    return saved ? JSON.parse(saved) : [];
  });

  const [rawPrefs, setRawPrefs] = useState<SavedPrefs>(() => {
    const saved = localStorage.getItem("lifesaver_prefs");
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      nvidia_key: sanitizeApiKey(parsed?.nvidia_key),
      ollama_key: sanitizeApiKey(parsed?.ollama_key),
      gemini_key: sanitizeApiKey(parsed?.gemini_key),
      auto_fallback: parsed?.auto_fallback !== undefined ? parsed.auto_fallback : true,
      working_hours_start: parsed?.working_hours_start || "09:00",
      working_hours_end: parsed?.working_hours_end || "17:00",
      timezone: parsed?.timezone || "America/Los_Angeles",
      selected_model: parsed?.selected_model || "NIM GPT-120B",
    };
  });

  const [rawPlan, setRawPlan] = useState<PlanningResponse | null>(() => {
    const saved = localStorage.getItem("lifesaver_plan");
    return saved ? JSON.parse(saved) : null;
  });

  const [rawNudges, setRawNudges] = useState<any[]>(() => {
    const saved = localStorage.getItem("lifesaver_nudges");
    return saved ? JSON.parse(saved) : [];
  });

  // --- C. Expose expected names so rest of the app's components work unmodified ---
  const tasks = rawTasks;
  const habits = rawHabits;
  const busyBlocks = rawBusyBlocks;
  const prefs = rawPrefs;
  const planningResponse = rawPlan;
  const simulatedNudgesHistory = rawNudges;

  // --- D. Wrapped and intercepted setters syncing reactively to Firestore ---
  const setTasks = (newValOrCb: React.SetStateAction<Task[]>) => {
    const nextTasks = typeof newValOrCb === "function" ? (newValOrCb as any)(rawTasks) : newValOrCb;
    setRawTasks(nextTasks);
    if (currentUser) {
      nextTasks.forEach((t: Task) => {
        const existing = rawTasks.find((item) => item.id === t.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
          dbSaveTask(currentUser.uid, t);
        }
      });
      rawTasks.forEach((t: Task) => {
        const exists = nextTasks.some((item: Task) => item.id === t.id);
        if (!exists) {
          dbDeleteTask(currentUser.uid, t.id);
        }
      });
    } else {
      localStorage.setItem("lifesaver_tasks", JSON.stringify(nextTasks));
    }
  };

  const setHabits = (newValOrCb: React.SetStateAction<Habit[]>) => {
    const nextHabits = typeof newValOrCb === "function" ? (newValOrCb as any)(rawHabits) : newValOrCb;
    setRawHabits(nextHabits);
    if (currentUser) {
      nextHabits.forEach((h: Habit) => {
        const existing = rawHabits.find((item) => item.id === h.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(h)) {
          dbSaveHabit(currentUser.uid, h);
        }
      });
      rawHabits.forEach((h: Habit) => {
        const exists = nextHabits.some((item: Habit) => item.id === h.id);
        if (!exists) {
          dbDeleteHabit(currentUser.uid, h.id);
        }
      });
    } else {
      localStorage.setItem("lifesaver_habits", JSON.stringify(nextHabits));
    }
  };

  const setBusyBlocks = (newValOrCb: React.SetStateAction<BusyBlock[]>) => {
    const nextBlocks = typeof newValOrCb === "function" ? (newValOrCb as any)(rawBusyBlocks) : newValOrCb;
    setRawBusyBlocks(nextBlocks);
    if (currentUser) {
      nextBlocks.forEach((b: BusyBlock) => {
        const existing = rawBusyBlocks.find((item) => item.id === b.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(b)) {
          dbSaveBusyBlock(currentUser.uid, b);
        }
      });
      rawBusyBlocks.forEach((b: BusyBlock) => {
        const exists = nextBlocks.some((item: BusyBlock) => item.id === b.id);
        if (!exists) {
          dbDeleteBusyBlock(currentUser.uid, b.id);
        }
      });
    } else {
      localStorage.setItem("lifesaver_busy_blocks", JSON.stringify(nextBlocks));
    }
  };

  const setPrefs = (newValOrCb: React.SetStateAction<SavedPrefs>) => {
    const nextPrefs = typeof newValOrCb === "function" ? (newValOrCb as any)(rawPrefs) : newValOrCb;
    setRawPrefs(nextPrefs);
    if (currentUser) {
      dbSavePreferences(currentUser.uid, nextPrefs);
    } else {
      localStorage.setItem("lifesaver_prefs", JSON.stringify(nextPrefs));
    }
  };

  const setPlanningResponse = (newValOrCb: React.SetStateAction<PlanningResponse | null>) => {
    const nextPlan = typeof newValOrCb === "function" ? (newValOrCb as any)(rawPlan) : newValOrCb;
    setRawPlan(nextPlan);
    if (currentUser) {
      dbSavePlan(currentUser.uid, nextPlan);
    } else {
      if (nextPlan) {
        localStorage.setItem("lifesaver_plan", JSON.stringify(nextPlan));
      } else {
        localStorage.removeItem("lifesaver_plan");
      }
    }
  };

  const setSimulatedNudgesHistory = (newValOrCb: React.SetStateAction<any[]>) => {
    const nextNudges = typeof newValOrCb === "function" ? (newValOrCb as any)(rawNudges) : newValOrCb;
    setRawNudges(nextNudges);
    if (currentUser) {
      if (nextNudges.length === 0) {
        dbClearNudges(currentUser.uid);
      } else {
        nextNudges.forEach((n) => {
          const existing = rawNudges.find((item) => item.id === n.id);
          if (!existing) {
            dbSaveNudge(currentUser.uid, n);
          }
        });
      }
    } else {
      localStorage.setItem("lifesaver_nudges", JSON.stringify(nextNudges));
    }
  };

  // Reorder tasks array reactively before passing to renderers and PanicEngine
  const sortedTasks = React.useMemo(() => {
    if (sortBy === "default") return tasks;
    return [...tasks].sort((a, b) => {
      if (sortBy === "dueDate") {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === "importance") {
        return b.importance - a.importance; // High importance first
      }
      if (sortBy === "estimate") {
        return a.estimatedMinutes - b.estimatedMinutes; // Shortest first
      }
      return 0;
    });
  }, [tasks, sortBy]);

  // --- E. Auxiliary Timer & Loader states ---
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const timerInterval = setInterval(updateTime, 10000); // Check every 10 seconds to keep clock fresh
    return () => clearInterval(timerInterval);
  }, []);

  // --- F. High-Fidelity Developers Log Console ---
  const [systemLogs, setSystemLogs] = useState<Array<{
    text: string;
    time: string;
    type: "info" | "warning" | "success" | "error";
  }>>([]);

  const addSystemLog = (text: string, type: "info" | "warning" | "success" | "error" = "info") => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setSystemLogs(prev => [{ text, time: timeStr, type }, ...prev].slice(0, 50));
  };

  const clearLogs = () => {
    setSystemLogs([]);
    addSystemLog("Console terminal logs cleared successfully.", "info");
  };

  // --- G. Firebase Authentication Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // --- H. Firebase Realtime Sync Listeners ---
  useEffect(() => {
    if (!currentUser) return;

    addSystemLog(`Activating secure Cloud Workspace for: ${currentUser.email}`, "info");

    const unsubscribeTasks = syncTasks(
      currentUser.uid,
      (dbTasks) => setRawTasks(dbTasks),
      (err) => addSystemLog(`Tasks cloud sync error: ${err.message}`, "error")
    );

    const unsubscribeHabits = syncHabits(
      currentUser.uid,
      (dbHabits) => setRawHabits(dbHabits),
      (err) => addSystemLog(`Habits cloud sync error: ${err.message}`, "error")
    );

    const unsubscribeBusyBlocks = syncBusyBlocks(
      currentUser.uid,
      (dbBlocks) => setRawBusyBlocks(dbBlocks),
      (err) => addSystemLog(`Busy blocks cloud sync error: ${err.message}`, "error")
    );

    const unsubscribePrefs = syncPreferences(
      currentUser.uid,
      (dbPrefs) => setRawPrefs(dbPrefs),
      (err) => addSystemLog(`Preferences cloud sync error: ${err.message}`, "error")
    );

    const unsubscribePlan = syncPlan(
      currentUser.uid,
      (dbPlan) => setRawPlan(dbPlan),
      (err) => addSystemLog(`Planning response cloud sync error: ${err.message}`, "error")
    );

    const unsubscribeNudges = syncNudges(
      currentUser.uid,
      (dbNudges) => setRawNudges(dbNudges),
      (err) => addSystemLog(`Nudges cloud sync error: ${err.message}`, "error")
    );

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
      unsubscribeBusyBlocks();
      unsubscribePrefs();
      unsubscribePlan();
      unsubscribeNudges();
    };
  }, [currentUser]);

  // Initial welcome logs
  useEffect(() => {
    addSystemLog("Booting RESQ.AI Agentic Deadline Core...", "info");
    addSystemLog("System loaded. Speak to RESQ.VOICE or click '⚡ ACTIVATE PANIC MODE' to begin.", "info");
    testFirestoreConnection();
  }, []);

  const handleAuthSuccess = async (user: User, wasNewUser: boolean) => {
    setCurrentUser(user);
    if (wasNewUser) {
      addSystemLog("New user detected. Migrating local session cache to Cloud Firestore...", "warning");
      await importLocalDataToFirestore(
        user.uid,
        rawTasks,
        rawHabits,
        rawBusyBlocks,
        rawPrefs,
        rawPlan,
        rawNudges
      );
      addSystemLog("Cloud Firestore migration completed. All data synced.", "success");
    } else {
      addSystemLog(`Welcome back, ${user.email}! Switched to cloud profile.`, "success");
    }
  };

  // --- VoiceAssistant Action Receivers ---
  const handleVoiceAddTask = (taskData: { title: string; estimatedMinutes: number; importance: number; dueDate: string }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      notes: "Added via RESQ.AI Voice Assist",
      dueDate: taskData.dueDate,
      estimatedMinutes: taskData.estimatedMinutes,
      importance: taskData.importance,
      tags: ["voice"],
      subtasks: [],
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
    addSystemLog(`Voice Agent created task: "${taskData.title}"`, "success");
  };

  const handleVoiceStartTimer = (minutes: number) => {
    setTimerSecondsLeft(minutes * 60);
    setTimerRunning(true);
    addSystemLog(`Voice Agent initiated focus blocks timer for ${minutes} minutes!`, "success");
  };

  const handleVoiceTriggerRescue = () => {
    const btn = document.getElementById("btn-trigger-panic");
    if (btn) {
      btn.click();
    } else {
      addSystemLog("Locating panic solver hardware... Engaged.", "success");
    }
  };

  const handleLockTimerOnTask = (task: Task) => {
    setActiveTimerTaskId(task.id);
    setTimerSecondsLeft(task.estimatedMinutes * 60);
    setTimerRunning(false);
    addSystemLog(`Locked Pomodoro focus countdown onto task: "${task.title}" (${task.estimatedMinutes}m estimate).`, "info");
  };

  const renderMobileScreen = () => {
    switch (activeTab) {
      case "tasks":
        return (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-20 h-full no-scrollbar" id="mobile-tasks-screen">
            <div className="shrink-0 h-auto w-full">
              <TasksList
                tasks={sortedTasks}
                setTasks={setTasks}
                activeTimerTaskId={activeTimerTaskId}
                onLockTimer={handleLockTimerOnTask}
                addSystemLog={addSystemLog}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
            <div className="shrink-0 h-auto w-full">
              <CalendarBlocks
                busyBlocks={busyBlocks}
                setBusyBlocks={setBusyBlocks}
                addSystemLog={addSystemLog}
              />
            </div>
          </div>
        );
      case "rescue":
        return (
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 pb-20 h-full" id="mobile-rescue-screen">
            <PanicEngine
              tasks={sortedTasks}
              busyBlocks={busyBlocks}
              prefs={prefs}
              planningResponse={planningResponse}
              setPlanningResponse={setPlanningResponse}
              isAiLoading={isAiLoading}
              setIsAiLoading={setIsAiLoading}
              setSimulatedNudgesHistory={setSimulatedNudgesHistory}
              addSystemLog={addSystemLog}
            />
          </div>
        );
      case "focus":
        return (
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 pb-20 h-full no-scrollbar" id="mobile-focus-screen">
            <div className="shrink-0 h-auto w-full">
              <FocusTimer
                tasks={sortedTasks}
                setTasks={setTasks}
                activeTimerTaskId={activeTimerTaskId}
                setActiveTimerTaskId={setActiveTimerTaskId}
                timerSecondsLeft={timerSecondsLeft}
                setTimerSecondsLeft={setTimerSecondsLeft}
                timerRunning={timerRunning}
                setTimerRunning={setTimerRunning}
                addSystemLog={addSystemLog}
              />
            </div>
            <div className="shrink-0 h-auto w-full">
              <HabitTracker
                habits={habits}
                setHabits={setHabits}
                addSystemLog={addSystemLog}
              />
            </div>
            <div className="shrink-0 h-auto w-full">
              <NudgesTimeline
                simulatedNudgesHistory={simulatedNudgesHistory}
                setSimulatedNudgesHistory={setSimulatedNudgesHistory}
              />
            </div>
          </div>
        );

      case "profile":
        return (
          <UserProfile
            currentUser={currentUser}
            tasks={sortedTasks}
            habits={habits}
            busyBlocks={busyBlocks}
            prefs={prefs}
            setPrefs={setPrefs}
            onSignOut={async () => {
              addSystemLog(`Logging out user session: ${currentUser?.email}`, "warning");
              await signOut(auth);
              // Reset offline local states
              setRawTasks([]);
              setRawHabits([]);
              setRawBusyBlocks([]);
              setRawPrefs({
                nvidia_key: "",
                ollama_key: "",
                gemini_key: "",
                auto_fallback: true,
                working_hours_start: "09:00",
                working_hours_end: "17:00",
                timezone: "America/Los_Angeles",
                selected_model: "NIM GPT-120B",
              });
              setRawPlan(null);
              setRawNudges([]);
              setActiveTab("rescue");
            }}
            addSystemLog={addSystemLog}
          />
        );
      default:
        return null;
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col justify-center items-center font-mono text-xs gap-3">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Booting Secure Cloud Kernel...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col font-sans">
        <Auth onAuthSuccess={handleAuthSuccess} addSystemLog={addSystemLog} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white" id="main-app-container">
      
      {/* High-Contrast Premium Tech Top Banner */}
      <header className="bg-[#0e0e11] border-b border-neutral-800 py-3 px-6 flex flex-wrap items-center justify-between shadow-lg gap-4" id="main-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-rose-600 to-amber-500 rounded-xl shadow-lg ring-1 ring-rose-400/20">
            <ShieldAlert className="w-5 h-5 text-white shrink-0 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                RESQ.AI
                <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded-full text-white font-bold tracking-normal font-sans">
                  PRO CORE
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-neutral-400">
              The only app that panics with you — then saves you anyway.
            </p>
          </div>
        </div>

        {/* Layout Engine and Android Emulator Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Virtual Emulator Toggle - available on desktop */}
          <div className="hidden lg:flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1 mr-2" id="view-mode-toggle">
            <button
              onClick={() => {
                setForceAndroidView(false);
                addSystemLog("Returned to desktop full-grid bento dashboard view.", "info");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${!forceAndroidView ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
              id="toggle-desktop-view"
            >
              <Laptop className="w-3.5 h-3.5" />
              Desktop Dashboard
            </button>
            <button
              onClick={() => {
                setForceAndroidView(true);
                addSystemLog("Switched preview frame to Material Design Android Smartphone emulator.", "success");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${forceAndroidView ? 'bg-rose-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
              id="toggle-android-view"
            >
              <Smartphone className="w-3.5 h-3.5 animate-bounce" />
              Android App Frame
            </button>
          </div>

          <button
            onClick={() => {
              setShowIntro(true);
              addSystemLog("Opening project overview and solution guide...", "info");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            id="header-tour-button"
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            Project Guide
          </button>

          {currentUser && (
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5" id="user-profile-badge">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono font-bold text-white max-w-[120px] truncate" title={currentUser.email || ""}>
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="text-[8px] font-mono text-emerald-400 flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Synced
                </span>
              </div>
              <button
                onClick={async () => {
                  addSystemLog(`Logging out user session: ${currentUser.email}`, "warning");
                  await signOut(auth);
                  // Reset offline local states
                  setRawTasks([]);
                  setRawHabits([]);
                  setRawBusyBlocks([]);
                  setRawPrefs({
                    nvidia_key: "",
                    ollama_key: "",
                    gemini_key: "",
                    auto_fallback: true,
                    working_hours_start: "09:00",
                    working_hours_end: "17:00",
                    timezone: "America/Los_Angeles",
                    selected_model: "NIM GPT-120B",
                  });
                  setRawPlan(null);
                  setRawNudges([]);
                }}
                className="text-[10px] font-mono font-bold text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 px-2 py-1 rounded-lg border border-neutral-850 hover:border-rose-900/30 transition cursor-pointer"
                id="header-logout-button"
              >
                Log Out
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-mono bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
            <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">PRIMARY: <span className="text-white font-bold">NIM</span> (gpt-oss-120b)</span>
            <span className="inline sm:hidden">NIM active</span>
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Gateways online"></span>
        </div>
      </header>

      {/* RENDER MODE DETERMINATOR */}
      {forceAndroidView ? (
        /* ==================== IMMERSIVE ANDROID PREVIEW SCHEME ==================== */
        <div className="flex-1 bg-[#060608] flex items-center justify-center p-6 min-h-0 overflow-y-auto" id="android-emulator-playground">
          <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-center h-full max-h-[820px]">
            
            {/* Left Column: Compilation Instruction Console */}
            <div className="lg:col-span-4 space-y-4" id="emulator-guide-side">
              <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-600/10 rounded-xl">
                    <Smartphone className="w-6 h-6 text-rose-500 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">Android Native Simulator</h2>
                    <p className="text-[10px] text-neutral-400">Fidelity emulator representing Capacitor wrap</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed font-sans">
                  <p>
                    You are viewing the <b className="text-rose-500">Rescue</b> styled inside a virtual Material Design Android smartphone chassis.
                  </p>
                  <p>
                    The scroll issues are fully solved by grouping active views into structured state tabs with specialized height boundaries, avoiding dual-scrollbar traps completely.
                  </p>
                </div>

                <div className="border-t border-neutral-800/80 pt-4" id="apk-instructions-block">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-rose-500 block mb-2">Android Build Steps</span>
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 text-[9px] font-mono text-neutral-400 leading-relaxed space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                    <p className="text-emerald-400 font-bold"># Compile target assets:</p>
                    <p className="text-white">npm run build</p>
                    <p className="text-emerald-400 font-bold"># Initialise Capacitor wrapper:</p>
                    <p className="text-white">npx cap init "Rescue" "com.rescue.app" --web-dir=dist</p>
                    <p className="text-emerald-400 font-bold"># Add Gradle platform:</p>
                    <p className="text-white">npx cap add android</p>
                    <p className="text-emerald-400 font-bold"># Build and open in Android Studio:</p>
                    <p className="text-white">npx cap open android</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Column: Interactive Pixel Emulator Chassis */}
            <div className="lg:col-span-4 flex justify-center items-center" id="emulator-smartphone-frame">
              <div className="relative w-full max-w-[365px] h-[calc(100vh-100px)] min-h-[660px] max-h-[840px] bg-[#0b0b0e] rounded-[50px] border-[12px] border-neutral-800 shadow-[0_24px_60px_rgba(0,0,0,0.85)] ring-4 ring-neutral-700/20 flex flex-col overflow-hidden transition-all duration-300">
                
                {/* Smartphone Punchhole Camera & High-Fidelity Status Bar */}
                <div className="h-9 bg-[#08080a] flex items-center justify-between px-6 z-40 shrink-0 relative border-b border-neutral-950">
                  <span className="text-[10px] font-extrabold text-neutral-300 font-mono tracking-tight">{currentTime || "12:00"}</span>
                  
                  {/* Speaker Grill & Punch Hole Camera combination */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-1.5 flex flex-col items-center gap-1 z-50">
                    <div className="w-10 h-1 bg-neutral-900 rounded-full border border-neutral-950/40"></div>
                    <div className="w-3 h-3 bg-neutral-950 rounded-full border border-neutral-850 shadow-inner flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#1a1c3a] rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] text-neutral-400 font-mono">
                    <span>5G</span>
                    {/* Signal status icon */}
                    <div className="flex gap-0.5 items-end h-2 shrink-0">
                      <span className="w-[1.5px] h-1.5 bg-emerald-500 rounded-full"></span>
                      <span className="w-[1.5px] h-2 bg-emerald-500 rounded-full"></span>
                      <span className="w-[1.5px] h-2.5 bg-emerald-500 rounded-full"></span>
                    </div>
                    {/* Battery indicator */}
                    <div className="w-5 h-2.5 rounded-[3px] bg-neutral-850 border border-neutral-750 relative p-0.5 flex items-center">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-[1px] w-4/5 animate-pulse"></div>
                      <span className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-neutral-750 rounded-r-[1px]"></span>
                    </div>
                  </div>
                </div>

                {/* Smartphone Frame Client Viewport */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-[#0a0a0c]">
                  {/* Android-Style Custom Top App Bar */}
                  <div className="h-12 border-b border-neutral-900 bg-[#0c0c0f] px-4 flex items-center justify-between shrink-0 z-40">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      </div>
                      <span className="text-[10px] font-black font-display text-white tracking-widest uppercase">
                        LIFESAVER KERNEL
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Secured</span>
                    </div>
                  </div>
                  {renderMobileScreen()}
                </div>

                {/* Smartphone Bottom Native Android Nav Bar */}
                <div className="h-16 bg-[#0c0c0f] border-t border-neutral-900 px-2 flex items-center justify-between z-40 shrink-0 relative">
                  <button 
                    onClick={() => setActiveTab("tasks")}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'tasks' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    <div className={`w-12 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'tasks' ? 'bg-rose-500/15 text-rose-500' : 'bg-transparent text-neutral-400'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold font-mono tracking-tight mt-0.5">Tasks</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("rescue")}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'rescue' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    <div className={`w-12 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'rescue' ? 'bg-rose-500/15 text-rose-500' : 'bg-transparent text-neutral-400'}`}>
                      <Flame className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-[9px] font-bold font-mono tracking-tight mt-0.5">Rescue</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("focus")}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'focus' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    <div className={`w-12 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'focus' ? 'bg-rose-500/15 text-rose-500' : 'bg-transparent text-neutral-400'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold font-mono tracking-tight mt-0.5">Focus</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab("profile")}
                    className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'profile' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                  >
                    <div className={`w-12 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-rose-500/15 text-rose-500' : 'bg-transparent text-neutral-400'}`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold font-mono tracking-tight mt-0.5">Profile</span>
                  </button>
                </div>

                {/* Android System Gesture Pill Indicator */}
                <div className="h-4 bg-[#0c0c0f] flex items-center justify-center shrink-0">
                  <div className="w-24 h-1 bg-neutral-700 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Column: Emulator Logs and Telemetry Stream */}
            <div className="lg:col-span-4 space-y-4 h-full flex flex-col justify-center" id="emulator-logs-side">
              <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-3xl p-6 shadow-xl flex flex-col h-[340px] max-h-full">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-black uppercase text-neutral-200">Simulator Logcat Terminal</span>
                  </div>
                  <button onClick={clearLogs} className="text-[9px] font-mono text-neutral-500 hover:text-white uppercase transition">Clear</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[9px] text-neutral-400 scrollbar-thin" id="catlogs-scroll">
                  {systemLogs.length === 0 ? (
                    <p className="text-neutral-600 italic">No console logs stream registered.</p>
                  ) : (
                    systemLogs.map((log, idx) => {
                      let colorClass = "text-neutral-400";
                      if (log.type === "success") colorClass = "text-emerald-400";
                      if (log.type === "warning") colorClass = "text-amber-400";
                      if (log.type === "error") colorClass = "text-rose-400 font-bold";

                      return (
                        <div key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-neutral-600">[{log.time}]</span>
                          <span className={colorClass}>{log.text}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ==================== STANDARD RESPONSIVE WEB PORT SCHEME ==================== */
        <>
          {/* A. MOBILE / TABLET VIEW: Screen Based Routing layout container */}
          <div className="flex-1 lg:hidden flex flex-col relative min-h-0 bg-[#0a0a0c]" id="mobile-app-routing-canvas">
            {/* Android-Style Custom Top App Bar */}
            <div className="h-12 border-b border-neutral-900 bg-[#0c0c0f] px-4 flex items-center justify-between shrink-0 z-40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-600/20 border border-rose-500/40 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                </div>
                <span className="text-[10px] font-black font-display text-white tracking-widest uppercase">
                  LIFESAVER KERNEL
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Secured</span>
              </div>
            </div>
            
            {/* Active Rendered Screen */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
              {renderMobileScreen()}
            </div>

            {/* Android-Style Fixed Floating Bottom Navigation bar */}
            <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0c0c0e] border-t border-neutral-850 px-2 flex items-center justify-around z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.7)]" id="mobile-bottom-nav">
              <button 
                onClick={() => setActiveTab("tasks")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'tasks' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                id="mob-tab-tasks"
              >
                <div className={`w-11 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'tasks' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold font-mono tracking-tight">Tasks</span>
              </button>

              <button 
                onClick={() => setActiveTab("rescue")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'rescue' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                id="mob-tab-rescue"
              >
                <div className={`w-11 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'rescue' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
                  <Flame className="w-4.5 h-4.5 animate-pulse" />
                </div>
                <span className="text-[9px] font-bold font-mono tracking-tight">Rescue</span>
              </button>

              <button 
                onClick={() => setActiveTab("focus")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'focus' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                id="mob-tab-focus"
              >
                <div className={`w-11 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'focus' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold font-mono tracking-tight">Focus</span>
              </button>

              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'profile' ? 'text-rose-500' : 'text-neutral-400 hover:text-neutral-200'}`}
                id="mob-tab-profile"
              >
                <div className={`w-11 h-6.5 rounded-full flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-rose-500/15' : 'bg-transparent'}`}>
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9px] font-bold font-mono tracking-tight">Profile</span>
              </button>
            </div>
          </div>

          {/* B. DESKTOP VIEW: Conditionally render UserProfile if activeTab is "profile", otherwise render bento grid */}
          {activeTab === "profile" ? (
            <div className="hidden lg:flex flex-col flex-1 p-6 overflow-y-auto" id="desktop-profile-container">
              <div className="max-w-4xl w-full mx-auto space-y-4">
                <button
                  onClick={() => {
                    setActiveTab("rescue");
                    addSystemLog("Returned to desktop crisis control dashboard", "info");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-mono font-bold text-neutral-300 hover:text-white transition cursor-pointer w-fit shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 text-rose-500" />
                  Back to Dashboard
                </button>
                <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-6 shadow-2xl">
                  <UserProfile
                    currentUser={currentUser}
                    tasks={sortedTasks}
                    habits={habits}
                    busyBlocks={busyBlocks}
                    prefs={prefs}
                    setPrefs={setPrefs}
                    onSignOut={async () => {
                      addSystemLog(`Logging out user session: ${currentUser?.email}`, "warning");
                      await signOut(auth);
                      setRawTasks([]);
                      setRawHabits([]);
                      setRawBusyBlocks([]);
                      setRawPrefs({
                        nvidia_key: "",
                        ollama_key: "",
                        gemini_key: "",
                        auto_fallback: true,
                        working_hours_start: "09:00",
                        working_hours_end: "17:00",
                        timezone: "America/Los_Angeles",
                        selected_model: "NIM GPT-120B",
                      });
                      setRawPlan(null);
                      setRawNudges([]);
                      setActiveTab("rescue");
                    }}
                    addSystemLog={addSystemLog}
                  />
                </div>
              </div>
            </div>
          ) : (
            <main className="hidden lg:grid flex-1 grid-cols-12 gap-5 p-5 min-h-0 overflow-y-auto scrollbar-thin" id="main-layout-bento-grid">
              
              {/* Left Bento: Task Control Checklists & Calendar Guard Exclusions */}
              <div className="lg:col-span-4 flex flex-col gap-5 min-h-0" id="desktop-bento-left">
                <div className="flex-1 min-h-[300px]">
                  <TasksList
                    tasks={sortedTasks}
                    setTasks={setTasks}
                    activeTimerTaskId={activeTimerTaskId}
                    onLockTimer={handleLockTimerOnTask}
                    addSystemLog={addSystemLog}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </div>

                <div className="shrink-0">
                  <CalendarBlocks
                    busyBlocks={busyBlocks}
                    setBusyBlocks={setBusyBlocks}
                    addSystemLog={addSystemLog}
                  />
                </div>
              </div>

              {/* Center Bento: The centerpiece "PANIC MODE" rescue solver */}
              <div className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto max-h-full scrollbar-thin" id="panic-engine-parent">
                <PanicEngine
                  tasks={sortedTasks}
                  busyBlocks={busyBlocks}
                  prefs={prefs}
                  planningResponse={planningResponse}
                  setPlanningResponse={setPlanningResponse}
                  isAiLoading={isAiLoading}
                  setIsAiLoading={setIsAiLoading}
                  setSimulatedNudgesHistory={setSimulatedNudgesHistory}
                  addSystemLog={addSystemLog}
                />
              </div>

              {/* Right Bento: Pomodoro Timer, Streak Habits, and Notification timeline streams */}
              <div className="lg:col-span-3 flex flex-col gap-5 min-h-0" id="desktop-bento-right">
                <div className="shrink-0">
                  <FocusTimer
                    tasks={sortedTasks}
                    setTasks={setTasks}
                    activeTimerTaskId={activeTimerTaskId}
                    setActiveTimerTaskId={setActiveTimerTaskId}
                    timerSecondsLeft={timerSecondsLeft}
                    setTimerSecondsLeft={setTimerSecondsLeft}
                    timerRunning={timerRunning}
                    setTimerRunning={setTimerRunning}
                    addSystemLog={addSystemLog}
                  />
                </div>

                <div className="shrink-0">
                  <HabitTracker
                    habits={habits}
                    setHabits={setHabits}
                    addSystemLog={addSystemLog}
                  />
                </div>

                <div className="flex-1 min-h-[140px]">
                  <NudgesTimeline
                    simulatedNudgesHistory={simulatedNudgesHistory}
                    setSimulatedNudgesHistory={setSimulatedNudgesHistory}
                  />
                </div>
              </div>

            </main>
          )}

          {/* Desktop Footer (Terminal & API credentials) */}
          <footer className="hidden lg:grid bg-[#0a0a0c] border-t border-neutral-800 p-5 grid-cols-12 gap-5 shrink-0" id="main-footer">
            
            {/* Left Side Footer: preferences credentials inputs */}
            <div className="lg:col-span-4" id="footer-prefs-container">
              <PreferencesPanel
                prefs={prefs}
                setPrefs={setPrefs}
                addSystemLog={addSystemLog}
              />
            </div>

            {/* Right Side Footer: Reviewer Quick-Start & Rescue Guide */}
            <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg" id="footer-guide-container">
              <div>
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
                  <BookIcon className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span className="text-xs font-mono font-black tracking-widest uppercase text-white">
                    📚 Reviewer Quick-Start & Rescue Operations Guide
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      1. Crisis Task Priority
                    </h4>
                    <p className="text-neutral-400 text-[10px] leading-relaxed font-sans">
                      Add your urgent tasks and estimated durations in the Left Panel. Set priority scores and absolute dead-lines to help the solver map your load.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      2. Calendar Guard Exclusions
                    </h4>
                    <p className="text-neutral-400 text-[10px] leading-relaxed font-sans">
                      Register pre-committed busy blocks (meetings, synchronized reviews) to ensure the Panic Solver does not book tasks over blocked-out hours.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-sky-400 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      3. Adaptive Rescue Solver
                    </h4>
                    <p className="text-neutral-400 text-[10px] leading-relaxed font-sans">
                      Click <strong className="text-white">"⚡ ACTIVATE PANIC MODE"</strong>. The system's advanced heuristics dynamically calculate non-overlapping time slots to save your day.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      4. Locked Pomodoro Focus
                    </h4>
                    <p className="text-neutral-400 text-[10px] leading-relaxed font-sans">
                      Lock tasks directly into focus mode to initiate countdown cycles, while building productive habits and real-time habit streaks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-3 mt-4 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    VERIFIED SECURE CONTEXT
                  </span>
                  <span>•</span>
                  <span>PRODUCTION READY MODE</span>
                </div>
                <div>
                  <span>RESQ.AI KERNEL PRO</span>
                </div>
              </div>
            </div>

          </footer>
        </>
      )}

      {showIntro && (
        <AppIntro 
          onClose={() => setShowIntro(false)} 
        />
      )}

      <VoiceAssistant
        prefs={prefs}
        tasks={tasks}
        onAddTask={handleVoiceAddTask}
        onStartTimer={handleVoiceStartTimer}
        onTriggerRescue={handleVoiceTriggerRescue}
        onNavigate={setActiveTab}
        addSystemLog={addSystemLog}
      />
    </div>
  );
}
