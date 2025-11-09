// FILE: /pages/management/forgot-password.tsx

import Head from "next/head";
import Link from "next/link";
import { FormEvent, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Same public config that is already used in utils/firebaseClient.ts
const firebaseConfig = {
  apiKey: "AIzaSyDddxs7XqxDhkfzvFxZigUQlZJu0fZ7VJQ",
  authDomain: "famous-finds.firebaseapp.com",
  projectId: "famous-finds",
  storageBucket: "famous-finds.firebasestorage.app",
  messagingSenderId: "825808501537",
  appId: "1:825808501537:web:a0516661171712bd2c9c60",
  measurementId: "G-NHM648X2ZR",
};

async function sendResetEmail(email: string) {
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await sendPasswordResetEmail(auth, email);
}

export default function ManagementForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      await sendResetEmail(trimmed);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "We couldn't send a reset link. Please check the email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Forgot Password — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto flex max-w-md flex-col px-4 pb-16 pt-10 text-sm">
          <Link
            href="/management/login"
            className="mb-6 text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Admin Login
          </Link>

          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm">
            {!sent ? (
              <>
                <h1 className="text-lg font-semibold">
                  Reset your admin password
                </h1>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the email address associated with your admin account and
                  we&apos;ll email you a secure password reset link.
                </p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Admin email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-black focus:outline-none"
                      placeholder="admin@example.com"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending reset link…" : "Send reset link"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold">Check your email</h1>
                <p className="mt-2 text-xs text-gray-500">
                  If an admin account exists for{" "}
                  <span className="font-medium">{email}</span>, you&apos;ll
                  receive an email with a link to reset your password.
                </p>
                <p className="mt-3 text-xs text-gray-500">
                  The link may take a few minutes to arrive and could land in
                  your spam or promotions folder.
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Send another reset link
                  </button>
                  <Link
                    href="/management/login"
                    className="block text-center text-xs text-blue-600 hover:text-blue-700"
                  >
                    ← Back to Admin Login
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
