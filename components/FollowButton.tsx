// FILE: /components/FollowButton.tsx
import { useState } from "react";
export default function FollowButton({ sellerId }:{ sellerId:string }){
  const [f,setF]=useState(false); const [busy,setBusy]=useState(false);
  async function toggle(){
    setBusy(true);
    await fetch("/api/social/follow", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ sellerId, follow: !f }) });
    setF(!f); setBusy(false);
  }
  return <button className="btn" onClick={toggle} disabled={busy}>{f?"Following":"Follow"}</button>;
}
