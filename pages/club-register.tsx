// FILE: /pages/club-register.tsx
// --- Provided "as-is" from your original VIP Club files ---
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
import Footer from "../components/Footer"; // Assuming you have a Footer component
import Head from "next/head";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create user profile.");
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
    <div className="flex min-h-screen flex-col bg-black text-gray-100">
      <Head>
        <title>Join the VIP Club — Famous Finds</title>
      </Head>
      <Header />

      <main className="flex flex-1 justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-neutral-900/80 p-6 shadow-lg ring-1 ring-white/10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
            Join the VIP Members Club
          </h1>
          <p className="mt-1 text-center text-xs text-gray-400">
            Create an account to save your cart, get exclusive discounts, and
            earn rewards.
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-red-900/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-neutral-700 bg-black/40 px-3 py-2 text-sm text-gray-100 focus:border-gray-100 focus:outline-none"
              />
            </div>
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
                autoComplete="new-password"
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/club-login"
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  );
}
