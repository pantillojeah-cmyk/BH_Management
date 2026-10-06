import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export type AppRole = "admin" | "owner" | "customer" | "pending_owner";

interface AuthContextValue {
  user: any | null;
  session: any | null;
  role: AppRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SSR_DEFAULT: AuthContextValue = {
  user: null,
  session: null,
  role: null,
  loading: true,
  refreshRole: async () => {},
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(SSR_DEFAULT);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isServer = typeof window === "undefined";

  // During SSR, skip the session hook entirely
  const sessionResult = isServer ? { data: null, isPending: true } : authClient.useSession();
  const { data, isPending } = sessionResult as { data: any; isPending: boolean };

  const [role, setRole] = useState<AppRole | null>(null);

  const fetchRole = async (userId: string) => {
    try {
      const res = await fetch(`/api/user-role?userId=${userId}`);
      if (res.ok) {
        const { role } = await res.json();
        setRole(role);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (data?.user) {
      fetchRole(data.user.id);
    } else {
      setRole(null);
    }
  }, [data?.user?.id]);

  const refreshRole = async () => {
    if (data?.user) await fetchRole(data.user.id);
  };

  const signOut = async () => {
    await authClient.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        role,
        loading: isPending,
        refreshRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
