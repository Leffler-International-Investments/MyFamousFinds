// /pages/seller/login.tsx
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";

export default function SellerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (email.trim()) {
      router.push("/seller/dashboard");
    }
  };

  return (
    <div className="h-screen bg-black flex items-center justify-center text-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-neutral-950 p-8 rounded-xl border border-neutral-800 w-80 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Seller Login</h1>
        <input
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md bg-black border border-neutral-700 p-2"
        />
        <button className="w-full bg-white text-black font-medium py-2 rounded-md">
          Login
        </button>
        <Link
          href="/"
          className="block text-center text-sm text-gray-400 hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>
      </form>
    </div>
  );
}
