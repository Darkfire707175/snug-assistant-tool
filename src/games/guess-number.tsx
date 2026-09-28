import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameProps } from "./types";

export default function GuessNumber({ finish, play }: GameProps) {
  const target = useRef(1 + Math.floor(Math.random() * 100));
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const [history, setHistory] = useState<{ guess: number; hint: string }[]>([]);
  const [won, setWon] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = Number(value);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100 || won) return;
    const attempts = tries + 1;
    setTries(attempts);
    setValue("");
    if (guess === target.current) {
      play("win");
      setHistory((h) => [{ guess, hint: "¡Correcto!" }, ...h]);
      setWon(true);
      finish({ score: Math.max(120 - attempts * 8, 10), won: true });
      return;
    }
    play("click");
    setHistory((h) => [{ guess, hint: guess < target.current ? "Más alto ⬆️" : "Más bajo ⬇️" }, ...h]);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5">
      <p className="text-center text-muted-foreground">
        He pensado un número entre 1 y 100. ¿Cuál es?
      </p>
      <form onSubmit={submit} className="flex w-full gap-2">
        <Input
          type="number"
          min={1}
          max={100}
          value={value}
          disabled={won}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tu número"
          className="text-center text-lg"
        />
        <Button type="submit" variant="hero" disabled={won || value === ""}>
          Probar
        </Button>
      </form>
      <p className="font-display">
        Intentos: <span className="text-gradient">{tries}</span>
      </p>

      {won && (
        <div className="animate-pop panel w-full px-6 py-5 text-center">
          <p className="font-display text-2xl text-gradient">¡Adivinado!</p>
          <p className="text-muted-foreground">
            El número era {target.current} y lo conseguiste en {tries} intentos.
          </p>
        </div>
      )}

      <ul className="w-full space-y-2">
        {history.map((h, i) => (
          <li
            key={`${h.guess}-${i}`}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2"
          >
            <span className="font-display">{h.guess}</span>
            <span className="text-sm text-muted-foreground">{h.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
