// FILE: /pages/api/admin/system-health.ts
// Comprehensive system health check — runs all critical subsystem checks
// and returns a single pass/fail verdict with details.
// Called by Vercel Cron every 30 minutes to detect issues early.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";

type CheckResult = {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  durationMs?: number;
};

type HealthResponse = {
  ok: boolean;
  timestamp: string;
  checks: CheckResult[];
  summary: { pass: number; warn: number; fail: number };
};

async function checkFirebaseAdmin(): Promise<CheckResult> {
  const start = Date.now();
  if (!isFirebaseAdminReady || !adminDb) {
    return {
      name: "firebase_admin",
      status: "fail",
      message: "Firebase Admin SDK not initialized",
      durationMs: Date.now() - start,
    };
  }
  try {
    const snap = await adminDb.collection("listings").limit(1).get();
    return {
      name: "firebase_admin",
      status: "pass",
      message: `Firestore connected (sample doc: ${snap.empty ? "none" : snap.docs[0].id})`,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "firebase_admin",
      status: "fail",
      message: `Firestore query failed: ${err?.message || "unknown"}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkFirebaseAuth(): Promise<CheckResult> {
  const start = Date.now();
  if (!adminAuth) {
    return {
      name: "firebase_auth",
      status: "fail",
      message: "Firebase Auth not initialized",
      durationMs: Date.now() - start,
    };
  }
  try {
    await adminAuth.listUsers(1);
    return {
      name: "firebase_auth",
      status: "pass",
      message: "Firebase Auth connected",
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "firebase_auth",
      status: "fail",
      message: `Firebase Auth failed: ${err?.message || "unknown"}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkEmailOutbox(): Promise<CheckResult> {
  const start = Date.now();
  if (!adminDb) {
    return { name: "email_outbox", status: "warn", message: "Firestore not available", durationMs: Date.now() - start };
  }
  try {
    const stuckSnap = await adminDb
      .collection("email_outbox")
      .where("status", "==", "pending")
      .limit(50)
      .get();

    const now = Date.now();
    let stuckCount = 0;
    stuckSnap.docs.forEach((doc) => {
      const data = doc.data();
      const created = data.createdAt?.toMillis?.() || data.createdAt || 0;
      if (now - created > 30 * 60 * 1000) stuckCount++;
    });

    if (stuckCount > 10) {
      return {
        name: "email_outbox",
        status: "fail",
        message: `${stuckCount} emails stuck in outbox for >30 min`,
        durationMs: Date.now() - start,
      };
    }
    if (stuckCount > 0) {
      return {
        name: "email_outbox",
        status: "warn",
        message: `${stuckCount} emails pending for >30 min`,
        durationMs: Date.now() - start,
      };
    }
    return {
      name: "email_outbox",
      status: "pass",
      message: `Outbox healthy (${stuckSnap.size} pending)`,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "email_outbox",
      status: "fail",
      message: `Outbox check failed: ${err?.message || "unknown"}`,
      durationMs: Date.now() - start,
    };
  }
}

function checkEnvVars(): CheckResult {
  const required = [
    "ADMIN_API_SECRET",
    "ADMIN_EMAIL",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ];
  const recommended = [
    "MANAGEMENT_SUPER_EMAILS",
    "NEXT_PUBLIC_OWNER_EMAILS",
    "AWS_SES_FROM",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
  ];

  const missingRequired = required.filter((k) => !process.env[k]);
  const missingRecommended = recommended.filter((k) => !process.env[k]);

  if (missingRequired.length > 0) {
    return {
      name: "env_vars",
      status: "fail",
      message: `Missing required: ${missingRequired.join(", ")}`,
    };
  }
  if (missingRecommended.length > 0) {
    return {
      name: "env_vars",
      status: "warn",
      message: `Missing recommended: ${missingRecommended.join(", ")}`,
    };
  }
  return { name: "env_vars", status: "pass", message: "All env vars configured" };
}

async function checkPayPal(): Promise<CheckResult> {
  const start = Date.now();
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    return {
      name: "paypal",
      status: "warn",
      message: "PayPal credentials not configured",
      durationMs: Date.now() - start,
    };
  }

  const base =
    process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
  try {
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const resp = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (resp.ok) {
      return {
        name: "paypal",
        status: "pass",
        message: "PayPal API authenticated",
        durationMs: Date.now() - start,
      };
    }
    return {
      name: "paypal",
      status: "fail",
      message: `PayPal auth returned ${resp.status}`,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      name: "paypal",
      status: "fail",
      message: `PayPal unreachable: ${err?.message || "unknown"}`,
      durationMs: Date.now() - start,
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  // Allow Vercel Cron (CRON_SECRET header) or admin session
  const cronSecret = req.headers["authorization"]?.replace("Bearer ", "");
  const expectedCron = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;
  const isCron = expectedCron && cronSecret === expectedCron;

  if (!isCron && !requireAdmin(req, res)) return;

  const checks = await Promise.all([
    checkFirebaseAdmin(),
    checkFirebaseAuth(),
    checkEmailOutbox(),
    Promise.resolve(checkEnvVars()),
    checkPayPal(),
  ]);

  const summary = {
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };

  const result: HealthResponse = {
    ok: summary.fail === 0,
    timestamp: new Date().toISOString(),
    checks,
    summary,
  };

  // Log failures for monitoring
  if (summary.fail > 0) {
    console.error(
      `[system-health] ${summary.fail} check(s) FAILED:`,
      checks
        .filter((c) => c.status === "fail")
        .map((c) => `${c.name}: ${c.message}`)
        .join("; ")
    );
  }

  res.status(result.ok ? 200 : 503).json(result);
}
