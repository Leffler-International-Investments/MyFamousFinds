// FILE: /pages/club-login.tsx
// --- Provided "as-is" from your original VIP Club files ---
import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../utils/firebaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer"; // Assuming you have a Footer component
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
    <div className="flex min-h-screen flex-col bg-black text-gray-100">
      <Head>
        <title>Sign In — Famous Finds</title>
      </Head>
      <Header />

      <main className="flex flex-1 justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 p-6 shadow-lg ring-1 ring-white/10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
            Sign In
          </h1>

          {error && (
            <div className="mt-4 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-md bg-white py-2 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/club-register"
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Don't have an account? Join the VIP Club
            </Link>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
