// FILE: /pages/admin/review.tsx
// (Admin "vetting" panel with Request Proof support)

import { useState, useEffect } from "react";
import { db } from "../../utils/firebaseClient"; // Client-side db
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
          where("status", "==", "PendingReview")
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
        throw new Error(error || "Failed to update listing");
      }
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRequestProof = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/request-proof/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to request proof");
      }
      // Mark this listing as proof requested in local state
      setListings((prev) =>
        prev.map((listing) =>
          listing.id === id
            ? { ...listing, proofRequested: true }
            : listing
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to request proof");
    }
  };

  if (loading)
    return <div style={{ padding: "20px" }}>Loading pending items...</div>;
  if (error)
    return (
      <div style={{ color: "red", padding: "20px" }}>Error: {error}</div>
    );

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "20px auto",
        padding: "20px",
        color: "#f9fafb",
      }}
    >
      <h1>Admin Review Panel</h1>
      <p>Found {listings.length} item(s) pending review.</p>
      <hr style={{ margin: "20px 0" }} />
      {listings.length === 0 && <p>No items to review.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {listings.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              gap: "20px",
              padding: "15px",
              background: "#1a1a1a",
              borderRadius: "8px",
              border: "1px solid #374151",
            }}
          >
            {/* Image */}
            <div style={{ flexShrink: 0 }}>
              <Image
                src={
                  item.imageUrl ||
                  "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80"
                }
                alt={item.title || "Listing image"}
                width={150}
                height={150}
                style={{ objectFit: "cover", borderRadius: "4px" }}
              />
            </div>

            {/* Main info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{item.title}</h3>
              <p style={{ margin: "4px 0" }}>
                <strong>Brand:</strong> {item.brand || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Price:</strong> ${item.price} {item.currency || "AUD"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Seller Type:</strong> {item.sellerType || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Seller ID:</strong> {item.sellerId || "—"}
              </p>

              {/* Authenticity fields, if present */}
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "10px",
                  borderTop: "1px dashed #4b5563",
                  fontSize: "13px",
                }}
              >
                <p style={{ margin: "2px 0" }}>
                  <strong>Purchased From:</strong>{" "}
                  {item.purchase_source || "—"}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Proof of Authenticity:</strong>{" "}
                  {item.purchase_proof || "—"}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Serial / Code:</strong>{" "}
                  {item.serial_number || "—"}
                </p>
                <p style={{ margin: "2px 0" }}>
                  <strong>Auth Photos:</strong>{" "}
                  {item.auth_photos ? (
                    <a
                      href={item.auth_photos}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#60a5fa" }}
                    >
                      View proof
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
                {item.proofRequested && (
                  <p
                    style={{
                      marginTop: "4px",
                      color: "#facc15",
                      fontStyle: "italic",
                    }}
                  >
                    Proof requested from seller.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                justifyContent: "center",
                minWidth: "140px",
              }}
            >
              <button
                onClick={() => handleDecision(item.id, "approve")}
                style={{
                  padding: "10px",
                  background: "green",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision(item.id, "reject")}
                style={{
                  padding: "10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Reject
              </button>
              <button
                onClick={() => handleRequestProof(item.id)}
                disabled={item.proofRequested}
                style={{
                  padding: "10px",
                  background: item.proofRequested ? "#4b5563" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: item.proofRequested ? "default" : "pointer",
                  fontSize: "13px",
                }}
              >
                {item.proofRequested ? "Proof Requested" : "Request Proof"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
