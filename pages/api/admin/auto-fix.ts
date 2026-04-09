// FILE: /pages/api/admin/auto-fix.ts
// Automated maintenance agent — detects and fixes common issues.
// Designed to run as a Vercel Cron job on a schedule.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";

type FixAction = {
  name: string;
  fixed: number;
  errors: string[];
};

type AutoFixResponse = {
  ok: boolean;
  timestamp: string;
  actions: FixAction[];
  totalFixed: number;
  totalErrors: number;
};

/**
 * Clean up stuck email outbox entries.
 * Emails stuck in "sending" status for >15 min are reset to "pending"
 * so the outbox processor can retry them.
 */
async function fixStuckEmails(): Promise<FixAction> {
  const action: FixAction = { name: "stuck_emails", fixed: 0, errors: [] };
  if (!adminDb) return action;

  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const snap = await adminDb
      .collection("email_outbox")
      .where("status", "==", "sending")
      .limit(20)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(0);
      if (updatedAt < cutoff) {
        await doc.ref.update({ status: "pending", updatedAt: new Date() });
        action.fixed++;
      }
    }
  } catch (err: any) {
    action.errors.push(err?.message || "Unknown error");
  }
  return action;
}

/**
 * Clean expired login challenges (older than 1 hour).
 * Prevents collection bloat from abandoned 2FA flows.
 */
async function cleanExpiredChallenges(): Promise<FixAction> {
  const action: FixAction = { name: "expired_challenges", fixed: 0, errors: [] };
  if (!adminDb) return action;

  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const snap = await adminDb
      .collection("loginChallenges")
      .where("createdAt", "<", cutoff)
      .limit(100)
      .get();

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
      action.fixed++;
    });

    if (action.fixed > 0) {
      await batch.commit();
    }
  } catch (err: any) {
    action.errors.push(err?.message || "Unknown error");
  }
  return action;
}

/**
 * Fix listings with missing status field.
 * Listings without a status are treated as "active" but should be
 * explicitly marked so queries and filters work correctly.
 */
async function fixMissingListingStatus(): Promise<FixAction> {
  const action: FixAction = { name: "missing_listing_status", fixed: 0, errors: [] };
  if (!adminDb) return action;

  try {
    // Firestore doesn't have a "field does not exist" query,
    // so we look for listings where status is empty string or null
    const snap = await adminDb
      .collection("listings")
      .where("status", "==", "")
      .limit(50)
      .get();

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "active" });
      action.fixed++;
    });

    if (action.fixed > 0) {
      await batch.commit();
    }
  } catch (err: any) {
    action.errors.push(err?.message || "Unknown error");
  }
  return action;
}

/**
 * Clean up stale pending orders (older than 24 hours).
 * PayPal orders that were never captured leave behind pending_orders docs.
 */
async function cleanStalePendingOrders(): Promise<FixAction> {
  const action: FixAction = { name: "stale_pending_orders", fixed: 0, errors: [] };
  if (!adminDb) return action;

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snap = await adminDb
      .collection("pending_orders")
      .where("createdAt", "<", cutoff)
      .where("status", "==", "CREATED")
      .limit(50)
      .get();

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "EXPIRED" });
      action.fixed++;
    });

    if (action.fixed > 0) {
      await batch.commit();
    }
  } catch (err: any) {
    action.errors.push(err?.message || "Unknown error");
  }
  return action;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoFixResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  // Auth: Vercel Cron bearer token or admin API secret header
  const cronSecret = req.headers["authorization"]?.replace("Bearer ", "");
  const adminSecret = String(req.headers["x-admin-secret"] || "");
  const expected = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;

  if (!expected || (cronSecret !== expected && adminSecret !== expected)) {
    return res.status(401).json({
      ok: false,
      timestamp: new Date().toISOString(),
      actions: [],
      totalFixed: 0,
      totalErrors: 1,
    } as any);
  }

  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(503).json({
      ok: false,
      timestamp: new Date().toISOString(),
      actions: [{ name: "firebase", fixed: 0, errors: ["Firebase Admin not ready"] }],
      totalFixed: 0,
      totalErrors: 1,
    });
  }

  const actions = await Promise.all([
    fixStuckEmails(),
    cleanExpiredChallenges(),
    fixMissingListingStatus(),
    cleanStalePendingOrders(),
  ]);

  const totalFixed = actions.reduce((s, a) => s + a.fixed, 0);
  const totalErrors = actions.reduce((s, a) => s + a.errors.length, 0);

  if (totalFixed > 0) {
    console.log(
      `[auto-fix] Fixed ${totalFixed} issue(s):`,
      actions
        .filter((a) => a.fixed > 0)
        .map((a) => `${a.name}=${a.fixed}`)
        .join(", ")
    );
  }

  if (totalErrors > 0) {
    console.error(
      `[auto-fix] ${totalErrors} error(s):`,
      actions
        .filter((a) => a.errors.length > 0)
        .map((a) => `${a.name}: ${a.errors.join(", ")}`)
        .join("; ")
    );
  }

  res.status(200).json({
    ok: totalErrors === 0,
    timestamp: new Date().toISOString(),
    actions,
    totalFixed,
    totalErrors,
  });
}
