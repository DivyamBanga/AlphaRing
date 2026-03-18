import { createBrowserClient } from "@supabase/ssr";

// ── Check if Supabase is configured ─────────────────────
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here"
  );
}

// ── Browser client (for client components) ──────────────
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Database types ──────────────────────────────────────
export interface DbStrategy {
  id: string;
  user_id: string;
  name: string;
  english_prompt: string;
  json_config: Record<string, unknown>;
  return_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  total_trades: number;
  avg_trade_duration: number;
  grade: string;
  composite_score: number;
  equity_curve: Record<string, unknown>[];
  trade_log: Record<string, unknown>[];
  strategy_type: string;
  is_active: boolean;
  created_at: string;
}

export interface DbProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  updated_at: string;
}
