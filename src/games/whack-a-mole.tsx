import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GameProps } from "./types";

const DURATION = 30;

export default function WhackAMole({ finish, play }: GameProps) {
  const [active, setActive] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const sent = useRef(false);

  useEffect(() => {
    if (phase !== "running") return;
    const spawn = window.setInterval(() => {
      setActive(Math.floor(Math.random() * 9));
    }, 800);
    const clock = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          setPhase("done");
          setActive(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(spawn);
      window.clearInterval(clock);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "done" && !sent.current) {
      sent.current = true;
      play("win");
      finish({ score: score * 5, won: score > 10 });
    }
  }, [phase, score, finish, play]);

  const hit = (i: number) => {
    if (phase !== "running" || active !== i) return;
    play("score");
    setScore((s) => s + 1);
    setActive(null);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex w-full max-w-sm items-center justify-between font-display">
        <span>
          Topos: <span className="text-gradient">{score}</span>
        </span>
        <span>{left}s</span>
      </div>
      <Progress value={(left / DURATION) * 100} className="w-full max-w-sm" />
      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => hit(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl border border-border text-4xl transition-all ${
              active === i ? "animate-pop bg-surface-2" : "bg-surface"
            }`}
          >
            {active === i ? "🐹" : "🕳️"}
          </button>
        ))}
      </div>
      {phase === "idle" && (
        <Button variant="hero" onClick={() => setPhase("running")}>
          Comenzar
        </Button>
      )}
      {phase === "done" && (
        <div className="animate-pop panel px-8 py-5 text-center">
          <p className="font-display text-2xl text-gradient">{score} topos</p>
          <p className="text-muted-foreground">Puntos: {score * 5}</p>
        </div>
      )}
    </div>
  );
}
