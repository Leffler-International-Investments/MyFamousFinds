// FILE: /components/ProductCard.tsx
import Link from "next/link";
import { useState } from "react";
import { useToast } from "./Toast";

export type ProductLike = {
  id: string;
  title: string;
  brand?: string;
  price?: string;
  image: string;   // always the actual listing image
  href: string;
  badge?: string;
  details?: string;
  // Optional extras if your data has them
  category?: string;
  condition?: string;
  tags?: string[];
};

export default function ProductCard(p: ProductLike) {
  const [liked, setLiked] = useState(false);
  const { showToast } = useToast();

  function handleHeart() {
    const next = !liked;
    setLiked(next);
    showToast(
      next
        ? `${p.title} added to your wishlist`
        : `${p.title} removed from your wishlist`
    );
  }

  return (
    <div className="card">
      {/* 1. THUMBNAIL (Unclickable, visual only) */}
      <div className="thumb">
        {p.image ? (
          <img src={p.image} alt={p.title} />
        ) : (
          <div className="no-image">No image</div>
        )}
        {p.badge && <span className="badge">{p.badge}</span>}
      </div>

      {/* 2. INFO & ACTIONS */}
      <div className="meta">
        <div className="info-top">
          {p.brand && <div className="brand">{p.brand}</div>}
          <div className="title">{p.title}</div>
          {p.price && <div className="price">{p.price}</div>}
        </div>

        {/* 3. NEW ACTION BUTTONS */}
        <div className="actions">
          <button
            type="button"
            className={`btn-heart ${liked ? "active" : ""}`}
            onClick={handleHeart}
            title="I Love It"
          >
            {liked ? "❤" : "♡"}
          </button>

          <Link href={p.href} className="btn-buy">
            Buy Now
          </Link>
        </div>
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          height: 100%; /* Fill grid height */
        }

        /* --- PRESERVED YOUR PERFECT SQUARE THUMBNAIL --- */
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
          
          /* Global Dashboard CSS handles the 'multiply' filter if needed */
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

        /* --- META SECTION --- */
        .meta {
          padding: 12px;
          display: flex;
          flex-direction: column;
          flex-grow: 1; /* Pushes actions to bottom if card stretches */
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
          
          /* Text clamping to keep height consistent */
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

        /* --- NEW BUTTONS STYLING --- */
        .actions {
          margin-top: auto; /* Pushes buttons to very bottom */
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-heart {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #e5e7eb;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-heart:hover {
          border-color: #d1d5db;
          color: #ef4444;
        }

        .btn-heart.active {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fca5a5;
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

        .btn-buy:hover {
          background: #000000;
        }
      `}</style>
    </div>
  );
}
