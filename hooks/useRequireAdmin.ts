// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

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

    const role = window.localStorage.getItem("ff-role");

    if (role === "management") {
      setState("allowed");
    } else {
      // If not an admin, redirect to the login page
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

