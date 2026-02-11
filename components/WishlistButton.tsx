// FILE: /components/WishlistButton.tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseClientReady } from "../utils/firebaseClient";
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

  async function t(){
    if (!userId) {
      router.push("/buyer/signin");
      return;
    }
    const next = !on;
    await fetch("/api/wishlist/toggle",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify({ productId, on: next })
    });
    setOn(next);
    showToast(next ? "Product added to your wishlist" : "Product removed from your wishlist");
  }
  return <button className="btn-offer" onClick={t}>{on?"Wishlisted":"Save to wishlist"}</button>;
}
