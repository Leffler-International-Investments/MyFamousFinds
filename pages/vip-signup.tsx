// FILE: /pages/vip-signup.tsx

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function VipSignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }

      // Create VIP member record (points, tier, etc.)
      try {
        await fetch("/api/vip/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: cred.user.uid,
            email: cred.user.email,
            fullName: fullName.trim() || null,
          }),
        });
      } catch (joinErr) {
        console.error("vip_join_api_error", joinErr);
      }

      setSuccess(
        "Welcome to the Front Row. Your VIP profile has been created."
      );
    } catch (err: any) {
      console.error("vip_signup_error", err);
      let msg = "Unable to create your VIP profile. Please try again.";
      if (err?.code === "auth/email-already-in-use") {
        msg =
          "This email is already registered. Please sign in instead or use another email.";
      } else if (err?.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Join the VIP Club — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-semibold text-center mb-2">
              Join the Front Row
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Free membership. Earn points on every purchase, unlock tiers, and
              get early access to drops — inspired by Nike-style rewards
              systems.
            </p>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="First and last name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use at least 6 characters. You&apos;ll use this to sign in to
                  your VIP profile.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white rounded-full py-2.5 text-sm font-semibold tracking-wide uppercase mt-2 hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading ? "Creating profile…" : "Join the Club"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already a member?{" "}
              <Link href="/vip-login" className="text-black font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
