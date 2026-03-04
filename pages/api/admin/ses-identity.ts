// FILE: /pages/api/admin/ses-identity.ts
// Admin endpoint to manage SES email identity verification.
// In SES sandbox mode, both sender AND recipient emails must be verified.
//
// POST /api/admin/ses-identity  — Send verification email to an address
//   body: { email: "user@example.com" }
//
// GET  /api/admin/ses-identity  — Check verification status
//   query: ?email=a@x.com,b@y.com   (comma-separated list)
//   or no email param → lists all verified identities
//
// DELETE /api/admin/ses-identity — Remove an identity
//   body: { email: "user@example.com" }

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import {
  verifySesEmailIdentity,
  checkSesIdentityStatus,
  listVerifiedSesIdentities,
  deleteSesEmailIdentity,
  isSesInSandbox,
} from "../../../utils/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!requireAdmin(req, res)) return;

  // ── POST: Send verification email ──
  if (req.method === "POST") {
    const { email } = (req.body || {}) as { email?: string };
    const addr = String(email || "").trim().toLowerCase();

    if (!addr || !addr.includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid email required." });
    }

    try {
      await verifySesEmailIdentity(addr);
      return res.status(200).json({
        ok: true,
        message: `Verification email sent to ${addr}. They must click the link in the email from AWS.`,
        email: addr,
      });
    } catch (err: any) {
      console.error("[ses-identity] Verify failed:", err);
      return res.status(500).json({
        ok: false,
        error: err?.message || "Failed to send verification email",
      });
    }
  }

  // ── GET: Check status or list identities ──
  if (req.method === "GET") {
    try {
      const emailParam = String(req.query.email || "").trim();

      if (emailParam) {
        // Check status of specific emails
        const emails = emailParam
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes("@"));

        if (emails.length === 0) {
          return res.status(400).json({ ok: false, error: "No valid emails provided." });
        }

        const statuses = await checkSesIdentityStatus(emails);
        const sandbox = await isSesInSandbox();
        return res.status(200).json({
          ok: true,
          sandbox,
          statuses,
        });
      }

      // No email param — list all verified identities
      const verified = await listVerifiedSesIdentities();
      const sandbox = await isSesInSandbox();
      return res.status(200).json({
        ok: true,
        sandbox,
        verifiedIdentities: verified,
        count: verified.length,
      });
    } catch (err: any) {
      console.error("[ses-identity] List/check failed:", err);
      return res.status(500).json({
        ok: false,
        error: err?.message || "Failed to check SES identities",
      });
    }
  }

  // ── DELETE: Remove an identity ──
  if (req.method === "DELETE") {
    const { email } = (req.body || {}) as { email?: string };
    const addr = String(email || "").trim().toLowerCase();

    if (!addr || !addr.includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid email required." });
    }

    try {
      await deleteSesEmailIdentity(addr);
      return res.status(200).json({
        ok: true,
        message: `Identity "${addr}" removed from SES.`,
      });
    } catch (err: any) {
      console.error("[ses-identity] Delete failed:", err);
      return res.status(500).json({
        ok: false,
        error: err?.message || "Failed to delete identity",
      });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed. Use GET, POST, or DELETE." });
}
