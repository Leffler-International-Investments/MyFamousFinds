// FILE: /pages/seller/register-vetting.tsx
// Redirect to the unified /become-seller page

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function SellerVettingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/become-seller");
  }, [router]);
  return null;
}
