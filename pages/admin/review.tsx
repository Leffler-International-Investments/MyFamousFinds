// FILE: /pages/admin/review.tsx
// Admin "vetting" panel (legacy) with Request Proof support

import { useState, useEffect } from "react";
import { db } from "../../utils/firebaseClient";
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
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
    const fetchPendingListings = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "listings"),
          // ✅ support both old and new status
          where("status", "in", ["Pending", "PendingReview"])
        );
        const querySnapshot = await getDocs(q);
        const pendingListings: Listing[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            proofRequested: !!data.proofRequested,
            ...data,
          };
        });
        setListings(pendingListings);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch listings.");
      }
      setLoading(false);
    };
    fetchPendingListings();
  }, []);

  const handleDecision = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Unknown error");
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
        const { error } = await res.json();
        throw new Error(error || "Unknown error");
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
    return <p className="p-4 text-sm text-gray-600">Loading…</p>;
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900">
      <h1 className="mb-4 text-xl font-semibold">
        Legacy Listing Vetting Panel
      </h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Listing
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Seller
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Price
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Photos
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Status
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((l) => (
              <tr key={l.id}>
                <td className="px-3 py-2 text-gray-900">
                  <div className="flex items-center gap-2">
                    {l.imageUrl && (
                      <div className="relative h-10 w-10 overflow-hidden rounded">
                        <Image
                          src={l.imageUrl}
                          alt={l.title || "listing"}
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
                <td className="px-3 py-2 text-gray-700">
                  {l.sellerName || l.sellerId || "—"}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {l.price
                    ? `US$${Number(l.price).toLocaleString("en-US")}`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {Array.isArray(l.auth_photos) && l.auth_photos.length > 0
                    ? `${l.auth_photos.length} authenticity photo(s)`
                    : "—"}
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {l.status || "Pending"}
                  {l.proofRequested && (
                    <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                      Proof requested
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white"
                      onClick={() => handleDecision(l.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                      onClick={() => handleDecision(l.id, "reject")}
                    >
                      Reject
                    </button>
                    <button
                      className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-medium text-black"
                      onClick={() => handleRequestProof(l.id)}
                      disabled={!!l.proofRequested}
                    >
                      {l.proofRequested ? "Proof requested" : "Request proof"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-sm text-gray-500"
                >
                  No listings pending review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
