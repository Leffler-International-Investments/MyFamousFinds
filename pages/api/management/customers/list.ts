import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../../utils/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!requireAdmin(req, res)) return;

  const errors: string[] = [];
  const firestoreUsers: any[] = [];
  const firestoreEmails = new Set<string>();

  // 1) Fetch all users from Firestore
  if (adminDb) {
    try {
      const snap = await adminDb.collection("users").limit(1000).get();
      for (const doc of snap.docs) {
        const d = doc.data() || {};
        firestoreUsers.push({ id: doc.id, ...d });
        const email = (d.email || "").toLowerCase().trim();
        if (email) firestoreEmails.add(email);
      }
    } catch (e: any) {
      errors.push(`Firestore: ${e?.message || "unknown error"}`);
    }
  } else {
    errors.push("Firestore: adminDb not initialized");
  }

  // 2) Fetch all Firebase Auth users
  const authUsersMap: Record<string, { uid: string; disabled: boolean; displayName: string; email: string; phoneNumber: string; creationTime: string }> = {};
  if (adminAuth) {
    try {
      const result = await adminAuth.listUsers(1000);
      for (const u of result.users) {
        const email = (u.email || "").toLowerCase().trim();
        if (email) {
          authUsersMap[email] = {
            uid: u.uid,
            disabled: u.disabled,
            displayName: u.displayName || "",
            email: u.email || "",
            phoneNumber: u.phoneNumber || "",
            creationTime: u.metadata?.creationTime || "",
          };
        }
      }
    } catch (e: any) {
      errors.push(`Auth: ${e?.message || "unknown error"}`);
    }
  } else {
    errors.push("Auth: adminAuth not initialized");
  }

  // 3) Fetch orders for revenue aggregation
  const ordersByEmail: Record<string, { items: number; spent: number }> = {};
  if (adminDb) {
    try {
      const ordersSnap = await adminDb.collection("orders").get();
      for (const doc of ordersSnap.docs) {
        const d: any = doc.data() || {};
        const buyerEmail = (d.buyer?.email || d.buyerEmail || "").toLowerCase().trim();
        if (!buyerEmail) continue;
        const total = Number(d.totals?.total || 0);
        if (!ordersByEmail[buyerEmail]) {
          ordersByEmail[buyerEmail] = { items: 0, spent: 0 };
        }
        ordersByEmail[buyerEmail].items += 1;
        ordersByEmail[buyerEmail].spent += total;
      }
    } catch (e: any) {
      errors.push(`Orders: ${e?.message || "unknown error"}`);
    }
  }

  // 4) Build customer list from Firestore users
  const customers: any[] = [];
  for (const d of firestoreUsers) {
    const email = (d.email || "").toLowerCase().trim();
    const authInfo = email ? authUsersMap[email] : null;
    const agg = email ? (ordersByEmail[email] || { items: 0, spent: 0 }) : { items: 0, spent: 0 };

    let status = d.status || "Active";
    const authDisabled = authInfo?.disabled || false;
    if (authDisabled && status === "Active") {
      status = "Disabled";
    }

    customers.push({
      id: d.id,
      name: d.name || d.fullName || d.displayName || authInfo?.displayName || "",
      email: d.email || "",
      phone: d.phone || authInfo?.phoneNumber || "",
      status,
      authDisabled,
      vipTier: d.vipTier || "Member",
      points: Number(d.points || 0),
      createdAt: d.createdAt?.toDate?.().toISOString?.() || authInfo?.creationTime || "",
      totalItems: agg.items,
      totalSpent: agg.spent,
    });
  }

  // 5) Add Auth-only users not in Firestore
  for (const email of Object.keys(authUsersMap)) {
    if (firestoreEmails.has(email)) continue;
    const authInfo = authUsersMap[email];
    const agg = ordersByEmail[email] || { items: 0, spent: 0 };

    customers.push({
      id: authInfo.uid,
      name: authInfo.displayName || "",
      email: authInfo.email,
      phone: authInfo.phoneNumber || "",
      status: authInfo.disabled ? "Disabled" : "Active",
      authDisabled: authInfo.disabled,
      vipTier: "Member",
      points: 0,
      createdAt: authInfo.creationTime || "",
      totalItems: agg.items,
      totalSpent: agg.spent,
    });
  }

  // Sort newest first
  customers.sort((a, b) => {
    if (!a.createdAt && !b.createdAt) return 0;
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.status(200).json({
    ok: true,
    customers,
    total: customers.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
