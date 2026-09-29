import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type GameStat = {
  game_id: string;
  best_score: number | null;
  best_time_ms: number | null;
  plays: number;
  wins: number;
  total_score: number;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  game_id: string;
  score: number;
  won: boolean;
  created_at: string;
};

const localKey = (gameId: string) => `gamezone:best:${gameId}`;

function readLocalBest(gameId: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(localKey(gameId));
  return raw === null ? null : Number(raw);
}

function writeLocalBest(gameId: string, score: number, lowerIsBetter: boolean) {
  const current = readLocalBest(gameId);
  const better =
    current === null || (lowerIsBetter ? score < current : score > current) ? score : current;
  localStorage.setItem(localKey(gameId), String(better));
}

/** Stats of the signed-in player, for every game. */
export function useMyStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-stats", user?.id ?? "guest"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_stats")
        .select("game_id,best_score,best_time_ms,plays,wins,total_score,updated_at")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as GameStat[];
    },
  });
}

/** Local (guest) best scores, kept in the browser. */
export function useLocalBest(gameId: string) {
  return useQuery({
    queryKey: ["local-best", gameId],
    queryFn: async () => readLocalBest(gameId),
  });
}

/** Best score shown on cards and game screens, for guests and signed-in players. */
export function useBestScore(gameId: string) {
  const { user } = useAuth();
  const stats = useMyStats();
  const local = useLocalBest(gameId);
  if (user) {
    const row = stats.data?.find((s) => s.game_id === gameId);
    return row?.best_score ?? null;
  }
  return local.data ?? null;
}

export function useRecentSessions(limit = 8) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sessions", user?.id ?? "guest", limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("game_sessions")
        .select("id,game_id,score,won,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });
}

export type SubmitPayload = {
  score: number;
  won?: boolean;
  timeMs?: number | null;
  lowerIsBetter?: boolean;
};

/** Saves a finished game: session history + aggregated stats (or local storage for guests). */
export function useSubmitResult(gameId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ score, won = false, timeMs = null, lowerIsBetter = false }: SubmitPayload) => {
      if (!user) {
        writeLocalBest(gameId, score, lowerIsBetter);
        return { saved: false as const, coins: 0, finalScore: score };
      }
      const { data, error } = await supabase.rpc("submit_game_result", {
        p_game_id: gameId,
        p_score: score,
        p_won: won,
        p_time_ms: timeMs ?? undefined,
        p_lower_is_better: lowerIsBetter,
      });
      if (error) throw error;
      const res = (data ?? {}) as { coins_earned?: number; score?: number };
      return {
        saved: true as const,
        coins: Number(res.coins_earned ?? 0),
        finalScore: Number(res.score ?? score),
      };
    },
    onSuccess: () => {
      for (const key of ["local-best", "my-stats", "sessions", "ranking", "wallet", "boosts"]) {
        void qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export type RankingRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  wins: number;
  plays: number;
};

/** Public leaderboard: only public profile data, never emails. */
export function useRanking() {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: async (): Promise<RankingRow[]> => {
      const [statsRes, profilesRes] = await Promise.all([
        supabase.from("game_stats").select("user_id,total_score,wins,plays"),
        supabase.from("profiles").select("id,display_name,avatar_url"),
      ]);
      if (statsRes.error) throw statsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profiles = new Map(
        (profilesRes.data ?? []).map((p) => [
          p.id as string,
          { display_name: p.display_name as string, avatar_url: p.avatar_url as string | null },
        ]),
      );

      const totals = new Map<string, RankingRow>();
      for (const row of statsRes.data ?? []) {
        const id = row.user_id as string;
        const profile = profiles.get(id);
        const entry =
          totals.get(id) ??
          ({
            user_id: id,
            display_name: profile?.display_name ?? "Jugador",
            avatar_url: profile?.avatar_url ?? null,
            total_score: 0,
            wins: 0,
            plays: 0,
          } satisfies RankingRow);
        entry.total_score += Number(row.total_score ?? 0);
        entry.wins += Number(row.wins ?? 0);
        entry.plays += Number(row.plays ?? 0);
        totals.set(id, entry);
      }

      return [...totals.values()].sort((a, b) => b.total_score - a.total_score);
    },
  });
}

/** Per-game leaderboard used on the ranking page. */
export function useGameRanking(gameId: string, lowerIsBetter: boolean) {
  return useQuery({
    queryKey: ["ranking", "game", gameId],
    queryFn: async () => {
      const [statsRes, profilesRes] = await Promise.all([
        supabase
          .from("game_stats")
          .select("user_id,best_score,best_time_ms,wins")
          .eq("game_id", gameId),
        supabase.from("profiles").select("id,display_name,avatar_url"),
      ]);
      if (statsRes.error) throw statsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id as string, p]));
      return (statsRes.data ?? [])
        .filter((r) => r.best_score !== null)
        .map((r) => ({
          user_id: r.user_id as string,
          display_name: (profiles.get(r.user_id as string)?.display_name as string) ?? "Jugador",
          avatar_url: (profiles.get(r.user_id as string)?.avatar_url as string | null) ?? null,
          value: Number(r.best_score),
        }))
        .sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))
        .slice(0, 20);
    },
  });
}
