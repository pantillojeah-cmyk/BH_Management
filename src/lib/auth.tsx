import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "owner" | "customer";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: { full_name: string; email: string; phone: string | null; avatar_url: string | null } | null;
  ownerStatus: "pending" | "approved" | "rejected" | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [ownerStatus, setOwnerStatus] = useState<AuthState["ownerStatus"]>(null);
  const [loading, setLoading] = useState(true);

  const loadUserExtras = async (uid: string) => {
    const [rolesRes, profileRes, statusRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("full_name,email,phone,avatar_url").eq("id", uid).maybeSingle(),
      supabase.from("owner_status").select("status").eq("user_id", uid).maybeSingle(),
    ]);
    setRoles((rolesRes.data ?? []).map((r) => r.role as AppRole));
    setProfile(profileRes.data ?? null);
    setOwnerStatus((statusRes.data?.status as AuthState["ownerStatus"]) ?? null);
  };

  const refresh = async () => {
    if (user?.id) await loadUserExtras(user.id);
  };

  useEffect(() => {
    // Subscribe FIRST so we never miss an event
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user?.id) {
        // Defer DB lookups to avoid deadlock
        setTimeout(() => void loadUserExtras(sess.user.id), 0);
      } else {
        setRoles([]);
        setProfile(null);
        setOwnerStatus(null);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user?.id) await loadUserExtras(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthCtx.Provider value={{ user, session, roles, profile, ownerStatus, loading, refresh, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("owner")) return "owner";
  return "customer";
}

export function dashboardPath(roles: AppRole[]): string {
  const r = primaryRole(roles);
  if (r === "admin") return "/admin";
  if (r === "owner") return "/owner";
  return "/customer";
}
