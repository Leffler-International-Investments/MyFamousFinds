// FILE: /pages/seller/orders.tsx

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";

type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

type OrderItem = {
  listingId: string;
  title: string;
  image?: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: number;
  status: "paid" | "shipped" | "delivered" | "cancelled";
  buyerEmail?: string;
  shipping?: ShippingAddress;
  items: OrderItem[];
  total: number;
  payoutStatus?: "pending" | "paid" | "failed";
  tracking?: { carrier?: string; trackingNumber?: string };
};

type OrdersOk = { ok: true; orders: Order[] };

export default function SellerOrdersPage() {
  const { ok: authed, authLoading } = useRequireSeller();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [shipModal, setShipModal] = useState<{
    open: boolean;
    orderId?: string;
    carrier?: string;
    trackingNumber?: string;
  }>({ open: false });

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === "paid" || o.status === "shipped"),
    [orders]
  );

  useEffect(() => {
    if (!authLoading && authed) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authed]);

  function getSellerIdHeader(): string {
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("ff-seller-id") || "").trim();
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const sellerId = getSellerIdHeader();
      const res = await fetch("/api/seller/orders", {
        headers: sellerId ? { "x-seller-id": sellerId } : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load orders");
      setOrders((json as OrdersOk).orders || []);
    } catch (e: any) {
      setError(String(e?.message || "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }

  async function onMarkShipped(orderId: string, carrier: string, trackingNumber: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller/mark-shipped", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getSellerIdHeader() ? { "x-seller-id": getSellerIdHeader() } : {}),
        },
        body: JSON.stringify({
          orderId,
          carrier: carrier.trim(),
          trackingNumber: trackingNumber.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to mark shipped");
      }

      setShipModal({ open: false });
      await refresh();
    } catch (e: any) {
      setError(String(e?.message || "Failed to mark shipped"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Seller Orders | My Famous Finds</title>
      </Head>

      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <main className="flex-1 w-full">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-gray-600">
                  View and manage your sold items. Ship promptly using signature required.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/seller/dashboard"
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back to dashboard
                </Link>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4 text-sm text-gray-700">
                Showing <b>{paidOrders.length}</b> active orders
              </div>

              <div className="divide-y divide-gray-100">
                {paidOrders.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-600">
                    No paid orders yet.
                  </div>
                ) : (
                  paidOrders.map((o) => (
                    <div key={o.id} className="px-6 py-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-500">
                            Order #{o.id.slice(0, 8)} •{" "}
                            {new Date(o.createdAt).toLocaleString()}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {o.items.length} item{o.items.length !== 1 ? "s" : ""} • $
                            {Number(o.total).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            {o.status.toUpperCase()}
                          </span>

                          <button
                            onClick={() =>
                              setExpanded((p) => ({ ...p, [o.id]: !p[o.id] }))
                            }
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            {expanded[o.id] ? "Hide" : "Details"}
                          </button>

                          <button
                            onClick={() =>
                              setShipModal({
                                open: true,
                                orderId: o.id,
                                carrier: o.tracking?.carrier || "",
                                trackingNumber: o.tracking?.trackingNumber || "",
                              })
                            }
                            className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
                          >
                            Mark shipped
                          </button>
                        </div>
                      </div>

                      {expanded[o.id] && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="font-semibold mb-2">Items</div>
                            {o.items.map((it, i) => (
                              <div key={i} className="flex gap-3 mb-3">
                                <div className="h-14 w-14 bg-gray-100 rounded-lg overflow-hidden">
                                  {it.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={it.image}
                                      alt={it.title}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold">{it.title}</div>
                                  <div className="text-sm text-gray-600">
                                    Qty {it.quantity} • ${it.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div>
                            <div className="font-semibold mb-2">Shipping</div>
                            <div className="border rounded-lg p-4 text-sm">
                              <div className="font-semibold">{o.shipping?.name}</div>
                              <div>{o.shipping?.line1}</div>
                              {o.shipping?.line2 && <div>{o.shipping.line2}</div>}
                              <div>
                                {[o.shipping?.city, o.shipping?.state, o.shipping?.postal_code]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                              <div>{o.shipping?.country}</div>
                              {o.buyerEmail && <div>Buyer: {o.buyerEmail}</div>}
                            </div>

                            <div className="mt-3 text-sm text-gray-600">
                              Tracking:{" "}
                              {o.tracking?.trackingNumber ? (
                                <b>
                                  {o.tracking.carrier} • {o.tracking.trackingNumber}
                                </b>
                              ) : (
                                "Not provided"
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
