// FILE: /pages/api/management/content/faq.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../../utils/firebaseAdmin";

type FaqItem = { question: string; answer: string };

type FaqResponse =
  | { ok: true; faqs: FaqItem[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FaqResponse>
) {
  if (!adminDb) {
    return res.status(500).json({ ok: false, error: "Firebase not configured" });
  }

  if (req.method === "GET") {
    try {
      const snap = await adminDb.collection("cms").doc("faq").get();
      const data = snap.exists ? snap.data() || {} : {};
      const faqs = Array.isArray(data.faqs) ? data.faqs : [];

      return res.status(200).json({ ok: true, faqs });
    } catch (err) {
      console.error("cms_faq_get_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const incoming = Array.isArray(body.faqs) ? body.faqs : [];

      const faqs: FaqItem[] = incoming
        .map((item: any) => ({
          question: String(item.question || "").trim(),
          answer: String(item.answer || "").trim(),
        }))
        .filter((item, index) =>
          // Keep first row even if empty so the UI always has at least one row
          index === 0 ? true : item.question || item.answer
        );

      await adminDb
        .collection("cms")
        .doc("faq")
        .set(
          {
            faqs,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      return res.status(200).json({ ok: true, faqs });
    } catch (err) {
      console.error("cms_faq_post_error", err);
      return res.status(500).json({ ok: false, error: "server_error" });
    }
  }

  return res.status(405).json({ ok: false, error: "method_not_allowed" });
}
