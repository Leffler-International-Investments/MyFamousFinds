// FILE: /pages/management/stripe-settings.tsx
// Redirects to the PayPal settings page (this route kept for backwards compatibility)
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function StripeSettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/management/settings");
  }, [router]);
  return null;
}
