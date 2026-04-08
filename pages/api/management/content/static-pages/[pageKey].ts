// FILE: /pages/api/management/content/static-pages/[pageKey].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../../utils/adminAuth";

type PageContent = {
  title: string;
  body: string;
};

type StaticPageResponse =
  | { ok: true; content: PageContent | null }
  | { ok: false; error: string };

const ALLOWED_KEYS = ["about", "contact", "shipping", "returns"] as const;
type PageKey = (typeof ALLOWED_KEYS)[number];

function normalizeKey(raw: string | string[] | undefined): PageKey | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  if (ALLOWED_KEYS.includes(value as PageKey)) {
    return value as PageKey;
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaticPageResponse>
) {
  if (!requireAdmin(req, res)) return;

  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  const key = normalizeKey(req.query.pageKey);

  if (!key) {
    return res
      .status(400)
      .json({ ok: false, error: "invalid_page_key" });
  }

  const docId = `static_${key}`;

  if (req.method === "GET") {
    try {
      const snap = await adminDb.collection("cms").doc(docId).get();

      if (!snap.exists) {
        return res.status(200).json({ ok: true, content: null });
      }

      const data = snap.data() || {};
      const content: PageContent = {
        title: String(data.title || ""),
        body: String(data.body || ""),
      };

      return res.status(200).json({ ok: true, content });
    } catch (err) {
      console.error("cms_static_get_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const content: PageContent = {
        title: String(body.title || "").trim(),
        body: String(body.body || "").trim(),
      };

      if (!content.title) {
        return res
          .status(400)
          .json({ ok: false, error: "missing_title" });
      }

      await adminDb
        .collection("cms")
        .doc(docId)
        .set(
          {
            ...content,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      return res.status(200).json({ ok: true, content });
    } catch (err) {
      console.error("cms_static_post_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
