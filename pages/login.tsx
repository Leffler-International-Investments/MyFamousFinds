// FILE: /pages/login.tsx
// Login page — signs users in as buyers. Seller and management dashboards
// have their own dedicated login pages (/seller/login, /management/login).

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithCredential,
  AuthCredential,
} from "firebase/auth";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import GoogleOneTap from "../components/GoogleOneTap";
import { auth } from "../utils/firebaseClient";
import { safeRedirectPath } from "../utils/roleSession";

const SESSION_TTL_MS = 168 * 60 * 60 * 1000; // 7 days

export default function UnifiedLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Pending Google credential for account linking
  const [pendingCred, setPendingCred] = useState<AuthCredential | null>(null);

  // Promo code state
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const from = safeRedirectPath(
    typeof router.query.from === "string" ? router.query.from : null,
    "/account"
  );

  function setBuyerSession(userEmail: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ff-role", "buyer");
    window.localStorage.setItem("ff-email", userEmail.toLowerCase());
    window.localStorage.setItem(
      "ff-session-exp",
      String(Date.now() + SESSION_TTL_MS)
    );
  }

  /**
   * Server-side sign-in that handles disabled accounts.
   * Verifies password via Firebase Auth REST API (works even if disabled),
   * re-enables the account, ensures Firestore doc exists, then returns
   * a custom token for client-side sign-in.
   */
  async function serverSideSignIn(
    userEmail: string,
    userPassword: string
  ): Promise<import("firebase/auth").UserCredential> {
    const res = await fetch("/api/auth/buyer-signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Sign-in failed on server");
    }

    const data = await res.json();
    if (!data.customToken) {
      throw new Error("No sign-in token received");
    }

    // Use the custom token to sign in on the client
    return await signInWithCustomToken(auth, data.customToken);
  }

  // If user already has an active buyer Firebase session, redirect to account
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && typeof window !== "undefined") {
        const role = window.localStorage.getItem("ff-role");
        if (role === "buyer") {
          const redirectFrom =
            typeof router.query.from === "string" ? router.query.from : null;
          router.replace(safeRedirectPath(redirectFrom, "/account"));
        }
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle redirect result from signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        const userEmail = (result.user.email || "").toLowerCase();
        const redirectFrom =
          typeof router.query.from === "string" ? router.query.from : null;
        setBuyerSession(userEmail);
        router.push(safeRedirectPath(redirectFrom, "/account"));
      })
      .catch((err) => {
        if (err?.code === "auth/popup-closed-by-user") return;
        console.error("redirect_result_error", err);

        if (
          err?.code === "auth/account-exists-with-different-credential"
        ) {
          const conflictEmail =
            err?.customData?.email ||
            err?.customData?._tokenResponse?.email ||
            "";
          if (conflictEmail) {
            const credential = GoogleAuthProvider.credentialFromError(err);
            if (credential) setPendingCred(credential);
            setEmail(conflictEmail);
            setError(
              "You already have an account with this email. Please enter your password below to sign in, and we'll link Google for faster access next time."
            );
            return;
          }
          setError(
            "An account with this email may already exist. Please sign in with your email and password instead."
          );
          return;
        }

        const msg =
          err?.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for Google sign-in. The site domain must be added to Firebase Auth authorized domains in the Firebase Console."
            : err?.code === "auth/operation-not-allowed"
              ? "This sign-in method is not enabled. Please enable Google provider in Firebase Console > Authentication > Sign-in method."
              : `Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`;
        setError(msg);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePromoSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPromoError(null);
    const trimmed = promoCode.trim();
    if (!trimmed) {
      setPromoError("Please enter your promo code.");
      return;
    }
    setPromoLoading(true);
    try {
      const res = await fetch("/api/auth/verify-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const json = await res.json();
      if (json.ok) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("ff-role", "promo");
          window.localStorage.setItem("ff-promo-access", "true");
          window.localStorage.setItem(
            "ff-session-exp",
            String(Date.now() + SESSION_TTL_MS)
          );
        }
        router.push(from || "/");
      } else {
        setPromoError("Invalid promo code. Please try again.");
      }
    } catch {
      setPromoError("Something went wrong. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleOneTapSuccess(user: import("firebase/auth").User) {
    const userEmail = (user.email || "").toLowerCase();
    setBuyerSession(userEmail);
    router.push(from || "/account");
  }

  async function handleSocialSignIn(provider: "google") {
    if (!auth) return;
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const authProvider = new GoogleAuthProvider();
      await signInWithRedirect(auth, authProvider);
    } catch (err: any) {
      console.error("social_login_redirect_error", err);
      setError(
        err?.code === "auth/unauthorized-domain"
          ? "This domain is not authorized for Google sign-in. The site domain must be added to Firebase Auth authorized domains in the Firebase Console."
          : err?.code === "auth/operation-not-allowed"
            ? "Google sign-in is not enabled. Please contact support."
            : `Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`
      );
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // First try normal client-side Firebase sign-in
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // Link pending Google credential if present
      if (pendingCred && cred.user) {
        try {
          await linkWithCredential(cred.user, pendingCred);
          setPendingCred(null);
          setInfo("Google has been linked to your account for faster sign-in next time.");
        } catch (linkErr: any) {
          console.warn("link_credential_warning", linkErr?.code);
          setPendingCred(null);
        }
      }

      setBuyerSession(trimmedEmail);
      router.push(from || "/account");
    } catch (err: any) {
      const code = err?.code || "";

      if (code === "auth/user-disabled") {
        // Account is disabled — use server-side sign-in which:
        // 1. Verifies password via REST API (works for disabled accounts)
        // 2. Re-enables the Auth account
        // 3. Re-creates Firestore doc if missing
        // 4. Returns a custom token for client sign-in
        try {
          const cred = await serverSideSignIn(trimmedEmail, password);

          if (pendingCred && cred.user) {
            try {
              await linkWithCredential(cred.user, pendingCred);
              setPendingCred(null);
            } catch {
              setPendingCred(null);
            }
          }

          setBuyerSession(trimmedEmail);
          router.push(from || "/account");
          return;
        } catch (serverErr: any) {
          console.error("server_signin_error", serverErr);
          setError(
            serverErr?.message || "Your account is disabled and could not be restored. Please contact support at support@myfamousfinds.com."
          );
        }
      } else if (
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-credential"
      ) {
        setError("Email or password did not match. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError(
          "Too many failed login attempts. Please wait a few minutes and try again."
        );
      } else if (code === "auth/network-request-failed") {
        setError(
          "Network error. Please check your internet connection and try again."
        );
      } else if (code === "auth/invalid-api-key") {
        setError(
          "Sign-in is temporarily unavailable due to a configuration issue. Please contact support."
        );
      } else {
        setError(
          `Sign-in failed. Please try again.${code ? ` (${code})` : ""}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Sign In - Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <GoogleOneTap
              onSuccess={handleOneTapSuccess}
              onError={(err) => {
                console.error("one_tap_error", err);
                setError("Google sign-in failed. Please try again.");
              }}
              disabled={loading}
            />
            <h1>Welcome to Famous Finds</h1>
            <p className="auth-subtitle">
              Sign in to shop, sell, and manage your account — all in one place.
            </p>

            {error && <div className="auth-error">{error}</div>}
            {info && <div className="auth-info">{info}</div>}

            <div className="social-buttons">
              <button
                type="button"
                className="social-btn"
                onClick={() => handleSocialSignIn("google")}
                disabled={disabled}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="auth-divider">
              <span>or sign in with email</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="auth-fields">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    placeholder="name@example.com"
                    disabled={disabled}
                  />
                </div>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  required
                  placeholder="Enter password"
                />

                <button
                  type="submit"
                  className="auth-button-primary"
                  disabled={disabled}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="auth-links">
              <p className="auth-secondary-link">
                <Link href="/buyer/forgot-password">Forgot password?</Link>
              </p>
              <p className="auth-secondary-link">
                Don&apos;t have an account?{" "}
                <Link href="/signup">Create one</Link>
              </p>
            </div>

            {/* Promo code section */}
            <div className="promo-section">
              {!showPromo ? (
                <button
                  type="button"
                  className="promo-toggle"
                  onClick={() => setShowPromo(true)}
                >
                  Have a promo code?
                </button>
              ) : (
                <form onSubmit={handlePromoSubmit} className="promo-form">
                  <p className="promo-label">Enter your promo code</p>
                  {promoError && (
                    <p className="promo-error">{promoError}</p>
                  )}
                  <div className="promo-row">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="promo-input"
                      placeholder="Promo code"
                      autoComplete="off"
                      disabled={promoLoading}
                    />
                    <button
                      type="submit"
                      className="promo-btn"
                      disabled={promoLoading}
                    >
                      {promoLoading ? "..." : "Go"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          color: #111827;
        }
        .auth-main {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 16px 40px;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid #e5e7eb;
          padding: 32px 28px 28px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
        }
        h1 {
          font-family: ui-serif, "Times New Roman", serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          text-align: center;
        }
        .auth-subtitle {
          margin: 0 0 24px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.5;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-field label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        :global(.auth-input) {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 10px 14px;
          font-size: 14px;
          color: #111827;
          transition: all 0.2s ease;
        }
        :global(.auth-input:focus) {
          outline: none;
          border-color: #111827;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
        }
        .auth-button-primary {
          margin-top: 4px;
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          background: #111827;
          color: #ffffff;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.2s;
        }
        .auth-button-primary:hover {
          opacity: 0.9;
        }
        .auth-button-primary:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .auth-error,
        .auth-info {
          border-radius: 12px;
          padding: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .auth-error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .auth-info {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .auth-links {
          margin-top: 20px;
          border-top: 1px solid #f3f4f6;
          padding-top: 16px;
        }
        .auth-secondary-link {
          margin-top: 8px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }
        .auth-secondary-link a {
          color: #111827;
          text-decoration: underline;
        }
        .auth-secondary-link a:hover {
          color: #000000;
        }

        /* Promo code */
        .promo-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
        .promo-toggle {
          font-size: 13px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .promo-toggle:hover {
          color: #111827;
        }
        .promo-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .promo-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin: 0;
        }
        .promo-error {
          font-size: 12px;
          color: #b91c1c;
          margin: 0;
        }
        .promo-row {
          display: flex;
          gap: 8px;
        }
        .promo-input {
          flex: 1;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 8px 14px;
          font-size: 14px;
          color: #111827;
        }
        .promo-input:focus {
          outline: none;
          border-color: #111827;
          background: #ffffff;
        }
        .promo-btn {
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          border: none;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .promo-btn:hover {
          opacity: 0.9;
        }
        .promo-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 4px;
        }
        .social-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          transition: background 0.15s, border-color 0.15s;
          font-family: inherit;
        }
        .social-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 8px 0;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .auth-divider span {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
