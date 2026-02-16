// FILE: /utils/roleSession.ts

export type Role = "seller" | "management" | "buyer";

const ROLE_KEY = "ff-role";
const EMAIL_KEY = "ff-email";
const EXP_KEY = "ff-session-exp"; // epoch ms

// Sliding session duration (hours) — 7 days
export const DEFAULT_SESSION_TTL_HOURS = 168;

function nowMs() {
  return Date.now();
}

function computeExpiryMs(ttlHours = DEFAULT_SESSION_TTL_HOURS) {
  return nowMs() + ttlHours * 60 * 60 * 1000;
}

export function setRoleSession(role: Role, email?: string, ttlHours?: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
  if (email) window.localStorage.setItem(EMAIL_KEY, email);
  window.localStorage.setItem(
    EXP_KEY,
    String(computeExpiryMs(ttlHours ?? DEFAULT_SESSION_TTL_HOURS))
  );
}

export function getRoleSession() {
  if (typeof window === "undefined") {
    return { role: null as Role | null, email: null as string | null, exp: 0 };
  }
  const role = (window.localStorage.getItem(ROLE_KEY) as Role | null) || null;
  const email = window.localStorage.getItem(EMAIL_KEY);
  const exp = Number(window.localStorage.getItem(EXP_KEY) || "0") || 0;
  return { role, email, exp };
}

export function isRoleSessionValid(expected: Role) {
  const { role, exp } = getRoleSession();
  if (role !== expected) return false;
  // Backwards compatibility: if exp was never set, treat as valid.
  if (!exp) return true;
  return exp > nowMs();
}

export function touchRoleSession(ttlHours = DEFAULT_SESSION_TTL_HOURS) {
  if (typeof window === "undefined") return;
  const role = window.localStorage.getItem(ROLE_KEY);
  if (!role) return;
  window.localStorage.setItem(EXP_KEY, String(computeExpiryMs(ttlHours)));
}
