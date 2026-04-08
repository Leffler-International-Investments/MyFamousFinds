// FILE: /pages/api/management/seller-training.ts
// GET  ?sellerId=xxx  — fetch training status for a seller
// POST { action: "send", sellerId, sellerEmail, sellerName }  — send training invite email
// POST { action: "submit", sellerId, answers }  — seller submits quiz (called from seller side)
// POST { action: "certify", sellerId }  — management manually certifies
// POST { action: "revoke", sellerId }  — management revokes certification

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, isFirebaseAdminReady } from "../../../utils/firebaseAdmin";
import { requireAdmin } from "../../../utils/adminAuth";
import { sendMail, brandedEmailWrapper, escapeHtml } from "../../../utils/email";

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What is required before listing a Bag, Watch, or Jewelry item?",
    options: [
      "A. Just a photo",
      "B. At least 2 of 3 authentication documents and a serial/reference number",
      "C. Only a price",
      "D. Nothing extra",
    ],
    correct: "B",
  },
  {
    id: "q2",
    question: "How long is the cooling-off period before a seller receives their payout after delivery?",
    options: ["A. 3 days", "B. 7 days", "C. 14 days", "D. 30 days"],
    correct: "C",
  },
  {
    id: "q3",
    question: "What should a seller do if an item sells and they need to ship it?",
    options: [
      "A. Wait for the buyer to contact them",
      "B. Immediately prepare the item and use the UPS label generated in their dashboard",
      "C. Arrange their own courier",
      "D. Contact support and wait 5 days",
    ],
    correct: "B",
  },
  {
    id: "q4",
    question: "Can a seller list items without completing their bank account details?",
    options: [
      "A. Yes, always",
      "B. No — bank details are required before listing",
      "C. Only for items under $100",
      "D. Yes, but only 1 item",
    ],
    correct: "B",
  },
  {
    id: "q5",
    question: "What happens if a listing is rejected by management?",
    options: [
      "A. It is automatically relisted",
      "B. The seller is banned",
      "C. The seller receives an email with the rejection reason and can resubmit",
      "D. Nothing — it disappears silently",
    ],
    correct: "C",
  },
  {
    id: "q6",
    question: "Which of the following best describes MyFamousFinds' authentication standard?",
    options: [
      "A. Items are sold as-is with no verification",
      "B. Only buyers verify items after purchase",
      "C. Management reviews every listing and checks authenticity documents before approval",
      "D. Authentication is optional",
    ],
    correct: "C",
  },
  {
    id: "q7",
    question: "What is the platform commission structure?",
    options: [
      "A. Sellers keep 100% of the sale price",
      "B. A platform fee is deducted from the seller payout as per the consignment agreement",
      "C. Buyers pay the commission",
      "D. There is no commission",
    ],
    correct: "B",
  },
];

