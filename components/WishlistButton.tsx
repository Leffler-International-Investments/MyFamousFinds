// FILE: /components/WishlistButton.tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseClientReady } from "../utils/firebaseClient";
export default function WishlistButton({ productId }:{ productId:string }){
  const [on,setOn]=useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseClientReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  async function t(){
    await fetch("/api/wishlist/toggle",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify({ productId, on:!on })
    });
    setOn(!on);
  }
  return <button className="btn-offer" onClick={t}>{on?"Wishlisted":"Save to wishlist"}</button>;
}
