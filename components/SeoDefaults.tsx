// FILE: /components/SeoDefaults.tsx
// Global SEO defaults: Organization + WebSite structured data,
// fallback OG/Twitter tags for pages that don't set their own.

import Head from "next/head";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
const SITE_NAME = "Famous Finds";
const DEFAULT_DESCRIPTION =
  "Discover curated, authenticated pre-loved designer bags, jewelry, watches and ready-to-wear from trusted sellers.";
const LOGO_URL = `${SITE_URL}/Famous-Finds-Logo.png`;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description: DEFAULT_DESCRIPTION,
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@myfamousfinds.com",
    contactType: "customer service",
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/catalogue?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function SeoDefaults() {
  return (
    <Head>
      {/* Fallback OG tags — page-level Head tags override these */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={LOGO_URL} />
      <meta property="og:description" content={DEFAULT_DESCRIPTION} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={LOGO_URL} />
      <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />

      {/* Organization + WebSite structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSiteSchema),
        }}
      />
    </Head>
  );
}
