/**
 * Browser-safe dynamic synthesizer audio player using Web Audio API
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  // Resume context if suspended (browser security policies require user interaction)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Ascending sweet chime representing focus block completion success
 */
export function playFocusCompleteSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Ascending G5 major chord chime (G5, B5, D6)
    playTone(783.99, now, 0.4);        // G5
    playTone(987.77, now + 0.12, 0.4);  // B5
    playTone(1174.66, now + 0.24, 0.6); // D6
  } catch (err) {
    console.warn("Focus audio cue failed to play:", err);
  }
}

/**
 * Friendly digital double beep notification chime for triggered nudges
 */
export function playNudgeSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + duration);
    };

    // Sophisticated modern chime (F#5, A5)
    playTone(739.99, now, 0.08);
    playTone(880.00, now + 0.1, 0.2);
  } catch (err) {
    console.warn("Nudge audio cue failed to play:", err);
  }
}
