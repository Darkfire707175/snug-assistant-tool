import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2, LogOut, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gameById } from "@/games/registry";
import { useAuth } from "@/lib/auth";
import { useMyStats, useRecentSessions } from "@/lib/scores";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — GameZone" },
      {
        name: "description",
        content: "Tus partidas jugadas, victorias, puntos totales y mejores puntuaciones en GameZone.",
      },
      { property: "og:title", content: "Mi perfil — GameZone" },
      {
        property: "og:description",
        content: "Consulta tus récords y tu historial de partidas en GameZone.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading, signInWithGoogle, signOut, switchAccount } = useAuth();
  const stats = useMyStats();
  const sessions = useRecentSessions();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-gradient">Tu perfil</h1>
        <p className="mt-3 text-muted-foreground">
          Inicia sesión con Google para guardar tus puntuaciones, ver tus estadísticas y aparecer en
          el ranking.
        </p>
        <Button
          variant="hero"
          size="lg"
          className="mt-6"
          onClick={async () => {
            const { error } = await signInWithGoogle();
            if (error) toast.error(error);
          }}
        >
          Entrar con Google
        </Button>
        <div className="mt-4">
          <Button variant="ghost" asChild>
            <Link to="/">Ver los juegos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rows = stats.data ?? [];
  const plays = rows.reduce((sum, r) => sum + r.plays, 0);
  const wins = rows.reduce((sum, r) => sum + r.wins, 0);
  const totalScore = rows.reduce((sum, r) => sum + Number(r.total_score), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <section className="panel flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <Avatar className="h-24 w-24 border-2 border-ring">
          <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="text-2xl">
            {(profile?.display_name ?? "J").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-display text-3xl text-gradient">{profile?.display_name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="neon"
            onClick={async () => {
              const { error } = await switchAccount();
              if (error) toast.error(error);
            }}
          >
            <Users className="mr-1 h-4 w-4" /> Cambiar cuenta
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut();
              toast.success("Sesión cerrada");
            }}
          >
            <LogOut className="mr-1 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Juegos jugados", value: rows.length },
          { label: "Partidas", value: plays },
          { label: "Partidas ganadas", value: wins },
          { label: "Puntuación total", value: totalScore },
        ].map((item) => (
          <div key={item.label} className="panel p-5 text-center">
            <p className="font-display text-2xl text-gradient">{item.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Trophy className="h-5 w-5 text-accent" /> Mejores puntuaciones
        </h2>
        {rows.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            Todavía no has jugado ninguna partida.{" "}
            <Link to="/" className="text-primary underline">
              Elige un juego
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {rows.map((row) => {
              const game = gameById(row.game_id);
              const unit = game?.scoreUnit ? ` ${game.scoreUnit}` : "";
              return (
                <li key={row.game_id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{game?.icon ?? "🎮"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{game?.name ?? row.game_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.plays} partidas · {row.wins} victorias
                    </p>
                  </div>
                  <span className="font-display text-gradient">
                    {row.best_score === null ? "—" : `${row.best_score}${unit}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel mt-6 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Gamepad2 className="h-5 w-5 text-primary" /> Últimos juegos jugados
        </h2>
        {(sessions.data ?? []).length === 0 ? (
          <p className="mt-4 text-muted-foreground">Aún no hay partidas en tu historial.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sessions.data?.map((session) => {
              const game = gameById(session.game_id);
              return (
                <li key={session.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="text-xl">{game?.icon ?? "🎮"}</span>
                  <span className="min-w-0 flex-1 truncate">{game?.name ?? session.game_id}</span>
                  <span className="text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-display">{session.score}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
