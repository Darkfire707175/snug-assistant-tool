
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Jugador',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  best_score numeric,
  best_time_ms integer,
  plays integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  total_score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
GRANT SELECT, INSERT, UPDATE ON public.game_stats TO authenticated;
GRANT SELECT ON public.game_stats TO anon;
GRANT ALL ON public.game_stats TO service_role;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_stats_public_read" ON public.game_stats FOR SELECT USING (true);
CREATE POLICY "game_stats_insert_own" ON public.game_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "game_stats_update_own" ON public.game_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  duration_ms integer,
  won boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_sessions_user_created_idx ON public.game_sessions (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_sessions_read_own" ON public.game_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "game_sessions_insert_own" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_game_result(
  p_game_id text,
  p_score numeric DEFAULT 0,
  p_won boolean DEFAULT false,
  p_time_ms integer DEFAULT NULL,
  p_lower_is_better boolean DEFAULT false
)
RETURNS public.game_stats
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.game_stats;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO public.game_sessions (user_id, game_id, score, duration_ms, won)
  VALUES (v_user, p_game_id, COALESCE(p_score, 0), p_time_ms, COALESCE(p_won, false));

  INSERT INTO public.game_stats (user_id, game_id, best_score, best_time_ms, plays, wins, total_score, updated_at)
  VALUES (
    v_user, p_game_id, COALESCE(p_score, 0), p_time_ms, 1,
    CASE WHEN COALESCE(p_won, false) THEN 1 ELSE 0 END,
    COALESCE(p_score, 0), now()
  )
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    best_score = CASE
      WHEN p_lower_is_better THEN LEAST(COALESCE(public.game_stats.best_score, COALESCE(p_score, 0)), COALESCE(p_score, 0))
      ELSE GREATEST(COALESCE(public.game_stats.best_score, 0), COALESCE(p_score, 0))
    END,
    best_time_ms = CASE
      WHEN p_time_ms IS NULL THEN public.game_stats.best_time_ms
      ELSE LEAST(COALESCE(public.game_stats.best_time_ms, p_time_ms), p_time_ms)
    END,
    plays = public.game_stats.plays + 1,
    wins = public.game_stats.wins + CASE WHEN COALESCE(p_won, false) THEN 1 ELSE 0 END,
    total_score = public.game_stats.total_score + COALESCE(p_score, 0),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean) TO authenticated;
