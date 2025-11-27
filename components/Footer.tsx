// FILE: /components/Footer.tsx

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="mt-auto border-t border-neutral-800 bg-neutral-900 text-white">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row md:items-start md:py-8">
        
        {/* LEFT: BRAND + COPYRIGHT */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="text-xs uppercase tracking-[0.2em] text-white">
            Famous Finds
          </div>
          <div className="mt-1 text-[10px] text-neutral-500">
            © {new Date().getFullYear()} All rights reserved.
          </div>
          <div className="mt-2 hidden text-[10px] text-neutral-600 md:block">
            Curated pre-loved luxury.
          </div>
        </div>

        {/* RIGHT: TOGGLE GROUPS (COMPACT) */}
        <div className="flex items-start gap-3">
          {/* HELP SECTION */}
          <div className="relative flex flex-col items-end">
            <button
              type="button"
              onClick={() => toggleSection("help")}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all
              ${
                openSection === "help"
                  ? "border-white bg-white text-neutral-900"
                  : "border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-500 hover:text-white"
              }`}
            >
              <span>Help</span>
            </button>

            {openSection === "help" && (
              <ul className="absolute bottom-full mb-2 w-32 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-right text-xs text-neutral-400 shadow-xl">
                <li className="mb-2"><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li className="mb-2"><Link href="/shipping" className="hover:text-white">Shipping</Link></li>
                <li className="mb-2"><Link href="/returns" className="hover:text-white">Returns</Link></li>
                <li className="mb-2"><Link href="/buying" className="hover:text-white">Buying</Link></li>
                <li><Link href="/selling" className="hover:text-white">Selling</Link></li>
              </ul>
            )}
          </div>

          {/* COMPANY SECTION */}
          <div className="relative flex flex-col items-end">
            <button
              type="button"
              onClick={() => toggleSection("company")}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all
              ${
                openSection === "company"
                  ? "border-white bg-white text-neutral-900"
                  : "border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-500 hover:text-white"
              }`}
            >
              <span>Company</span>
            </button>

            {openSection === "company" && (
              <ul className="absolute bottom-full mb-2 w-32 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-right text-xs text-neutral-400 shadow-xl">
                <li className="mb-2"><Link href="/about" className="hover:text-white">About</Link></li>
                <li className="mb-2"><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li className="mb-2"><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/authenticity-policy" className="hover:text-white">Authenticity</Link></li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