const PASS_SCORE = 5; // 5/7 to pass

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isFirebaseAdminReady || !adminDb) {
    return res.status(500).json({ error: "Firebase not configured" });
  }

  // GET — public read for seller (no admin required)
  if (req.method === "GET") {
    const sellerId = String(req.query.sellerId || "").trim();
    if (!sellerId) return res.status(400).json({ error: "Missing sellerId" });
    const doc = await adminDb.collection("seller_training").doc(sellerId).get();
    if (!doc.exists) return res.status(200).json({ status: "not_sent" });
    return res.status(200).json({ status: "ok", ...doc.data() });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, sellerId, sellerEmail, sellerName, answers } = req.body || {};
  if (!sellerId) return res.status(400).json({ error: "Missing sellerId" });

  // Submit quiz — called from seller side (no admin required)
  if (action === "submit") {
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Missing answers" });
    }
    let score = 0;
    const results: Record<string, { correct: boolean; given: string; expected: string }> = {};
    for (const q of QUIZ_QUESTIONS) {
      const given = String(answers[q.id] || "").trim().toUpperCase();
      const correct = given === q.correct;
      if (correct) score++;
      results[q.id] = { correct, given, expected: q.correct };
    }
    const passed = score >= PASS_SCORE;
    const now = new Date().toISOString();
    await adminDb.collection("seller_training").doc(sellerId).set({
      sellerId,
      submittedAt: now,
      score,
      total: QUIZ_QUESTIONS.length,
      passed,
      results,
      certified: passed,
      certifiedAt: passed ? now : null,
      status: passed ? "certified" : "failed",
    }, { merge: true });
    return res.status(200).json({ ok: true, score, total: QUIZ_QUESTIONS.length, passed, ...(!passed ? { results } : {}) });
  }

  // Complete review — seller reviews failed questions and retries (no admin required)
  if (action === "complete-review") {
    const doc = await adminDb.collection("seller_training").doc(sellerId).get();
    if (!doc.exists) return res.status(400).json({ error: "No training record found" });
    const data = doc.data()!;
    if (data.status !== "failed") return res.status(400).json({ error: "Quiz not in failed state" });
    if (!answers || typeof answers !== "object") return res.status(400).json({ error: "Missing answers" });
    const prevResults = data.results || {};
    const failedQs = QUIZ_QUESTIONS.filter(q => prevResults[q.id] && !prevResults[q.id].correct);
    for (const q of failedQs) {
      const given = String(answers[q.id] || "").trim().toUpperCase();
      if (given !== q.correct) {
        return res.status(400).json({ error: "Not all review answers are correct" });
      }
    }
    const now = new Date().toISOString();
    await adminDb.collection("seller_training").doc(sellerId).set({
      certified: true, certifiedAt: now, status: "certified", passed: true,
      reviewCompletedAt: now, score: data.total,
    }, { merge: true });
    await adminDb.collection("sellers").doc(sellerId).set(
      { certifiedFfSeller: true, certifiedAt: now }, { merge: true }
    );
    return res.status(200).json({ ok: true, passed: true, score: data.total, total: QUIZ_QUESTIONS.length });
  }

  // All actions below require admin
  if (!requireAdmin(req, res)) return;

  if (action === "send") {
    const email = String(sellerEmail || "").trim().toLowerCase();
    const name = String(sellerName || "Seller").trim();
    if (!email) return res.status(400).json({ error: "Missing sellerEmail" });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.myfamousfinds.com";
    const trainingUrl = `${siteUrl}/seller/training`;

    const bodyHtml =
      `<p style="margin:0 0 6px 0;font-size:13px;font-weight:600;color:#b8860b;letter-spacing:0.06em;text-transform:uppercase;">Seller Certification</p>` +
      `<p style="margin:0 0 16px 0;font-size:22px;font-weight:bold;color:#1c1917;">Welcome to Famous Finds, ${escapeHtml(name)}!</p>` +
      `<p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;">To become a <strong>Certified Famous Finds Seller</strong>, please complete the short seller training and pass the quiz below. It takes about 5 minutes.</p>` +
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;background:#fafaf9;border:1px solid #e7e5e4;border-radius:10px;">` +
      `<tr><td style="padding:20px;">` +
      `<p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#b8860b;text-transform:uppercase;letter-spacing:0.05em;">What you'll learn</p>` +
      `<ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">` +
      `<li>How to list items correctly (Bags, Watches, Jewelry requirements)</li>` +
      `<li>Payout timelines and banking setup</li>` +
      `<li>Shipping process using UPS labels</li>` +
      `<li>Authentication standards</li>` +
      `<li>What happens when a listing is approved or rejected</li>` +
      `</ul>` +
      `</td></tr></table>` +
      `<div style="text-align:center;margin:0 0 24px 0;">` +
      `<a href="${escapeHtml(trainingUrl)}" style="display:inline-block;background:#1c1917;color:#d4a843;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 40px;border-radius:999px;letter-spacing:0.04em;">Start Training &amp; Quiz →</a>` +
      `</div>` +
      `<p style="margin:0;font-size:12px;color:#a8a29e;text-align:center;">Once you pass the quiz you'll receive your Certified FF Seller badge automatically.</p>`;

    const html = brandedEmailWrapper(bodyHtml);
    const text = `Welcome to Famous Finds, ${name}!

Complete your seller training and quiz at: ${trainingUrl}

Pass 5/7 questions to become a Certified Famous Finds Seller.`;

    await sendMail(email, "Famous Finds — Complete Your Seller Training & Certification", text, html);

    await adminDb.collection("seller_training").doc(sellerId).set({
      sellerId, sellerEmail: email, sellerName: name,
      inviteSentAt: new Date().toISOString(),
      status: "invited",
    }, { merge: true });

    return res.status(200).json({ ok: true });
  }

  if (action === "certify") {
    await adminDb.collection("seller_training").doc(sellerId).set({
      certified: true, certifiedAt: new Date().toISOString(), status: "certified",
    }, { merge: true });
    // Also write badge to seller doc
    await adminDb.collection("sellers").doc(sellerId).set(
      { certifiedFfSeller: true, certifiedAt: new Date().toISOString() }, { merge: true }
    );
    return res.status(200).json({ ok: true });
  }

  if (action === "revoke") {
    await adminDb.collection("seller_training").doc(sellerId).set(
      { certified: false, status: "revoked", revokedAt: new Date().toISOString() }, { merge: true }
    );
    await adminDb.collection("sellers").doc(sellerId).set(
      { certifiedFfSeller: false }, { merge: true }
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Invalid action" });
}
