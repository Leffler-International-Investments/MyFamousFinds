// FILE: /hooks/useRequireSeller.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export function useRequireSeller() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = window.localStorage.getItem("ff-role");
    if (role === "seller") {
      setIsSeller(true);
      setChecking(false);
    } else {
      setIsSeller(false);
      setChecking(false);
      const from = encodeURIComponent(router.asPath);
      router.replace(`/seller/login?from=${from}`);
    }
  }, [router]);

  return { loading: checking, isSeller };
}
