import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { CATEGORIES, GAMES } from "@/games/registry";
import { useAuth } from "@/lib/auth";
import { useMyStats } from "@/lib/scores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameZone — Juega minijuegos gratis en tu navegador" },
      {
        name: "description",
        content:
          "Snake, Pong, Memory, Minesweeper y más minijuegos jugables al instante. Guarda tus récords y compite en el ranking.",
      },
      { property: "og:title", content: "GameZone — Portal de minijuegos" },
      {
        property: "og:description",
        content: "13 minijuegos jugables, récords guardados y ranking de jugadores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todos");
  const { user, profile } = useAuth();
  const stats = useMyStats();

  const totalScore = (stats.data ?? []).reduce((sum, s) => sum + Number(s.total_score), 0);

  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      const matchesQuery =
        q === "" ||
        game.name.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q);
      const matchesCategory = category === "Todos" || game.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <section className="panel relative overflow-hidden px-6 py-12 text-center sm:px-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--gradient-glow)" }}
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> {GAMES.length} juegos listos para jugar
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl">
            {user ? (
              <>
                Bienvenido, <span className="text-gradient">{profile?.display_name}</span>
              </>
            ) : (
              <>
                Bienvenido a <span className="text-gradient">GameZone</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Minijuegos rápidos, récords guardados y un ranking global. Elige tu juego y empieza a
            marcar puntuaciones.
          </p>
          {user && (
            <p className="mt-4 font-display text-lg">
              Puntos totales: <span className="text-gradient">{totalScore}</span>
            </p>
          )}
        </div>
      </section>

      <section className="mt-10 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar juegos…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["Todos", ...CATEGORIES].map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? "hero" : "neon"}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>

      {games.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No hay juegos que coincidan con tu búsqueda.
        </p>
      )}
    </div>
  );
}
