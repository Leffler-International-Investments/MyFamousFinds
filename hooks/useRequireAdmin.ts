// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";

type AdminGuardState = "checking" | "allowed" | "denied";

/**
 * Frontend guard for management admin pages.
 * It checks localStorage for the role set during login.
 */
export function useRequireAdmin() {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>("checking");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isRoleSessionValid("management")) {
      // Sliding session: extend on every protected page load
      touchRoleSession();
      setState("allowed");
    } else {
      setState("denied");
      const from = encodeURIComponent(router.asPath);
      router.replace(`/management/login?from=${from}`);
    }
  }, [router]);

  return {
    loading: state === "checking",
    isAdmin: state === "allowed",
  };
}

