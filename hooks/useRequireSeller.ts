// FILE: /hooks/useRequireSeller.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";

export function useRequireSeller() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isRoleSessionValid("seller")) {
      // Sliding session: extend on every protected page load
      touchRoleSession();
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
