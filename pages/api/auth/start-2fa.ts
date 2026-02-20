// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";
import { sendLoginCodeSms, isSmsConfigured } from "../../../utils/sms";
import { createChallenge } from "../../../utils/twofaStore";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
  method?: "email" | "sms";
};

// Super users who can see the code on-screen when delivery fails
// (they already authenticated with password — this is a fallback, not a bypass)
const SUPER_EMAILS = new Set([
  "leffleryd@gmail.com",
  "arich1114@aol.com",
  "arichspot@gmail.com",
  "ariel@arichwines.com",
  "arielspot@gmail.com",
  "itai.leff@gmail.com",
]);

type Start2faResponse =
  | {
      ok: true;
      challengeId: string;
      via: "email" | "sms";
      message: string;
      devCode?: string;
    }
  | { ok: false; error: string; message?: string };

function canSendEmail() {
  return true;
}

/**
 * Look up the user's phone from a single collection by email query.
 */
async function findPhoneInCollection(
  collection: string,
  email: string,
  phoneFields: string[] = ["phone"]
): Promise<string | null> {
  if (!adminDb) return null;

  // Try doc ID = email first (sellers use this pattern)
  try {
    const doc = await adminDb.collection(collection).doc(email).get();
    if (doc.exists) {
      const data = doc.data();
      for (const f of phoneFields) {
        if (data?.[f]) return data[f];
      }
    }
  } catch { /* doc ID may not be a valid path — skip */ }

  // Query by email field
  const snap = await adminDb
    .collection(collection)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (!snap.empty) {
    const data = snap.docs[0].data();
    for (const f of phoneFields) {
      if (data[f]) return data[f];
    }
  }

  // For sellers, also check contactEmail
  if (collection === "sellers") {
    const snap2 = await adminDb
      .collection(collection)
      .where("contactEmail", "==", email)
      .limit(1)
      .get();
    if (!snap2.empty) {
      const data = snap2.docs[0].data();
      for (const f of phoneFields) {
        if (data[f]) return data[f];
      }
    }
  }

  return null;
}

/**
 * Look up the user's phone number from Firestore.
 * Checks the primary collection for the role first, then falls back
 * to all other collections so that e.g. a management member logging
 * into the seller portal can still receive SMS.
 */
async function lookupPhone(
  email: string,
  role: "seller" | "management"
): Promise<string | null> {
  if (!adminDb) return null;

  // Order: primary collection first, then fallbacks
  const searchOrder =
    role === "management"
      ? [
          { col: "management_team", fields: ["phone"] },
          { col: "sellers", fields: ["phone", "contactPhone"] },
          { col: "users", fields: ["phone"] },
          { col: "vip_members", fields: ["phone"] },
        ]
      : [
          { col: "sellers", fields: ["phone", "contactPhone"] },
          { col: "management_team", fields: ["phone"] },
          { col: "users", fields: ["phone"] },
          { col: "vip_members", fields: ["phone"] },
        ];

  for (const { col, fields } of searchOrder) {
    try {
      const phone = await findPhoneInCollection(col, email, fields);
      if (phone) return phone;
    } catch (err) {
      console.error(`[start-2fa] Phone lookup in ${col} failed:`, err);
    }
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Start2faResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, error: "method_not_allowed", message: "POST only" });
  }

  const { email, role, method } = (req.body || {}) as Start2faBody;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, error: "missing_email", message: "Email required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole: "seller" | "management" =
    role === "seller" ? "seller" : "management";
  const deliveryMethod: "email" | "sms" = method === "sms" ? "sms" : "email";

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 1) Store challenge
  let challengeId: string | null = null;

  if (isFirebaseAdminReady && adminDb) {
    try {
      const docRef = await adminDb.collection("loginChallenges").add({
        email: normalizedEmail,
        role: normalizedRole,
        code,
        method: deliveryMethod,
        createdAt: FieldValue.serverTimestamp(),
        used: false,
      });
      challengeId = docRef.id;
    } catch (err) {
      console.error("[start-2fa] Firestore failed, using memory", err);
    }
  }

  if (!challengeId) {
    const ch = createChallenge({
      email: normalizedEmail,
      role: normalizedRole,
      code,
    });
    challengeId = ch.id;
  }

  // 2) Send code via chosen method
  let codeSent = false;
  let sendError = "";

  if (deliveryMethod === "sms") {
    // SMS delivery
    if (!isSmsConfigured()) {
      return res.status(200).json({
        ok: false,
        error: "sms_not_configured",
        message: "SMS is not configured. Please use email verification instead.",
      });
    }

    const phone = await lookupPhone(normalizedEmail, normalizedRole);
    if (!phone) {
      return res.status(200).json({
        ok: false,
        error: "no_phone",
        message:
          "No mobile number on file for this account. Please use email verification instead.",
      });
    }

    try {
      await sendLoginCodeSms(phone, code);
      codeSent = true;
    } catch (err: any) {
      console.error("[start-2fa] SMS send failed:", err);
      sendError = err?.message || "Unknown SMS error";
    }
  } else {
    // Email delivery
    if (canSendEmail()) {
      try {
        await sendLoginCode(normalizedEmail, code);
        codeSent = true;
      } catch (err: any) {
        console.error("[start-2fa] Email send failed:", err);
        sendError = err?.message || "Unknown email error";
      }
    }
  }

  // 3) Only expose devCode in non-production environments when delivery fails
  if (!codeSent && process.env.NODE_ENV !== "production") {
    return res.status(200).json({
      ok: true,
      challengeId,
      via: deliveryMethod,
      devCode: code,
      message: `[DEV] Your 6-digit code is: ${code}`,
    });
  }

  if (!codeSent) {
    const target = deliveryMethod === "sms" ? "SMS" : "email";
    // Full technical detail goes to server logs only — never to the user
    console.error(
      `[start-2fa] ${target} delivery FAILED for ${normalizedEmail}.`,
      `Error: ${sendError}`,
      sendError.includes("not verified")
        ? `\n→ SES sandbox: the recipient "${normalizedEmail}" is not a verified identity in SES (region ${process.env.AWS_REGION || "us-east-1"}). Either verify this recipient in the SES console, or request SES production access to send to anyone.`
        : ""
    );

    // For super users (owners/admins), show the code on-screen so they
    // aren't locked out while SES sandbox / SMS provisioning is pending.
    // They already proved their identity with a password.
    if (SUPER_EMAILS.has(normalizedEmail)) {
      console.log(`[start-2fa] Showing code on-screen for super user ${normalizedEmail}`);
      return res.status(200).json({
        ok: true,
        challengeId: challengeId!,
        via: deliveryMethod,
        devCode: code,
        message: `${target} delivery is temporarily unavailable. Your code is: ${code}`,
      });
    }

    const otherMethod = deliveryMethod === "sms" ? "email" : "SMS";
    return res.status(200).json({
      ok: false,
      error: "send_failed",
      message:
        `We couldn't send the verification code via ${target} right now. ` +
        `Please try ${otherMethod} instead, or contact support if the problem persists.`,
    });
  }

  const successMsg =
    deliveryMethod === "sms"
      ? "We've sent a 6-digit code to your mobile number."
      : "We've sent a 6-digit code to your email address.";

  return res.status(200).json({
    ok: true,
    challengeId,
    via: deliveryMethod,
    message: successMsg,
  });
}
