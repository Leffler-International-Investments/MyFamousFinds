// FILE: /utils/sellerClient.ts
/**
 * Client helper for Seller Portal API calls.
 *
 * The server-side seller endpoints use Firebase Admin Auth to verify
 * the caller's identity (Authorization: Bearer <idToken>).
 *
 * This module provides `sellerFetch()` which automatically attaches
 * the current Firebase Auth user's ID token to every request.
 */

import { auth } from "./firebaseClient";

/**
 * Get the Firebase Auth Bearer token for the current signed-in seller.
 * Returns an empty object if no user is signed in.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
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
 * Bearer token.  Drop-in replacement for `fetch(url, opts)`.
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
