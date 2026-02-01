// FILE: /components/Header.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../utils/firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Header() {
  const [vipUser, setVipUser] = useState<User | null>(null);

  useEffect(() => {
    // If Firebase client is not configured, do not crash the site.
    if (!auth) return;

    const unsub = onAuthStateChanged(auth, (user) => setVipUser(user));
    return () => unsub();
  }, []);

  return (
    <header className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-[0.25em]">
            FAMOUS FINDS
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/bag" className="hover:underline">
            🛍️ My Shopping Bag
          </Link>
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/help" className="hover:underline">
            Help
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/vip"
            className="px-4 py-2 rounded-full bg-green-600 text-white text-sm font-semibold"
          >
            My VIP Profile
          </Link>

          <Link
            href="/management/login"
            className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm font-semibold"
          >
            Management Admin Login
          </Link>

          <Link
            href="/seller/login"
            className="px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold"
          >
            Seller Admin Login
            <span className="ml-2 text-xs opacity-80">
              Become a Seller — Click Here
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
