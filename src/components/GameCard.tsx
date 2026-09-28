import { Link } from "@tanstack/react-router";
import { Play, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBestScore } from "@/lib/scores";
import type { GameDefinition } from "@/games/types";

export function GameCard({ game }: { game: GameDefinition }) {
  const best = useBestScore(game.id);

  return (
    <article className="panel card-hover group flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <span className="animate-float text-5xl drop-shadow-[0_0_18px_rgba(197,107,255,0.45)]">
          {game.icon}
        </span>
        <Badge variant="secondary" className="bg-surface-2 text-xs">
          {game.category}
        </Badge>
      </div>

      <div className="flex-1">
        <h3 className="font-display text-xl">{game.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{game.description}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="h-4 w-4 text-accent" />
        {game.scoreLabel}:{" "}
        <span className="font-display text-foreground">
          {best === null ? "—" : `${best}${game.scoreUnit ? ` ${game.scoreUnit}` : ""}`}
        </span>
      </div>

      <Button variant="hero" asChild className="w-full">
        <Link to="/juego/$slug" params={{ slug: game.slug }}>
          <Play className="mr-1 h-4 w-4" /> Jugar
        </Link>
      </Button>
    </article>
  );
}
