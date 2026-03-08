// FILE: /hooks/useRequireOwner.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";

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

    const email = window.localStorage.getItem("ff-email");

    if (
      isRoleSessionValid("management") &&
      email &&
      OWNER_EMAILS.includes(email)
    ) {
      touchRoleSession();
      setState("allowed");
    } else {
      setState("denied");
      router.replace("/management/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading: state === "checking",
    isOwner: state === "allowed",
  };
}
