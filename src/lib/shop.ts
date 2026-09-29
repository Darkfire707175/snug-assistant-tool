import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  kind: "skin" | "consumable";
  slot: string | null;
  price: number;
  sort: number;
};

export const SLOT_LABEL: Record<string, string> = {
  snake: "Serpiente",
  pong_paddle: "Paleta de Pong",
  pong_bg: "Fondo de Pong",
  profile_icon: "Icono de perfil",
};

export const ITEM_EMOJI: Record<string, string> = {
  snake_neon_blue: "💙",
  snake_fire: "🔥",
  snake_gold: "👑",
  snake_dark_purple: "🟣",
  paddle_neon_green: "🟩",
  paddle_pink: "🌸",
  pong_galaxy: "🌌",
  icon_bronze: "🥉",
  icon_silver: "🥈",
  icon_gold: "🥇",
  icon_diamond: "💎",
  double_coins: "🪙",
  double_points: "✖️2",
  extra_life: "❤️",
  slow_ball: "🐢",
  super_combo: "⚡",
};

/** Canvas colours for Pong skins. */
export const PADDLE_COLORS: Record<string, string> = {
  default: "#c56bff",
  rival: "#ff6bb5",
  paddle_neon_green: "#39ff6a",
  paddle_pink: "#ffb3d1",
};

export function snakeSkinClass(itemId: string | null | undefined, head = false) {
  if (!itemId) return head ? "skin-snake-default-head" : "skin-snake-default";
  return `skin-snake-${itemId.replace("snake_", "")}`;
}

export function frameClass(itemId: string | null | undefined) {
  return itemId ? `frame-${itemId}` : "";
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Error");

export function useShopItems() {
  return useQuery({
    queryKey: ["shop-items"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_items").select("*").order("sort");
      if (error) throw error;
      return (data ?? []) as ShopItem[];
    },
  });
}

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("coins,total_earned")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? { coins: 0, total_earned: 0 };
    },
  });
}

export function useInventory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["inventory", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("item_id,quantity")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.item_id, r.quantity]));
    },
  });
}

/** Equipped skins by slot for a given user (defaults to the signed-in user). */
export function useEquipped(userId?: string | null) {
  const { user } = useAuth();
  const id = userId ?? user?.id;
  return useQuery({
    queryKey: ["equipped", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipped")
        .select("slot,item_id")
        .eq("user_id", id!);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.slot, r.item_id])) as Record<
        string,
        string
      >;
    },
  });
}

export function useActiveBoosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["boosts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("active_boosts")
        .select("item_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.item_id);
    },
  });
}

function useInvalidateShop() {
  const qc = useQueryClient();
  return () => {
    for (const key of ["wallet", "inventory", "equipped", "boosts"]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useShopActions() {
  const invalidate = useInvalidateShop();
  const opts = { onSettled: invalidate };
  const buy = useMutation({
    ...opts,
    mutationFn: async (item: string) => {
      const { error } = await supabase.rpc("buy_item", { p_item: item });
      if (error) throw new Error(error.message);
    },
  });
  const equip = useMutation({
    ...opts,
    mutationFn: async (item: string) => {
      const { error } = await supabase.rpc("equip_item", { p_item: item });
      if (error) throw new Error(error.message);
    },
  });
  const unequip = useMutation({
    ...opts,
    mutationFn: async (slot: string) => {
      const { error } = await supabase.rpc("unequip_slot", { p_slot: slot });
      if (error) throw new Error(error.message);
    },
  });
  const use = useMutation({
    ...opts,
    mutationFn: async (item: string) => {
      const { error } = await supabase.rpc("use_consumable", { p_item: item });
      if (error) throw new Error(error.message);
    },
  });
  return { buy, equip, unequip, use, errMsg };
}
