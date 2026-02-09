import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "../../../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  if (!adminDb || !adminAuth) return res.status(500).json({ ok: false, error: "firebase_not_configured" });

  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const sessionCookie = req.cookies?.session || "";

    const idToken = token || sessionCookie;
    if (!idToken) return res.status(401).send("Missing auth");

    const decoded = await adminAuth.verifyIdToken(idToken);
    const isAdmin =
      decoded?.isAdmin === true ||
      decoded?.uid === "Fj28JrWa8LQEzwGcZQ60rme39wP2" ||
      decoded?.uid === "hoMODWgS1zY1JAuz1dbCbnhaBki2";

    if (!isAdmin) return res.status(403).send("Forbidden");

    const { sellerId, status } = req.body || {};
    if (!sellerId || !status) return res.status(400).send("Missing sellerId/status");

    await adminDb.collection("sellers").doc(String(sellerId)).update({
      status: String(status),
      updatedAt: new Date(),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message || "Server error");
  }
}
