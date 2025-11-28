// FILE: /components/Footer.tsx

import Link from "next/link";
import HomepageButler from "./HomepageButler";

export default function Footer() {
  return (
    <>
      <footer className="mt-auto border-t border-neutral-800 bg-neutral-900 text-white">
        {/* wider main container */}
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 sm:px-6 py-12 text-center">
          
          {/* BRAND + COPYRIGHT */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-white">
              FAMOUS FINDS
            </div>
            <div className="text-[11px] text-neutral-400">
              © {new Date().getFullYear()} All rights reserved. Curated pre-loved luxury.
            </div>
          </div>

          {/* LINKS SECTION */}
          <nav className="w-full flex justify-center">
            <div className="w-full max-w-6xl flex flex-wrap justify-center gap-x-16 gap-y-4">
              {/* 16 = 4rem = 64px = over 1cm of real-world spacing */}
              
              <Link
                href="/buying"
                className="text-xs sm:text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Authenticity
              </Link>

              <Link
                href="/privacy"
                className="text-xs sm:text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
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
