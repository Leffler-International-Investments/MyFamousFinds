// FILE: /pages/management/vetting-queue.tsx
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { adminDb } from "../../utils/firebaseAdmin";

type SellerApplication = {
  id: string;
  businessName: string;
  contactEmail: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
};

type Props = { items: SellerApplication[] };

export default function ManagementVettingQueue({ items }: Props) {
  const { loading } = useRequireAdmin();
  const [query, setQuery] = useState("");
  const [localItems, setLocalItems] = useState(items);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localItems;
    return localItems.filter((s) => {
      return (
        s.businessName.toLowerCase().includes(q) ||
        s.contactEmail.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [localItems, query]);

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/${action}-seller/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to update seller");
      }
      setLocalItems((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: action === "approve" ? "Approved" : "Rejected",
              }
            : s
        )
      );
    } catch (err: any) {
      alert(err?.message || "Error updating seller status.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Seller Vetting Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Seller Vetting Queue
              </h1>
              <p className="text-sm text-gray-600">
                One row per seller application. Once a seller is approved,
                new products go to{" "}
                <strong>Listing Review Queue</strong>, not this page.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white"
            >
              ← Back to admin home
            </Link>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by business, email, or ID…"
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Business
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Contact email
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 text-gray-900">
                      {s.businessName || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {s.contactEmail || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {s.submittedAt || "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {s.status}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAction(s.id, "approve")}
                          disabled={
                            actionLoading === s.id || s.status === "Approved"
                          }
                          className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(s.id, "reject")}
                          disabled={
                            actionLoading === s.id || s.status === "Rejected"
                          }
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No seller applications pending review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const snap = await adminDb
      .collection("sellers")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const items: SellerApplication[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = String(d.status || "Pending");
      let status: SellerApplication["status"] = "Pending";
      if (/approve/i.test(rawStatus)) status = "Approved";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        businessName: d.businessName || d.name || "Seller",
        contactEmail: d.email || d.contactEmail || "",
        submittedAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        status,
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading vetting queue", err);
    return { props: { items: [] } };
  }
};
