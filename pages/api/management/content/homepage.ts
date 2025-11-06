// FILE: /pages/api/management/content/homepage.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type HomepageContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  collections: string;
  seoDescription: string;
};

type HomepageResponse =
  | { ok: true; content: HomepageContent }
  | { ok: false; error: string };

const DEFAULT_CONTENT: HomepageContent = {
  heroTitle: "Discover Curated Luxury Finds",
  heroSubtitle: "Shop pre-loved designer treasures verified by experts.",
  heroImage: "",
  collections: "Bags,Watches,Jewelry,Clothing",
  seoDescription:
    "Famous-Finds: your destination for authenticated luxury resale.",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HomepageResponse>
) {
  if (req.method === "GET") {
    try {
      const snap = await adminDb.collection("cms").doc("homepage").get();

      if (!snap.exists) {
        return res.status(200).json({ ok: true, content: DEFAULT_CONTENT });
      }

      const data = snap.data() || {};
      const content: HomepageContent = {
        heroTitle: String(data.heroTitle || DEFAULT_CONTENT.heroTitle),
        heroSubtitle: String(
          data.heroSubtitle || DEFAULT_CONTENT.heroSubtitle
        ),
        heroImage: String(data.heroImage || DEFAULT_CONTENT.heroImage || ""),
        collections: String(data.collections || DEFAULT_CONTENT.collections),
        seoDescription: String(
          data.seoDescription || DEFAULT_CONTENT.seoDescription
        ),
      };

      return res.status(200).json({ ok: true, content });
    } catch (err) {
      console.error("cms_homepage_get_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const content: HomepageContent = {
        heroTitle: String(body.heroTitle || "").trim(),
        heroSubtitle: String(body.heroSubtitle || "").trim(),
        heroImage: String(body.heroImage || "").trim(),
        collections: String(body.collections || "").trim(),
        seoDescription: String(body.seoDescription || "").trim(),
      };

      if (!content.heroTitle || !content.heroSubtitle) {
        return res
          .status(400)
          .json({ ok: false, error: "missing_fields" });
      }

      await adminDb
        .collection("cms")
        .doc("homepage")
        .set(
          {
            ...content,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      return res.status(200).json({ ok: true, content });
    } catch (err) {
      console.error("cms_homepage_post_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
