// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";

type AdminGuardState = "checking" | "allowed" | "denied";

/**
 * Frontend guard for management admin pages.
 * Checks localStorage for the role set during login.
 *
 * NOTE: Management pages also have getServerSideProps that validates the
 * HttpOnly admin session cookie.  This client-side guard is a secondary
 * check.  If the server already rendered the page (cookie was valid) we
 * trust that and skip the redirect even when localStorage is stale —
 * this prevents a flash-redirect on refresh when the cookie is fine but
 * localStorage was cleared by another tab or browser cleanup.
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
      return;
    }

    // If getServerSideProps already validated the admin cookie and rendered
    // this page, the __NEXT_DATA__ props won't contain a redirect.  In that
    // case the server already proved the user is authenticated — re-set the
    // localStorage session so the client-side guard stays in sync.
    try {
      const nextData = (window as any).__NEXT_DATA__;
      // getServerSideProps would have redirected to /management/login if the
      // cookie was invalid.  If we are here, the server said "allowed".
      if (nextData?.props?.pageProps !== undefined) {
        // Re-establish the localStorage session from the server-validated state
        const email = window.localStorage.getItem("ff-email") || "";
        window.localStorage.setItem("ff-role", "management");
        if (!window.localStorage.getItem("ff-session-exp")) {
          window.localStorage.setItem(
            "ff-session-exp",
            String(Date.now() + 168 * 60 * 60 * 1000)
          );
        }
        touchRoleSession();
        setState("allowed");
        return;
      }
    } catch {
      // Ignore — fall through to redirect
    }

    setState("denied");
    const from = encodeURIComponent(router.asPath);
    router.replace(`/management/login?from=${from}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading: state === "checking",
    isAdmin: state === "allowed",
  };
}
