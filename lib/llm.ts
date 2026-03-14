// ============================================================
// LLM Cascade Client
// Groq (primary) → Gemini (fallback) → error
// Called from API routes only (server-side).
// ============================================================

import { validateStrategy, type StrategyConfig } from "./strategy-schema";
import {
  ADVANCED_SYSTEM_PROMPT,
  GUIDED_SYSTEM_PROMPT,
  GUIDED_FOLLOWUP_PROMPT,
} from "./prompts";

export interface GuidedResponse {
  mode: "questions";
  questions: string[];
  partial_understanding: string;
}

export type InterpretResult =
  | { type: "strategy"; data: StrategyConfig }
  | { type: "guided"; data: GuidedResponse }
  | { type: "error"; message: string };

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ============================================================
// Provider implementations
// ============================================================

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  // Convert chat messages to Gemini format
  const systemInstruction = messages.find((m) => m.role === "system")?.content || "";
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (response.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ============================================================
// Cascade logic
// ============================================================

async function callLLMCascade(messages: ChatMessage[]): Promise<string> {
  // Try Groq first
  try {
    return await callGroq(messages);
  } catch (err) {
    const error = err as Error;
    console.log(`Groq failed: ${error.message}`);

    if (error.message === "GROQ_API_KEY not set") {
      // Don't try Groq without a key, fall through
    } else if (error.message !== "RATE_LIMITED") {
      // Non-rate-limit error — still try fallback
    }
  }

  // Try Gemini
  try {
    return await callGemini(messages);
  } catch (err) {
    const error = err as Error;
    console.log(`Gemini failed: ${error.message}`);
  }

  throw new Error(
    "All LLM providers are unavailable. Please try again in a moment."
  );
}

// ============================================================
// JSON extraction + validation
// ============================================================

function extractJSON(text: string): string {
  // Try to parse as-is first
  const trimmed = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Find the first { and last }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function parseAndValidateStrategy(
  jsonStr: string
): { valid: true; config: StrategyConfig } | { valid: false; error: string } {
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
  }

  // Check if it's an error response
  if (parsed.error) {
    return { valid: false, error: parsed.error };
  }

  // Check if it's a guided mode response
  if (parsed.mode === "questions") {
    return { valid: false, error: "GUIDED_RESPONSE" };
  }

  // Validate as strategy config
  const errors = validateStrategy(parsed as StrategyConfig);
  if (errors.length > 0) {
    return {
      valid: false,
      error: `Validation errors: ${errors.map((e) => `${e.field}: ${e.message}`).join("; ")}`,
    };
  }

  return { valid: true, config: parsed as StrategyConfig };
}

// ============================================================
// Public API
// ============================================================

/**
 * Interpret a user's English strategy description.
 * Advanced mode: returns strategy config directly.
 * Guided mode: may return follow-up questions first.
 */
export async function interpretStrategy(
  userPrompt: string,
  mode: "guided" | "advanced",
  conversationHistory?: ChatMessage[]
): Promise<InterpretResult> {
  const systemPrompt =
    mode === "guided"
      ? conversationHistory && conversationHistory.length > 2
        ? GUIDED_FOLLOWUP_PROMPT
        : GUIDED_SYSTEM_PROMPT
      : ADVANCED_SYSTEM_PROMPT;

  const messages: ChatMessage[] = conversationHistory
    ? [{ role: "system", content: systemPrompt }, ...conversationHistory]
    : [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

  // First attempt
  let rawResponse: string;
  try {
    rawResponse = await callLLMCascade(messages);
  } catch (err) {
    return { type: "error", message: (err as Error).message };
  }

  const jsonStr = extractJSON(rawResponse);

  // Check for guided response
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.mode === "questions" && mode === "guided") {
      return {
        type: "guided",
        data: {
          mode: "questions",
          questions: parsed.questions || [],
          partial_understanding: parsed.partial_understanding || "",
        },
      };
    }
    if (parsed.error) {
      return { type: "error", message: parsed.error };
    }
  } catch {
    // Not valid JSON yet, will handle below
  }

  // Try to validate as strategy
  let result = parseAndValidateStrategy(jsonStr);

  if (result.valid) {
    return { type: "strategy", data: result.config };
  }

  // Retry once with correction prompt
  if (result.error !== "GUIDED_RESPONSE") {
    try {
      const retryMessages: ChatMessage[] = [
        ...messages,
        { role: "assistant", content: rawResponse },
        {
          role: "user",
          content: `Your output wasn't valid. Error: ${result.error}\n\nPlease fix and output ONLY the corrected JSON object. No explanation.`,
        },
      ];

      const retryResponse = await callLLMCascade(retryMessages);
      const retryJson = extractJSON(retryResponse);
      result = parseAndValidateStrategy(retryJson);

      if (result.valid) {
        return { type: "strategy", data: result.config };
      }
    } catch {
      // Retry failed, fall through to error
    }
  }

  return {
    type: "error",
    message:
      "Could not generate a valid strategy. Try being more specific about what stocks to trade, when to buy, and when to sell.",
  };
}
