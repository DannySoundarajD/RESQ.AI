import React, { useState } from "react";
import { 
  X, Flame, ShieldAlert, Sparkles, CheckCircle2, ArrowRight, 
  Brain, Timer, HeartHandshake, Award, Zap, TrendingUp, Compass, ChevronRight, Mic
} from "lucide-react";

interface AppIntroProps {
  onClose: () => void;
}

type TabType = "problem" | "solution" | "uniqueness" | "guide";

export default function AppIntro({ onClose }: AppIntroProps) {
  const [activeTab, setActiveTab] = useState<TabType>("problem");

  const handleComplete = () => {
    localStorage.setItem("lifesaver_tour_completed", "true");
    onClose();
  };

  const tabs = [
    { id: "problem", label: "The Problem (PS)", icon: ShieldAlert },
    { id: "solution", label: "How We Solve It", icon: Brain },
    { id: "uniqueness", label: "Why We're Different", icon: Sparkles },
    { id: "guide", label: "Quick Start Guide", icon: Compass },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none overflow-y-auto font-sans"
      id="app-intro-overlay"
    >
      <div 
        className="bg-[#0e0e11] border border-neutral-800/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
        id="app-intro-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Brand Banner / Accent Header */}
        <div className="w-full md:w-1/3 bg-gradient-to-b from-rose-950/40 via-[#0e0e11] to-[#0e0e11] p-6 md:p-8 border-b md:border-b-0 md:border-r border-neutral-800/60 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 flex items-center justify-center">
                <Flame className="w-5 h-5 animate-pulse" />
              </span>
              <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                  RESQ.AI <span className="text-[9px] bg-rose-600 px-1.5 py-0.5 rounded text-white font-bold tracking-normal font-sans">AGENTIC</span>
                </h1>
                <span className="text-[9px] text-neutral-400 tracking-wider uppercase font-mono">The Deadline Rescue Core</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white leading-tight font-sans">
                The only app built for late-night deadline panic.
              </h2>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                Procrastination and deadline freeze are physiological responses to stress. We don't pretend you are a perfect robot. We provide the tools to actively rescue you.
              </p>
            </div>
          </div>

          <div className="mt-8 md:mt-0 space-y-4">
            {/* Quick Stats list */}
            <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                RESQ.VOICE Core: ONLINE
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                CLUSTERS: REAL-TIME SECURED
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                BREATH MATRIX: INTEGRATED
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white py-3 px-4 rounded-xl text-xs font-mono font-bold transition duration-150 cursor-pointer shadow-lg shadow-rose-950/20"
              id="intro-enter-workspace-btn"
            >
              Enter Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Tabbed Explainer Navigation & Content */}
        <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto max-h-[60vh] md:max-h-full">
          {/* Header row with Tab buttons */}
          <div className="flex items-center justify-between border-b border-neutral-800/60 pb-4 mb-6">
            <span className="text-[10px] font-mono font-black tracking-widest text-neutral-400 uppercase">
              Project Onboarding & Concept
            </span>
            <button
              onClick={handleComplete}
              className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition cursor-pointer"
              title="Close Guide"
              id="intro-close-icon-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Tabs Bar */}
          <div className="flex flex-wrap gap-2 mb-6" id="intro-tabs-navigation">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                    isActive
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-md shadow-rose-950/10"
                      : "bg-neutral-900 border-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                  id={`intro-tab-btn-${tab.id}`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-rose-500' : 'text-neutral-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Explainer Area */}
          <div className="flex-1 flex flex-col min-h-0" id="intro-tab-content-container">
            {activeTab === "problem" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-500 tracking-wider">
                    THE PROBLEM STATEMENT (PS)
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Why Traditional Planners Fail During High-Stress Deadlines
                  </h3>
                </div>

                <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
                  <p>
                    Most productivity applications are designed with an unrealistic premise: <strong className="text-white">they assume the user is a logical, stress-free actor.</strong> They present you with long, sterile lists of tasks, calendars, and trackers.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="bg-neutral-900/50 border border-neutral-800/40 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-[11px]">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        Deadline Paralysis
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        When stress levels cross a threshold, the amygdala takes over, inducing a "freeze" state. Looking at a 20-item to-do list makes you shut down entirely and procrastinate.
                      </p>
                    </div>

                    <div className="bg-neutral-900/50 border border-neutral-800/40 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-[11px]">
                        <Zap className="w-4 h-4 shrink-0" />
                        Cognitive Friction
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed">
                        Manually triaging lists and figuring out how to fit buffers around your actual calendar block schedules while panicking is incredibly exhausting, leading to deeper delay.
                      </p>
                    </div>
                  </div>

                  <p className="pt-2 text-neutral-400 italic">
                    "Under extreme adrenaline, you don't need a comprehensive archive of your life goals. You need a simple, visual, action-first control center that calms your physiology and schedules your next steps for you."
                  </p>
                </div>
              </div>
            )}

            {activeTab === "solution" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">
                    OUR SOLUTION ENGINE
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    How RESQ.AI Directly Solves the Stress Cycle
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
                  <p>
                    We designed a unified tactical control dashboard to guide you step-by-step from chaotic panic back into flow.
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex gap-3 items-start bg-neutral-900/30 p-3 rounded-2xl border border-neutral-800/40">
                      <span className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-[11px] font-mono">1. Voice-Enabled Autonomous Assistance (RESQ.VOICE)</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          No more manual tapping. Speak naturally to RESQ.VOICE (powered by Google Gemini-2.5-flash). Tell it what's due, and it parses your words, speaks back calming tactical advice, automatically schedules tasks, and configures Pomodoro focus.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-neutral-900/30 p-3 rounded-2xl border border-neutral-800/40">
                      <span className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-[11px] font-mono">2. Intelligent Priority Solver (Panic Mode)</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Calculates stress metrics dynamically. Activating "PANIC MODE" runs server-side smart models with multi-model fallbacks (NVIDIA NIM/Ollama/Gemini) to draft custom hourly schedules, calendar exclusion layouts, and predictive danger mitigations.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-neutral-900/30 p-3 rounded-2xl border border-neutral-800/40">
                      <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-[11px] font-mono">3. Integrated Somatic Recovery (Box Breath)</h4>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Combats physical "deadline freeze" on the spot. The built-in interactive breathing companion uses a guided 4-4-4 diaphragmatic pacer to instantly signal your autonomic nervous system to downregulate adrenaline and lower cortisol.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "uniqueness" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider">
                    COMPETITIVE LANDSCAPE
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Why RESQ.AI is a True Hackathon Winner
                  </h3>
                </div>

                <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
                  <p>
                    Standard productivity apps (like Todoist, Notion, or Google Calendar) are passive logs. They record what you need to do but leave you to fight your own anxiety. RESQ.AI is an agentic, tactical companion built to solve deadlines with you.
                  </p>

                  <table className="w-full text-left border-collapse text-[10px] bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden">
                    <thead>
                      <tr className="bg-neutral-900 border-b border-neutral-800 text-neutral-400 uppercase font-mono">
                        <th className="p-3">Feature Area</th>
                        <th className="p-3 text-neutral-500">Other Planners</th>
                        <th className="p-3 text-emerald-400">RESQ.AI (Ours)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 font-sans">
                      <tr>
                        <td className="p-3 font-mono font-bold text-white">Target State</td>
                        <td className="p-3 text-neutral-400">Calm/Structured future</td>
                        <td className="p-3 text-emerald-300 font-medium">Active High-Stress Crisis</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-white">Agentic Input</td>
                        <td className="p-3 text-neutral-400">Manual forms & clicks</td>
                        <td className="p-3 text-emerald-300 font-medium">Speech-to-Intent Voice Core (Gemini)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-white">Panic Relief</td>
                        <td className="p-3 text-neutral-400">None</td>
                        <td className="p-3 text-emerald-300 font-medium">Server-side Multi-Model Fallback AI Solutions</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-white">Physiology Support</td>
                        <td className="p-3 text-neutral-400">Separated apps</td>
                        <td className="p-3 text-emerald-300 font-medium">Integrated Diaphragmatic Box Breathing</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-bold text-white">Data Sync</td>
                        <td className="p-3 text-neutral-400">Offline only or generic</td>
                        <td className="p-3 text-emerald-300 font-medium">Secure Google Firestore Persistence</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "guide" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-rose-400 tracking-wider">
                    OPERATIONAL PROTOCOL
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    How to Survive Your Next Deadline in 4 Steps
                  </h3>
                </div>

                <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-neutral-800/80 p-3.5 rounded-2xl bg-neutral-900/30">
                      <div className="flex items-center gap-2 text-white font-bold font-mono text-[10px] mb-1">
                        <span className="w-5 h-5 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center font-mono text-[9px] border border-neutral-700/50">
                          1
                        </span>
                        Speak to RESQ.VOICE
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Click the glowing mic floating pill. Say "Add high priority task build slides by midnight" or "Start focus timer". Watch it organize your space hands-free.
                      </p>
                    </div>

                    <div className="border border-neutral-800/80 p-3.5 rounded-2xl bg-neutral-900/30">
                      <div className="flex items-center gap-2 text-white font-bold font-mono text-[10px] mb-1">
                        <span className="w-5 h-5 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center font-mono text-[9px] border border-neutral-700/50">
                          2
                        </span>
                        Define Exclusions
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Specify scheduled sleep, hard meetings, or breaks in the Calendar Guard. RESQ.AI isolates these to secure absolute buffers for work blocks.
                      </p>
                    </div>

                    <div className="border border-neutral-800/80 p-3.5 rounded-2xl bg-neutral-900/30">
                      <div className="flex items-center gap-2 text-white font-bold font-mono text-[10px] mb-1">
                        <span className="w-5 h-5 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center font-mono text-[9px] border border-neutral-700/50">
                          3
                        </span>
                        Trigger Panic Mode
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Hit "RESCUE MY SCHEDULE". Our AI calculates importance, stress weight, and timezone gaps, creating a comprehensive hourly timeline.
                      </p>
                    </div>

                    <div className="border border-neutral-800/80 p-3.5 rounded-2xl bg-neutral-900/30">
                      <div className="flex items-center gap-2 text-white font-bold font-mono text-[10px] mb-1">
                        <span className="w-5 h-5 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center font-mono text-[9px] border border-neutral-700/50">
                          4
                        </span>
                        Engage Flow Pacing
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Start Pomodoro locks in the Focus tab. Keep habits checked. If indicators turn critical red, use somatic Box Breathing to pacify your adrenaline.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-800/50 pt-4 mt-2">
                    <span className="text-[9px] font-mono text-neutral-400">Ready to command your deadlines?</span>
                    <button
                      onClick={handleComplete}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-mono font-bold transition duration-150 cursor-pointer shadow-md"
                    >
                      Acknowledge & Start
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper buttons below content */}
          <div className="border-t border-neutral-800/60 pt-4 mt-6 flex items-center justify-between text-neutral-500 text-[10px] font-mono">
            <div>
              Active View: <span className="text-neutral-300 font-bold uppercase">{activeTab}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-2 h-2 rounded-full transition-all duration-150 cursor-pointer ${
                    activeTab === tab.id ? "bg-rose-500 w-4" : "bg-neutral-800 hover:bg-neutral-700"
                  }`}
                  title={`Go to ${tab.label}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
