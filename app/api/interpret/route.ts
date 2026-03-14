import { NextRequest, NextResponse } from "next/server";
import { interpretStrategy } from "@/lib/llm";

// Simple in-memory rate limiting (per-instance, resets on cold start)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { prompt, mode = "advanced", conversationHistory } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'prompt' field" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    if (!["guided", "advanced"].includes(mode)) {
      return NextResponse.json(
        { error: "Mode must be 'guided' or 'advanced'" },
        { status: 400 }
      );
    }

    const result = await interpretStrategy(prompt, mode, conversationHistory);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Interpret API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
