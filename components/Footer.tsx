// FILE: /components/Footer.tsx

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-[#faf9f6]">
      <div className="page-container mx-auto flex flex-col gap-6 px-4 py-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
        {/* LEFT: BRAND + COPYRIGHT */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Famous Finds
          </div>
          <div className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Famous Finds. All rights reserved.
          </div>
        </div>

        {/* CENTER: TOGGLE GROUPS */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-8">
          {/* HELP SECTION */}
          <div className="flex flex-col items-center md:items-start">
            <button
              type="button"
              onClick={() => toggleSection("help")}
              className={`group flex items-center gap-2 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all
              ${
                openSection === "help"
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                  : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <span>Help</span>
              <span
                className={`text-[9px] transition-transform duration-300 ${
                  openSection === "help" ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {openSection === "help" && (
              <ul className="mt-3 space-y-2 text-sm text-neutral-500 md:mt-4">
                <li>
                  <Link href="/help" className="hover:text-neutral-900">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-neutral-900">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-neutral-900">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/buying" className="hover:text-neutral-900">
                    Buying
                  </Link>
                </li>
                <li>
                  <Link href="/selling" className="hover:text-neutral-900">
                    Selling
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* COMPANY SECTION */}
          <div className="flex flex-col items-center md:items-start">
            <button
              type="button"
              onClick={() => toggleSection("company")}
              className={`group flex items-center gap-2 rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all
              ${
                openSection === "company"
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                  : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <span>Company</span>
              <span
                className={`text-[9px] transition-transform duration-300 ${
                  openSection === "company" ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>

            {openSection === "company" && (
              <ul className="mt-3 space-y-2 text-sm text-neutral-500 md:mt-4">
                <li>
                  <Link href="/about" className="hover:text-neutral-900">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-neutral-900">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-neutral-900">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/authenticity-policy"
                    className="hover:text-neutral-900"
                  >
                    Authenticity
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: SMALL NOTE (OPTIONAL) */}
        <div className="hidden text-xs text-neutral-400 md:block">
          Curated pre-loved luxury, verified by Famous Finds.
        </div>
      </div>
    </footer>
  );
}
