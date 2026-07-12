// In-memory IP failure tracker. Separate from per-account lockout (userRepository.incrementFailedAttempts) —
// this catches an attacker spraying different usernames from ONE IP, which per-account lockout can't see.
// In-memory is a deliberate scope decision for this assignment: fine for a single-instance deployment,
// would need a shared store (Redis) if the app were ever horizontally scaled across multiple server instances.

import { env } from "../config/env";

interface IpRecord {
  failures: number;
  windowStart: number;
  blockedUntil?: number;
}

const ipMap = new Map<string, IpRecord>();

const WINDOW_MS = env.IP_BLOCK_WINDOW_MINUTES * 60 * 1000;
const BLOCK_MS = env.IP_BLOCK_DURATION_MINUTES * 60 * 1000;

export function isIpBlocked(ip: string): boolean {
  const record = ipMap.get(ip);
  if (!record?.blockedUntil) return false;

  if (Date.now() > record.blockedUntil) {
    ipMap.delete(ip); // block expired, clean up
    return false;
  }
  return true;
}

export function recordIpFailure(ip: string): void {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    // no record, or window expired — start fresh
    ipMap.set(ip, { failures: 1, windowStart: now });
    return;
  }

  record.failures += 1;
  if (record.failures >= env.IP_BLOCK_MAX_FAILURES) {
    record.blockedUntil = now + BLOCK_MS;
  }
}

export function clearIpFailures(ip: string): void {
  ipMap.delete(ip);
}

// Periodic cleanup so the Map doesn't grow unbounded from one-off failures that never escalate.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    const expired = record.blockedUntil ? now > record.blockedUntil : now - record.windowStart > WINDOW_MS;
    if (expired) ipMap.delete(ip);
  }
}, 5 * 60 * 1000).unref(); // unref so this timer doesn't keep the process alive during tests/shutdown