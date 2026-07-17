const hits = new Map<string, number[]>();

// Generic sliding-window limiter, keyed however the caller likes (e.g.
// `${event}:${userId}`) so different socket events get independent budgets
// instead of sharing one global counter per user.
export function checkRateLimit(key: string, maxHits: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = hits.get(key) ?? [];
  const withinWindow = timestamps.filter((t) => now - t < windowMs);

  if (withinWindow.length >= maxHits) {
    hits.set(key, withinWindow);
    return true;
  }

  withinWindow.push(now);
  hits.set(key, withinWindow);
  return false;
}

const MESSAGE_WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 10;

// Kept for backward compatibility with the existing send_message call site —
// same 10-per-10s budget as before, now implemented as a keyed instance of
// the generic limiter so it doesn't share state with the other events below.
export function isRateLimited(userId: string): boolean {
  return checkRateLimit(`send_message:${userId}`, MAX_MESSAGES_PER_WINDOW, MESSAGE_WINDOW_MS);
}

export function clearRateLimit(userId: string): void {
  for (const key of hits.keys()) {
    if (key.endsWith(`:${userId}`)) hits.delete(key);
  }
}