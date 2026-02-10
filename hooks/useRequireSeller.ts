// FILE: /hooks/useRequireSeller.ts
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isRoleSessionValid, touchRoleSession } from "../utils/roleSession";

/**
 * @param opts.skipAgreementCheck — set to true on the consignment-agreement
 *   page itself so it doesn't redirect in a loop.
 */
export function useRequireSeller(opts?: { skipAgreementCheck?: boolean }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isRoleSessionValid("seller")) {
      // Sliding session: extend on every protected page load
      touchRoleSession();
      setIsSeller(true);
      setChecking(false);

      // Check agreement status (skip on the agreement page itself)
      if (!opts?.skipAgreementCheck) {
        const agreementSigned =
          window.localStorage.getItem("ff-agreement-signed");
        if (agreementSigned !== "true") {
          router.replace("/seller/consignment-agreement");
        }
      }
    } else {
      setIsSeller(false);
      setChecking(false);
      const from = encodeURIComponent(router.asPath);
      router.replace(`/seller/login?from=${from}`);
    }
  }, [router, opts?.skipAgreementCheck]);

  return { loading: checking, isSeller };
}
