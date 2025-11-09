// FILE: /pages/admin/review.tsx
// Admin vetting panel with Request Proof support (browser-only Firestore)

import { useState, useEffect } from "react";
import type { DocumentData } from "firebase/firestore";
import Image from "next/image";

type Listing = DocumentData & {
  id: string;
  proofRequested?: boolean;
};

export default function AdminReviewPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPendingListings() {
      try {
        setLoading(true);

        const { db } = await import("../../utils/firebaseClient");
        const {
          collection,
          getDocs,
          query,
          where,
        } = await import("firebase/firestore");

        const q = query(
          collection(db, "listings"),
          // support both old and new status values
          where("status", "in", ["Pending", "PendingReview"])
        );

        const snapshot = await getDocs(q);
        if (cancelled) return;

        const pending: Listing[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            proofRequested: !!data.proofRequested,
            ...data,
          };
        });

        setListings(pending);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to fetch listings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (typeof window !== "undefined") {
      fetchPendingListings();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDecision = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unknown error");
      }
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err?.message || "Failed to update listing.");
    }
  };

  const handleRequestProof = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/request-proof/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unknown error");
      }
      setListings((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, proofRequested: true } : l
        )
      );
    } catch (err: any) {
      alert(err?.message || "Failed to request proof.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 text-sm text-gray-700">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 text-sm text-red-600">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Listing Review Queue</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review pending listings, request authenticity proof, and approve
              or reject items before they go live.
            </p>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-left">Seller</th>
                <th className="px-3 py-2 text-left">Price (USD)</th>
                <th className="px-3 py-2 text-left">Authenticity</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((l) => {
                const thumb =
                  (Array.isArray(l.imageUrls) && l.imageUrls[0]) ||
                  l.imageUrl ||
                  null;

                const authCount = Array.isArray(l.auth_photos)
                  ? l.auth_photos.length
                  : 0;

                return (
                  <tr key={l.id} className="align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {thumb && (
                          <div className="relative h-14 w-14 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            <Image
                              src={thumb}
                              alt={l.title || "Listing image"}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {l.title || "Untitled"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {l.brand || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {l.sellerName || l.sellerId || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {l.price
                        ? `US$${Number(l.price).toLocaleString("en-US")}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {authCount > 0
                        ? `${authCount} authenticity photo(s)`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {l.status || "Pending"}
                      {l.proofRequested && (
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-amber-600">
                          Proof requested
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-col items-end gap-1 text-xs sm:flex-row sm:justify-end">
                        <button
                          className="rounded-full border border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleRequestProof(l.id)}
                          disabled={l.proofRequested}
                        >
                          {l.proofRequested ? "Proof requested" : "Request proof"}
                        </button>
                        <button
                          className="rounded-full border border-green-500 bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                          onClick={() => handleDecision(l.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-full border border-red-500 bg-white px-3 py-1 text-red-600 hover:bg-red-50"
                          onClick={() => handleDecision(l.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {listings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    No listings pending review.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
