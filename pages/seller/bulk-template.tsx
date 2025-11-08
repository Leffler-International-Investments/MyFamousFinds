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

            {/* --- UPDATED: Instructions for new fields --- */}
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Template columns explained
            </h2>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>
                <strong>title (required):</strong> The product title (e.g.,
                "Prada Galleria Saffiano Bag").
              </li>
              <li>
                <strong>brand (required):</strong> Brand name (e.g., "Prada").
              </li>
              <li>
                <strong>category (required):</strong> Category (e.g., "Bags").
              </li>
              <li>
                <strong>price (required):</strong> Price in **USD** (e.g., 1500). Do
                not include "$" or "USD".
              </li>
              <li>
                <strong>imageUrls:</strong> One or more public URLs for your product
                images. Separate multiple URLs with a comma.
              </li>
              <li className="font-medium text-black">
                <strong>purchase_source (required):</strong> Where you got the
                item (e.g., "Prada Store, NYC", "Vintage Dealer").
              </li>
              <li className="font-medium text-black">
                <strong>purchase_proof (required):</strong> The type of proof
                you have (e.g., "Original Receipt", "Certificate of Authenticity").
              </li>
              <li className="font-medium text-black">
                <strong>serial_number (required):</strong> The item's serial
                number. Enter "N/A" if the item does not have one.
              </li>
              <li className="font-medium text-black">
                <strong>auth_photos:</strong> One or more URLs to photos of your
                proof (e.g., a photo of the receipt or serial number).
              </li>
              <li className="font-medium text-black">
                <strong>authenticity_confirmed (required):</strong> Must be <code>YES</code>.
                By entering <code>YES</code>, the seller confirms the item is authentic
                and accepts legal responsibility for counterfeits.
              </li>
            </ul>
            {/* ------------------------------------------- */}

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
