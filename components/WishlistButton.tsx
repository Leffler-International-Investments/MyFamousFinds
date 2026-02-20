// FILE: /components/WishlistButton.tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, firebaseClientReady } from "../utils/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useToast } from "./Toast";

export default function WishlistButton({ productId }:{ productId:string }){
  const [on,setOn]=useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!firebaseClientReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  // Load initial saved state when userId is available
  useEffect(() => {
    if (!userId || !productId || !db) return;
    const docId = `${userId}_${productId}`;
    getDoc(doc(db, "buyerSavedItems", docId))
      .then((snap) => {
        if (snap.exists()) setOn(true);
      })
      .catch(() => {});
  }, [userId, productId]);

  async function t(){
    if (!userId) {
      router.push("/login");
      return;
    }
    const next = !on;
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch("/api/wishlist/toggle",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ productId, on: next })
      });
      setOn(next);
      showToast(next ? "Product added to your wishlist" : "Product removed from your wishlist");
    } catch (err) {
      console.error("wishlist_toggle_error", err);
      showToast("Could not update your wishlist. Please try again.");
    }
  }
  return (
    <button className="btn-wishlist" onClick={t} title={on ? "Remove from wishlist" : "Save to wishlist"}>
      <svg viewBox="0 0 24 24" width="22" height="22">
        {on ? (
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="#ef4444"
          />
        ) : (
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="none"
            stroke="#666"
            strokeWidth="2"
          />
        )}
      </svg>
    </button>
  );
}
