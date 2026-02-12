// FILE: /pages/api/auth/start-2fa.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  adminDb,
  FieldValue,
  isFirebaseAdminReady,
} from "../../../utils/firebaseAdmin";
import { sendLoginCode } from "../../../utils/email";
import { sendLoginCodeSms, isTwilioConfigured } from "../../../utils/sms";
import { createChallenge } from "../../../utils/twofaStore";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
  method?: "email" | "sms";
};

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
  if (process.env.EMAIL_DISABLED === "1") return false;
  return true;
}

/**
 * Look up the user's phone number from Firestore based on role + email.
 */
async function lookupPhone(
  email: string,
  role: "seller" | "management"
): Promise<string | null> {
  if (!adminDb) return null;

  try {
    if (role === "management") {
      // Check management_team collection
      const snap = await adminDb
        .collection("management_team")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data.phone || null;
      }
    } else {
      // Check sellers collection — 3-step lookup matching seller/login.ts
      // 1. Doc ID = email
      let doc = await adminDb.collection("sellers").doc(email).get();
      if (doc.exists) {
        const data = doc.data();
        return data?.phone || data?.contactPhone || null;
      }
      // 2. Field email = provided email
      let snap = await adminDb
        .collection("sellers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data.phone || data.contactPhone || null;
      }
      // 3. Field contactEmail = provided email
      snap = await adminDb
        .collection("sellers")
        .where("contactEmail", "==", email)
        .limit(1)
        .get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data.phone || data.contactPhone || null;
      }
    }
  } catch (err) {
    console.error("[start-2fa] Phone lookup failed:", err);
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

  if (deliveryMethod === "sms") {
    // SMS delivery
    if (!isTwilioConfigured()) {
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
    } catch (err) {
      console.error("[start-2fa] SMS send failed:", err);
    }
  } else {
    // Email delivery
    if (canSendEmail()) {
      try {
        await sendLoginCode(normalizedEmail, code);
        codeSent = true;
      } catch (err) {
        console.error("[start-2fa] Email send failed:", err);
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
    console.error(`[start-2fa] ${target} not sent and not in dev mode — code cannot be delivered`);
    return res.status(200).json({
      ok: true,
      challengeId,
      via: deliveryMethod,
      message:
        `We were unable to send the verification ${target}. Please try the other method, or contact support if the problem persists.`,
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
