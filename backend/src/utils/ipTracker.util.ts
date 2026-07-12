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
    ipMap.delete(ip);
    return false;
  }
  return true;
}

// Returns true only on the exact call that triggers a new block — false otherwise,
// including on every call after the IP is already blocked. Callers use this to fire
// a one-time admin alert instead of alerting on every subsequent blocked request.
export function recordIpFailure(ip: string): boolean {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    ipMap.set(ip, { failures: 1, windowStart: now });
    return false;
  }

  record.failures += 1;
  if (record.failures >= env.IP_BLOCK_MAX_FAILURES && !record.blockedUntil) {
    record.blockedUntil = now + BLOCK_MS;
    return true; // just crossed the threshold this call
  }

  return false;
}

export function clearIpFailures(ip: string): void {
  ipMap.delete(ip);
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    const expired = record.blockedUntil ? now > record.blockedUntil : now - record.windowStart > WINDOW_MS;
    if (expired) ipMap.delete(ip);
  }
}, 5 * 60 * 1000).unref();