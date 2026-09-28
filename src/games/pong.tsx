import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

const W = 640;
const H = 400;
const PADDLE_H = 80;
const PADDLE_W = 12;
const TARGET = 5;

export default function Pong({ finish, play }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState({ player: 0, cpu: 0 });
  const [result, setResult] = useState<"playing" | "won" | "lost">("playing");
  const sent = useRef(false);

  const state = useRef({
    py: H / 2 - PADDLE_H / 2,
    cy: H / 2 - PADDLE_H / 2,
    bx: W / 2,
    by: H / 2,
    vx: 5,
    vy: 3,
    up: false,
    down: false,
    player: 0,
    cpu: 0,
    running: true,
  });

  useEffect(() => {
    const keys = (down: boolean) => (e: KeyboardEvent) => {
      if (["ArrowUp", "w", "W"].includes(e.key)) {
        state.current.up = down;
        e.preventDefault();
      }
      if (["ArrowDown", "s", "S"].includes(e.key)) {
        state.current.down = down;
        e.preventDefault();
      }
    };
    const kd = keys(true);
    const ku = keys(false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

    const reset = (towardsPlayer: boolean) => {
      const s = state.current;
      s.bx = W / 2;
      s.by = H / 2;
      s.vx = towardsPlayer ? -5 : 5;
      s.vy = Math.random() > 0.5 ? 3 : -3;
    };

    const loop = () => {
      const s = state.current;
      if (s.running) {
        if (s.up) s.py -= 7;
        if (s.down) s.py += 7;
        s.py = Math.max(0, Math.min(H - PADDLE_H, s.py));

        const targetY = s.by - PADDLE_H / 2;
        s.cy += Math.max(-4.4, Math.min(4.4, targetY - s.cy));
        s.cy = Math.max(0, Math.min(H - PADDLE_H, s.cy));

        s.bx += s.vx;
        s.by += s.vy;
        if (s.by < 8 || s.by > H - 8) s.vy *= -1;

        if (s.bx - 8 < PADDLE_W + 12 && s.by > s.py && s.by < s.py + PADDLE_H && s.vx < 0) {
          s.vx = Math.abs(s.vx) * 1.04;
          s.vy += ((s.by - (s.py + PADDLE_H / 2)) / PADDLE_H) * 4;
          play("click");
        }
        if (s.bx + 8 > W - PADDLE_W - 12 && s.by > s.cy && s.by < s.cy + PADDLE_H && s.vx > 0) {
          s.vx = -Math.abs(s.vx) * 1.04;
          s.vy += ((s.by - (s.cy + PADDLE_H / 2)) / PADDLE_H) * 4;
          play("click");
        }

        if (s.bx < 0) {
          s.cpu += 1;
          setScore({ player: s.player, cpu: s.cpu });
          play("lose");
          reset(false);
        } else if (s.bx > W) {
          s.player += 1;
          setScore({ player: s.player, cpu: s.cpu });
          play("score");
          reset(true);
        }

        if (s.player >= TARGET || s.cpu >= TARGET) {
          s.running = false;
          setResult(s.player >= TARGET ? "won" : "lost");
        }
      }

      ctx.fillStyle = "#171326";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#c56bff";
      ctx.fillRect(12, s.py, PADDLE_W, PADDLE_H);
      ctx.fillStyle = "#ff6bb5";
      ctx.fillRect(W - PADDLE_W - 12, s.cy, PADDLE_W, PADDLE_H);

      ctx.beginPath();
      ctx.fillStyle = "#9df5d0";
      ctx.arc(s.bx, s.by, 8, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [play]);

  useEffect(() => {
    if (result !== "playing" && !sent.current) {
      sent.current = true;
      play(result === "won" ? "win" : "lose");
      finish({ score: score.player * 20, won: result === "won" });
    }
  }, [result, score.player, finish, play]);

  const touchMove = (clientY: number, rect: DOMRect) => {
    const ratio = (clientY - rect.top) / rect.height;
    state.current.py = Math.max(0, Math.min(H - PADDLE_H, ratio * H - PADDLE_H / 2));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-[640px] justify-between font-display text-xl">
        <span className="text-primary">Tú {score.player}</span>
        <span className="text-accent">{score.cpu} CPU</span>
      </div>
      <div className="relative w-full max-w-[640px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-xl border border-border touch-none"
          onTouchStart={(e) => touchMove(e.touches[0].clientY, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => touchMove(e.touches[0].clientY, e.currentTarget.getBoundingClientRect())}
          onMouseMove={(e) => touchMove(e.clientY, e.currentTarget.getBoundingClientRect())}
        />
        {result !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-background/80 backdrop-blur-sm">
            <p
              className={`animate-pop font-display text-3xl ${
                result === "won" ? "text-success" : "text-destructive"
              }`}
            >
              {result === "won" ? "¡Victoria!" : "Derrota"}
            </p>
            <p className="text-muted-foreground">
              {score.player} - {score.cpu}
            </p>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Teclas ↑ / ↓ o W / S. En móvil arrastra el dedo sobre el tablero.
      </p>
    </div>
  );
}
