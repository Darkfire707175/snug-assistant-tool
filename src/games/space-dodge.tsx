import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

const W = 420;
const H = 560;

type Rock = { x: number; y: number; r: number; v: number };

export default function SpaceDodge({ finish, play }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const sent = useRef(false);

  const state = useRef({
    x: W / 2,
    left: false,
    right: false,
    rocks: [] as Rock[],
    tick: 0,
    score: 0,
    running: true,
  });

  useEffect(() => {
    const handler = (down: boolean) => (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) {
        state.current.left = down;
        e.preventDefault();
      }
      if (["ArrowRight", "d", "D"].includes(e.key)) {
        state.current.right = down;
        e.preventDefault();
      }
    };
    const kd = handler(true);
    const ku = handler(false);
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

    const loop = () => {
      const s = state.current;
      if (s.running) {
        s.tick += 1;
        if (s.left) s.x -= 6;
        if (s.right) s.x += 6;
        s.x = Math.max(20, Math.min(W - 20, s.x));

        const difficulty = 1 + s.tick / 1400;
        if (s.tick % Math.max(14, Math.round(34 / difficulty)) === 0) {
          s.rocks.push({
            x: 20 + Math.random() * (W - 40),
            y: -20,
            r: 10 + Math.random() * 16,
            v: 2.2 * difficulty + Math.random() * 1.6,
          });
        }

        s.rocks.forEach((rock) => (rock.y += rock.v));
        s.rocks = s.rocks.filter((rock) => {
          if (rock.y > H + 30) {
            s.score += 5;
            return false;
          }
          return true;
        });
        setScore(s.score);

        const shipY = H - 46;
        const crashed = s.rocks.some(
          (rock) => Math.hypot(rock.x - s.x, rock.y - shipY) < rock.r + 15,
        );
        if (crashed) {
          s.running = false;
          setOver(true);
        }
      }

      ctx.fillStyle = "#12101f";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        const y = (i * 97 + state.current.tick * 1.4) % H;
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect((i * 53) % W, y, 2, 2);
      }

      const s2 = state.current;
      ctx.fillStyle = "#ff6bb5";
      s2.rocks.forEach((rock) => {
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = "#c56bff";
      ctx.beginPath();
      ctx.moveTo(s2.x, H - 62);
      ctx.lineTo(s2.x - 16, H - 30);
      ctx.lineTo(s2.x + 16, H - 30);
      ctx.closePath();
      ctx.fill();

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
        Puntuación: <span className="text-gradient">{score}</span>
      </p>
      <div className="relative w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`w-full rounded-xl border border-border touch-none ${over ? "animate-shake" : ""}`}
          onTouchStart={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            state.current.x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
          }}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            state.current.x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
          }}
        />
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
            <p className="animate-pop font-display text-3xl text-destructive">Game Over</p>
            <p className="text-muted-foreground">Puntuación: {score}</p>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Mueve con ← → o arrastra en pantalla.</p>
    </div>
  );
}
