// FILE: /hooks/useRequireSeller.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Guard for seller admin pages.
 * Allows access only when localStorage.ff-role === "seller".
 * If not, redirects to /admin.
 *
 * Replace this later with a real auth/session check.
 */
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
      router.replace(`/admin?from=${from}`);
    }
  }, [router]);

  return { loading: checking, isSeller };
}
