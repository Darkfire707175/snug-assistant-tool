import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameShell } from "@/components/GameShell";
import { findGame } from "@/games/registry";

export const Route = createFileRoute("/juego/$slug")({
  loader: ({ params }) => {
    const game = findGame(params.slug);
    if (!game) throw notFound();
    return { name: game.name, description: game.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Juego no encontrado — GameZone" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — GameZone`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
      ],
    };
  },
  notFoundComponent: GameNotFound,
  component: GamePage,
});

function GamePage() {
  const { slug } = Route.useParams();
  const game = findGame(slug);
  if (!game) return <GameNotFound />;
  return <GameShell game={game} />;
}

function GameNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl">Juego no encontrado</h1>
      <p className="mt-2 text-muted-foreground">Este juego no existe o cambió de dirección.</p>
      <Button variant="hero" asChild className="mt-6">
        <Link to="/">Volver a GameZone</Link>
      </Button>
    </div>
  );
}
