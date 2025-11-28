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

          {/* LINK PILLS – WRAP ON MOBILE */}
          <nav className="w-full flex justify-center">
            <div className="flex flex-wrap justify-center gap-3 max-w-xl">
              <Link
                href="/help"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Help Center
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/buying"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Buying
              </Link>
              <Link
                href="/selling"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Selling
              </Link>
              <Link
                href="/shipping"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Shipping
              </Link>
              <Link
                href="/returns"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Returns
              </Link>
              <Link
                href="/authenticity-policy"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Authenticity
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center rounded-full bg-neutral-800 px-3 py-1 text-xs sm:text-[13px] text-blue-300 hover:bg-neutral-700 hover:text-blue-100 transition-colors"
              >
                Privacy
              </Link>
            </div>
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
