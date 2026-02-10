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
 * Returns an empty object if no user is signed in.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    await waitForAuth();

    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
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
 */
export async function sellerFetch(
  url: string,
  opts?: RequestInit
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const merged: RequestInit = {
    ...opts,
    headers: {
      ...authHeaders,
      ...(opts?.headers || {}),
    },
  };
  return fetch(url, merged);
}
