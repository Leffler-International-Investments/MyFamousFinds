// FILE: /pages/api/ai-profile.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: "MyFamousFinds",
    alternateName: "My Famous Finds",
    applicationCategory: "ShoppingApplication",
    operatingSystem: "Web",
    url: `${SITE_URL}/`,
    description:
      "MyFamousFinds is a curated marketplace for authenticated designer fashion, bags, watches, and accessories, with seller and management dashboards.",
    downloadUrl: `${SITE_URL}/app-store`,
    installUrl: `${SITE_URL}/app-store`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free access for buyers. Seller plans available.",
    },
    featureList: [
      "Curated listings of designer items",
      "Seller dashboard for uploading and managing stock",
      "Management review and authentication workflow",
      "Buyer messaging and wishlist features",
      "Search by brand, category, and condition",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "64",
    },
    creator: {
      "@type": "Organization",
      name: "MyFamousFinds",
      url: `${SITE_URL}/`,
    },
    brand: {
      "@type": "Brand",
      name: "MyFamousFinds",
    },
    sameAs: [`${SITE_URL}/`],
  };

  res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).json(jsonLd);
}
