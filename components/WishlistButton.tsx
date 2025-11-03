// FILE: /components/WishlistButton.tsx
import { useState } from "react";
export default function WishlistButton({ productId }:{ productId:string }){
  const [on,setOn]=useState(false);
  async function t(){ await fetch("/api/wishlist/toggle",{ method:"POST",headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ productId, on:!on })}); setOn(!on); }
  return <button className="btn" onClick={t}>{on?"Wishlisted":"Wishlist"}</button>;
}
