"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, createClient } from "@/lib/supabase";
import type { DbProfile } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: DbProfile | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGitHub: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUsername: async () => false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!configured) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setProfile(data as DbProfile);
    },
    [configured]
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured, fetchProfile]);

  async function signInWithGitHub() {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signInWithGoogle() {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function updateUsername(username: string): Promise<boolean> {
    if (!configured || !user) return false;
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (!error) {
      await fetchProfile(user.id);
      return true;
    }
    return false;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGitHub,
        signInWithGoogle,
        signOut,
        updateUsername,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
