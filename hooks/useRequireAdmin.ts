// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type AdminGuardState = "checking" | "allowed" | "denied";

/**
 * Lightweight frontend guard for management admin pages.
 *
 * It relies on the stubbed auth used on /admin:
 * when a user signs in as a management admin, store:
 *
 *   window.localStorage.setItem("ff-role", "management")
 *
 * Any /management/* page should call this hook. If the value is not present,
 * or not "management", the user is redirected back to /admin.
 *
 * Later, when you plug in real auth (Auth0, Clerk, etc.), update this hook
 * to check real tokens / roles instead of localStorage.
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
      const from = encodeURIComponent(router.asPath);
      router.replace(`/admin?from=${from}`);
    }
  }, [router]);

  return {
    loading: state === "checking",
    isAdmin: state === "allowed",
  };
}
