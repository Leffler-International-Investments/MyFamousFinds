// FILE: /components/Footer.tsx

import Link from "next/link";
import HomepageButler from "./HomepageButler";

export default function Footer() {
  return (
    <>
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-10 text-center">
          
          {/* TOP: BRAND + COPYRIGHT */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              Famous Finds
            </div>
            <div className="text-[11px] text-neutral-500">
              © {new Date().getFullYear()} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* MIDDLE: BLUE LINKS */}
          {/* flex-wrap: makes it wrap to 2-3 lines on mobile */}
          {/* gap-x-6: adds space between words */}
          {/* gap-y-3: adds space between rows when wrapped */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[13px] font-medium">
            <Link href="/help" className="text-blue-400 hover:text-blue-300 transition-colors">
              Help Center
            </Link>
            <Link href="/about" className="text-blue-400 hover:text-blue-300 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
              Contact
            </Link>
            <Link href="/buying" className="text-blue-400 hover:text-blue-300 transition-colors">
              Buying
            </Link>
            <Link href="/selling" className="text-blue-400 hover:text-blue-300 transition-colors">
              Selling
            </Link>
            <Link href="/shipping" className="text-blue-400 hover:text-blue-300 transition-colors">
              Shipping
            </Link>
            <Link href="/returns" className="text-blue-400 hover:text-blue-300 transition-colors">
              Returns
            </Link>
            <Link href="/authenticity-policy" className="text-blue-400 hover:text-blue-300 transition-colors">
              Authenticity
            </Link>
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
              Privacy
            </Link>
          </nav>

        </div>
      </footer>

      {/* BUTLER */}
      <div className="butler-floating">
        <HomepageButler />
      </div>
    </>
  );
}
