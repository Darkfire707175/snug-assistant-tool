import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Tone = "click" | "score" | "win" | "lose" | "tick";

type SoundContextValue = {
  enabled: boolean;
  toggle: () => void;
  play: (tone: Tone) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const TONES: Record<Tone, { freq: number[]; dur: number; type: OscillatorType }> = {
  click: { freq: [520], dur: 0.06, type: "square" },
  score: { freq: [660, 880], dur: 0.1, type: "triangle" },
  win: { freq: [523, 659, 784, 1046], dur: 0.14, type: "triangle" },
  lose: { freq: [330, 220, 140], dur: 0.16, type: "sawtooth" },
  tick: { freq: [420], dur: 0.04, type: "sine" },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("gamezone:sound");
    if (stored === "on") setEnabled(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("gamezone:sound", next ? "on" : "off");
      return next;
    });
  }, []);

  const play = useCallback(
    (tone: Tone) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") void ctx.resume();
        const spec = TONES[tone];
        spec.freq.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = spec.type;
          osc.frequency.value = f;
          const start = ctx.currentTime + i * spec.dur;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.14, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.dur);
          osc.connect(gain).connect(ctx.destination);
          osc.start(start);
          osc.stop(start + spec.dur + 0.02);
        });
      } catch {
        /* audio not available */
      }
    },
    [enabled],
  );

  return <SoundContext.Provider value={{ enabled, toggle, play }}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside SoundProvider");
  return ctx;
}
