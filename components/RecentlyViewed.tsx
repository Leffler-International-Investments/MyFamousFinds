// FILE: /components/RecentlyViewed.tsx
// localStorage-based Recently Viewed section — no auth required.

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ff-recently-viewed";
const MAX_ITEMS = 12;

export type RecentItem = {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  viewedAt: number;
};

/** Record a product view in localStorage */
export function recordRecentView(item: {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentItem[] = raw ? JSON.parse(raw) : [];
    // Remove existing entry for this id
    const filtered = items.filter((i) => i.id !== item.id);
    // Add to front
    filtered.unshift({ ...item, viewedAt: Date.now() });
    // Trim to max
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage quota or parse error — ignore
  }
}

/** Get recently viewed items, optionally excluding a specific id */
function getRecentItems(excludeId?: string): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RecentItem[] = JSON.parse(raw);
    return items
      .filter((i) => i.id && i.id !== excludeId)
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(getRecentItems(excludeId));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="rv-section">
      <h2 className="rv-title">Recently Viewed</h2>
      <div className="rv-grid">
        {items.map((item) => (
          <Link key={item.id} href={`/product/${item.id}`} className="rv-card">
            <img
              src={item.image || "/Famous-Finds-Logo-2.png"}
              alt={item.title}
              className="rv-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/Famous-Finds-Logo-2.png";
              }}
            />
            <div className="rv-body">
              <span className="rv-brand">{item.brand}</span>
              <span className="rv-name">{item.title}</span>
              <span className="rv-price">{item.price}</span>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .rv-section {
          margin-top: 40px;
          padding-top: 28px;
          border-top: 1px solid #ececec;
        }
        .rv-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 16px;
          color: #111;
        }
        .rv-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .rv-card {
          text-decoration: none;
          color: inherit;
          border: 1px solid #ececec;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          transition: box-shadow 0.15s;
        }
        .rv-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }
        .rv-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
          background: #fafafa;
        }
        .rv-body {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rv-brand {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #888;
        }
        .rv-name {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rv-price {
          font-size: 13px;
          font-weight: 800;
          color: #111;
          margin-top: 2px;
        }
        @media (max-width: 980px) {
          .rv-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 640px) {
          .rv-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}
