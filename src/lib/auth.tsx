import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: (forceAccountPicker?: boolean) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchAccount: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function metaName(user: User) {
  const meta = user.user_metadata ?? {};
  return (
    (meta["full_name"] as string) ||
    (meta["name"] as string) ||
    user.email?.split("@")[0] ||
    "Jugador"
  );
}

function metaAvatar(user: User) {
  const meta = user.user_metadata ?? {};
  return ((meta["avatar_url"] as string) || (meta["picture"] as string) || null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    const sync = async () => {
      const payload = {
        id: user.id,
        display_name: metaName(user),
        avatar_url: metaAvatar(user),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("id, display_name, avatar_url")
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setProfile({
          id: user.id,
          display_name: payload.display_name,
          avatar_url: payload.avatar_url,
        });
        return;
      }
      setProfile(data as Profile);
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      loading,
      signInWithGoogle: async (forceAccountPicker = false) => {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          ...(forceAccountPicker ? { extraParams: { prompt: "select_account" } } : {}),
        });
        if (result.error) return { error: result.error.message ?? "No se pudo iniciar sesión" };
        return {};
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
      switchAccount: async () => {
        await supabase.auth.signOut();
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
          extraParams: { prompt: "select_account" },
        });
        if (result.error) return { error: result.error.message ?? "No se pudo cambiar de cuenta" };
        return {};
      },
    }),
    [user, session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
