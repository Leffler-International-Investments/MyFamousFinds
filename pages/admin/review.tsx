// FILE: /pages/admin/review.tsx

import Layout from "../../components/Layout";

export default function AdminReviewPage() {
  return (
    <Layout title="Admin Review">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Review &amp; vetting
        </h1>
        <p className="text-sm text-gray-700 mb-4">
          The dedicated vetting workflow now lives in the management area.
          Use the vetting queue to review new sellers and listings before they
          are published to the marketplace.
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-medium text-gray-900 mb-2">
            Go to vetting queue
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            From there you can approve, decline or request more information on
            submissions.
          </p>
          <a
            href="/management/vetting-queue"
            className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Open vetting queue
          </a>
        </div>
      </div>
    </Layout>
  );
}
