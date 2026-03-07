// FILE: /utils/sellerClient.ts
/**
 * Client helper for Seller Portal API calls.
 *
 * The server-side seller endpoints use Firebase Admin Auth to verify
 * the caller's identity (Authorization: Bearer <idToken>).
 *
 * This module provides `sellerFetch()` which automatically attaches
 * the current Firebase Auth user's ID token to every request.
 *
 * FIX (v1): After refresh, Firebase Auth can take a moment to restore
 *   session. Old code read auth.currentUser immediately → 401.
 *   Now we wait for onAuthStateChanged once before reading the token.
 *
 * FIX (v2): If Firebase Auth session was never established (e.g.
 *   signInWithCustomToken failed silently during login), we now
 *   recover by fetching a fresh custom token from /api/seller/auth-token
 *   and signing in before making the API call.
 */

import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "./firebaseClient";

let authReadyPromise: Promise<void> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let recoveryAttempted = false;

/**
 * Proactively refresh the Firebase ID token every 45 minutes so it
 * never expires during a long seller session (tokens live ~60 min).
 * Starts automatically after the first sellerFetch call.
 */
function startTokenKeepAlive() {
  if (keepAliveTimer) return;
  const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes
  keepAliveTimer = setInterval(() => {
    if (auth?.currentUser) {
      auth.currentUser.getIdToken(true).catch(() => {});
    }
  }, REFRESH_INTERVAL_MS);
}

async function waitForAuth(): Promise<void> {
  if (!auth) return;

  // If already available, no wait needed.
  if (auth.currentUser) return;

  // Reuse the same promise across calls.
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise<void>((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };

    // Safety timeout so we never hang.
    const t = setTimeout(finish, 2500);

    const unsub = onAuthStateChanged(
      auth,
      () => {
        clearTimeout(t);
        try {
          unsub();
        } catch {}
        finish();
      },
      () => {
        clearTimeout(t);
        try {
          unsub();
        } catch {}
        finish();
      }
    );
  });

  return authReadyPromise;
}

/**
 * Attempt to recover the Firebase Auth session by fetching a fresh
 * custom token from the server. This handles the case where
 * signInWithCustomToken failed silently during login.
 */
async function recoverFirebaseAuth(): Promise<boolean> {
  if (!auth) return false;
  if (auth.currentUser) return true;

  // Only attempt recovery once per page load to avoid loops.
  if (recoveryAttempted) return false;
  recoveryAttempted = true;

  try {
    const email =
      typeof window !== "undefined"
        ? window.localStorage.getItem("ff-email")
        : null;
    if (!email) return false;

    const res = await fetch("/api/seller/auth-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    if (!json.ok || !json.firebaseToken) return false;

    await signInWithCustomToken(auth, json.firebaseToken);

    // Reset the authReadyPromise so future calls pick up the new user.
    authReadyPromise = null;

    return !!auth.currentUser;
  } catch (e) {
    console.warn("[sellerClient] Firebase Auth recovery failed:", e);
    return false;
  }
}

/**
 * Get the Firebase Auth Bearer token for the current signed-in seller.
 * @param forceRefresh  Pass `true` to force-refresh an expired ID token.
 * Returns an empty object if no user is signed in.
 */
export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    await waitForAuth();

    // If no Firebase Auth user after waiting, attempt recovery.
    if (!auth?.currentUser) {
      await recoverFirebaseAuth();
    }

    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(forceRefresh);
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("[sellerClient] Failed to get auth token:", e);
  }
  return headers;
}

/**
 * Wrapper around fetch() that automatically attaches the Firebase Auth
 * Bearer token. Drop-in replacement for `fetch(url, opts)`.
 *
 * If the server responds with 401 (expired token), the token is
 * force-refreshed and the request is retried once — so the seller
 * is never logged out due to a stale ID token.
 *
 * If auth.currentUser is null (Firebase session lost), attempts to
 * recover the session via /api/seller/auth-token before retrying.
 */
export async function sellerFetch(
  url: string,
  opts?: RequestInit
): Promise<Response> {
  // Start proactive token refresh so long sessions never expire.
  startTokenKeepAlive();

  const authHeaders = await getAuthHeaders();
  const merged: RequestInit = {
    ...opts,
    headers: {
      ...authHeaders,
      ...(opts?.headers || {}),
    },
  };
  const res = await fetch(url, merged);

  // On 401, attempt recovery and retry once.
  if (res.status === 401) {
    let freshHeaders: Record<string, string> = {};

    // Case 1: auth.currentUser exists → try force-refreshing the token.
    if (auth?.currentUser) {
      freshHeaders = await getAuthHeaders(true);
    }

    // Case 2: force-refresh didn't yield a token (e.g. expired refresh
    // token, revoked session) OR no currentUser → attempt full recovery
    // by fetching a new custom token from the server.
    if (!freshHeaders["Authorization"]) {
      // If currentUser exists but we can't get a valid token, sign out
      // the stale user first so recoverFirebaseAuth() doesn't short-circuit.
      if (auth?.currentUser) {
        try { await signOut(auth); } catch {}
        authReadyPromise = null;
      }
      recoveryAttempted = false;
      const recovered = await recoverFirebaseAuth();
      if (recovered || auth?.currentUser) {
        freshHeaders = await getAuthHeaders(true);
      }
    }

    // Only retry if we actually have an auth header now.
    if (freshHeaders["Authorization"]) {
      const retry: RequestInit = {
        ...opts,
        headers: {
          ...freshHeaders,
          ...(opts?.headers || {}),
        },
      };
      return fetch(url, retry);
    }
  }

  return res;
}
