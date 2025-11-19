// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb, FieldValue } from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";

// Defines the expected structure for the POST request body.
type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
};

// Defines the possible response structures for the API call.
type Start2faResponse =
  | { ok: true; challengeId: string }
  | { ok: false; error: string; message?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  // 1. Method Check
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "Use POST." });
  }

  try {
    const body = (req.body || {}) as Start2faBody;
    const email = (body.email || "").trim().toLowerCase();
    const role = body.role || "management"; // Default role if not provided

    // 2. Input Validation
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: "missing_email",
        message: "Email address is required.",
      });
    }

    // 3. Generate Code and Expiration
    // Generate a random 6-digit code (100000 to 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    // 4. Save Challenge in Firestore
    // This creates the challenge record the user will verify against
    const docRef = await adminDb.collection("authChallenges").add({
      email,
      role,
      code,
      expiresAt,
      used: false, // Flag to ensure the code is used only once
      createdAt: FieldValue.serverTimestamp(),
    });

    // 5. Send the Email
    // Note: The 'sendLoginCode' utility is assumed to handle the actual email sending
    // and its behavior if environment variables (SMTP config) are missing.
    await sendLoginCode(email, code);

    // 6. Return Success
    return res.status(200).json({
      ok: true,
      challengeId: docRef.id, // Return the ID for the client to use in the verification step
    });
  } catch (err: any) {
    console.error("start-2fa error", err);
    // 7. Handle Server Errors
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: err?.message || "Server error",
    });
  }
}
