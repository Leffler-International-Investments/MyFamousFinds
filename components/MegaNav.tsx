import Link from "next/link";

export default function MegaNav() {
  const nav = [
    {
      label: "NEW ARRIVALS",
      href: "/category/new-arrivals",
      submenu: [
        { label: "All New Arrivals", href: "/category/new-arrivals" },
        { label: "New Bags", href: "/category/bags?sort=new" },
        { label: "New Shoes", href: "/category/shoes?sort=new" },
        { label: "New Watches", href: "/category/watches?sort=new" },
      ],
    },
    {
      label: "DESIGNERS",
      href: "/designers",
      submenu: [
        { label: "All Designers", href: "/designers" },
        { label: "Chanel", href: "/designers/chanel" },
        { label: "Louis Vuitton", href: "/designers/louis-vuitton" },
        { label: "Prada", href: "/designers/prada" },
      ],
    },
    {
      label: "WOMEN",
      href: "/category/women",
      submenu: [
        { label: "All Women", href: "/category/women" },
        { label: "Bags", href: "/category/bags?for=women" },
        { label: "Shoes", href: "/category/shoes?for=women" },
        { label: "Clothing", href: "/category/clothing?for=women" },
      ],
    },
    {
      label: "BAGS",
      href: "/category/bags",
      submenu: [
        { label: "All Bags", href: "/category/bags" },
        { label: "Totes", href: "/category/bags?tote=1" },
        { label: "Crossbody", href: "/category/bags?crossbody=1" },
        { label: "Mini Bags", href: "/category/bags?mini=1" },
      ],
    },
    {
      label: "MEN",
      href: "/category/men",
      submenu: [
        { label: "All Men", href: "/category/men" },
        { label: "Bags", href: "/category/bags?for=men" },
        { label: "Shoes", href: "/category/shoes?for=men" },
        { label: "Accessories", href: "/category/accessories?for=men" },
      ],
    },
    {
      label: "KIDS",
      href: "/category/kids",
      submenu: [
        { label: "All Kids", href: "/category/kids" },
        { label: "Girls", href: "/category/kids?for=girls" },
        { label: "Boys", href: "/category/kids?for=boys" },
      ],
    },
    {
      label: "JEWELRY",
      href: "/category/jewelry",
      submenu: [
        { label: "All Jewelry", href: "/category/jewelry" },
        { label: "Necklaces", href: "/category/jewelry?type=necklace" },
        { label: "Bracelets", href: "/category/jewelry?type=bracelet" },
        { label: "Earrings", href: "/category/jewelry?type=earrings" },
      ],
    },
    {
      label: "WATCHES",
      href: "/category/watches",
      submenu: [
        { label: "All Watches", href: "/category/watches" },
        { label: "Men's Watches", href: "/category/watches?for=men" },
        { label: "Women's Watches", href: "/category/watches?for=women" },
      ],
    },
  ];

  return (
    <div className="ff-meganav">
      {nav.map((item) => (
        <div key={item.label} className="ff-meganav-item">
          <Link href={item.href} className="ff-meganav-link">
            {item.label}
          </Link>

          {item.submenu && (
            <div className="ff-megamenu">
              {item.submenu.map((sub) => (
                <Link key={sub.label} href={sub.href} className="ff-megamenu-link">
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .ff-meganav {
          display: flex;
          gap: 24px;
          padding: 8px 20px;
          border-bottom: 1px solid #eee;
          background: white;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          position: relative;
        }

        .ff-meganav-item {
          position: relative;
        }

        .ff-meganav-link {
          text-decoration: none;
          color: #333;
          padding-bottom: 4px;
        }

        .ff-meganav-link:hover {
          color: black;
          border-bottom: 2px solid black;
        }

        /* DROPDOWN */
        .ff-megamenu {
          position: absolute;
          top: 28px;
          left: 0;
          background: white;
          border: 1px solid #ddd;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 12px 16px;
          display: none;
          z-index: 20;
          min-width: 200px;
        }

        .ff-meganav-item:hover .ff-megamenu {
          display: block;
        }

        .ff-megamenu-link {
          display: block;
          padding: 6px 0;
          text-decoration: none;
          color: #555;
          font-size: 13px;
        }

        .ff-megamenu-link:hover {
          color: black;
        }

        /* MOBILE */
        @media (max-width: 850px) {
          .ff-megamenu {
            position: static;
            display: block !important;
            box-shadow: none;
            border: none;
            padding-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
