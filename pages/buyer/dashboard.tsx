 // FILE: pages/buyer/dashboard.tsx

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from "firebase/firestore";

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
  const [user, setUser] = useState<User | null>(null);

  const [savedItems, setSavedItems] = useState<ItemRow[]>([]);
  const [viewedItems, setViewedItems] = useState<ItemRow[]>([]);
  const [activeOffers, setActiveOffers] = useState<ItemRow[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [router]);

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

    const saved = await loadCollection("buyerSavedItems");
    setSavedItems(saved);

    const viewedQuery = query(
      collection(db, "buyerRecentlyViewed"),
      where("userId", "==", uid),
      orderBy("viewedAt", "desc"),
      limit(30)
    );
    const viewedSnap = await getDocs(viewedQuery);
    setViewedItems(
      viewedSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }))
    );

    const offers: ItemRow[] = [];
    const offersByUid = await getDocs(
      query(
        collection(db, "offers"),
        where("buyerId", "==", uid),
        where("status", "==", "pending")
      )
    );
    offersByUid.forEach((doc) => {
      const d: any = doc.data() || {};
      offers.push({
        id: doc.id,
        title: d.listingTitle || "Offer",
        brand: d.listingBrand || "",
        price: Number(d.offerAmount || d.offerPrice || 0),
        currency: String(d.currency || "USD"),
        status: d.status || "pending",
      });
    });

    setActiveOffers(offers);

    const orders: ItemRow[] = [];
    const ordersByUid = await getDocs(
      query(collection(db, "orders"), where("buyerUid", "==", uid))
    );
    ordersByUid.forEach((doc) => {
      const d: any = doc.data() || {};
      orders.push({
        id: doc.id,
        title: d.listingTitle || d.title || "Purchased item",
        brand: d.listingBrand || d.brand || "",
        price: Number(d.total || d.price || 0),
        currency: String(d.currency || "USD"),
        status: d.status || "Paid",
        createdAt: d.createdAt?.toDate?.().toLocaleDateString?.("en-US") || "",
        imageUrl: d.listingImage || d.imageUrl || "",
        sellerName: d.sellerName || "",
        sellerId: d.sellerId || "",
        referenceId: d.stripePaymentIntentId || d.stripePaymentIntent || "",
      });
    });

    setPurchasedItems(orders);

    if (saved.length) {
      const updatedSaved = await Promise.all(
        saved.map(async (item) => {
          if (!item.listingId) return item;
          try {
            const listingRef = doc(db, "listings", String(item.listingId));
            const listingSnap = await getDoc(listingRef);
            if (!listingSnap.exists()) return item;
            const listingData: any = listingSnap.data() || {};
            const listingStatus = String(listingData.status || "").toLowerCase();
            const isSold =
              listingStatus === "sold" ||
              listingStatus === "inactive_sold" ||
              listingData.isSold === true;
            return {
              ...item,
              status: isSold ? "Sold" : item.status || "Live",
            };
          } catch (err) {
            console.error("saved_item_status_error", err);
            return item;
          }
        })
      );
      setSavedItems(updatedSaved);
    }
  };

  const handleSignOut = async () => {
    if (auth) await signOut(auth);
    router.push("/");
  };

  // ✅ If Firebase isn’t configured, don’t crash — show a clear message
  if (!firebaseClientReady) {
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
              {user && <p className="buyer-dashboard-meta">Signed in as {user.email}</p>}
            </div>

            <button type="button" onClick={handleSignOut} className="buyer-dashboard-signout">
              Sign out
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
                <div className="buyer-dashboard-list">
                  <h2 className="buyer-dashboard-list-title">Saved Items</h2>
                  <p className="buyer-dashboard-note">
                    Saved until another guest purchases it. Saving does not reserve the item.
                  </p>
                  {savedItems.length ? (
                    <ul className="buyer-dashboard-list-items">
                      {savedItems.map((item) => (
                        <li key={item.id} className="buyer-dashboard-list-row">
                          <span>{item.title}</span>
                          <span className="buyer-dashboard-meta-line">
                            {item.brand ? `${item.brand} • ` : ""}
                            {item.status === "Sold"
                              ? "Status: SOLD / No longer available"
                              : item.status
                              ? `Status: ${item.status}`
                              : ""}
                          </span>
                        </li>
                      ))}
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
                          <div className="buyer-dashboard-row">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="buyer-dashboard-thumb" />
                            ) : null}
                            <div className="buyer-dashboard-row-content">
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
                                {item.createdAt ? ` • ${item.createdAt}` : ""}
                                {item.referenceId ? ` • Ref: ${item.referenceId}` : ""}
                                {item.sellerName
                                  ? ` • Seller: ${item.sellerName}`
                                  : item.sellerId
                                  ? ` • Seller ID: ${item.sellerId}`
                                  : ""}
                              </span>
                            </div>
                          </div>
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
      `}</style>
    </>
  );
}
