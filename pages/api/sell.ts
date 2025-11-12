// FILE: /pages/api/sell.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../utils/firebaseAdmin";

// Next.js parses JSON; disable multipart parsing (we upload images client-side to Firebase Storage)
export const config = {
  api: { bodyParser: true },
};

type Ok = { ok: true; id: string };
type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    // Expect JSON body from the Sell page
    const {
      name,
      email,
      brand,
      designer_id,
      designer_is_top,
      designer_request,
      designer_request_reason,
      title,
      condition,
      size,
      color,
      price,
      serial_number,
      image_url,
      purchase_proof,
      details,
      // optional: auth token from client (if you gate submissions)
      idToken,
    } = req.body || {};

    if (!name || !email || !title || !brand) {
      res.status(400).json({ ok: false, error: "Missing required fields" });
      return;
    }

    // (Optional) verify user if token provided
    let uid: string | null = null;
    if (idToken) {
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        uid = decoded.uid;
      } catch {
        // ignore verification errors; treat as guest submission
      }
    }

    const doc = {
      createdAt: new Date(),
      status: "new", // new | reviewing | approved | rejected
      submitter: {
        uid,
        name,
        email,
      },
      item: {
        title,
        brand,
        designer_id: designer_id || null,
        designer_is_top: !!designer_is_top || false,
        designer_request: designer_request || null,
        designer_request_reason: designer_request_reason || null,
        condition: condition || null,
        size: size || null,
        color: color || null,
        price: price ? Number(price) : null,
        serial_number: serial_number || null,
        image_url: image_url || null,
        purchase_proof: purchase_proof || null,
        details: details || null,
      },
    };

    const ref = await adminDb.collection("listing_submissions").add(doc);
    res.status(200).json({ ok: true, id: ref.id });
  } catch (e: any) {
    console.error("sell api error:", e?.message || e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
