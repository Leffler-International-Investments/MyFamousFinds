// FILE: /components/Footer.tsx

import Link from "next/link";
import HomepageButler from "./HomepageButler";

export default function Footer() {
  return (
    <>
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-10 text-center">
          
          {/* BRAND + COPYRIGHT */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Famous Finds
            </div>
            <div className="text-[11px] text-neutral-400">
              © {new Date().getFullYear()} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* BLUE LINKS WITH PERFECT SPACING */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[13px] font-medium">
            <Link href="/help" className="text-blue-400 hover:text-blue-300 transition">
              Help Center
            </Link>
            <Link href="/about" className="text-blue-400 hover:text-blue-300 transition">
              About
            </Link>
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition">
              Contact
            </Link>
            <Link href="/buying" className="text-blue-400 hover:text-blue-300 transition">
              Buying
            </Link>
            <Link href="/selling" className="text-blue-400 hover:text-blue-300 transition">
              Selling
            </Link>
            <Link href="/shipping" className="text-blue-400 hover:text-blue-300 transition">
              Shipping
            </Link>
            <Link href="/returns" className="text-blue-400 hover:text-blue-300 transition">
              Returns
            </Link>
            <Link href="/authenticity-policy" className="text-blue-400 hover:text-blue-300 transition">
              Authenticity
            </Link>
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition">
              Privacy
            </Link>
          </nav>

        </div>
      </footer>

      {/* FLOATING BUTLER ICON */}
      <div className="butler-floating">
        <HomepageButler />
      </div>
    </>
  );
}
