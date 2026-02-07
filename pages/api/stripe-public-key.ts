// FILE: /pages/api/stripe-public-key.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../utils/firebaseAdmin";

type Resp =
  | { ok: true; key: string; source: "env" | "firestore" }
  | { ok: false; error: string };

function normalize(raw: string) {
  return String(raw || "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const envKey = normalize(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
  if (envKey) {
    return res.status(200).json({ ok: true, key: envKey, source: "env" });
  }

  try {
    if (adminDb) {
      const snap = await adminDb.collection("admin").doc("stripe_settings").get();
      if (snap.exists) {
        const data = snap.data() || {};
        const k = normalize((data as any).publishableKey || "");
        if (k) return res.status(200).json({ ok: true, key: k, source: "firestore" });
      }
    }
  } catch (err) {
    console.warn("[stripe-public-key] Firestore lookup failed:", err);
  }

  return res.status(500).json({
    ok: false,
    error: "Missing Stripe publishable key. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel env vars.",
  });
}
