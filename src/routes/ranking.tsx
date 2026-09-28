import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GAMES } from "@/games/registry";
import { useGameRanking, useRanking } from "@/lib/scores";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking de jugadores — GameZone" },
      {
        name: "description",
        content: "Clasificación global de GameZone por puntos totales y por cada minijuego.",
      },
      { property: "og:title", content: "Ranking de jugadores — GameZone" },
      {
        property: "og:description",
        content: "Mira quién lidera GameZone en puntos totales y en cada juego.",
      },
    ],
  }),
  component: RankingPage;
});

function medal(index: number) {
  return index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
}

function RankingPage() {
  const global = useRanking();
  const { user } = useAuth();
  const [gameId, setGameId] = useState(GAMES[0].id);
  const selected = GAMES.find((g) => g.id === gameId)!;
  const perGame = useGameRanking(selected.id, !!selected.lowerIsBetter);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="flex items-center gap-3 font-display text-3xl sm:text-4xl">
        <Trophy className="h-8 w-8 text-accent" /> <span className="text-gradient">Ranking</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Clasificación pública por puntos totales. Solo se muestran nombre, avatar y puntuación.
      </p>

      <section className="panel mt-8 divide-y divide-border">
        <h2 className="flex items-center gap-2 px-6 py-4 font-display text-xl">
          <Crown className="h-5 w-5 text-accent" /> Puntos totales
        </h2>
        {global.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        {global.data?.length === 0 && (
          <p className="px-6 py-8 text-center text-muted-foreground">
            Todavía no hay puntuaciones. ¡Sé el primero en jugar!
          </p>
        )}
        {global.data?.map((row, i) => (
          <div
            key={row.user_id}
            className={`flex items-center gap-4 px-6 py-4 ${
              row.user_id === user?.id ? "bg-surface-2" : ""
            }`}
          >
            <span className="w-10 font-display text-lg">{medal(i)}</span>
            <Avatar className="h-10 w-10">
              <AvatarImage src={row.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{row.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{row.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {row.plays} partidas · {row.wins} victorias
              </p>
            </div>
            <span className="font-display text-lg text-gradient">{row.total_score}</span>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Ranking por juego</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {GAMES.map((game) => (
            <Button
              key={game.id}
              size="sm"
              variant={gameId === game.id ? "hero" : "neon"}
              onClick={() => setGameId(game.id)}
            >
              {game.icon} {game.name}
            </Button>
          ))}
        </div>

        <div className="panel mt-4 divide-y divide-border">
          {perGame.isLoading && (
            <div className="px-6 py-4">
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {perGame.data?.length === 0 && (
            <p className="px-6 py-8 text-center text-muted-foreground">
              Nadie ha marcado puntuación en {selected.name} todavía.
            </p>
          )}
          {perGame.data?.map((row, i) => (
            <div key={row.user_id} className="flex items-center gap-4 px-6 py-3">
              <span className="w-10 font-display">{medal(i)}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={row.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{row.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate">{row.display_name}</span>
              <span className="font-display text-gradient">
                {row.value}
                {selected.scoreUnit ? ` ${selected.scoreUnit}` : ""}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
