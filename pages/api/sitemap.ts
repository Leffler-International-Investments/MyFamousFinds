// FILE: /pages/api/sitemap.ts
// Dynamic sitemap that includes all live product URLs for SEO.
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

const SITE = "https://www.myfamousfinds.com";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/about", changefreq: "monthly", priority: "0.6" },
  { loc: "/catalogue", changefreq: "daily", priority: "0.9" },
  { loc: "/reviews", changefreq: "weekly", priority: "0.7" },
  { loc: "/vip-loyalty-rewards", changefreq: "monthly", priority: "0.6" },
  { loc: "/become-seller", changefreq: "monthly", priority: "0.5" },
  { loc: "/authenticity-policy", changefreq: "yearly", priority: "0.3" },
  { loc: "/privacy", changefreq: "yearly", priority: "0.3" },
  { loc: "/returns", changefreq: "yearly", priority: "0.3" },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end("Method not allowed");
  }

  const urls: string[] = [];

  // Static pages
  for (const p of STATIC_PAGES) {
    urls.push(
      `  <url>\n    <loc>${SITE}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    );
  }

  // Dynamic product pages
  try {
    if (adminDb) {
      const snap = await adminDb.collection("listings").limit(2000).get();
      snap.docs.forEach((doc) => {
        const d: any = doc.data() || {};
        const status = String(d.status || "").toLowerCase();
        if (status === "removed" || status === "deleted" || status === "rejected") return;
        urls.push(
          `  <url>\n    <loc>${SITE}/product/${doc.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
        );
      });
    }
  } catch (err) {
    console.error("sitemap: error fetching listings", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
