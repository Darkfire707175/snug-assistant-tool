import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

type Mark = "X" | "O" | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winner(board: Mark[]): { mark: Mark; line: number[] } | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line };
    }
  }
  return null;
}

function bestMove(board: Mark[]): number {
  const empty = board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  for (const i of empty) {
    const test = [...board];
    test[i] = "O";
    if (winner(test)?.mark === "O") return i;
  }
  for (const i of empty) {
    const test = [...board];
    test[i] = "X";
    if (winner(test)?.mark === "X") return i;
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe({ finish, play }: GameProps) {
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"player" | "cpu">("player");
  const sent = useRef(false);

  const result = winner(board);
  const full = board.every(Boolean);
  const over = !!result || full;

  useEffect(() => {
    if (turn !== "cpu" || over) return;
    const id = window.setTimeout(() => {
      setBoard((prev) => {
        if (winner(prev) || prev.every(Boolean)) return prev;
        const next = [...prev];
        next[bestMove(prev)] = "O";
        return next;
      });
      setTurn("player");
      play("click");
    }, 420);
    return () => window.clearTimeout(id);
  }, [turn, over, play]);

  useEffect(() => {
    if (!over || sent.current) return;
    sent.current = true;
    const won = result?.mark === "X";
    play(won ? "win" : result ? "lose" : "tick");
    finish({ score: won ? 100 : result ? 0 : 40, won });
  }, [over, result, finish, play]);

  const pick = (i: number) => {
    if (board[i] || over || turn !== "player") return;
    play("click");
    setBoard((prev) => {
      const next = [...prev];
      next[i] = "X";
      return next;
    });
    setTurn("cpu");
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="font-display text-lg">
        {over
          ? result
            ? result.mark === "X"
              ? "¡Ganaste!"
              : "Gana la CPU"
            : "Empate"
          : turn === "player"
            ? "Tu turno (X)"
            : "Turno de la CPU"}
      </p>
      <div className="grid w-full max-w-[340px] grid-cols-3 gap-3">
        {board.map((mark, i) => (
          <button
            key={i}
            type="button"
            onClick={() => pick(i)}
            className={`flex aspect-square items-center justify-center rounded-xl border border-border font-display text-4xl transition-all ${
              result?.line.includes(i) ? "bg-success/25" : "bg-surface hover:bg-surface-2"
            } ${mark === "X" ? "text-primary" : "text-accent"}`}
          >
            {mark}
          </button>
        ))}
      </div>
    </div>
  );
}
