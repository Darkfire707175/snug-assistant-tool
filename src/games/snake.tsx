import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

const SIZE = 20;
const TICK = 110;

type Point = { x: number; y: number };

export default function Snake({ finish, play }: GameProps) {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const dir = useRef<Point>({ x: 1, y: 0 });
  const nextDir = useRef<Point>({ x: 1, y: 0 });
  const finished = useRef(false);

  const setDirection = useCallback((d: Point) => {
    if (d.x === -dir.current.x && d.y === -dir.current.y) return;
    nextDir.current = d;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        setDirection(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection]);

  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => {
      setSnake((prev) => {
        dir.current = nextDir.current;
        const head = {
          x: prev[0].x + dir.current.x,
          y: prev[0].y + dir.current.y,
        };
        const hitWall = head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE;
        const hitSelf = prev.some((p) => p.x === head.x && p.y === head.y);
        if (hitWall || hitSelf) {
          setOver(true);
          return prev;
        }
        const ate = head.x === food.x && head.y === food.y;
        const body = [head, ...prev];
        if (ate) {
          setScore((s) => s + 10);
          play("score");
          let next: Point;
          do {
            next = {
              x: Math.floor(Math.random() * SIZE),
              y: Math.floor(Math.random() * SIZE),
            };
          } while (body.some((p) => p.x === next.x && p.y === next.y));
          setFood(next);
        } else {
          body.pop();
        }
        return body;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [over, food, play]);

  useEffect(() => {
    if (over && !finished.current) {
      finished.current = true;
      play("lose");
      finish({ score });
    }
  }, [over, score, finish, play]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="font-display text-lg">
        Puntuación: <span className="text-gradient">{score}</span>
      </div>
      <div
        className={`relative grid aspect-square w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-surface ${
          over ? "animate-shake" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const x = i % SIZE;
          const y = Math.floor(i / SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = !isHead && snake.some((p) => p.x === x && p.y === y);
          const isFood = food.x === x && food.y === y;
          return (
            <div
              key={i}
              className={
                isHead
                  ? "rounded-[3px] bg-accent"
                  : isBody
                    ? "rounded-[3px] bg-primary"
                    : isFood
                      ? "animate-pulse-glow rounded-full bg-success"
                      : ""
              }
            />
          );
        })}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 backdrop-blur-sm">
            <p className="font-display text-2xl text-destructive">Game Over</p>
            <p className="text-muted-foreground">Puntuación final: {score}</p>
          </div>
        )}
      </div>

      <div className="grid w-[200px] grid-cols-3 gap-2 sm:hidden">
        <span />
        <Button variant="secondary" onClick={() => setDirection({ x: 0, y: -1 })}>
          ↑
        </Button>
        <span />
        <Button variant="secondary" onClick={() => setDirection({ x: -1, y: 0 })}>
          ←
        </Button>
        <Button variant="secondary" onClick={() => setDirection({ x: 0, y: 1 })}>
          ↓
        </Button>
        <Button variant="secondary" onClick={() => setDirection({ x: 1, y: 0 })}>
          →
        </Button>
      </div>
    </div>
  );
}
