// FILE: /pages/management/support-tickets.tsx
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

type Ticket = {
  id: string;
  subject: string;
  fromEmail: string;
  status: string;
  createdAt: string;
};

type Props = {
  tickets: Ticket[];
};

export default function ManagementSupportTickets({ tickets }: Props) {
  const { loading } = useRequireAdmin();
  if (loading) return null;

  return (
    <>
      <Head>
        <title>Support Tickets — Admin</title>
      </Head>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Support Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and respond to customer support requests submitted to
                Famous-Finds.
              </p>
            </div>
            <Link
              href="/management/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Management Dashboard
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Ticket ID
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Subject
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    From
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-gray-900">{t.id}</td>
                    <td className="px-4 py-2 text-gray-700">{t.subject}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {t.fromEmail}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{t.status}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {t.createdAt}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      No support tickets yet.
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
      .collection("supportTickets")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const tickets: Ticket[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        subject: d.subject || "",
        fromEmail: d.fromEmail || d.email || "",
        status: d.status || "Open",
        createdAt:
          d.createdAt?.toDate?.().toLocaleString("en-US") || "",
      };
    });

    return { props: { tickets } };
  } catch (err) {
    console.error("Error loading support tickets", err);
    return { props: { tickets: [] } };
  }
};
