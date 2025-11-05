// FILE: /pages/management/forgot-password.tsx
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { firebaseApp } from "../../utils/firebaseClient"; // Ensure this path is correct

export default function ManagementForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use the built-in Firebase function
      const auth = getAuth(firebaseApp);
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("No admin account found with this email address.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reset Admin Password — Famous Finds</title>
      </Head>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />

        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-16 pt-10">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-950/80 p-6 shadow-xl">
            
            {sent ? (
              // --- "Email Sent" View ---
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-white">
                  Check Your Email
                </h1>
                <p className="mt-2 text-sm text-gray-300">
                  A password reset link has been sent to {email}. Please check
                  your inbox (and spam folder).
                </p>
                <div className="mt-6">
                  <Link
                    href="/management/login"
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              // --- "Forgot Password" Form View ---
              <>
                <h1 className="text-center text-2xl font-semibold text-white">
                  Reset Admin Password
                </h1>
                <p className="mt-2 text-center text-xs text-gray-400">
                  Enter your admin email address to receive a password reset
                  link.
                </Shop>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 focus:border-gray-300 focus:outline-none"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    href="/management/login"
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
