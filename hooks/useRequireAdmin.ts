// FILE: /hooks/useRequireAdmin.ts
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext"; // <- adjust if your path is different

/**
 * Frontend guard for admin-only pages.
 * Assumes your AuthContext exposes { user, loading }.
 * And that user.role === "admin" (or user.claims.role).
 */
export function useRequireAdmin() {
  const router = useRouter();
  const { user, loading } = useAuth() as {
    user: any | null;
    loading: boolean;
  };

  useEffect(() => {
    if (loading) return;

    // Not logged in → send to login
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Logged in but not admin → 404 (or another page you prefer)
    const role = (user as any)?.role || (user as any)?.claims?.role;
    if (role !== "admin") {
      router.replace("/404");
    }
  }, [user, loading, router]);

  return { user, loading };
}
