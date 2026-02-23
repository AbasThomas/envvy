import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";

const suggestionSchema = z.object({
  env: z.record(z.string(), z.string()),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = suggestionSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return ok({
      provider: "local-fallback",
      suggestions: generateFallbackSuggestions(parsed.data.env),
      commitSummary: createCommitSummary(parsed.data.env),
    });
  }

  const prompt = `You are envii AI assistant. Given this env JSON:\n${JSON.stringify(parsed.data.env, null, 2)}\nReturn JSON with keys "suggestions" (array of strings) and "commitSummary" (short sentence). Focus on secure defaults and missing keys.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return ok({
      provider: "local-fallback",
      suggestions: generateFallbackSuggestions(parsed.data.env),
      commitSummary: createCommitSummary(parsed.data.env),
    });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return ok({
      provider: "local-fallback",
      suggestions: generateFallbackSuggestions(parsed.data.env),
      commitSummary: createCommitSummary(parsed.data.env),
    });
  }

  try {
    const ai = JSON.parse(content) as {
      suggestions: string[];
      commitSummary: string;
    };
    return ok({
      provider: "groq",
      suggestions: ai.suggestions ?? [],
      commitSummary: ai.commitSummary ?? createCommitSummary(parsed.data.env),
    });
  } catch {
    return ok({
      provider: "local-fallback",
      suggestions: generateFallbackSuggestions(parsed.data.env),
      commitSummary: createCommitSummary(parsed.data.env),
    });
  }
}

function generateFallbackSuggestions(env: Record<string, string>) {
  const suggestions: string[] = [];
  if (!env.NODE_ENV) suggestions.push("Add NODE_ENV=production in production environments.");
  if (!env.DATABASE_URL) suggestions.push("Set DATABASE_URL and rotate credentials frequently.");
  if (!env.NEXTAUTH_SECRET) suggestions.push("Add NEXTAUTH_SECRET (minimum 32 random chars).");

  for (const key of Object.keys(env)) {
    if (/SECRET|TOKEN|KEY/i.test(key) && env[key].length < 16) {
      suggestions.push(`${key} looks short; use a stronger random secret.`);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("No obvious issues found. Consider rotating secrets monthly.");
  }

  return suggestions;
}

function createCommitSummary(env: Record<string, string>) {
  const keyCount = Object.keys(env).length;
  return `Updated ${keyCount} environment variables with secure defaults and validation notes.`;
}
