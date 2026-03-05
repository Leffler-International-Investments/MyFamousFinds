// FILE: /pages/club-login.tsx
// --- UPDATED to use the correct CSS classes from globals.css ---

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import GoogleOneTap from "../components/GoogleOneTap";
// import Footer from "../components/Footer"; // Footer removed to match auth page design
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle redirect result from signInWithRedirect (fallback for popup failures)
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          router.push("/club-profile");
        }
      })
      .catch((err) => {
        if (err?.code === "auth/popup-closed-by-user") return;
        console.error("club_redirect_result_error", err);
        setError(
          err?.code === "auth/unauthorized-domain"
            ? "This domain is not authorized for Google sign-in. Please contact support."
            : err?.code === "auth/account-exists-with-different-credential"
            ? "An account already exists with this email using a different sign-in method."
            : `Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error("club_google_login_error", err);
      setError(`Sign-in failed. Please try again.${err?.code ? ` (${err.code})` : ""}`);
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success, redirect to their profile or the homepage
      router.push("/club-profile");
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    // Use the .auth-page class from globals.css
    <div className="auth-page">
      <Head>
        <title>Sign In — Famous Finds</title>
      </Head>
      <Header />

      {/* Use the .auth-main class from globals.css */}
      <main className="auth-main">
        {/* Use the .auth-card class from globals.css */}
        <div className="auth-card">
          <GoogleOneTap
            onSuccess={() => router.push("/club-profile")}
            onError={(err) => {
              console.error("one_tap_club_error", err);
              setError("Google sign-in failed. Please try again.");
            }}
            disabled={loading}
          />
          <h1>Sign In</h1>

          {error && (
            // Use the .auth-error class from globals.css
            <div className="auth-error">{error}</div>
          )}

          <div className="social-buttons">
            <button
              type="button"
              className="social-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
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

          <form onSubmit={handleLogin} className="auth-fields">
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input" // Use .auth-input class
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input" // Use .auth-input class
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-button-primary" // Use .auth-button-primary class
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Use the .auth-secondary-link class from globals.css */}
          <div className="auth-secondary-link">
            <Link href="/club-register">
              Don't have an account? Join the VIP Club
            </Link>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
