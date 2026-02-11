// FILE: /pages/api/management/setup-password.ts
// Allows registered management team members to set their Firebase Auth password.
// Only works for emails that exist in the management_team Firestore collection.

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, adminAuth } from "../../../utils/firebaseAdmin";

type Resp =
  | { ok: true }
  | { ok: false; code: string; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, code: "method", message: "Method not allowed." });
  }

  if (!adminDb || !adminAuth) {
    return res.status(500).json({
      ok: false,
      code: "server",
      message: "Firebase Admin is not configured.",
    });
  }

  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      ok: false,
      code: "bad_input",
      message: "A valid email address is required.",
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      ok: false,
      code: "bad_input",
      message: "Password must be at least 8 characters.",
    });
  }

  try {
    // Check if this email exists in the management_team collection
    const teamSnap = await adminDb
      .collection("management_team")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (teamSnap.empty) {
      return res.status(403).json({
        ok: false,
        code: "not_team_member",
        message:
          "This email is not registered as a team member. Please contact the site owner.",
      });
    }

    // Try to find existing Firebase Auth user, or create one
    let uid: string;
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
      // Update the password
      await adminAuth.updateUser(uid, { password });
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Create a new Firebase Auth user
        const newUser = await adminAuth.createUser({ email, password });
        uid = newUser.uid;
      } else {
        throw err;
      }
    }

    // Mark password as set in the team record
    const teamDoc = teamSnap.docs[0];
    await teamDoc.ref.update({ passwordSetAt: new Date().toISOString() });

    console.log(`[MGMT-SETUP-PW] Password set for team member ${email}`);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[MGMT-SETUP-PW] error", err);
    return res.status(500).json({
      ok: false,
      code: "server",
      message: err?.message || "An unexpected error occurred.",
    });
  }
}
