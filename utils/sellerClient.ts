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
 * FIX:
 * - After refresh, Firebase Auth can take a moment to restore session.
 * - Old code read auth.currentUser immediately (null) → no Bearer token → 401.
 * - Now we wait for onAuthStateChanged once before reading the token.
 */

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseClient";

let authReadyPromise: Promise<void> | null = null;
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

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
 * Get the Firebase Auth Bearer token for the current signed-in seller.
 * @param forceRefresh  Pass `true` to force-refresh an expired ID token.
 * Returns an empty object if no user is signed in.
 */
export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    await waitForAuth();

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

  // On 401, force-refresh the Firebase ID token and retry once.
  if (res.status === 401 && auth?.currentUser) {
    const freshHeaders = await getAuthHeaders(true);
    const retry: RequestInit = {
      ...opts,
      headers: {
        ...freshHeaders,
        ...(opts?.headers || {}),
      },
    };
    return fetch(url, retry);
  }

  return res;
}
