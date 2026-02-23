type RateBucket = {
  tokens: number;
  refillAt: number;
};

const bucketStore = new Map<string, RateBucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(
  key: string,
  {
    windowMs = 60_000,
    max = 60,
  }: {
    windowMs?: number;
    max?: number;
  } = {},
): RateLimitResult {
  const now = Date.now();
  const existing = bucketStore.get(key);

  if (!existing || now >= existing.refillAt) {
    bucketStore.set(key, {
      tokens: max - 1,
      refillAt: now + windowMs,
    });
    return { ok: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (existing.tokens <= 0) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, existing.refillAt - now),
    };
  }

  existing.tokens -= 1;
  bucketStore.set(key, existing);
  return { ok: true, remaining: existing.tokens, retryAfterMs: 0 };
}
