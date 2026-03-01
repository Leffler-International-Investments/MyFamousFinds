// FILE: /components/WishlistContext.tsx
// App-wide wishlist state: loads saved IDs once per user, provides toggle for ProductCard.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useToast } from "./Toast";

type WishlistContextType = {
  savedIds: Set<string>;
  toggleWishlist: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextType>({
  savedIds: new Set(),
  toggleWishlist: () => {},
});

export function useWishlistContext() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const currentUidRef = useRef<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const cleanupRef = useRef<(() => void) | null>(null);

  // Load all saved item IDs when the user logs in
  useEffect(() => {
    // Dynamic import to avoid SSG prerender issues with Firebase client modules
    import("../utils/firebaseClient").then(({ auth, db, firebaseClientReady }) => {
      if (!firebaseClientReady || !auth || !db) return;
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        import("firebase/firestore").then(({ collection, getDocs, query, where }) => {
          const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
              setSavedIds(new Set());
              currentUidRef.current = null;
              return;
            }
            if (currentUidRef.current === user.uid) return;
            currentUidRef.current = user.uid;
            try {
              const snap = await getDocs(
                query(collection(db, "buyerSavedItems"), where("userId", "==", user.uid))
              );
              const ids = new Set(snap.docs.map((d) => (d.data() as any).listingId || ""));
              setSavedIds(ids);
            } catch {
              // ignore — user can still browse
            }
          });
          // Store the unsubscribe function for cleanup
          cleanupRef.current = unsub;
        });
      });
    });

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const { auth } = await import("../utils/firebaseClient");
      if (!auth?.currentUser) {
        router.push("/login");
        return;
      }
      const wasSaved = savedIds.has(productId);
      const newSaved = new Set(savedIds);
      if (wasSaved) {
        newSaved.delete(productId);
        showToast("Product removed from your wishlist");
      } else {
        newSaved.add(productId);
        showToast("Product added to your wishlist");
      }
      setSavedIds(newSaved);

      try {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/wishlist/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, on: !wasSaved }),
        });
      } catch {
        // Revert on failure
        setSavedIds(savedIds);
      }
    },
    [savedIds, showToast, router]
  );

  return (
    <WishlistContext.Provider value={{ savedIds, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
