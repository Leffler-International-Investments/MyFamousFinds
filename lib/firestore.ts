// FILE: /lib/firestore.ts

import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  orderBy,
  limit,
  query,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { APP_NAME } from "./appConfig";

export type ReviewDoc = {
  id?: string;
  userId?: string;
  rating?: number;
  comment?: string;
  email?: string;
  appName?: string;
  createdAt?: Timestamp;
};

/**
 * Add a new review document to Firestore (client side).
 */
export async function addReview(
  userId: string,
  rating: number,
  comment: string,
  appName?: string
) {
  const reviewsRef = collection(db, "reviews");
  const docRef = await addDoc(reviewsRef, {
    userId,
    rating,
    comment,
    appName: appName || APP_NAME,
    createdAt: Timestamp.now(),
  });
  return docRef;
}

/**
 * Fetch recent reviews from Firestore (optional helper).
 */
export async function getRecentReviews(limitCount = 50) {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ReviewDoc[];
}
