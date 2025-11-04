// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type AdminGuardState = "checking" | "allowed" | "denied";

/**
 * Lightweight frontend guard for management admin pages.
 *
 * It relies on the auth stub used on /admin:
 * window.localStorage.setItem("ff-role", "management")
 *
 * Any /management/* page should call this hook. If the value is not present,
 * the user is redirected back to /admin.
 */
export function useRequireAdmin() {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>("checking");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = window.localStorage.getItem("ff-role");

    if (role === "management") {
      setState("allowed");
    } else {
      setState("denied");
      // Redirect to the admin login, passing the current page as 'from'
      const from = encodeURIComponent(router.asPath);
      router.replace(`/admin?from=${from}`);
    }
  }, [router]);

  return {
    loading: state === "checking",
    isAdmin: state === "allowed",
  };
}
