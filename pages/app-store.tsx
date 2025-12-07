// FILE: /pages/app-store.tsx

import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://myfamousfinds.com";

// TODO: if you later ship native apps, replace with real URLs
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.myfamousfinds";
const APP_STORE_URL =
  "https://apps.apple.com/app/myfamousfinds/id1234567890";

export default function MyFamousFindsAppPage() {
  const title = "MyFamousFinds – Access the Marketplace on Web and Mobile";
  const description =
    "Open MyFamousFinds on web or mobile to browse curated designer fashion, bags, and watches, and manage your selling activity.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MyFamousFinds",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web, Android, iOS",
    url: `${SITE_URL}/app-store`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    potentialAction: {
      "@type": "UseAction",
      target: `${SITE_URL}/`,
    },
    publisher: {
      "@type": "Organization",
      name: "MyFamousFinds",
      url: SITE_URL,
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_URL}/app-store`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/app-store`} />
        <meta
          property="og:image"
          content={`${SITE_URL}/myfamousfinds_logo.png`}
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta
          name="twitter:image"
          content={`${SITE_URL}/myfamousfinds_logo.png`}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 text-center">
        <h1 className="mb-4 text-3xl font-semibold">Access MyFamousFinds</h1>
        <p className="mb-8 text-slate-700">
          Browse designer finds, manage your listings, and stay close to your
          favourite pieces from any device.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href={PLAY_STORE_URL}
            className="rounded-md border px-6 py-3 text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Android app
          </a>
          <a
            href={APP_STORE_URL}
            className="rounded-md border px-6 py-3 text-sm font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get iOS app
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Or use the web experience:{" "}
          <Link href="/">
            <a>open MyFamousFinds in your browser</a>
          </Link>
          .
        </p>
      </main>
    </>
  );
}
