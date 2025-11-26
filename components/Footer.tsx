// FILE: /components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-100 bg-white pt-12 pb-8">
      <div className="page-container">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          
          {/* Brand / Logo Area (Hidden on mobile to save space, visible on desktop) */}
          <div className="hidden md:block max-w-xs">
            <h4 className="font-serif text-lg font-bold text-neutral-900 mb-4">
              Famous Finds
            </h4>
            <p className="text-sm text-neutral-500 leading-relaxed">
              The premier destination for secure luxury resale. Authenticated, curated, and ready for you.
            </p>
          </div>

          {/* Links Section: Side-by-side on mobile (grid-cols-2) */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 w-full md:w-auto">
            
            {/* Column 1: HELP */}
            <div>
              <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">
                Help
              </h4>
              <ul className="space-y-3 text-sm text-neutral-500">
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
            </div>

            {/* Column 2: COMPANY */}
            <div>
              <h4 className="font-serif text-xs font-bold uppercase tracking-widest text-neutral-900 mb-4">
                Company
              </h4>
              <ul className="space-y-3 text-sm text-neutral-500">
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
            </div>
          </div>
        </div>

        {/* Legal Line */}
        <div className="mt-12 border-t border-neutral-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Famous Finds
          </p>
          
          <div className="hidden md:flex gap-4 text-xs text-neutral-400">
            <span>Terms</span>
            <span>Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
