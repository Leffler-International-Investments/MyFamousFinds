// FILE: /pages/seller/bulk-template.tsx

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function SellerBulkTemplatePage() {
  return (
    <>
      <Head>
        <title>Seller Bulk Template — Famous Finds</title>
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Header />

        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-xl font-semibold">
              Bulk upload listings
            </h1>

            {/* High-level explanation */}
            <p className="mb-3 text-sm text-gray-700">
              Use this CSV template to upload many listings at once. Every row
              you upload becomes a <strong>pending listing</strong> in our
              review queue. Only items that pass authenticity checks will be
              approved and pushed to the Famous-Finds main catalogue.
            </p>

            <p className="mb-4 text-sm text-gray-700">
              If you only have one item, you can also use the{" "}
              <strong>&ldquo;Add a single listing (no CSV)&rdquo;</strong> form
              on the bulk upload page – it collects the same authenticity
              details as this template.
            </p>

            <div className="mb-6 flex flex-wrap gap-3">
              <Link
                href="/seller/bulk-upload"
                className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Go to bulk upload
              </Link>

              <a
                href="/api/seller/bulk-template"
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-400"
              >
                Download CSV template
              </a>
            </div>

            {/* Step-by-step help */}
            <h2 className="mb-1 text-sm font-semibold text-gray-900">
              How the bulk upload works
            </h2>
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-gray-700">
              <li>
                <strong>Step 1 – CSV structure:</strong> Download the template
                and fill in one row per item, including{" "}
                <span className="font-semibold">
                  brand, title, category, price (USD), and authenticity fields
                </span>{" "}
                listed below.
              </li>
              <li>
                <strong>Step 2 – Upload file:</strong> On the Bulk Upload page,
                go to Step&nbsp;2 and upload the completed CSV. We&apos;ll
                parse it and show any rows that need fixes.
              </li>
              <li>
                <strong>Step 3 – Review &amp; approval:</strong> Submitting the
                file sends all valid rows into the{" "}
                <strong>Listing Review Queue</strong>. Our team can approve or
                reject each item individually. Only approved items become
                visible on the main Famous-Finds storefront.
              </li>
            </ol>

            {/* Column overview */}
            <h2 className="mb-1 text-sm font-semibold text-gray-900">
              Required listing columns (core details)
            </h2>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  title
                </code>{" "}
                – item name (e.g. “Prada Galleria Saffiano Tote”)
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  brand
                </code>{" "}
                – designer or brand (e.g. “Prada”)
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  category
                </code>{" "}
                – bag, watch, shoes, etc.
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  price_usd
                </code>{" "}
                – numeric price in US dollars (no $ sign).
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  condition
                </code>{" "}
                – e.g. “New with tags”, “Excellent”, “Good”.
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  main_image_url
                </code>{" "}
                – public URL for the main product photo.
              </li>
            </ul>

            {/* Authenticity section */}
            <h2 className="mb-1 text-sm font-semibold text-gray-900">
              Authenticity &amp; anti-counterfeit fields (required for luxury)
            </h2>
            <p className="mb-2 text-xs text-gray-600">
              These fields protect you and Famous-Finds in the U.S. market.
              Rows that are missing authenticity information will <em>not</em>{" "}
              be approved.
            </p>

            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  serial_number
                </code>{" "}
                – the brand&apos;s serial, reference or model number printed on
                the item or card. If the item has no serial, enter{" "}
                <code>N/A</code> and explain in{" "}
                <code>auth_proof_details</code>.
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  auth_proof_type
                </code>{" "}
                – one of: “original_receipt”, “certificate_of_authenticity”,
                “brand_service_record”, “third_party_authenticator”, “other”.
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  auth_proof_details
                </code>{" "}
                – short description of the proof (store name, purchase date,
                authenticator, etc.).
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  auth_image_url
                </code>{" "}
                – URL for a clear photo of the proof (e.g. receipt, card,
                certificate, or serial stamp close-up).
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  auth_doc_url
                </code>{" "}
                – optional link to a PDF or external authenticity report (if
                you use a third-party authenticator).
              </li>
              <li>
                <code className="rounded bg-gray-100 px-1 py-0.5">
                  authenticity_confirmed
                </code>{" "}
                – must be <code>YES</code> to submit. By entering{" "}
                <code>YES</code> the seller confirms the item is authentic and
                accepts legal responsibility for counterfeits.
              </li>
            </ul>

            {/* Legal + reassurance */}
            <h2 className="mb-1 text-sm font-semibold text-gray-900">
              Why we ask for this
            </h2>
            <p className="mb-2 text-sm text-gray-700">
              Famous-Finds operates as a peer-to-peer marketplace in the United
              States. U.S. trademark and consumer laws hold sellers, and in some
              cases platforms, responsible for counterfeit goods. Collecting
              serial numbers, proof of authenticity and clear photos helps:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Protect you as a genuine seller.</li>
              <li>Show regulators and brands that we vet high-risk listings.</li>
              <li>
                Keep the Famous-Finds™ brand trusted for buyers and partners.
              </li>
            </ul>

            <p className="text-xs text-gray-500">
              Tip: keep your original receipts, certificates and serial photos.
              If a brand or buyer raises a concern, our team may request these
              documents again before releasing funds.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
