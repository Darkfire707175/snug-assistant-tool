import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GameProps } from "./types";

const DURATION = 10;

export default function ClickRush({ finish, play }: GameProps) {
  const [clicks, setClicks] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const sent = useRef(false);

  useEffect(() => {
    if (state !== "running") return;
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 0.1) {
          setState("done");
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (state === "done" && !sent.current) {
      sent.current = true;
      play("win");
      finish({ score: clicks, won: clicks > 0 });
    }
  }, [state, clicks, finish, play]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-md items-center justify-between font-display text-lg">
        <span>
          Clics: <span className="text-gradient">{clicks}</span>
        </span>
        <span>{left.toFixed(1)} s</span>
      </div>
      <Progress value={(left / DURATION) * 100} className="w-full max-w-md" />

      {state === "idle" && (
        <Button size="lg" variant="hero" onClick={() => setState("running")}>
          Comenzar
        </Button>
      )}

      {state === "running" && (
        <button
          type="button"
          onClick={() => {
            setClicks((c) => c + 1);
            play("click");
          }}
          className="h-56 w-56 rounded-full bg-gradient-brand font-display text-2xl text-primary-foreground shadow-glow transition-transform active:scale-95 sm:h-64 sm:w-64"
        >
          ¡CLIC!
        </button>
      )}

      {state === "done" && (
        <div className="animate-pop panel px-8 py-6 text-center">
          <p className="font-display text-3xl text-gradient">{clicks} clics</p>
          <p className="mt-1 text-muted-foreground">
            {(clicks / DURATION).toFixed(1)} clics por segundo
          </p>
        </div>
      )}
    </div>
  );
}
