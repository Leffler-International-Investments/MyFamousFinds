// FILE: /components/Header.tsx

import Link from "next/link";

type MegaLink = {
  label: string;
  href: string;
};

type MegaSection = {
  heading: string;
  links: MegaLink[];
};

type MegaNavItem = {
  label: string;
  href: string;
  sections?: MegaSection[];
};

const megaNav: MegaNavItem[] = [
  {
    label: "NEW ARRIVALS",
    href: "/category/new-arrivals",
    sections: [
      {
        heading: "Shop new in",
        links: [
          { label: "All new arrivals", href: "/category/new-arrivals" },
          { label: "New bags", href: "/category/bags?sort=new" },
          { label: "New shoes", href: "/category/shoes?sort=new" },
          { label: "New watches", href: "/category/watches?sort=new" },
        ],
      },
    ],
  },
  {
    label: "DESIGNERS",
    href: "/designers",
    sections: [
      {
        heading: "Browse by designer",
        links: [
          { label: "All designers", href: "/designers" },
          { label: "Chanel", href: "/designers/chanel" },
          { label: "Louis Vuitton", href: "/designers/louis-vuitton" },
          { label: "Prada", href: "/designers/prada" },
        ],
      },
    ],
  },
  {
    label: "WOMEN",
    href: "/category/women",
    sections: [
      {
        heading: "Categories",
        links: [
          { label: "All women", href: "/category/women" },
          { label: "Bags", href: "/category/bags?for=women" },
          { label: "Shoes", href: "/category/shoes?for=women" },
          { label: "Clothing", href: "/category/clothing?for=women" },
        ],
      },
    ],
  },
  {
    label: "BAGS",
    href: "/category/bags",
    sections: [
      {
        heading: "Bag styles",
        links: [
          { label: "All bags", href: "/category/bags" },
          { label: "Totes", href: "/category/bags?tote=1" },
          { label: "Crossbody", href: "/category/bags?crossbody=1" },
          { label: "Mini bags", href: "/category/bags?mini=1" },
        ],
      },
    ],
  },
  {
    label: "MEN",
    href: "/category/men",
    sections: [
      {
        heading: "Categories",
        links: [
          { label: "All men", href: "/category/men" },
          { label: "Bags", href: "/category/bags?for=men" },
          { label: "Shoes", href: "/category/shoes?for=men" },
          { label: "Accessories", href: "/category/accessories?for=men" },
        ],
      },
    ],
  },
  {
    label: "JEWELRY",
    href: "/category/jewelry",
    sections: [
      {
        heading: "Jewelry",
        links: [
          { label: "All jewelry", href: "/category/jewelry" },
          { label: "Necklaces", href: "/category/jewelry?type=necklace" },
          { label: "Bracelets", href: "/category/jewelry?type=bracelet" },
          { label: "Earrings", href: "/category/jewelry?type=earrings" },
        ],
      },
    ],
  },
  {
    label: "WATCHES",
    href: "/category/watches",
    sections: [
      {
        heading: "Watches",
        links: [
          { label: "All watches", href: "/category/watches" },
          { label: "Women’s watches", href: "/category/watches?for=women" },
          { label: "Men’s watches", href: "/category/watches?for=men" },
        ],
      },
    ],
  },
];

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      {/* Top utility bar – keep your existing links */}
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2 text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <Link
            href="/vip"
            className="inline-flex items-center rounded-full bg-black text-white px-3 py-1 font-medium"
          >
            VIP Front Row
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/shopping-bag" className="font-medium">
            FF Shopping Bag
          </Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/help">Help</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link
            href="/admin/login"
            className="admin-button management hidden sm:inline-block"
          >
            Management Admin Login
          </Link>
          <Link
            href="/seller/login"
            className="admin-button seller hidden sm:inline-block"
          >
            Seller Admin Login
          </Link>
        </div>
      </div>

      {/* Brand + main nav (Luxelist style) */}
      <div className="border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-xl tracking-[0.25em] font-semibold">
              FAMOUS FINDS
            </Link>

            <div className="hidden sm:flex items-center gap-5 text-gray-600">
              <Link href="/account" aria-label="Account">
                <span className="text-sm">Account</span>
              </Link>
              <Link href="/wishlist" aria-label="Wishlist">
                <span className="text-sm">Wishlist</span>
              </Link>
              <Link href="/shopping-bag" aria-label="Bag">
                <span className="text-sm">Bag</span>
              </Link>
            </div>
          </div>

          {/* Category bar with hover mega menus */}
          <nav className="flex items-stretch gap-6 text-xs tracking-[0.18em] text-gray-800 pb-3">
            {megaNav.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className="inline-flex items-center py-1 border-b-2 border-transparent group-hover:border-gray-900"
                >
                  {item.label}
                </Link>

                {item.sections && item.sections.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-30">
                    <div className="w-[420px] rounded-xl border border-gray-200 bg-white shadow-xl p-4 grid grid-cols-1 gap-4">
                      {item.sections.map((section) => (
                        <div key={section.heading}>
                          <div className="text-[11px] font-semibold text-gray-500 mb-2 uppercase">
                            {section.heading}
                          </div>
                          <ul className="space-y-1 text-[13px] text-gray-800">
                            {section.links.map((link) => (
                              <li key={link.label}>
                                <Link
                                  href={link.href}
                                  className="hover:text-gray-900 hover:underline"
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Simple search box on the right */}
            <div className="ml-auto hidden md:block">
              <form
                action="/search"
                className="flex items-center border border-gray-300 rounded-md px-2 py-[3px] bg-white text-[13px]"
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Search"
                  className="bg-transparent outline-none text-gray-800 placeholder-gray-400 w-32"
                />
              </form>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
