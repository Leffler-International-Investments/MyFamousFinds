// /pages/admin/login.tsx

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = (e:any) => {
    e.preventDefault();
    const allowed = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];
    if (allowed.includes(email.trim().toLowerCase())) {
      router.push("/admin/dashboard");
    } else {
      alert("Access denied: management only");
    }
  };

  return (
    <div className="h-screen bg-black flex items-center justify-center text-gray-100">
      <form onSubmit={handleLogin} className="bg-neutral-950 p-8 rounded-xl border border-neutral-800 w-80 space-y-4">
        <h1 className="text-xl font-semibold text-center">Management Admin Login</h1>
        <input
          type="email"
          required
          placeholder="Admin email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full rounded-md bg-black border border-neutral-700 p-2"
        />
        <button className="w-full bg-white text-black font-medium py-2 rounded-md">Login</button>
        <Link href="/" className="block text-center text-sm text-gray-400 hover:text-gray-200">
          ← Back to Dashboard
        </Link>
      </form>
    </div>
  );
}
