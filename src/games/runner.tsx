import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameProps } from "./types";

const W = 640;
const H = 260;
const GROUND = H - 40;

type Obstacle = { x: number; w: number; h: number };

export default function Runner({ finish, play }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const sent = useRef(false);

  const state = useRef({
    y: GROUND,
    vy: 0,
    obstacles: [] as Obstacle[],
    speed: 5,
    tick: 0,
    score: 0,
    running: true,
  });

  const jump = useCallback(() => {
    const s = state.current;
    if (!s.running) return;
    if (s.y >= GROUND - 1) {
      s.vy = -12;
      play("click");
    }
  }, [play]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const loop = () => {
      const s = state.current;
      if (s.running) {
        s.tick += 1;
        s.speed = 5 + s.tick / 600;
        s.vy += 0.62;
        s.y = Math.min(GROUND, s.y + s.vy);
        if (s.y === GROUND) s.vy = 0;

        if (s.tick % Math.max(38, Math.round(90 - s.speed * 4)) === 0) {
          s.obstacles.push({ x: W + 20, w: 18 + Math.random() * 16, h: 26 + Math.random() * 26 });
        }
        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => {
          if (o.x + o.w < 0) {
            s.score += 10;
            return false;
          }
          return true;
        });
        setScore(s.score);

        const hit = s.obstacles.some(
          (o) => o.x < 70 && o.x + o.w > 34 && s.y > GROUND - o.h - 4,
        );
        if (hit) {
          s.running = false;
          setOver(true);
        }
      }

      ctx.fillStyle = "#141024";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(197,107,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 18);
      ctx.lineTo(W, GROUND + 18);
      ctx.stroke();

      const s2 = state.current;
      ctx.fillStyle = "#9df5d0";
      s2.obstacles.forEach((o) => ctx.fillRect(o.x, GROUND + 18 - o.h, o.w, o.h));

      ctx.fillStyle = "#ff6bb5";
      ctx.fillRect(38, s2.y - 14, 30, 32);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (over && !sent.current) {
      sent.current = true;
      play("lose");
      finish({ score });
    }
  }, [over, score, finish, play]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="font-display text-lg">
        Distancia: <span className="text-gradient">{score}</span>
      </p>
      <div className="relative w-full max-w-[640px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onPointerDown={jump}
          className={`w-full cursor-pointer rounded-xl border border-border touch-none ${
            over ? "animate-shake" : ""
          }`}
        />
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
            <p className="animate-pop font-display text-3xl text-destructive">Game Over</p>
            <p className="text-muted-foreground">Distancia: {score}</p>
          </div>
        )}
      </div>
      <Button variant="secondary" onClick={jump} className="sm:hidden">
        Saltar
      </Button>
      <p className="text-sm text-muted-foreground">Espacio, ↑ o toca la pantalla para saltar.</p>
    </div>
  );
}
