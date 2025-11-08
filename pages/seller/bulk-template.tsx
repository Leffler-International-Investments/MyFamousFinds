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
              Bulk Upload Instructions
            </h1>

            <p className="mb-3 text-sm text-gray-700">
              Use our CSV template to upload many listings at once. Every row
              you upload becomes a <strong>pending listing</strong> in our
              review queue. Our admin team will review each item for authenticity
              before it can go live.
            </p>

            <p className="mb-4 text-sm text-gray-700">
              If you only have one item, the{" "}
              <strong>&ldquo;Add a single listing&rdquo;</strong> form
              on the upload page is the faster option.
            </p>

            <div className="mb-6 flex flex-wrap gap-3">
              <Link
                href="/seller/bulk-upload"
                className="inline-flex items-center rounded-md border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Go to Upload Page
              </Link>
              <a
                href="/api/seller/bulk-template"
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-400"
              >
                Download CSV Template
              </a>
            </div>

            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              CSV Template Columns Explained
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
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
                number. You must enter the code or "N/A" if one does not exist.
              </li>
              <li className="font-medium text-black">
                <strong>auth_photos:</strong> One or more URLs to photos of your
                proof (e.g., a photo of the receipt or serial number).
              </li>
              <li className="font-medium text-black">
                <strong>authenticity_confirmed (required):</strong> Must be <code>YES</code>.
                By entering <code>YES</code>, you confirm the item is authentic
                and accept full legal responsibility.
              </li>
            </ul>

            <h2 className="mb-1 mt-6 text-sm font-semibold text-gray-900">
              Why we require this
            </h2>
            <p className="mb-2 text-sm text-gray-700">
              Famous-Finds operates as a peer-to-peer marketplace in the United
              States. U.S. trademark laws hold sellers liable for counterfeit goods.
              Collecting authenticity proof is a required step to protect you,
              the buyers, and the platform.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
