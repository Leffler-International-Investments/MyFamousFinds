 // FILE: pages/buyer/dashboard.tsx

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

// ✅ Use the shared client initializer (and do NOT init at import-time here)
import { auth, db, firebaseClientReady } from "../../utils/firebaseClient";

type ItemRow = {
  id: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  listingId?: string;
  imageUrl?: string;
  sellerName?: string;
  sellerId?: string;
  referenceId?: string;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const previewMode = useMemo(
    () => router.isReady && String(router.query.preview || "") === "1",
    [router.isReady, router.query.preview]
  );
  const [user, setUser] = useState<User | null>(null);

  const [savedItems, setSavedItems] = useState<ItemRow[]>([]);
  const [cartItems, setCartItems] = useState<ItemRow[]>([]);
  const [viewedItems, setViewedItems] = useState<ItemRow[]>([]);
  const [activeOffers, setActiveOffers] = useState<ItemRow[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    if (previewMode) {
      setUser(null);
      setSavedItems([
        { id: "preview-1", title: "Vintage Chanel Classic Flap", brand: "Chanel" },
        { id: "preview-2", title: "Hermès Birkin 30", brand: "Hermès" },
      ]);
      setViewedItems([
        { id: "preview-3", title: "Louis Vuitton Speedy 25", brand: "Louis Vuitton" },
      ]);
      setActiveOffers([{ id: "preview-4", title: "Rolex Datejust 36", brand: "Rolex" }]);
      setPurchasedItems([
        { id: "preview-5", title: "Cartier Love Bracelet", brand: "Cartier" },
      ]);
      setLoading(false);
      return;
    }

    // ✅ Prevent build-time crash / SSR crash when env vars aren’t configured
    if (!firebaseClientReady || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/buyer/signin");
        return;
      }
      setUser(u);
      await loadData(u.uid, u.email || "");
      setLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, router]);

  const loadData = async (uid: string, email: string) => {
    if (!db) return;

    const loadCollection = async (name: string) => {
      const q = query(collection(db, name), where("userId", "==", uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as ItemRow[];
    };

    setSavedItems(await loadCollection("buyerSavedItems"));
    setCartItems(await loadCollection("buyerCartItems"));
    setViewedItems(await loadCollection("buyerRecentlyViewed"));
    setActiveOffers(await loadCollection("buyerOffers"));

    const orders: ItemRow[] = [];
    if (email) {
      const ordersByEmail = await getDocs(
        query(collection(db, "orders"), where("buyerEmail", "==", email))
      );
      ordersByEmail.forEach((doc) => {
        const d: any = doc.data() || {};
        orders.push({
          id: doc.id,
          title: d.listingTitle || d.title || "Purchased item",
          brand: d.listingBrand || d.brand || "",
        });
      });
    }

    const ordersByUid = await getDocs(
      query(collection(db, "orders"), where("buyerUid", "==", uid))
    );
    ordersByUid.forEach((doc) => {
      if (orders.find((o) => o.id === doc.id)) return;
      const d: any = doc.data() || {};
      orders.push({
        id: doc.id,
        title: d.listingTitle || d.title || "Purchased item",
        brand: d.listingBrand || d.brand || "",
      });
    });

    setPurchasedItems(orders);
  };

  const handleMoveToBag = async (item: ItemRow) => {
    if (!db || !user) return;
    const listingId = item.listingId || item.id.split("_").pop() || "";
    if (!listingId) return;
    setMovingId(item.id);
    try {
      const cartDocId = `${user.uid}_${listingId}`;
      await setDoc(
        doc(db, "buyerCartItems", cartDocId),
        {
          userId: user.uid,
          listingId,
          title: item.title || "",
          brand: item.brand || "",
          price: item.price || 0,
          currency: item.currency || "USD",
          imageUrl: item.imageUrl || "",
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      setCartItems((prev) => {
        if (prev.find((c) => c.listingId === listingId)) return prev;
        return [...prev, { ...item, id: cartDocId, listingId }];
      });
    } catch (err) {
      console.error("Failed to move to bag:", err);
    } finally {
      setMovingId(null);
    }
  };

  const handleRemoveFromBag = async (item: ItemRow) => {
    if (!db || !user) return;
    setMovingId(item.id);
    try {
      await deleteDoc(doc(db, "buyerCartItems", item.id));
      setCartItems((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      console.error("Failed to remove from bag:", err);
    } finally {
      setMovingId(null);
    }
  };

  const handleSignOut = async () => {
    if (previewMode) {
      router.push("/");
      return;
    }
    if (auth) await signOut(auth);
    router.push("/");
  };

  // ✅ If Firebase isn’t configured, don’t crash — show a clear message
  if (!firebaseClientReady && !previewMode) {
    return (
      <>
        <Head>
          <title>Buyer Dashboard | Famous Finds</title>
        </Head>
        <Header />
        <main className="buyer-dashboard-main">
          <div className="wrap buyer-dashboard-wrap">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h1 className="text-xl font-semibold">Buyer Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Firebase client environment variables are missing in Vercel, so buyer features are disabled.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Buyer Dashboard | Famous Finds</title>
      </Head>

      <Header />

      <main className="buyer-dashboard-main">
        <div className="wrap buyer-dashboard-wrap">
          {/* Top header */}
          <div className="buyer-dashboard-header">
            <div>
              <h1 className="buyer-dashboard-title">Your Famous Finds Snapshot</h1>
              {previewMode ? (
                <p className="buyer-dashboard-meta">Preview mode (developer access)</p>
              ) : (
                user && <p className="buyer-dashboard-meta">Signed in as {user.email}</p>
              )}
            </div>

            <button type="button" onClick={handleSignOut} className="buyer-dashboard-signout">
              {previewMode ? "Exit preview" : "Sign out"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">Loading…</div>
          ) : (
            <div className="buyer-dashboard-body">
              {/* Snapshot card on the right (similar look to homepage) */}
              <section className="buyer-snapshot-card">
                <div className="buyer-snapshot-label">SNAPSHOT</div>

                <div className="buyer-snapshot-grid">
                  <div className="buyer-snapshot-item">
                    <div className="buyer-snapshot-number">{savedItems.length}</div>
                    <div className="buyer-snapshot-text">Saved Items</div>
                  </div>

                  <div className="buyer-snapshot-item">
                    <div className="buyer-snapshot-number">{cartItems.length}</div>
                    <div className="buyer-snapshot-text">Shopping Bag</div>
                  </div>

                  <div className="buyer-snapshot-item">
                    <div className="buyer-snapshot-number">{viewedItems.length}</div>
                    <div className="buyer-snapshot-text">Recently Viewed</div>
                  </div>

                  <div className="buyer-snapshot-item">
                    <div className="buyer-snapshot-number">{activeOffers.length}</div>
                    <div className="buyer-snapshot-text">Active Offers</div>
                  </div>

                  <div className="buyer-snapshot-item">
                    <div className="buyer-snapshot-number">{purchasedItems.length}</div>
                    <div className="buyer-snapshot-text">Purchased Items</div>
                  </div>
                </div>

                <p className="buyer-snapshot-note">
                  Saved items are not reserved and remain available until another
                  customer completes a purchase.
                </p>
              </section>

              {/* Lists */}
              <section className="buyer-dashboard-lists">
                {/* My Shopping Bag */}
                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">
                    My Shopping Bag
                    {cartItems.length > 0 && (
                      <Link href="/cart" className="buyer-dashboard-view-link">
                        View bag
                      </Link>
                    )}
                  </h2>
                  <p className="buyer-dashboard-note">
                    Items in your bag are not reserved until checkout is complete.
                  </p>
                  {cartItems.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {cartItems.map((item) => (
                        <li key={item.id} className="buyer-dashboard-list-row">
                          <div className="buyer-dashboard-row-between">
                            <div>
                              <span>{item.title}</span>
                              <span className="buyer-dashboard-meta-line">
                                {item.brand ? `${item.brand} • ` : ""}
                                {typeof item.price === "number" && item.price > 0
                                  ? item.price.toLocaleString("en-US", {
                                      style: "currency",
                                      currency: item.currency || "USD",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() => handleRemoveFromBag(item)}
                              disabled={movingId === item.id}
                            >
                              {movingId === item.id ? "..." : "Remove"}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="buyer-dashboard-empty">
                      Your bag is empty. Move items from your wishlist below.
                    </p>
                  )}
                </div>

                {/* Saved Items (Wishlist) */}
                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">Saved Items</h2>
                  <p className="buyer-dashboard-note">
                    Saved until another guest purchases it. Saving does not reserve the item.
                  </p>
                  {savedItems.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {savedItems.map((item) => {
                        const listingId = item.listingId || item.id.split("_").pop() || "";
                        const alreadyInBag = cartItems.some(
                          (c) => c.listingId === listingId
                        );
                        return (
                          <li key={item.id} className="buyer-dashboard-list-row">
                            <div className="buyer-dashboard-row-between">
                              <div>
                                <span>{item.title}</span>
                                <span className="buyer-dashboard-meta-line">
                                  {item.brand ? `${item.brand} • ` : ""}
                                  {typeof item.price === "number" && item.price > 0
                                    ? item.price.toLocaleString("en-US", {
                                        style: "currency",
                                        currency: item.currency || "USD",
                                      })
                                    : ""}
                                  {item.status === "Sold"
                                    ? " • SOLD / No longer available"
                                    : item.status
                                    ? ` • ${item.status}`
                                    : ""}
                                </span>
                              </div>
                              {item.status !== "Sold" && (
                                <button
                                  type="button"
                                  className={alreadyInBag ? "btn-in-bag" : "btn-move-to-bag"}
                                  onClick={() => !alreadyInBag && handleMoveToBag(item)}
                                  disabled={alreadyInBag || movingId === item.id}
                                >
                                  {movingId === item.id
                                    ? "Moving..."
                                    : alreadyInBag
                                    ? "In bag"
                                    : "Move to bag"}
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="buyer-dashboard-empty">No saved items yet.</p>
                  )}
                </div>

                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">Recently Viewed</h2>
                  {viewedItems.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {viewedItems.map((item) => (
                        <li key={item.id} className="buyer-dashboard-list-row">
                          <span>{item.title}</span>
                          {item.brand && <span className="buyer-dashboard-meta-line">{item.brand}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="buyer-dashboard-empty">No viewed items yet.</p>
                  )}
                </div>

                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">Active Offers</h2>
                  {activeOffers.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {activeOffers.map((item) => (
                        <li key={item.id} className="buyer-dashboard-list-row">
                          <span>{item.title}</span>
                          <span className="buyer-dashboard-meta-line">
                            {item.brand ? `${item.brand} • ` : ""}
                            {typeof item.price === "number" && item.price > 0
                              ? item.price.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: item.currency || "USD",
                                })
                              : ""}
                            {item.status ? ` • ${item.status}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="buyer-dashboard-empty">No active offers yet.</p>
                  )}
                </div>

                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">Purchased Items</h2>
                  {purchasedItems.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {purchasedItems.map((item) => (
                        <li key={item.id} className="buyer-dashboard-list-row">
                          {item.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="buyer-dashboard-empty">No purchases yet.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .buyer-snapshot-note {
          margin-top: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        .buyer-dashboard-note {
          margin: 8px 0 0;
          font-size: 12px;
          color: #6b7280;
        }
        .buyer-dashboard-list-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .buyer-dashboard-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .buyer-dashboard-row-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .buyer-dashboard-thumb {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e5e7eb;
        }
        .buyer-dashboard-meta-line {
          font-size: 12px;
          color: #6b7280;
        }
        .buyer-dashboard-row-between {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }
        .buyer-dashboard-row-between > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .buyer-dashboard-view-link {
          margin-left: 12px;
          font-size: 12px;
          font-weight: 400;
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .btn-move-to-bag {
          flex-shrink: 0;
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
          flex-shrink: 0;
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
        .btn-remove {
          flex-shrink: 0;
          border-radius: 999px;
          background: transparent;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #ef4444;
          border: 1px solid #fecaca;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-remove:hover {
          background: #fef2f2;
        }
        .btn-remove:disabled {
          opacity: 0.6;
        }
      `}</style>
    </>
  );
}
