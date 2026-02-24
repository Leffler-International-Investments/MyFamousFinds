// /pages/cart.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import Footer from "../components/Footer";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firebaseClientReady } from "../utils/firebaseClient";

type CartItem = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  reservedUntil?: number;
};

type SavedItem = {
  id: string;
  listingId: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
};

// Format remaining time for countdown timer
function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function Cart() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  // Countdown timer — tick every second
  useEffect(() => {
    const hasReservations = items.some((i) => i.reservedUntil && i.reservedUntil > Date.now());
    if (!hasReservations) return;

    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      // Auto-release expired items to saved
      const expired = items.filter(
        (i) => i.reservedUntil && i.reservedUntil <= current
      );
      if (expired.length > 0) {
        for (const item of expired) {
          handleSaveForLater(item);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (!firebaseClientReady || !auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      await loadCart(u);
      setLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getToken = async (): Promise<string | null> => {
    try {
      return auth?.currentUser ? await auth.currentUser.getIdToken() : null;
    } catch {
      return null;
    }
  };

  const reserveItem = async (listingId: string, token: string): Promise<number | undefined> => {
    try {
      const res = await fetch("/api/cart/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId }),
      });
      const json = await res.json();
      if (json.ok && json.reservedUntil) {
        return json.reservedUntil;
      }
    } catch {}
    return undefined;
  };

  const loadCart = async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();

      // Load cart and saved items via API (bypasses Firestore rules)
      const res = await fetch("/api/cart/data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.ok) {
        const cartItems: CartItem[] = json.cartItems || [];
        const saved: SavedItem[] = json.savedItems || [];

        // Reserve items with 15-minute timers
        const withReservations = await Promise.all(
          cartItems.map(async (item: CartItem) => {
            const reservedUntil = await reserveItem(item.listingId, token);
            return { ...item, reservedUntil };
          })
        );

        setItems(withReservations);
        setSavedItems(saved);
      }
    } catch (err) {
      console.error("Failed to load cart data:", err);
    }
  };

  const handleRemoveFromCart = async (item: CartItem) => {
    setActionId(item.id);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/cart/save-for-later", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: item.listingId, action: "remove" }),
      });
      const json = await res.json();
      if (json.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      console.error("Remove from cart failed:", err);
    } finally {
      setActionId(null);
    }
  };

  const handleSaveForLater = async (item: CartItem) => {
    if (!user) return;
    setActionId(item.id);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/cart/save-for-later", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: item.listingId, action: "save" }),
      });
      const json = await res.json();
      if (json.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setSavedItems((prev) => {
          if (prev.find((s) => s.listingId === item.listingId)) return prev;
          const savedDocId = `${user.uid}_${item.listingId}`;
          return [...prev, { ...item, id: savedDocId }];
        });
      }
    } catch (err) {
      console.error("Save for later failed:", err);
    } finally {
      setActionId(null);
    }
  };

  const handleMoveToCart = async (item: SavedItem) => {
    if (!user) return;
    setActionId(item.id);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch("/api/cart/save-for-later", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: item.listingId, action: "move-to-cart" }),
      });
      const json = await res.json();
      if (json.ok) {
        const cartDocId = `${user.uid}_${item.listingId}`;
        setItems((prev) => {
          if (prev.find((c) => c.listingId === item.listingId)) return prev;
          return [...prev, { ...item, id: cartDocId }];
        });
      }
    } catch (err) {
      console.error("Move to cart failed:", err);
    } finally {
      setActionId(null);
    }
  };

  const formatPrice = (price: number, currency = "USD") =>
    price > 0
      ? price.toLocaleString("en-US", { style: "currency", currency })
      : "";

  const cartTotal = items.reduce((sum, i) => sum + i.price, 0);

  return (
    <>
      <Head>
        <title>My Shopping Bag | Famous Finds</title>
      </Head>

      <Header />

      <main className="cart-main">
        <div className="cart-wrap">
          <div className="cart-header">
            <h1>My Shopping Bag</h1>
            <Link href="/account" className="back-link">
              &#8592; Back to Account
            </Link>
          </div>

          {loading ? (
            <p className="cart-loading">Loading your bag...</p>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p>Your shopping bag is empty.</p>
              <p className="cart-empty-sub">
                Browse our collection or move items from your wishlist.
              </p>
              <Link href="/" className="btn-browse">
                Browse collection
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {items.map((item) => {
                  const remaining = item.reservedUntil
                    ? item.reservedUntil - now
                    : 0;
                  const isExpiring = remaining > 0 && remaining < 3 * 60 * 1000;

                  return (
                    <div key={item.id} className="cart-item">
                      {item.reservedUntil && remaining > 0 && (
                        <div
                          className={`cart-timer${
                            isExpiring ? " cart-timer--urgent" : ""
                          }`}
                        >
                          Reserved for {formatCountdown(remaining)}
                        </div>
                      )}
                      {item.reservedUntil && remaining <= 0 && (
                        <div className="cart-timer cart-timer--expired">
                          Reservation expired — moving to saved items
                        </div>
                      )}
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="cart-item-img"
                        />
                      )}
                      <div className="cart-item-info">
                        <span className="cart-item-title">{item.title}</span>
                        {item.brand && (
                          <span className="cart-item-brand">{item.brand}</span>
                        )}
                      </div>
                      <div className="cart-item-actions">
                        <span className="cart-item-price">
                          {formatPrice(item.price, item.currency)}
                        </span>
                        <button
                          type="button"
                          className="btn-save-later"
                          onClick={() => handleSaveForLater(item)}
                          disabled={actionId === item.id}
                        >
                          {actionId === item.id ? "..." : "Save for later"}
                        </button>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveFromCart(item)}
                          disabled={actionId === item.id}
                        >
                          {actionId === item.id ? "..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <div className="cart-total">
                  <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                  <span className="cart-total-amount">
                    {formatPrice(cartTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-checkout"
                  onClick={() => router.push("/checkout")}
                >
                  Proceed to checkout
                </button>
              </div>
            </>
          )}

          {/* Saved items (wishlist) below the cart */}
          {savedItems.length > 0 && (
            <div className="saved-section">
              <h2>Saved Items ({savedItems.length})</h2>
              <p className="saved-note">
                Items in your wishlist. Move them to your bag when you are ready.
              </p>
              <div className="saved-items">
                {savedItems.map((item) => {
                  const alreadyInCart = items.some(
                    (c) => c.listingId === item.listingId
                  );
                  return (
                    <div key={item.id} className="saved-item">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="cart-item-img"
                        />
                      )}
                      <div className="cart-item-info">
                        <span className="cart-item-title">{item.title}</span>
                        {item.brand && (
                          <span className="cart-item-brand">{item.brand}</span>
                        )}
                      </div>
                      <div className="cart-item-actions">
                        <span className="cart-item-price">
                          {formatPrice(item.price, item.currency)}
                        </span>
                        <button
                          type="button"
                          className={alreadyInCart ? "btn-in-bag" : "btn-move-to-bag"}
                          onClick={() => !alreadyInCart && handleMoveToCart(item)}
                          disabled={alreadyInCart || actionId === item.id}
                        >
                          {actionId === item.id
                            ? "Moving..."
                            : alreadyInCart
                            ? "In bag"
                            : "Move to bag"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .cart-main {
          min-height: 60vh;
          padding: 32px 16px;
          background: #ffffff;
        }
        .cart-wrap {
          max-width: 720px;
          margin: 0 auto;
        }
        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .cart-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
        }
        .back-link {
          font-size: 13px;
          color: #2563eb;
        }
        .cart-loading {
          color: #6b7280;
          font-size: 14px;
        }
        .cart-empty {
          text-align: center;
          padding: 48px 0;
        }
        .cart-empty p {
          font-size: 16px;
          color: #111827;
        }
        .cart-empty-sub {
          margin-top: 4px;
          font-size: 13px;
          color: #6b7280;
        }
        .btn-browse {
          display: inline-block;
          margin-top: 16px;
          border-radius: 999px;
          background: #111827;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 500;
          color: white;
          text-decoration: none;
        }
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cart-item,
        .saved-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fafafa;
        }
        .cart-item-img {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
          flex-shrink: 0;
        }
        .cart-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .cart-item-title {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cart-item-brand {
          font-size: 12px;
          color: #6b7280;
        }
        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .cart-item-price {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
        }
        .btn-save-later {
          font-size: 11px;
          color: #2563eb;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
          white-space: nowrap;
        }
        .btn-save-later:disabled {
          opacity: 0.5;
        }
        .btn-remove {
          font-size: 11px;
          color: #ef4444;
          background: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-remove:disabled {
          opacity: 0.5;
        }
        .cart-summary {
          margin-top: 24px;
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #374151;
        }
        .cart-total-amount {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        .btn-checkout {
          display: block;
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 999px;
          background: #111827;
          padding: 14px 0;
          font-size: 16px;
          font-weight: 600;
          color: white;
          text-align: center;
          text-decoration: none;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
        }
        .btn-checkout:hover {
          background: #1f2937;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          transform: translateY(-1px);
        }
        .btn-checkout:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .saved-section {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .saved-section h2 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        .saved-note {
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }
        .saved-items {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .btn-move-to-bag {
          border-radius: 999px;
          background: #111827;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          color: white;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-move-to-bag:hover {
          background: #1f2937;
        }
        .btn-move-to-bag:disabled {
          opacity: 0.6;
        }
        .btn-in-bag {
          border-radius: 999px;
          background: #e5e7eb;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          border: none;
          cursor: default;
          white-space: nowrap;
        }
        /* Cart reservation timer */
        .cart-timer {
          width: 100%;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          background: #eff6ff;
          color: #1d4ed8;
          margin-bottom: 4px;
        }
        .cart-timer--urgent {
          background: #fef3c7;
          color: #92400e;
          animation: timerPulse 1s ease-in-out infinite;
        }
        .cart-timer--expired {
          background: #fef2f2;
          color: #b91c1c;
        }
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
