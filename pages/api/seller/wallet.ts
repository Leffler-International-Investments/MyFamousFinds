// FILE: /pages/api/seller/wallet.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSellerId } from "../../../utils/authServer";
import { adminDb } from "../../../utils/firebaseAdmin";

type PayoutRow = {
  id: string;
  date: string;
  amount: string;
  status: string;
  destination: string;
};

type WalletData = {
  available: number;
  upcoming: number;
  lifetime: number;
  payouts: PayoutRow[];
  account: null;
  paypalEmail: string | null;
  upcomingDate: string | null;
};

type Data = {
  ok: boolean;
  wallet?: WalletData;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const sellerId = await getSellerId(req);
    if (!sellerId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    if (!adminDb) {
      return res.status(500).json({ ok: false, error: "Firebase not configured" });
    }

    // Load seller's PayPal email
    const sellerDoc = await adminDb.collection("sellers").doc(sellerId).get();
    const sellerData: any = sellerDoc.exists ? sellerDoc.data() : {};
    const paypalEmail = sellerData?.paypalEmail || null;

    // Load payout history from Firestore
    let payouts: PayoutRow[] = [];
    try {
      const payoutSnap = await adminDb
        .collection("payouts")
        .where("sellerId", "==", sellerId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      payouts = payoutSnap.docs.map((doc) => {
        const d: any = doc.data() || {};
        return {
          id: doc.id,
          date: d.createdAt?.toDate?.()?.toLocaleDateString("en-US") || "",
          amount: `$${(Number(d.amount || 0)).toFixed(2)}`,
          status: d.status || "Pending",
          destination: d.paypalEmail || "PayPal",
        };
      });
    } catch {
      // Index may not exist yet
    }

    // Calculate balances from orders
    let available = 0;
    let upcoming = 0;
    let lifetime = 0;

    try {
      const ordersSnap = await adminDb
        .collection("orders")
        .where("sellerId", "==", sellerId)
        .where("status", "in", ["paid", "Paid", "PaidOut", "SIGNATURE_CONFIRMED"])
        .get();

      for (const doc of ordersSnap.docs) {
        const o: any = doc.data() || {};
        const total = Number(o.amountTotal || o.totals?.total || o.total || 0) / 100;
        const payoutStatus = o.payout?.status || "";

        lifetime += total;

        if (payoutStatus === "PAID") {
          // Already paid out
        } else if (payoutStatus === "ELIGIBLE") {
          available += total;
        } else {
          upcoming += total;
        }
      }
    } catch {
      // Index may not exist yet
    }

    const walletData: WalletData = {
      available,
      upcoming,
      lifetime,
      account: null,
      paypalEmail,
      upcomingDate: null,
      payouts,
    };

    res.status(200).json({ ok: true, wallet: walletData });
  } catch (err: any) {
    console.error("Error fetching wallet data:", err);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
