// FILE: /pages/signup.tsx
// Unified Signup — simplified onboarding: email + name only, then preferences step

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

import Header from "../components/Header";
import Footer from "../components/Footer";
import PasswordInput from "../components/PasswordInput";
import GoogleOneTap from "../components/GoogleOneTap";
import { auth } from "../utils/firebaseClient";
import { autoPrefixPhone } from "../utils/phoneFormat";

const INTEREST_OPTIONS = [
  "Bags & Handbags",
  "Shoes & Sneakers",
  "Jewelry & Watches",
  "Women's Clothing",
  "Men's Clothing",
  "Kids & Baby",
  "Accessories",
  "Home & Decor",
];

const SIZE_OPTIONS = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "One Size",
];

const AGE_RANGE_OPTIONS = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
  "Prefer not to say",
];

type BannerState =
  | null
  | { type: "error" | "info"; message: string; code?: string };

type SignupStep = "basics" | "preferences";

export default function UnifiedSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("basics");

  // Step 1 — basics
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<BannerState>(null);
  const [loading, setLoading] = useState(false);

  // Step 2 — preferences (optional)
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredSize, setPreferredSize] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Handle redirect result from signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return;
        const userEmail = (result.user.email || "").toLowerCase();
        const displayName = fullName.trim() || result.user.displayName || "";

        if (typeof window !== "undefined") {
          window.localStorage.setItem("ff-role", "buyer");
          window.localStorage.setItem("ff-email", userEmail);
          window.localStorage.setItem(
            "ff-session-exp",
            String(Date.now() + 168 * 60 * 60 * 1000)
          );
        }

        try {
          const token = await result.user.getIdToken();
          await fetch("/api/user/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fullName: displayName,
              email: userEmail,
              phone: phone.trim(),
              smsOptIn,
            }),
          });
        } catch {
          // Non-blocking
        }

        setStep("preferences");
      })
      .catch((err) => {
        if (err?.code === "auth/popup-closed-by-user") return;
        console.error("redirect_result_error", err);
        const msg =
          err?.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for sign-up. Please contact support."
            : err?.code === "auth/account-exists-with-different-credential"
            ? "An account already exists with this email using a different sign-in method."
            : err?.code === "auth/operation-not-allowed"
            ? "This sign-in method is not enabled. Please contact support."
            : err?.code === "auth/user-disabled"
            ? "This account has been disabled. Please contact support at support@myfamousfinds.com to re-enable your account."
            : `Sign-up failed. Please try again.${err?.code ? ` (${err.code})` : ""}`;
        setBanner({ type: "error", message: msg });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOneTapSuccess(user: import("firebase/auth").User) {
    const userEmail = (user.email || "").toLowerCase();
    const displayName = fullName.trim() || user.displayName || "";

    if (typeof window !== "undefined") {
      window.localStorage.setItem("ff-role", "buyer");
      window.localStorage.setItem("ff-email", userEmail);
      window.localStorage.setItem(
        "ff-session-exp",
        String(Date.now() + 168 * 60 * 60 * 1000)
      );
    }

    try {
      const token = await user.getIdToken();
      await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: displayName,
          email: userEmail,
          phone: phone.trim(),
          smsOptIn,
        }),
      });
    } catch {
      // Non-blocking
    }

    setStep("preferences");
  }

  async function handleSocialSignUp(provider: "google" | "facebook") {
    if (!auth) return;
    setBanner(null);
    setLoading(true);

    // Use redirect flow — avoids cross-origin popup issues.
    // The result is handled by the getRedirectResult() useEffect above.
    try {
      const authProvider =
        provider === "google"
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();
      await signInWithRedirect(auth, authProvider);
    } catch (err: any) {
      console.error("social_signup_redirect_error", err);
      setBanner({
        type: "error",
        message:
          err?.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for sign-up. Please contact support."
            : `Sign-up failed. Please try again.${err?.code ? ` (${err.code})` : ""}`,
      });
      setLoading(false);
    }
  }

  // Dead code removed — redirect result is handled by getRedirectResult useEffect

  async function handleBasicsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setBanner({
        type: "error",
        message: "Please fill in your name, email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      // Set display name
      if (cred.user) {
        await updateProfile(cred.user, { displayName: trimmedName });
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("ff-role", "buyer");
        window.localStorage.setItem("ff-email", trimmedEmail);
        window.localStorage.setItem(
          "ff-session-exp",
          String(Date.now() + 168 * 60 * 60 * 1000)
        );
      }

      // Save basic user profile to Firestore via API
      try {
        const token = await cred.user.getIdToken();
        await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: trimmedName,
            email: trimmedEmail,
            phone: phone.trim(),
            smsOptIn,
          }),
        });
      } catch {
        // Non-blocking — profile will be created later
      }

      // Move to preferences step
      setStep("preferences");
    } catch (err: any) {
      console.error("unified_signup_error", err);

      const code = err?.code as string | undefined;

      if (code === "auth/email-already-in-use") {
        setBanner({
          type: "info",
          code,
          message:
            'An account with this email already exists. Please sign in instead.',
        });
      } else if (code === "auth/weak-password") {
        setBanner({
          type: "error",
          code,
          message:
            "Please choose a stronger password (at least 6 characters).",
        });
      } else {
        setBanner({
          type: "error",
          code,
          message:
            "We couldn't create your account. Please check your details and try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSavePreferences() {
    setSavingPrefs(true);
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        await fetch("/api/user/preferences", {
          method: "POST",
          headers,
          body: JSON.stringify({
            interests,
            preferredSize,
            ageRange,
          }),
        });
      }
    } catch {
      // Non-blocking
    } finally {
      setSavingPrefs(false);
      router.push("/account");
    }
  }

  function handleSkipPreferences() {
    router.push("/account");
  }

  const disabled = loading;

  return (
    <>
      <Head>
        <title>Create Account - Famous Finds</title>
      </Head>

      <div className="auth-page">
        <Header />
        <main className="auth-main">
          <div className="auth-card">
            <GoogleOneTap
              onSuccess={handleOneTapSuccess}
              onError={(err) => {
                console.error("one_tap_signup_error", err);
                setBanner({ type: "error", message: "Google sign-in failed. Please try again." });
              }}
              disabled={loading || step !== "basics"}
            />
            {step === "basics" ? (
              <>
                <h1>Join Famous Finds</h1>
                <p className="auth-subtitle">
                  Create your account to shop curated luxury, save favourites,
                  and optionally sell your own pieces.
                </p>

                {banner && (
                  <div
                    className={
                      banner.type === "error"
                        ? "auth-banner error"
                        : "auth-banner"
                    }
                  >
                    <p>{banner.message}</p>
                    {banner.code === "auth/email-already-in-use" && (
                      <p className="auth-inline-links">
                        <Link href="/login">Sign in instead</Link>
                        {"  |  "}
                        <Link href="/buyer/forgot-password">
                          Forgot password
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                {/* Shared fields — collected before any sign-up method */}
                <div className="auth-fields" style={{ marginBottom: 16 }}>
                  <div className="auth-field">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="auth-input"
                      placeholder="Your name"
                      disabled={disabled}
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="phone">Mobile number</label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(autoPrefixPhone(e.target.value))}
                      className="auth-input"
                      placeholder="+1 (555) 000-0000"
                      disabled={disabled}
                    />
                  </div>

                  <label className="sms-optin">
                    <input
                      type="checkbox"
                      checked={smsOptIn}
                      onChange={(e) => setSmsOptIn(e.target.checked)}
                      disabled={disabled}
                    />
                    <span>
                      I'd like to receive text message updates about new
                      arrivals, price drops, and order notifications.
                    </span>
                  </label>
                </div>

                <div className="social-buttons">
                  <button
                    type="button"
                    className="social-btn"
                    onClick={() => handleSocialSignUp("google")}
                    disabled={disabled || !fullName.trim()}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    className="social-btn social-btn--fb"
                    onClick={() => handleSocialSignUp("facebook")}
                    disabled={disabled || !fullName.trim()}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Continue with Facebook</span>
                  </button>
                </div>

                <div className="auth-divider">
                  <span>or sign up with email</span>
                </div>

                <form onSubmit={handleBasicsSubmit}>
                  <div className="auth-fields">
                    <div className="auth-field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input"
                        placeholder="name@example.com"
                        disabled={disabled}
                        required
                      />
                    </div>

                    <PasswordInput
                      label="Password"
                      name="password"
                      value={password}
                      onChange={setPassword}
                      required
                      placeholder="Create password"
                      showStrength={true}
                    />

                    <button
                      type="submit"
                      className="auth-button-primary"
                      disabled={disabled || !fullName.trim()}
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  </div>
                </form>

                <p className="auth-secondary-link">
                  Already have an account?{" "}
                  <Link href="/login">Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <h1>Personalize Your Experience</h1>
                <p className="auth-subtitle">
                  Help us curate your feed. You can change these anytime in your
                  account settings.
                </p>

                <div className="pref-section">
                  <label className="pref-label">
                    What are you interested in?
                  </label>
                  <div className="pref-chips">
                    {INTEREST_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`pref-chip${
                          interests.includes(opt) ? " pref-chip--active" : ""
                        }`}
                        onClick={() => toggleInterest(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pref-section">
                  <label className="pref-label">Preferred size</label>
                  <div className="pref-chips">
                    {SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`pref-chip${
                          preferredSize === opt ? " pref-chip--active" : ""
                        }`}
                        onClick={() =>
                          setPreferredSize(preferredSize === opt ? "" : opt)
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pref-section">
                  <label className="pref-label">Age range</label>
                  <div className="pref-chips">
                    {AGE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`pref-chip${
                          ageRange === opt ? " pref-chip--active" : ""
                        }`}
                        onClick={() =>
                          setAgeRange(ageRange === opt ? "" : opt)
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pref-actions">
                  <button
                    type="button"
                    className="auth-button-primary"
                    onClick={handleSavePreferences}
                    disabled={savingPrefs}
                  >
                    {savingPrefs ? "Saving..." : "Save & Continue"}
                  </button>
                  <button
                    type="button"
                    className="auth-button-secondary"
                    onClick={handleSkipPreferences}
                  >
                    Skip for now
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
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
          max-width: 480px;
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
        .sms-optin {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
          margin-top: -4px;
        }
        .sms-optin input[type="checkbox"] {
          margin-top: 2px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          accent-color: #111827;
          cursor: pointer;
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
        .auth-button-secondary {
          width: 100%;
          border-radius: 999px;
          padding: 12px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          font-weight: 500;
          background: #ffffff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-button-secondary:hover {
          border-color: #111827;
          color: #111827;
        }
        .auth-banner {
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          text-align: center;
          background: #fef3c7;
          color: #92400e;
        }
        .auth-banner.error {
          background: #fef2f2;
          color: #b91c1c;
        }
        .auth-inline-links {
          margin-top: 4px;
        }
        .auth-inline-links a {
          color: #111827;
          text-decoration: underline;
        }
        .auth-secondary-link {
          margin-top: 16px;
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }
        .auth-secondary-link a {
          color: #111827;
          text-decoration: underline;
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
        .social-btn--fb {
          background: #1877F2;
          border-color: #1877F2;
          color: #ffffff;
        }
        .social-btn--fb svg {
          fill: #ffffff;
        }
        .social-btn--fb:hover:not(:disabled) {
          background: #166fe5;
          border-color: #166fe5;
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

        /* Preference step */
        .pref-section {
          margin-bottom: 20px;
        }
        .pref-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 10px;
        }
        .pref-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pref-chip {
          border-radius: 999px;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          padding: 8px 14px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pref-chip:hover {
          border-color: #111827;
        }
        .pref-chip--active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
        .pref-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </>
  );
}
