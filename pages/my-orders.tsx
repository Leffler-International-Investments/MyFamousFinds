// FILE: /pages/my-orders.tsx

import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { auth, db } from "../utils/firebaseClient";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

type ShippingInfo = {
  status?: string;
  trackingUrl?: string;
  carrier?: string;
  trackingNumber?: string;
};

type Order = {
  id: string;
  title: string;
  priceLabel: string;
  createdAt?: any;
  shipping?: ShippingInfo;
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Orders store buyerEmail and buyerId — query both to cover all cases
      const seen = new Set<string>();
      const list: Order[] = [];

      const pushOrder = (doc: any) => {
        if (seen.has(doc.id)) return;
        seen.add(doc.id);
        const d: any = doc.data() || {};
        const amt = typeof d.amountTotal === "number" ? d.amountTotal / 100 : 0;
        const cur = d.currency || "USD";
        const priceLabel =
          d.priceLabel ||
          (amt ? new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(amt) : "");
        list.push({
          id: doc.id,
          title: d.title || d.listingTitle || "Order",
          priceLabel,
          createdAt: d.createdAt,
          shipping: d.shipping || {},
        });
      };

      try {
        // Query by buyerId (Firebase UID)
        const byUid = await getDocs(
          query(collection(db, "orders"), where("buyerId", "==", user.uid))
        );
        byUid.forEach(pushOrder);

        // Query by buyerEmail (buyer's email)
        if (user.email) {
          const byEmail = await getDocs(
            query(collection(db, "orders"), where("buyerEmail", "==", user.email))
          );
          byEmail.forEach(pushOrder);
        }

        // Sort by createdAt descending
        list.sort((a, b) => {
          const ta = typeof a.createdAt === "number" ? a.createdAt : 0;
          const tb = typeof b.createdAt === "number" ? b.createdAt : 0;
          return tb - ta;
        });
      } catch (err) {
        console.error("Error loading orders:", err);
      }

      setOrders(list);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  return (
    <div>
      <Head>
        <title>My Orders - Famous Finds</title>
      </Head>

      <Header />

      <main className="section">
        <div className="section-header">
          <div>
            <h1>My orders</h1>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Track every purchase from payment to delivery.
            </p>
          </div>
        </div>

        <section className="sell-card">
          <div className="table-overflow-wrapper">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Tracking</th>
                </tr>
              </thead>
              <tbody>
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-message">
                      No orders recorded as yet.
                    </td>
                  </tr>
                )}

                {!loading &&
                  orders.map((o) => {
                    const shipping = o.shipping || {};
                    const status = shipping.status || "Pending";
                    const trackingUrl = shipping.trackingUrl || "";
                    const carrier = shipping.carrier || "";
                    const trackingNumber = shipping.trackingNumber || "";

                    return (
                      <tr key={o.id}>
                        <td>#{o.id.slice(-6).toUpperCase()}</td>
                        <td>{o.title}</td>
                        <td>{o.priceLabel}</td>
                        <td>{status}</td>
                        <td>
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-table-view"
                            >
                              Track package
                            </a>
                          ) : carrier && trackingNumber ? (
                            <span className="table-message-small">
                              {carrier} • {trackingNumber}
                            </span>
                          ) : (
                            <span className="table-message-small">
                              Awaiting shipment
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .sell-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 22px 22px 24px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
        }
        .table-overflow-wrapper {
          overflow-x: auto;
        }
        .catalogue-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: #111827;
        }
        .catalogue-table th,
        .catalogue-table td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .catalogue-table th {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
        }
        .catalogue-table tr:last-child td {
          border-bottom: none;
        }
        .table-message {
          text-align: center;
          color: #6b7280;
          padding: 28px;
        }
        .table-message-small {
          font-size: 11px;
          color: #6b7280;
        }
        .btn-table-view {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          color: #111827;
          background: #f9fafb;
        }
        .btn-table-view:hover {
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
