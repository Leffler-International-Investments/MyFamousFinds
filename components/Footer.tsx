// FILE: /components/Footer.tsx
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="mt-auto border-t border-neutral-100 bg-white pt-12 pb-12">
      <div className="page-container flex flex-col items-center justify-center text-center">
        
        {/* 1. Copyright Line */}
        <div className="mb-8 text-xs text-neutral-400">
          © {new Date().getFullYear()} Famous Finds
        </div>

        {/* 2. Interactive Buttons Container (Side-by-Side) */}
        <div className="flex flex-row items-start justify-center gap-4 w-full">
          
          {/* HELP SECTION */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => toggleSection("help")}
              className={`
                group flex items-center gap-2 rounded-full border px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all
                ${openSection === "help" 
                  ? "bg-neutral-900 text-white border-neutral-900" 
                  : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"}
              `}
            >
              <span>Help</span>
              <span className={`text-[10px] transition-transform duration-300 ${openSection === "help" ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {/* Sub-menu */}
            {openSection === "help" && (
              <ul className="mt-4 space-y-3 text-sm text-neutral-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <li><Link href="/help" className="hover:text-neutral-900">Help Center</Link></li>
                <li><Link href="/shipping" className="hover:text-neutral-900">Shipping</Link></li>
                <li><Link href="/returns" className="hover:text-neutral-900">Returns</Link></li>
                <li><Link href="/buying" className="hover:text-neutral-900">Buying</Link></li>
                <li><Link href="/selling" className="hover:text-neutral-900">Selling</Link></li>
              </ul>
            )}
          </div>

          {/* COMPANY SECTION */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => toggleSection("company")}
              className={`
                group flex items-center gap-2 rounded-full border px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all
                ${openSection === "company" 
                  ? "bg-neutral-900 text-white border-neutral-900" 
                  : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"}
              `}
            >
              <span>Company</span>
              <span className={`text-[10px] transition-transform duration-300 ${openSection === "company" ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {/* Sub-menu */}
            {openSection === "company" && (
              <ul className="mt-4 space-y-3 text-sm text-neutral-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <li><Link href="/about" className="hover:text-neutral-900">About</Link></li>
                <li><Link href="/contact" className="hover:text-neutral-900">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-neutral-900">Privacy</Link></li>
                <li><Link href="/authenticity-policy" className="hover:text-neutral-900">Authenticity</Link></li>
              </ul>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
}
