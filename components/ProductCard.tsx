// FILE: /components/ProductCard.tsx
import Link from "next/link";
import { useWishlistContext } from "./WishlistContext";

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
  const { savedIds, toggleWishlist } = useWishlistContext();
  const liked = isSaved !== undefined ? isSaved : savedIds.has(p.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(p.id);
    } else {
      toggleWishlist(p.id);
    }
  };

  return (
    <Link href={p.href} className="card-link">
      <div className="card">
        <div className="thumb">
          {p.image ? (
            <img src={p.image} alt={p.title} />
          ) : (
            <div className="no-image">No image</div>
          )}
          <button
            type="button"
            className={`heart${liked ? " heart--active" : ""}`}
            onClick={handleHeartClick}
            title={liked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              {liked ? (
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#ef4444"
                />
              ) : (
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                />
              )}
            </svg>
          </button>
        </div>

        <div className="info">
          {p.brand && <div className="brand">{p.brand}</div>}
          <div className="title">{p.title}</div>
          {p.price && <div className="price">{p.price}</div>}
        </div>
      </div>

      <style jsx>{`
        .card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
        }
        .card {
          display: flex;
          flex-direction: column;
          background: transparent;
          height: 100%;
        }
        .card:hover .thumb img {
          opacity: 0.92;
        }

        .thumb {
          position: relative;
          /* aspect-ratio fallback for iOS < 15 (pre-Sept 2021) */
          padding-top: 133.33%; /* 4:3 portrait = 100% * (4/3) */
          background: #f5f0e8;
          overflow: hidden;
          /* Prevent iOS GPU compositing from wiping the background */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          /* Force background to repaint correctly on iOS */
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        /* Override padding-top with aspect-ratio on supporting browsers */
        @supports (aspect-ratio: 3 / 4) {
          .thumb {
            aspect-ratio: 3 / 4;
            padding-top: 0;
          }
        }
        .thumb img {
          /* For padding-top fallback: absolutely positioned */
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          -webkit-object-fit: contain;
          object-fit: contain;
          display: block;
          /* Avoid GPU layer promotion that causes white flash on iOS */
          transition: opacity 0.2s ease;
          /* Ensure background colour shows through transparent images */
          background: #f5f0e8;
        }
        /* When aspect-ratio is supported, img can be static */
        @supports (aspect-ratio: 3 / 4) {
          .thumb img {
            position: static;
            width: 100%;
            height: 100%;
          }
        }
        .no-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #999;
        }

        .heart {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          /* Use z-index carefully — keep it low to avoid new stacking context on iOS */
          z-index: 1;
          padding: 0;
          /* No transform transition — avoids GPU layer promotion on iOS */
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .heart:hover {
          background: rgba(255, 255, 255, 0.98);
        }
        .heart--active {
          background: #fff;
        }

        .info {
          padding: 10px 4px 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .brand {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        .title {
          font-size: 13px;
          color: #222;
          line-height: 1.3;
          font-weight: 400;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .price {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          margin-top: 3px;
        }
      `}</style>
    </Link>
  );
}
