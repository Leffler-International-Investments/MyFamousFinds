// FILE: /hooks/useRequireOwner.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Only these emails can access OWNER-only pages
const OWNER_EMAILS = [
  "leffleryd@gmail.com",
  "arichspot@gmail.com",
  "arich1114@aol.com",
];

type AdminGuardState = "checking" | "allowed" | "denied";

/**
 * Owner-only guard (on top of management admin).
 * Checks localStorage for role + email and redirects if not allowed.
 */
export function useRequireOwner() {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>("checking");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = window.localStorage.getItem("ff-role");
    const email = window.localStorage.getItem("ff-email");

    if (role === "management" && email && OWNER_EMAILS.includes(email)) {
      setState("allowed");
    } else {
      setState("denied");
      router.replace("/management/dashboard");
    }
  }, [router]);

  return {
    loading: state === "checking",
    isOwner: state === "allowed",
  };
}
