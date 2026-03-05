// FILE: /components/GoogleOneTap.tsx
// Google One Tap sign-in — shows a "Continue as..." prompt for faster login.
// Falls back gracefully if One Tap is unavailable (incognito, no prior session, etc.)

import { useEffect, useRef } from "react";
import {
  GoogleAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  linkWithCredential,
} from "firebase/auth";
import { auth } from "../utils/firebaseClient";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

interface GoogleOneTapProps {
  /** Called after successful Firebase sign-in with the Firebase user */
  onSuccess: (user: import("firebase/auth").User) => void;
  /** Called if One Tap sign-in fails */
  onError?: (error: unknown) => void;
  /** Set to true to disable One Tap (e.g. while another sign-in is in progress) */
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
          }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function GoogleOneTap({
  onSuccess,
  onError,
  disabled,
}: GoogleOneTapProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip if no client ID configured, Firebase not ready, or disabled
    if (!GOOGLE_CLIENT_ID || !auth || disabled) return;

    // Don't re-initialize if already done
    if (initializedRef.current) return;

    // If user is already signed in, skip One Tap
    if (auth.currentUser) return;

    function initializeOneTap() {
      if (!window.google?.accounts?.id) return;

      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true, // Auto-select if only one account & previously authorized
        cancel_on_tap_outside: true,
        itp_support: true, // Intelligent Tracking Prevention support (Safari)
        use_fedcm_for_prompt: true, // Use FedCM when available (Chrome 117+)
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.debug(
            "One Tap not displayed:",
            notification.getNotDisplayedReason()
          );
        }
        if (notification.isSkippedMoment()) {
          console.debug(
            "One Tap skipped:",
            notification.getSkippedReason()
          );
        }
      });
    }

    async function handleCredentialResponse(response: { credential: string }) {
      try {
        // Exchange Google ID token for Firebase credential
        const credential = GoogleAuthProvider.credential(response.credential);
        const result = await signInWithCredential(auth, credential);
        onSuccess(result.user);
      } catch (err: any) {
        console.error("one_tap_firebase_error", err);

        // Handle account-exists-with-different-credential / internal-error
        // This happens when the email already has an email/password account
        if (
          err?.code === "auth/account-exists-with-different-credential" ||
          err?.code === "auth/internal-error"
        ) {
          const errorEmail = err?.customData?.email;
          if (errorEmail) {
            onError?.(
              new Error(
                "You already have an account with this email. Please sign in with your email and password first."
              )
            );
            return;
          }
        }

        onError?.(err);
      }
    }

    // Load GIS script if not already present
    if (window.google?.accounts?.id) {
      initializeOneTap();
    } else {
      const existingScript = document.querySelector(
        `script[src="${GIS_SCRIPT_URL}"]`
      );
      if (existingScript) {
        // Script tag exists but might still be loading
        existingScript.addEventListener("load", initializeOneTap);
      } else {
        const script = document.createElement("script");
        script.src = GIS_SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = initializeOneTap;
        script.onerror = () => {
          console.debug("Failed to load Google Identity Services script");
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      // Cancel any pending One Tap prompt on unmount
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // Ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // This component renders nothing — One Tap shows its own floating UI
  return null;
}
