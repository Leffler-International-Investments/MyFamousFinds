// FILE: /pages/club-login.tsx
// --- UPDATED to use the correct CSS classes from globals.css ---

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
// import Footer from "../components/Footer"; // Footer removed to match auth page design
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <h1>Sign In</h1>

          {error && (
            // Use the .auth-error class from globals.css
            <div className="auth-error">{error}</div>
          )}

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
