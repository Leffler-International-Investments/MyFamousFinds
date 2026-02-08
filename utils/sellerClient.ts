// FILE: /utils/sellerClient.ts
/**
 * Client helper for Seller Portal API calls.
 * Server endpoints expect a seller identity via the `x-seller-id` header.
 *
 * We store the seller id after login in localStorage:
 *  - ff-seller-id (preferred): Firebase Auth UID
 *  - ff-email (fallback)
 */
export function getSellerIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  const uid = window.localStorage.getItem("ff-seller-id") || "";
  if (uid.trim()) return uid.trim();
  const email = window.localStorage.getItem("ff-email") || "";
  return email.trim().toLowerCase();
}

export function sellerAuthHeaders(extra?: Record<string, string>) {
  const sellerId = getSellerIdFromStorage();
  return {
    ...(extra || {}),
    "x-seller-id": sellerId,
  };
}
