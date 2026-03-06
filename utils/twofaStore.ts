// FILE: /utils/twofaStore.ts
/**
 * In-memory 2FA fallback store.
 *
 * Why this exists:
 * - Vercel Serverless can run without Firestore Admin credentials (misconfigured envs).
 * - We still want Dan/Ariel to be able to log in and reach the admin console to fix env vars.
 *
 * Notes:
 * - This store is best-effort; serverless instances may not share memory.
 * - In production you should prefer Firestore-backed challenges.
 */

import crypto from "crypto";

export type TwoFactorRole = "seller" | "management";

export type TwoFactorChallenge = {
  id: string;
  email: string;
  role: TwoFactorRole;
  code: string;
  createdAt: number; // ms
  used: boolean;
};

const TTL_MS = 10 * 60 * 1000; // 10 minutes

declare global {
  // eslint-disable-next-line no-var
  var __FF_TWOFA_STORE__: Map<string, TwoFactorChallenge> | undefined;
}

function getStore() {
  if (!global.__FF_TWOFA_STORE__) {
    global.__FF_TWOFA_STORE__ = new Map<string, TwoFactorChallenge>();
  }
  return global.__FF_TWOFA_STORE__;
}

function cleanup(store: Map<string, TwoFactorChallenge>) {
  const now = Date.now();
  for (const [id, ch] of store.entries()) {
    if (now - ch.createdAt > TTL_MS) store.delete(id);
  }
}

export function createChallenge(params: {
  email: string;
  role: TwoFactorRole;
  code: string;
}): TwoFactorChallenge {
  const store = getStore();
  cleanup(store);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const ch: TwoFactorChallenge = {
    id,
    email: params.email,
    role: params.role,
    code: params.code,
    createdAt: Date.now(),
    used: false,
  };

  store.set(id, ch);
  return ch;
}

export function verifyChallenge(params: { id: string; code: string }) {
  const store = getStore();
  cleanup(store);

  const ch = store.get(params.id);
  if (!ch) return { ok: false as const, reason: "not_found" as const };

  if (ch.used) return { ok: false as const, reason: "already_used" as const };

  if (Date.now() - ch.createdAt > TTL_MS) {
    store.delete(params.id);
    return { ok: false as const, reason: "expired" as const };
  }

  if (
    ch.code.length !== params.code.length ||
    !crypto.timingSafeEqual(Buffer.from(ch.code), Buffer.from(params.code))
  ) {
    return { ok: false as const, reason: "invalid_code" as const };
  }

  ch.used = true;
  store.set(params.id, ch);
  return { ok: true as const, email: ch.email, role: ch.role };
}
