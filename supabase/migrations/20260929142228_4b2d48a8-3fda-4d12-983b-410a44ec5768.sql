
CREATE TABLE public.shop_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  kind text NOT NULL, -- 'skin' | 'consumable'
  slot text, -- snake | pong_paddle | pong_bg | profile_icon
  price integer NOT NULL,
  sort integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.shop_items TO anon, authenticated;
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY shop_items_public_read ON public.shop_items FOR SELECT USING (true);

INSERT INTO public.shop_items (id,name,description,kind,slot,price,sort) VALUES
('snake_neon_blue','Serpiente Neón Azul','Cuerpo azul brillante, borde luminoso y efecto neón animado.','skin','snake',250,1),
('snake_fire','Serpiente Fuego Naranja','Cuerpo rojo-naranja con efecto de llama animado.','skin','snake',350,2),
('snake_gold','Serpiente Dorada','Dorado metálico con brillo constante. Skin premium.','skin','snake',500,3),
('snake_dark_purple','Serpiente Oscuro Púrpura','Estilo dark mode morado elegante.','skin','snake',200,4),
('paddle_neon_green','Paleta Neón Verde','Paleta brillante verde fluorescente.','skin','pong_paddle',150,5),
('paddle_pink','Paleta Rosa Pastel','Paleta de color rosa suave.','skin','pong_paddle',150,6),
('pong_galaxy','Fondo Cancha Galáctica','Fondo de estrellas y galaxia para Pong.','skin','pong_bg',300,7),
('icon_bronze','Icono Bronce','Marco de bronce para tu perfil.','skin','profile_icon',100,8),
('icon_silver','Icono Plata','Marco de plata para tu perfil.','skin','profile_icon',200,9),
('icon_gold','Icono Oro','Marco de oro para tu perfil.','skin','profile_icon',400,10),
('icon_diamond','Icono Diamante','Marco de diamante para tu perfil.','skin','profile_icon',600,11),
('double_coins','Doble Monedas','Duplica las monedas ganadas en tu próxima partida.','consumable',NULL,80,20),
('double_points','Doble Puntos','Puntuación x2 en tu próxima partida de Snake o Pong.','consumable',NULL,120,21),
('extra_life','Vida Extra Snake','En Snake no pierdes la primera vez que chocas.','consumable',NULL,100,22),
('slow_ball','Velocidad Reducida Pong','La pelota va más lenta durante una partida de Pong.','consumable',NULL,90,23),
('super_combo','Super Combo','Puntos +150% y monedas +50% en tu próxima partida.','consumable',NULL,200,24);

CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  coins integer NOT NULL DEFAULT 0 CHECK (coins >= 0),
  total_earned integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_read_own ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.inventory (
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  acquired_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_read_own ON public.inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.equipped (
  user_id uuid NOT NULL,
  slot text NOT NULL,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  PRIMARY KEY (user_id, slot)
);
GRANT SELECT ON public.equipped TO anon, authenticated;
GRANT ALL ON public.equipped TO service_role;
ALTER TABLE public.equipped ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipped_public_read ON public.equipped FOR SELECT USING (true);

CREATE TABLE public.active_boosts (
  user_id uuid NOT NULL,
  item_id text NOT NULL REFERENCES public.shop_items(id),
  activated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
GRANT SELECT ON public.active_boosts TO authenticated;
GRANT ALL ON public.active_boosts TO service_role;
ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY boosts_read_own ON public.active_boosts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  game text NOT NULL CHECK (game IN ('pong','snake')),
  host_id uuid NOT NULL,
  guest_id uuid,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX rooms_open_code ON public.rooms(code) WHERE status <> 'finished';
GRANT SELECT ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY rooms_read_members ON public.rooms FOR SELECT TO authenticated USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE TABLE public.room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_room_member(_room uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.rooms WHERE id = _room AND (host_id = _user OR guest_id = _user))
$$;

CREATE POLICY room_messages_read ON public.room_messages FOR SELECT TO authenticated USING (public.is_room_member(room_id, auth.uid()));
CREATE POLICY room_messages_insert ON public.room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_room_member(room_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Shop functions
CREATE OR REPLACE FUNCTION public.buy_item(p_item text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_item public.shop_items; v_coins integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_item FROM public.shop_items WHERE id = p_item;
  IF NOT FOUND THEN RAISE EXCEPTION 'Objeto no encontrado'; END IF;
  IF v_item.kind = 'skin' AND EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user AND item_id = p_item) THEN
    RAISE EXCEPTION 'Ya tienes este skin';
  END IF;
  INSERT INTO public.wallets(user_id) VALUES (v_user) ON CONFLICT DO NOTHING;
  SELECT coins INTO v_coins FROM public.wallets WHERE user_id = v_user FOR UPDATE;
  IF v_coins < v_item.price THEN RAISE EXCEPTION 'No tienes suficientes monedas'; END IF;
  UPDATE public.wallets SET coins = coins - v_item.price, updated_at = now() WHERE user_id = v_user;
  INSERT INTO public.inventory(user_id,item_id,quantity) VALUES (v_user,p_item,1)
    ON CONFLICT (user_id,item_id) DO UPDATE SET quantity = public.inventory.quantity + 1;
  RETURN jsonb_build_object('coins', v_coins - v_item.price);
END; $$;

CREATE OR REPLACE FUNCTION public.equip_item(p_item text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_slot text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT slot INTO v_slot FROM public.shop_items WHERE id = p_item AND kind = 'skin';
  IF v_slot IS NULL THEN RAISE EXCEPTION 'No es un skin'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inventory WHERE user_id = v_user AND item_id = p_item) THEN
    RAISE EXCEPTION 'No tienes este skin';
  END IF;
  INSERT INTO public.equipped(user_id,slot,item_id) VALUES (v_user,v_slot,p_item)
    ON CONFLICT (user_id,slot) DO UPDATE SET item_id = EXCLUDED.item_id;
END; $$;

CREATE OR REPLACE FUNCTION public.unequip_slot(p_slot text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  DELETE FROM public.equipped WHERE user_id = auth.uid() AND slot = p_slot;
END; $$;

CREATE OR REPLACE FUNCTION public.use_consumable(p_item text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shop_items WHERE id = p_item AND kind = 'consumable') THEN
    RAISE EXCEPTION 'No es un consumible';
  END IF;
  IF EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id = v_user AND item_id = p_item) THEN
    RAISE EXCEPTION 'Este objeto ya está activo para tu próxima partida';
  END IF;
  UPDATE public.inventory SET quantity = quantity - 1 WHERE user_id = v_user AND item_id = p_item AND quantity > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'No te quedan unidades'; END IF;
  INSERT INTO public.active_boosts(user_id,item_id) VALUES (v_user,p_item);
END; $$;

-- Rooms
CREATE OR REPLACE FUNCTION public.create_room(p_game text)
RETURNS public.rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_code text; v_row public.rooms; i int := 0;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_game NOT IN ('pong','snake') THEN RAISE EXCEPTION 'Juego no válido'; END IF;
  UPDATE public.rooms SET status = 'finished', updated_at = now() WHERE status <> 'finished' AND created_at < now() - interval '6 hours';
  LOOP
    v_code := lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rooms WHERE code = v_code AND status <> 'finished');
    i := i + 1;
    IF i > 50 THEN RAISE EXCEPTION 'No hay códigos libres'; END IF;
  END LOOP;
  INSERT INTO public.rooms(code,game,host_id) VALUES (v_code,p_game,v_user) RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.join_room(p_code text)
RETURNS public.rooms LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_row public.rooms;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_row FROM public.rooms WHERE code = p_code AND status <> 'finished' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sala no encontrada'; END IF;
  IF v_row.host_id = v_user OR v_row.guest_id = v_user THEN RETURN v_row; END IF;
  IF v_row.guest_id IS NOT NULL THEN RAISE EXCEPTION 'La sala está llena'; END IF;
  UPDATE public.rooms SET guest_id = v_user, status = 'ready', updated_at = now() WHERE id = v_row.id RETURNING * INTO v_row;
  RETURN v_row;
END; $$;

CREATE OR REPLACE FUNCTION public.set_room_status(p_room uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_status NOT IN ('ready','playing','finished') THEN RAISE EXCEPTION 'Estado no válido'; END IF;
  IF NOT public.is_room_member(p_room, auth.uid()) THEN RAISE EXCEPTION 'No eres miembro'; END IF;
  UPDATE public.rooms SET status = p_status, updated_at = now() WHERE id = p_room;
END; $$;

-- Game results with coins and boosts
DROP FUNCTION IF EXISTS public.submit_game_result(text, numeric, boolean, integer, boolean);
CREATE OR REPLACE FUNCTION public.submit_game_result(p_game_id text, p_score numeric DEFAULT 0, p_won boolean DEFAULT false, p_time_ms integer DEFAULT NULL, p_lower_is_better boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_score numeric := GREATEST(COALESCE(p_score,0),0);
  v_points_mult numeric := 1;
  v_coin_mult numeric := 1;
  v_coins integer;
  v_used text[] := ARRAY[]::text[];
  v_is_sp boolean := p_game_id IN ('snake','pong','snake-online','pong-online');
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  v_score := LEAST(v_score, 100000);

  IF EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id=v_user AND item_id='double_coins') THEN
    v_coin_mult := v_coin_mult * 2; v_used := v_used || 'double_coins'; END IF;
  IF EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id=v_user AND item_id='super_combo') THEN
    v_coin_mult := v_coin_mult * 1.5; v_used := v_used || 'super_combo';
    IF NOT p_lower_is_better THEN v_points_mult := v_points_mult * 2.5; END IF; END IF;
  IF v_is_sp AND EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id=v_user AND item_id='double_points') THEN
    v_points_mult := v_points_mult * 2; v_used := v_used || 'double_points'; END IF;
  IF p_game_id IN ('snake','snake-online') AND EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id=v_user AND item_id='extra_life') THEN
    v_used := v_used || 'extra_life'; END IF;
  IF p_game_id IN ('pong','pong-online') AND EXISTS (SELECT 1 FROM public.active_boosts WHERE user_id=v_user AND item_id='slow_ball') THEN
    v_used := v_used || 'slow_ball'; END IF;

  IF NOT p_lower_is_better THEN v_score := round(v_score * v_points_mult); END IF;

  IF p_lower_is_better THEN
    v_coins := 10 + CASE WHEN p_won THEN 10 ELSE 0 END;
  ELSE
    v_coins := LEAST(150, 5 + floor(COALESCE(p_score,0) / 10)::int + CASE WHEN p_won THEN 15 ELSE 0 END);
  END IF;
  v_coins := floor(v_coins * v_coin_mult)::int;

  DELETE FROM public.active_boosts WHERE user_id = v_user AND item_id = ANY(v_used);

  INSERT INTO public.game_sessions (user_id, game_id, score, duration_ms, won)
  VALUES (v_user, p_game_id, v_score, p_time_ms, COALESCE(p_won,false));

  INSERT INTO public.game_stats (user_id, game_id, best_score, best_time_ms, plays, wins, total_score, updated_at)
  VALUES (v_user, p_game_id, v_score, p_time_ms, 1, CASE WHEN COALESCE(p_won,false) THEN 1 ELSE 0 END, v_score, now())
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    best_score = CASE WHEN p_lower_is_better THEN LEAST(COALESCE(public.game_stats.best_score, v_score), v_score)
                      ELSE GREATEST(COALESCE(public.game_stats.best_score, 0), v_score) END,
    best_time_ms = CASE WHEN p_time_ms IS NULL THEN public.game_stats.best_time_ms
                        ELSE LEAST(COALESCE(public.game_stats.best_time_ms, p_time_ms), p_time_ms) END,
    plays = public.game_stats.plays + 1,
    wins = public.game_stats.wins + CASE WHEN COALESCE(p_won,false) THEN 1 ELSE 0 END,
    total_score = public.game_stats.total_score + v_score,
    updated_at = now();

  INSERT INTO public.wallets(user_id, coins, total_earned) VALUES (v_user, v_coins, v_coins)
  ON CONFLICT (user_id) DO UPDATE SET coins = public.wallets.coins + v_coins, total_earned = public.wallets.total_earned + v_coins, updated_at = now();

  RETURN jsonb_build_object('coins_earned', v_coins, 'score', v_score, 'boosts_used', to_jsonb(v_used));
END; $$;

REVOKE EXECUTE ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.buy_item(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.equip_item(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unequip_slot(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.use_consumable(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_room(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.join_room(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_room_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean), public.buy_item(text), public.equip_item(text), public.unequip_slot(text), public.use_consumable(text), public.create_room(text), public.join_room(text), public.set_room_status(uuid, text), public.is_room_member(uuid, uuid) TO authenticated;
