// FILE: /utils/managementClient.ts
/**
 * Client helper for Management Dashboard API calls.
 *
 * Server endpoints accept `x-management-email` header verified against
 * MANAGEMENT_SUPER_EMAILS allow-list. This module provides `mgmtFetch()`
 * which automatically attaches the header from the localStorage session.
 */

function getManagementEmail(): string {
  if (typeof window === "undefined") return "";
  const role = window.localStorage.getItem("ff-role") || "";
  if (role !== "management") return "";
  return (window.localStorage.getItem("ff-email") || "").trim().toLowerCase();
}

/**
 * Wrapper around fetch() that automatically attaches x-management-email.
 * Drop-in replacement for `fetch(url, opts)`.
 */
export async function mgmtFetch(
  url: string,
  opts?: RequestInit
): Promise<Response> {
  const email = getManagementEmail();
  const authHeaders: Record<string, string> = {};
  if (email) authHeaders["x-management-email"] = email;

  return fetch(url, {
    ...opts,
    headers: {
      ...authHeaders,
      ...(opts?.headers || {}),
    },
  });
}
