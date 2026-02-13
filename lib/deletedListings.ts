// FILE: /lib/deletedListings.ts
// Server-only helpers. Stores deleted-listing IDs in the Admin SDK's own
// Firestore (where the service account has write permission).  The homepage
// and other pages call getDeletedListingIds() to filter them out.

import { adminDb } from "../utils/firebaseAdmin";

const COLLECTION = "_deleted_listings";

/** Mark a listing as deleted (stores its ID in the admin project). */
export async function markListingDeleted(id: string): Promise<void> {
  if (!adminDb) throw new Error("Admin SDK not initialized");
  await adminDb.collection(COLLECTION).doc(id).set({ deletedAt: new Date() });
}

/** Remove the deleted flag so the listing reappears on the homepage. */
export async function unmarkListingDeleted(id: string): Promise<void> {
  if (!adminDb) throw new Error("Admin SDK not initialized");
  await adminDb.collection(COLLECTION).doc(id).delete();
}

/** Return the set of listing IDs that have been soft-deleted. */
export async function getDeletedListingIds(): Promise<Set<string>> {
  if (!adminDb) return new Set();
  try {
    const snap = await adminDb.collection(COLLECTION).get();
    return new Set(snap.docs.map((doc) => doc.id));
  } catch {
    return new Set();
  }
}
