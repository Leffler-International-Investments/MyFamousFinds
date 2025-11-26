// FILE: /components/Footer.tsx
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  // State to track which section is currently open ('help', 'company', or null)
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    // If clicking the already open section, close it. Otherwise, open the new one.
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="mt-auto border-t border-neutral-100 bg-white pt-12 pb-12">
      <div className="page-container flex flex-col items-center justify-center text-center">
        
        {/* 1. Copyright (Moved to Top) */}
        <div className="mb-10 text-xs text-neutral-400">
          © {new Date().getFullYear()} Famous Finds
        </div>

        {/* 2. Interactive Sections Container */}
        <div className="w-full max-w-xs space-y-8">
          
          {/* HELP SECTION */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => toggleSection("help")}
              className="group flex items-center gap-2 font-serif text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <span>Help</span>
              {/* Optional: Small indicator arrow */}
              <span className={`text-[10px] transition-transform duration-300 ${openSection === "help" ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {/* Sub-menu (Condition: only show if openSection === 'help') */}
            {openSection === "help" && (
              <ul className="mt-4 space-y-3 text-sm text-neutral-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <li>
                  <Link href="/help" className="hover:text-neutral-900 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-neutral-900 transition-colors">
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-neutral-900 transition-colors">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/buying" className="hover:text-neutral-900 transition-colors">
                    Buying
                  </Link>
                </li>
                <li>
                  <Link href="/selling" className="hover:text-neutral-900 transition-colors">
                    Selling
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* COMPANY SECTION */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => toggleSection("company")}
              className="group flex items-center gap-2 font-serif text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              <span>Company</span>
              <span className={`text-[10px] transition-transform duration-300 ${openSection === "company" ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {/* Sub-menu (Condition: only show if openSection === 'company') */}
            {openSection === "company" && (
              <ul className="mt-4 space-y-3 text-sm text-neutral-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <li>
                  <Link href="/about" className="hover:text-neutral-900 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-neutral-900 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/authenticity-policy" className="hover:text-neutral-900 transition-colors">
                    Authenticity
                  </Link>
                </li>
              </ul>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
}
