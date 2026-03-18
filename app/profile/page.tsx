"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { isSupabaseConfigured, createClient } from "@/lib/supabase";
import GradeBadge from "@/components/ui/GradeBadge";

interface UserStrategy {
  id: string;
  name: string;
  return_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  total_trades: number;
  grade: string;
  composite_score: number;
  strategy_type: string;
  is_active: boolean;
  created_at: string;
}

function UsernameEditor() {
  const { profile, updateUsername } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasUsername = !!profile?.username;

  async function handleSave() {
    if (!username.trim() || saving) return;

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      setError("Only letters, numbers, hyphens, and underscores");
      return;
    }

    setSaving(true);
    setError(null);
    const success = await updateUsername(username.trim());
    setSaving(false);

    if (success) {
      setEditing(false);
    } else {
      setError("Username taken or update failed");
    }
  }

  if (!editing && hasUsername) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-display font-bold">
          {profile.username}
        </span>
        <span className="text-xs text-gray-600">(username set)</span>
      </div>
    );
  }

  if (!editing && !hasUsername) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm text-accent hover:text-accent-light transition-colors"
      >
        Set username
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          maxLength={30}
          className="px-3 py-1.5 bg-surface-elevated border border-surface-border/50 rounded-lg text-sm text-white focus:outline-none focus:border-accent/30"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-accent/15 text-accent text-sm rounded-lg hover:bg-accent/25 transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const fetchStrategies = useCallback(async () => {
    if (!configured || !user) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("strategies")
      .select(
        "id, name, return_pct, sharpe_ratio, max_drawdown_pct, win_rate_pct, total_trades, grade, composite_score, strategy_type, is_active, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setStrategies((data as UserStrategy[]) || []);
    setLoading(false);
  }, [configured, user]);

  useEffect(() => {
    if (!authLoading) fetchStrategies();
  }, [authLoading, fetchStrategies]);

  async function toggleActive(id: string, currentActive: boolean) {
    if (!configured || toggling) return;
    setToggling(id);

    const supabase = createClient();
    const { error } = await supabase
      .from("strategies")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (!error) {
      setStrategies((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, is_active: !currentActive } : s
        )
      );
    }
    setToggling(null);
  }

  // Not signed in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Sign in to see your strategies</p>
          <Link
            href="/"
            className="inline-block text-sm text-accent hover:text-accent-light transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-3 w-full max-w-2xl px-4">
          <div className="h-8 w-48 bg-surface-elevated rounded" />
          <div className="h-4 w-32 bg-surface-elevated/50 rounded" />
          <div className="h-20 bg-surface-elevated rounded-xl mt-6" />
          <div className="h-20 bg-surface-elevated rounded-xl" />
        </div>
      </div>
    );
  }

  const displayName =
    profile?.username || user?.user_metadata?.name || "Trader";
  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const activeCount = strategies.filter((s) => s.is_active).length;

  return (
    <div className="min-h-screen pb-20">
      <div className="mx-auto max-w-3xl px-4 pt-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 mb-10"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-14 h-14 rounded-2xl border border-surface-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <span className="text-accent text-xl font-bold">
                {displayName[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">{displayName}</h1>
            <UsernameEditor />
            <p className="text-sm text-gray-500 mt-1">
              {strategies.length} strategies &middot; {activeCount} active
            </p>
          </div>
        </motion.div>

        {/* Strategies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">
            My Strategies
          </h2>

          {!configured && (
            <div className="rounded-xl border border-surface-border/30 p-6 text-center text-sm text-gray-500">
              <p>Supabase is not configured.</p>
              <p className="mt-1 text-gray-600">
                Set NEXT_PUBLIC_SUPABASE_URL and
                NEXT_PUBLIC_SUPABASE_ANON_KEY to enable persistence.
              </p>
            </div>
          )}

          {configured && strategies.length === 0 && (
            <div className="rounded-xl border border-surface-border/30 p-8 text-center">
              <p className="text-gray-400 mb-4">No strategies deployed yet</p>
              <Link
                href="/create?mode=advanced"
                className="inline-flex px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-cyan-300 text-surface font-semibold text-sm hover:shadow-lg hover:shadow-accent/25 transition-all btn-shine"
              >
                Create Your First Strategy
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {strategies.map((strat, i) => (
                <motion.div
                  key={strat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-4 transition-all ${
                    strat.is_active
                      ? "border-surface-border/30 bg-surface-card"
                      : "border-surface-border/15 bg-surface-card/40 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/strategy/${strat.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {strat.name}
                        </span>
                        <GradeBadge grade={strat.grade} size="sm" />
                        {!strat.is_active && (
                          <span className="text-[9px] font-mono uppercase text-gray-600 border border-surface-border/30 rounded px-1.5 py-0.5">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs font-mono text-gray-500">
                        <span
                          className={
                            strat.return_pct >= 0
                              ? "text-profit"
                              : "text-loss"
                          }
                        >
                          {strat.return_pct > 0 ? "+" : ""}
                          {strat.return_pct.toFixed(1)}%
                        </span>
                        <span>Sharpe {strat.sharpe_ratio.toFixed(2)}</span>
                        <span>{strat.total_trades} trades</span>
                        <span className="text-gray-600">
                          {new Date(strat.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Toggle active/inactive */}
                    <button
                      onClick={() =>
                        toggleActive(strat.id, strat.is_active)
                      }
                      disabled={toggling === strat.id}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        strat.is_active
                          ? "text-gray-500 border border-surface-border/30 hover:border-loss/30 hover:text-loss"
                          : "text-profit border border-profit/20 hover:bg-profit/10"
                      } ${toggling === strat.id ? "opacity-50" : ""}`}
                    >
                      {toggling === strat.id
                        ? "..."
                        : strat.is_active
                          ? "Deactivate"
                          : "Reactivate"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
