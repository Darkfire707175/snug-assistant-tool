import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

type Phase = "idle" | "waiting" | "go" | "result" | "early";

export default function Reaction({ finish, play }: GameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [ms, setMs] = useState<number | null>(null);
  const startedAt = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const begin = () => {
    setMs(null);
    setPhase("waiting");
    const delay = 1200 + Math.random() * 3000;
    timer.current = window.setTimeout(() => {
      startedAt.current = performance.now();
      play("tick");
      setPhase("go");
    }, delay);
  };

  const hit = () => {
    if (phase === "waiting") {
      if (timer.current) window.clearTimeout(timer.current);
      play("lose");
      setPhase("early");
      return;
    }
    if (phase !== "go") return;
    const value = Math.round(performance.now() - startedAt.current);
    setMs(value);
    setPhase("result");
    play("win");
    finish({ score: value, timeMs: value, won: true });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={phase === "idle" || phase === "result" || phase === "early" ? begin : hit}
        className={`flex h-72 w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-border font-display text-xl transition-colors ${
          phase === "go"
            ? "bg-success text-success-foreground"
            : phase === "early"
              ? "animate-shake bg-destructive text-destructive-foreground"
              : "bg-surface text-foreground"
        }`}
      >
        {phase === "idle" && <span>Pulsa para comenzar</span>}
        {phase === "waiting" && <span className="text-muted-foreground">Espera la señal…</span>}
        {phase === "go" && <span>¡AHORA!</span>}
        {phase === "early" && <span>Demasiado pronto. Pulsa para reintentar</span>}
        {phase === "result" && (
          <span className="animate-pop text-center">
            <span className="text-gradient text-4xl">{ms} ms</span>
            <br />
            <span className="text-sm text-muted-foreground">Pulsa para volver a intentarlo</span>
          </span>
        )}
      </button>
      {phase === "idle" && (
        <Button variant="hero" onClick={begin}>
          Comenzar
        </Button>
      )}
    </div>
  );
}
