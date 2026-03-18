import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Re-export shared utilities
export { isSupabaseConfigured } from "./supabase";

// ── Server client (for API routes / server components) ──
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can fail in Server Components (read-only)
          }
        },
      },
    }
  );
}
