const WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 10;

const hits = new Map<string, number[]>();

export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(userId) ?? [];
  const withinWindow = timestamps.filter((t) => now - t < WINDOW_MS);

  if (withinWindow.length >= MAX_MESSAGES_PER_WINDOW) {
    hits.set(userId, withinWindow);
    return true;
  }

  withinWindow.push(now);
  hits.set(userId, withinWindow);
  return false;
}

export function clearRateLimit(userId: string): void {
  hits.delete(userId);
}