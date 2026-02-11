// FILE: /components/ProductCard.tsx
import Link from "next/link";
import { useState } from "react";

export type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;
  href: string;
  badge?: string;
  details?: string;
  category?: string;
  condition?: string;
  tags?: string[];
};

type Props = ProductLike & {
  isSaved?: boolean;
  onToggleWishlist?: (productId: string) => void;
};

export default function ProductCard({ isSaved, onToggleWishlist, ...p }: Props) {
  const [localLiked, setLocalLiked] = useState(false);
  const liked = isSaved !== undefined ? isSaved : localLiked;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(p.id);
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <Link href={p.href} className="card-link">
      <div className="card">
        {/* THUMBNAIL with heart overlay */}
        <div className="thumb">
          {p.image ? (
            <img src={p.image} alt={p.title} />
          ) : (
            <div className="no-image">No image</div>
          )}
          {p.badge && <span className="badge">{p.badge}</span>}
          <button
            type="button"
            className={`heart-overlay${liked ? " heart-overlay--active" : ""}`}
            onClick={handleHeartClick}
            title={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" className="heart-svg">
              {liked ? (
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#ef4444"
                />
              ) : (
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
              )}
            </svg>
          </button>
        </div>

        {/* INFO & BUY NOW */}
        <div className="meta">
          <div className="info-top">
            {p.brand && <div className="brand">{p.brand}</div>}
            <div className="title">{p.title}</div>
            {p.price && <div className="price">{p.price}</div>}
          </div>

          <div className="actions">
            <span className="btn-buy">Buy Now</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
          cursor: pointer;
        }
        .card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          height: 100%;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .card-link:hover .card {
          border-color: #111827;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .thumb {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }
        .no-image {
          font-size: 12px;
          color: #6b7280;
        }
        .badge {
          position: absolute;
          left: 8px;
          top: 8px;
          background: #e11d48;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          z-index: 2;
        }

        .heart-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.25);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 3;
          transition: background 0.2s, transform 0.15s;
          padding: 0;
        }
        .heart-overlay:hover {
          background: rgba(0, 0, 0, 0.4);
          transform: scale(1.1);
        }
        .heart-overlay--active {
          background: rgba(255, 255, 255, 0.9);
        }
        .heart-overlay--active:hover {
          background: rgba(255, 255, 255, 1);
        }

        .meta {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 12px;
        }
        .info-top {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .brand {
          color: #6b7280;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .title {
          font-size: 14px;
          line-height: 1.3;
          font-weight: 500;
          color: #111;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }
        .price {
          font-weight: 700;
          font-size: 15px;
          color: #111;
          margin-top: 2px;
        }

        .actions {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-buy {
          flex: 1;
          height: 36px;
          border-radius: 99px;
          background: #111827;
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background 0.2s;
        }
        .card-link:hover .btn-buy {
          background: #000000;
        }
      `}</style>
    </Link>
  );
}
