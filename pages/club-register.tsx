// FILE: /pages/club-register.tsx
// --- UPDATED to use the correct CSS classes from globals.css ---

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import { autoPrefixPhone } from "../utils/phoneFormat";
// import Footer from "../components/Footer"; // Footer removed to match auth page design
import Head from "next/head";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. (Optional) Update their Firebase profile display name
      await updateProfile(user, { displayName: name });

      // 3. Get the user's ID token to send to our API
      const idToken = await user.getIdToken();

      // 4. Call our new API to create their VIP profile in Firestore
      const res = await fetch("/api/auth/club-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: name,
          email: user.email,
          phone: phone.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create user profile.");
      }

      // 5. Success, redirect to their new profile page
      router.push("/club-profile");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already in use.");
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
        <title>Join the VIP Club — Famous Finds</title>
      </Head>
      <Header />

      {/* Use the .auth-main class from globals.css */}
      <main className="auth-main">
        {/* Use the .auth-card class from globals.css */}
        <div className="auth-card">
          <h1>Join the VIP Members Club</h1>
          <p className="auth-subtitle">
            Create an account to save your cart, get exclusive discounts, and
            earn rewards.
          </p>

          {error && (
            // Use the .auth-error class from globals.css
            <div className="auth-error">{error}</div>
          )}

          <form onSubmit={handleRegister} className="auth-fields">
            <div className="auth-field">
              <label>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input" // Use .auth-input class
              />
            </div>
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
              <label>Mobile number (for 2FA)</label>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(autoPrefixPhone(e.target.value))}
                className="auth-input"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="new-password"
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Use the .auth-secondary-link class from globals.css */}
          <div className="auth-secondary-link">
            <Link href="/club-login">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
