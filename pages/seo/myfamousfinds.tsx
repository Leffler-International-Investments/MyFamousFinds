// FILE: /pages/seo/myfamousfinds.tsx

import Head from "next/head";
import Link from "next/link";
import config from "../../config/myfamousfinds.json";

export default function MyFamousFindsSeoPage() {
  const title = `${config.name} – Curated Marketplace for Designer Fashion, Bags & Watches`;
  const description = `${config.name} is a curated resale marketplace for authenticated designer fashion, handbags, watches, and accessories, with tools for serious sellers.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: config.name,
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web",
    url: config.domain,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Curated categories for designers, bags, watches and more",
      "Seller dashboards and bulk upload tools",
      "Management-level review and approval flow",
      "High-quality photography and listing standards",
      "Buyer wishlists and saved searches"
    ],
    creator: {
      "@type": "Organization",
      name: config.name,
      url: config.domain
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content="MyFamousFinds, luxury resale, designer bags marketplace, watches marketplace, authenticated fashion"
        />
        <link rel="canonical" href={`${config.domain}${config.seoPath}`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${config.domain}${config.seoPath}`} />
        <meta property="og:site_name" content={config.name} />
        <meta property="og:image" content={`${config.domain}${config.logo}`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${config.domain}${config.logo}`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10 prose prose-slate">
        <h1>{config.name} – Curated Designer Resale Marketplace</h1>

        <p>
          <strong>{config.name}</strong> connects buyers with authenticated
          designer fashion, handbags, watches, and accessories, and gives
          professional sellers powerful tools to manage their stock.
        </p>

        <h2>For buyers</h2>
        <ul>
          <li>Browse curated categories by designer and product type.</li>
          <li>View detailed descriptions and photography.</li>
          <li>Save favourites and follow your preferred sellers.</li>
        </ul>

        <h2>For sellers</h2>
        <ul>
          <li>Upload items individually or in bulk.</li>
          <li>Use management dashboards to organise your listings.</li>
          <li>Benefit from marketplace standards and trust.</li>
        </ul>

        <p>
          Start exploring:{" "}
          <Link href="/">
            <a>visit the {config.name} homepage</a>
          </Link>
        </p>
      </main>
    </>
  );
}
