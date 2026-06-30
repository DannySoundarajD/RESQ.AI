import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, Terminal, X, BrainCircuit, Play, CornerDownRight } from "lucide-react";
import { Task, SavedPrefs } from "../types";

interface VoiceAssistantProps {
  prefs: SavedPrefs;
  tasks: Task[];
  onAddTask: (taskData: { title: string; estimatedMinutes: number; importance: number; dueDate: string }) => void;
  onStartTimer: (minutes: number) => void;
  onTriggerRescue: () => void;
  onNavigate: (tab: "tasks" | "rescue" | "focus" | "profile") => void;
  addSystemLog: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function VoiceAssistant({
  prefs,
  tasks,
  onAddTask,
  onStartTimer,
  onTriggerRescue,
  onNavigate,
  addSystemLog
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [aiResponse, setAiResponse] = useState<string>("Hello, I am RESQ.VOICE, your proactive agentic deadline companion. Click the mic or write to me.");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [waveformActive, setWaveformActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Synthesis & Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          setWaveformActive(true);
          addSystemLog("🎤 Speech Recognition engine listening...", "info");
        };

        recognition.onend = () => {
          setIsListening(false);
          setWaveformActive(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error", event.error);
          setIsListening(false);
          setWaveformActive(false);
          addSystemLog(`Voice input error: ${event.error}`, "warning");
        };

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setInputText(resultText);
          addSystemLog(`🎤 Speech detected: "${resultText}"`, "success");
          handleSendCommand(resultText);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      addSystemLog("Speech recognition is not natively supported in your browser context. Please use the text input.", "warning");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (synthRef.current) {
        synthRef.current.cancel(); // Stop speaking when starting to listen
      }
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Speech recognition start failed", e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!audioFeedback || !synthRef.current) return;

    // Cancel any current speaking
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose a nice premium sounding voice if available
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Male") || v.name.includes("Microsoft David"));
    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
      setWaveformActive(true);
    };

    utterance.onend = () => {
      setWaveformActive(false);
    };

    utterance.onerror = () => {
      setWaveformActive(false);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleSendCommand = async (textToSend?: string) => {
    const finalCommand = textToSend || inputText;
    if (!finalCommand.trim()) return;

    setIsAiLoading(true);
    setInputText("");
    addSystemLog(`Processing command: "${finalCommand}"...`, "info");

    try {
      const response = await fetch("/api/voice-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: finalCommand,
          gemini_key: prefs.gemini_key,
          tasks: tasks.map(t => ({ title: t.title, completed: t.completed, importance: t.importance }))
        }),
      });

      if (!response.ok) {
        throw new Error("Voice API response error");
      }

      const data = await response.json();
      if (data.success) {
        const spoken = data.spoken_response || "I have received and executed your command.";
        setAiResponse(spoken);
        speakText(spoken);

        // Execute agentic action returned by Gemini
        if (data.action) {
          const { type, payload } = data.action;
          addSystemLog(`Voice Agent dispatched: ${type}`, "success");

          switch (type) {
            case "ADD_TASK":
              if (payload && payload.title) {
                onAddTask({
                  title: payload.title,
                  estimatedMinutes: payload.estimatedMinutes || 30,
                  importance: payload.importance || 3,
                  dueDate: payload.dueDate || new Date(Date.now() + 7200000).toISOString() // default 2 hours
                });
                onNavigate("tasks");
              }
              break;
            case "START_TIMER":
              const timerMins = payload?.timerMinutes || 25;
              onStartTimer(timerMins);
              onNavigate("focus");
              break;
            case "TRIGGER_PANIC":
              onNavigate("rescue");
              setTimeout(() => {
                onTriggerRescue();
              }, 500);
              break;
            case "GET_STATUS":
              onNavigate("profile");
              break;
            case "TALK":
            default:
              // No reactive side-effect needed, just speak / show recommendations
              break;
          }
        }
      } else {
        throw new Error("Malformatted action payload");
      }
    } catch (err: any) {
      console.error(err);
      const fallbackMsg = "Sorry, I had trouble parsing that command. Please check your Gemini connection or restate your command.";
      setAiResponse(fallbackMsg);
      speakText(fallbackMsg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80] font-sans" id="voice-assistant-fab-container">
      {/* Dynamic Voice Assistant Sheet */}
      {isOpen ? (
        <div 
          className="bg-[#0c0c0f] border border-neutral-800 rounded-3xl shadow-2xl w-80 md:w-96 p-4 flex flex-col gap-3.5 animate-in slide-in-from-bottom-5 duration-200"
          id="voice-assistant-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-950 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 flex items-center justify-center animate-pulse">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black tracking-widest text-white uppercase font-mono">
                  RESQ.VOICE <span className="text-[8px] px-1 py-0.5 bg-rose-600 rounded text-white ml-1">GEMINI AI</span>
                </h3>
                <span className="text-[8px] text-neutral-400 font-mono">Voice-Enabled Deadline Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  audioFeedback 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                    : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                }`}
                title={audioFeedback ? "Mute TTS Feedback" : "Unmute TTS Feedback"}
              >
                {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Waveform Visualizer */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[110px] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-rose-500/5 blur-xl pointer-events-none"></div>

            {waveformActive ? (
              <div className="flex items-end justify-center gap-1 h-10 w-full mb-3" id="audio-waveform-bars">
                {[...Array(12)].map((_, i) => {
                  const delay = `${i * 0.1}s`;
                  const height = i % 2 === 0 ? "h-6 animate-pulse" : "h-9 animate-pulse";
                  return (
                    <span 
                      key={i} 
                      className="w-1 bg-gradient-to-t from-rose-600 to-amber-500 rounded-full"
                      style={{ 
                        height: `${Math.floor(Math.random() * 28) + 12}px`,
                        animationDelay: delay,
                        animationDuration: "0.6s"
                      }}
                    ></span>
                  );
                })}
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 animate-ping mr-1"></span>
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                  {isListening ? "Listening Spoken Commands..." : "System Idle / Standby"}
                </span>
              </div>
            )}

            {/* AI Response Bubble */}
            <div className="text-center max-w-full z-10">
              {isAiLoading ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-mono animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Parsing Intent...</span>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-300 leading-relaxed font-sans px-1">
                  {aiResponse}
                </p>
              )}
            </div>
          </div>

          {/* Action Log / Guidance Panel */}
          <div className="bg-neutral-900/50 border border-neutral-850 rounded-xl p-2.5 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-[8px] font-mono font-black text-rose-500 tracking-wider uppercase mb-1">
              <Terminal className="w-3 h-3" />
              Operational Vocals
            </div>
            <div className="text-neutral-400 font-mono space-y-0.5 max-h-[50px] overflow-y-auto no-scrollbar">
              <p className="flex items-start gap-1"><CornerDownRight className="w-2.5 h-2.5 text-neutral-600 mt-0.5 shrink-0" /> "Add task study for test tomorrow"</p>
              <p className="flex items-start gap-1"><CornerDownRight className="w-2.5 h-2.5 text-neutral-600 mt-0.5 shrink-0" /> "Start a focus timer for thirty minutes"</p>
              <p className="flex items-start gap-1"><CornerDownRight className="w-2.5 h-2.5 text-neutral-600 mt-0.5 shrink-0" /> "Solve my schedule now" (Panic solver)</p>
            </div>
          </div>

          {/* Inputs Bar */}
          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl border flex items-center justify-center transition cursor-pointer relative ${
                isListening 
                  ? "bg-rose-600 border-rose-500 text-white animate-pulse" 
                  : "bg-neutral-900 border-neutral-800 text-rose-500 hover:text-rose-400"
              }`}
              title={isListening ? "Stop Recording" : "Speak Voice Command"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
              )}
            </button>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSendCommand(); }}
              className="flex-1 flex gap-1.5 bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type command / instruction..."
                className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-white placeholder-neutral-500"
                id="voice-text-command-input"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                  inputText.trim() 
                    ? "bg-rose-600 text-white hover:bg-rose-500" 
                    : "text-neutral-700 bg-transparent cursor-not-allowed"
                }`}
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Floating Trigger Pill */
        <button
          onClick={() => {
            setIsOpen(true);
            speakText("RESQ.VOICE activated. How can I help you survive your deadline today?");
          }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-mono font-black text-xs tracking-wider rounded-full shadow-2xl shadow-rose-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-400/30"
          id="voice-assistant-fab-trigger"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <Mic className="w-4 h-4" />
          RESQ.VOICE
        </button>
      )}
    </div>
  );
}
