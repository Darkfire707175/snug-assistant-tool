import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

const PADS = [
  { id: 0, base: "bg-primary/40", active: "bg-primary" },
  { id: 1, base: "bg-accent/40", active: "bg-accent" },
  { id: 2, base: "bg-secondary/40", active: "bg-secondary" },
  { id: 3, base: "bg-success/40", active: "bg-success" },
];

export default function Simon({ finish, play }: GameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "over">("idle");
  const [step, setStep] = useState(0);
  const sent = useRef(false);

  const showSequence = useCallback(
    (seq: number[]) => {
      setPhase("showing");
      seq.forEach((pad, i) => {
        window.setTimeout(() => {
          setLit(pad);
          play("tick");
          window.setTimeout(() => setLit(null), 320);
          if (i === seq.length - 1) {
            window.setTimeout(() => {
              setPhase("input");
              setStep(0);
            }, 420);
          }
        }, i * 550);
      });
    },
    [play],
  );

  const start = () => {
    const seq = [Math.floor(Math.random() * 4)];
    setSequence(seq);
    showSequence(seq);
  };

  const press = (pad: number) => {
    if (phase !== "input") return;
    setLit(pad);
    window.setTimeout(() => setLit(null), 180);
    if (sequence[step] !== pad) {
      play("lose");
      setPhase("over");
      return;
    }
    play("score");
    if (step + 1 === sequence.length) {
      const next = [...sequence, Math.floor(Math.random() * 4)];
      window.setTimeout(() => {
        setSequence(next);
        showSequence(next);
      }, 550);
      return;
    }
    setStep((s) => s + 1);
  };

  useEffect(() => {
    if (phase === "over" && !sent.current) {
      sent.current = true;
      const level = sequence.length - 1;
      finish({ score: level * 15, won: level >= 5 });
    }
  }, [phase, sequence.length, finish]);

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="font-display text-lg">
        Nivel: <span className="text-gradient">{Math.max(sequence.length, 0)}</span>
      </p>
      <div className="grid w-full max-w-[340px] grid-cols-2 gap-3">
        {PADS.map((pad) => (
          <button
            key={pad.id}
            type="button"
            onClick={() => press(pad.id)}
            disabled={phase !== "input"}
            className={`aspect-square rounded-2xl border border-border transition-all duration-150 ${
              lit === pad.id ? `${pad.active} scale-95` : pad.base
            } ${phase === "input" ? "hover:brightness-125" : "opacity-80"}`}
          />
        ))}
      </div>
      {phase === "idle" && (
        <Button variant="hero" onClick={start}>
          Comenzar
        </Button>
      )}
      {phase === "showing" && <p className="text-muted-foreground">Observa la secuencia…</p>}
      {phase === "input" && <p className="text-muted-foreground">Repite la secuencia</p>}
      {phase === "over" && (
        <div className="animate-pop panel px-8 py-5 text-center">
          <p className="font-display text-2xl text-destructive">¡Fallaste!</p>
          <p className="text-muted-foreground">Llegaste al nivel {sequence.length - 1}</p>
        </div>
      )}
    </div>
  );
}
