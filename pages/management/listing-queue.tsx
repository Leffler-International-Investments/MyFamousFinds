// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Listing = {
  id: string;
  title: string;
  seller: string;
  category: string;
  purchase_source?: string;
  purchase_proof?: string;
  serial_number?: string;
  auth_photos?: string;
  submittedAt: string;
  status: string;
};

type Props = {
  items: Listing[];
};

export default function ManagementListingQueue({ items }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  const hasAny = items.length > 0;

  return (
    <>
      <Head>
        <title>Listing Review Queue — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Listing review queue
              </h1>
              <p className="text-sm text-gray-600">
                Pending submissions from open-market / casual sellers. Check
                authenticity notes before approval.
              </p>
            </div>
            <Link
              href="/management"
              className="rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white"
            >
              ← Back to admin home
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Listing
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Seller
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Purchased From
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Proof
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Serial
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Proof Docs
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Submitted
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hasAny ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.title}</td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.seller}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.category || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.purchase_source || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.purchase_proof || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.serial_number || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.auth_photos ? (
                          <a
                            href={item.auth_photos}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {item.submittedAt || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            "rounded-full px-3 py-1 text-xs font-medium " +
                            (item.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : item.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800")
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No listings awaiting review.
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

function formatDate(ts: any): string {
  try {
    if (!ts) return "";
    const d =
      typeof ts.toDate === "function"
        ? ts.toDate()
        : ts instanceof Date
        ? ts
        : null;
    if (!d) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}`;
  } catch {
    return "";
  }
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    // Reuse the listings collection and filter to "pending" in JS
    const snap = await adminDb
      .collection("listings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const all: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: string = "Live";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";

      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        category: d.categoryName || d.category || "",
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        serial_number: d.serial_number || "",
        auth_photos: d.auth_photos || "",
        submittedAt: formatDate(d.createdAt),
        status,
      };
    });

    const items = all.filter((i) => i.status === "Pending");

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [] } };
  }
};
