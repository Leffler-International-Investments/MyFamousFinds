// FILE: /hooks/useRequireAdmin.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type AdminGuardState = "checking" | "allowed" | "denied";

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
      router.replace(`/management/login?from=${from}`);
    }
  }, [router]);

  return {
    loading: state === "checking",
    isAdmin: state === "allowed",
  };
}

