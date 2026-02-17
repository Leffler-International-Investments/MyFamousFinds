// FILE: lib/firestore.ts
import { db } from "../utils/firebaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Save a user review to the "reviews" Firestore collection.
 */
export async function addReview(
  userId: string,
  rating: number,
  comment: string,
  appName: string
) {
  const ref = collection(db, "reviews");
  await addDoc(ref, {
    userId,
    rating,
    comment,
    appName,
    createdAt: serverTimestamp(),
  });
}
