import { useEffect, useRef, useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

const SIZE = 9;
const MINES = 10;

type Cell = { mine: boolean; open: boolean; flag: boolean; near: number };

function build(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, near: 0 })),
  );
  let placed = 0;
  while (placed < MINES) {
    const x = Math.floor(Math.random() * SIZE);
    const y = Math.floor(Math.random() * SIZE);
    if (!grid[y][x].mine) {
      grid[y][x].mine = true;
      placed++;
    }
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && nx >= 0 && ny < SIZE && nx < SIZE && grid[ny][nx].mine) n++;
        }
      }
      grid[y][x].near = n;
    }
  }
  return grid;
}

export default function Minesweeper({ finish, play }: GameProps) {
  const [grid, setGrid] = useState<Cell[][]>(build);
  const [state, setState] = useState<"playing" | "won" | "lost">("playing");
  const [flagMode, setFlagMode] = useState(false);
  const sent = useRef(false);

  const flags = grid.flat().filter((c) => c.flag).length;
  const safeLeft = grid.flat().filter((c) => !c.mine && !c.open).length;

  useEffect(() => {
    if (state === "playing" && safeLeft === 0) setState("won");
  }, [safeLeft, state]);

  useEffect(() => {
    if (state !== "playing" && !sent.current) {
      sent.current = true;
      play(state === "won" ? "win" : "lose");
      const opened = grid.flat().filter((c) => c.open && !c.mine).length;
      finish({ score: state === "won" ? 150 : opened * 2, won: state === "won" });
    }
  }, [state, grid, finish, play]);

  const reveal = (x: number, y: number) => {
    if (state !== "playing") return;
    setGrid((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })));
      const cell = next[y][x];
      if (flagMode) {
        if (!cell.open) cell.flag = !cell.flag;
        play("click");
        return next;
      }
      if (cell.flag || cell.open) return next;
      if (cell.mine) {
        next.forEach((row) => row.forEach((c) => { if (c.mine) c.open = true; }));
        setState("lost");
        return next;
      }
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        const c = next[cy][cx];
        if (c.open || c.flag) continue;
        c.open = true;
        if (c.near === 0) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = cy + dy;
              const nx = cx + dx;
              if (ny >= 0 && nx >= 0 && ny < SIZE && nx < SIZE && !next[ny][nx].open) {
                stack.push([nx, ny]);
              }
            }
          }
        }
      }
      play("score");
      return next;
    });
  };

  const colors = ["", "text-secondary", "text-success", "text-accent", "text-primary", "text-destructive", "text-accent", "text-foreground", "text-foreground"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="font-display">💣 {MINES - flags}</span>
        <Button
          variant={flagMode ? "hero" : "secondary"}
          size="sm"
          onClick={() => setFlagMode((f) => !f)}
        >
          <Flag className="mr-1 h-4 w-4" /> {flagMode ? "Modo bandera" : "Poner bandera"}
        </Button>
      </div>
      <div
        className={`grid gap-1 ${state === "lost" ? "animate-shake" : ""}`}
        style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <button
              key={`${x}-${y}`}
              type="button"
              onContextMenu={(e) => {
                e.preventDefault();
                setGrid((prev) => {
                  const next = prev.map((r) => r.map((c) => ({ ...c })));
                  if (!next[y][x].open) next[y][x].flag = !next[y][x].flag;
                  return next;
                });
              }}
              onClick={() => reveal(x, y)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border border-border text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                cell.open
                  ? cell.mine
                    ? "bg-destructive/30"
                    : "bg-surface-2"
                  : "bg-gradient-brand hover:opacity-85"
              }`}
            >
              {cell.open
                ? cell.mine
                  ? "💥"
                  : cell.near > 0
                    ? <span className={colors[cell.near]}>{cell.near}</span>
                    : ""
                : cell.flag
                  ? "🚩"
                  : ""}
            </button>
          )),
        )}
      </div>
      {state !== "playing" && (
        <div className="animate-pop panel px-8 py-5 text-center">
          <p
            className={`font-display text-2xl ${
              state === "won" ? "text-success" : "text-destructive"
            }`}
          >
            {state === "won" ? "¡Campo despejado!" : "¡Boom!"}
          </p>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Clic para abrir. Clic derecho o el botón de bandera para marcar minas.
      </p>
    </div>
  );
}
