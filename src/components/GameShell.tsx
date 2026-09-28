import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Gamepad2, ListChecks, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useSound } from "@/lib/sound";
import { useBestScore, useSubmitResult } from "@/lib/scores";
import type { GameDefinition, GameFinishPayload } from "@/games/types";

export function GameShell({ game }: { game: GameDefinition }) {
  const [runId, setRunId] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const { user } = useAuth();
  const { play } = useSound();
  const best = useBestScore(game.id);
  const submit = useSubmitResult(game.id);
  const Game = game.Component;

  const finish = useCallback(
    (payload: GameFinishPayload) => {
      setLastScore(payload.score);
      submit.mutate(
        { ...payload, lowerIsBetter: game.lowerIsBetter },
        {
          onSuccess: (res) => {
            if (res.saved) {
              toast.success("Resultado guardado en tu perfil");
            } else {
              toast.message("Récord guardado en este navegador", {
                description: "Inicia sesión con Google para guardarlo en tu perfil y el ranking.",
              });
            }
          },
          onError: () => toast.error("No se pudo guardar el resultado"),
        },
      );
    },
    [submit, game.lowerIsBetter],
  );

  const restart = () => {
    setLastScore(null);
    setRunId((id) => id + 1);
  };

  const unit = game.scoreUnit ? ` ${game.scoreUnit}` : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver a GameZone
          </Link>
        </Button>
        <Button variant="neon" onClick={restart}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reiniciar partida
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-5xl">{game.icon}</span>
        <div>
          <h1 className="font-display text-3xl text-gradient">{game.name}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="panel min-h-[520px] p-4 sm:p-6">
          <Game key={runId} finish={finish} play={play} />
        </section>

        <aside className="flex flex-col gap-4">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Trophy className="h-5 w-5 text-accent" /> Puntuación
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Última partida</dt>
                <dd className="font-display">
                  {lastScore === null ? "—" : `${lastScore}${unit}`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{game.scoreLabel}</dt>
                <dd className="font-display text-gradient">
                  {best === null ? "—" : `${best}${unit}`}
                </dd>
              </div>
            </dl>
            {!user && (
              <p className="mt-3 text-xs text-muted-foreground">
                Inicia sesión con Google para guardar tus récords y entrar en el ranking.
              </p>
            )}
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <ListChecks className="h-5 w-5 text-secondary" /> Instrucciones
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {game.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <Gamepad2 className="h-5 w-5 text-primary" /> Controles
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.controls.map((control) => (
                <Badge key={control} variant="secondary" className="bg-surface-2">
                  {control}
                </Badge>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
