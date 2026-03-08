// FILE: /hooks/useRequireSeller.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";
import { auth } from "../utils/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

/**
 * Frontend guard for seller dashboard pages.
 *
 * Primary check: localStorage role session (set during seller login).
 * Secondary recovery: if the Firebase Auth session is still alive
 * (e.g. user refreshed after localStorage was cleared by a buyer
 * logout in another tab) we attempt to recover the seller session
 * via the /api/seller/auth-token endpoint.
 */
export function useRequireSeller() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fast path: localStorage still valid
    if (isRoleSessionValid("seller")) {
      touchRoleSession();
      setIsSeller(true);
      setChecking(false);
      return;
    }

    // Recovery path: Firebase Auth session may still be alive even if
    // localStorage was cleared (e.g. by buyer logout or browser cleanup).
    // Listen for auth state and try to recover the seller session.
    if (!auth) {
      redirectToLogin();
      return;
    }

    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (user && user.email) {
        // User has a live Firebase Auth session — try to verify they
        // are a seller by hitting the auth-token endpoint.
        try {
          const res = await fetch("/api/seller/auth-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });
          if (res.ok && !cancelled) {
            // Re-establish the localStorage session
            window.localStorage.setItem("ff-role", "seller");
            window.localStorage.setItem(
              "ff-email",
              (user.email || "").toLowerCase()
            );
            window.localStorage.setItem(
              "ff-session-exp",
              String(Date.now() + 168 * 60 * 60 * 1000)
            );
            touchRoleSession();
            setIsSeller(true);
            setChecking(false);
            return;
          }
        } catch {
          // Recovery failed — fall through to redirect
        }
      }

      if (!cancelled) {
        redirectToLogin();
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };

    function redirectToLogin() {
      setIsSeller(false);
      setChecking(false);
      const from = encodeURIComponent(router.asPath);
      router.replace(`/seller/login?from=${from}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading: checking, isSeller };
}
