// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Lightweight admin-only page guard.
 * 
 * How it works:
 * When an admin logs in (for now you can simulate this manually),
 * call in the browser console:
 * 
 *    localStorage.setItem("ff-role", "management");
 * 
 * Any /management/* page will load only if ff-role === "management".
 * Otherwise, it redirects to /admin.
 */
export function useRequireAdmin() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const role = localStorage.getItem("ff-role");

    if (role === "management") {
      setIsAdmin(true);
      setChecking(false);
    } else {
      setIsAdmin(false);
      setChecking(false);
      router.replace("/admin");
    }
  }, [router]);

  return { loading: checking, isAdmin };
}
