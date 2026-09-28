import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

type Question = { category: string; q: string; options: string[]; answer: number };

const QUESTIONS: Question[] = [
  { category: "Videojuegos", q: "¿Qué compañía creó Mario?", options: ["Sega", "Nintendo", "Sony", "Atari"], answer: 1 },
  { category: "Videojuegos", q: "¿En qué juego aparece Aloy?", options: ["Horizon", "Halo", "Doom", "Fortnite"], answer: 0 },
  { category: "Videojuegos", q: "¿Cuál fue la consola portátil de Nintendo de 1989?", options: ["Game Gear", "PSP", "Game Boy", "Lynx"], answer: 2 },
  { category: "Geografía", q: "¿Cuál es la capital de Australia?", options: ["Sídney", "Melbourne", "Canberra", "Perth"], answer: 2 },
  { category: "Geografía", q: "¿Qué río pasa por Egipto?", options: ["Nilo", "Amazonas", "Danubio", "Ganges"], answer: 0 },
  { category: "Ciencia", q: "¿Cuántos planetas tiene el sistema solar?", options: ["7", "8", "9", "10"], answer: 1 },
  { category: "Ciencia", q: "¿Qué gas respiramos principalmente?", options: ["Oxígeno", "Helio", "Nitrógeno", "Hidrógeno"], answer: 2 },
  { category: "Historia", q: "¿En qué año cayó el muro de Berlín?", options: ["1989", "1975", "1991", "1968"], answer: 0 },
  { category: "Cine", q: "¿Quién dirigió 'Interstellar'?", options: ["Spielberg", "Nolan", "Cameron", "Scott"], answer: 1 },
  { category: "Música", q: "¿Cuántas cuerdas tiene un bajo estándar?", options: ["4", "5", "6", "7"], answer: 0 },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function Quiz({ finish, play }: GameProps) {
  const questions = useMemo(() => shuffle(QUESTIONS).slice(0, 8), []);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[index];

  const choose = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    const ok = option === current.answer;
    if (ok) {
      setCorrect((c) => c + 1);
      play("score");
    } else {
      play("lose");
    }
  };

  const next = () => {
    setPicked(null);
    if (index + 1 >= questions.length) {
      const finalCorrect = correct;
      setDone(true);
      play("win");
      finish({ score: finalCorrect * 25, won: finalCorrect > questions.length / 2 });
      return;
    }
    setIndex((i) => i + 1);
  };

  if (done) {
    return (
      <div className="animate-pop panel mx-auto max-w-md px-8 py-8 text-center">
        <p className="font-display text-3xl text-gradient">
          {correct} / {questions.length}
        </p>
        <p className="mt-2 text-muted-foreground">
          {correct === questions.length
            ? "¡Perfecto!"
            : correct > questions.length / 2
              ? "¡Buen resultado!"
              : "Puedes mejorarlo, inténtalo de nuevo."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Puntos: {correct * 25}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="rounded-full border border-border bg-surface px-3 py-1">
          {current.category}
        </span>
        <span>
          Pregunta {index + 1} de {questions.length} · Aciertos {correct}
        </span>
      </div>
      <h3 className="font-display text-xl">{current.q}</h3>
      <div className="grid gap-3">
        {current.options.map((option, i) => {
          const isAnswer = i === current.answer;
          const show = picked !== null;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(i)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                show && isAnswer
                  ? "border-success bg-success/20"
                  : show && picked === i
                    ? "border-destructive bg-destructive/20"
                    : "border-border bg-surface hover:border-ring hover:bg-surface-2"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <Button variant="hero" onClick={next}>
          {index + 1 >= questions.length ? "Ver resultado" : "Siguiente"}
        </Button>
      )}
    </div>
  );
}
