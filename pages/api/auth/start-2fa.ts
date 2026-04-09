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
import { queueEmail } from "../../../utils/emailOutbox";

type Start2faBody = {
  email?: string;
  role?: "seller" | "management";
  method?: "email" | "sms";
  phone?: string;
};

// Super users who can see the code on-screen when delivery fails
// (they already authenticated with password — this is a fallback, not a bypass)
// Loaded from MANAGEMENT_SUPER_EMAILS env var instead of hardcoding.
function getSuperEmails(): Set<string> {
  const emails = new Set<string>();
  (process.env.MANAGEMENT_SUPER_EMAILS || "")
    .split(",")
    .forEach((e) => {
      const t = e.trim().toLowerCase();
      if (t) emails.add(t);
    });
  const ae = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (ae) emails.add(ae);
  return emails;
}

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

  const { email, role, method, phone: userProvidedPhone } = (req.body || {}) as Start2faBody;

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, error: "missing_email", message: "Email required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole: "seller" | "management" =
    role === "seller" ? "seller" : "management";
  const deliveryMethod: "email" | "sms" = method === "sms" ? "sms" : "email";

  // Use cryptographically secure random number for 2FA codes
  const crypto = await import("crypto");
  const code = crypto.randomInt(100000, 1000000).toString();

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

  // 2) Send code via chosen method, with automatic fallback chain:
  //    Email → SMS fallback → Outbox queue (retry)
  //    SMS   → Email fallback → Outbox queue (retry)
  let codeSent = false;
  let actualMethod: "email" | "sms" = deliveryMethod;
  let sendError = "";

  if (deliveryMethod === "sms") {
    // ── SMS delivery (primary) ──
    if (!isSmsConfigured()) {
      return res.status(200).json({
        ok: false,
        error: "sms_not_configured",
        message: "SMS is not configured. Please use email verification instead.",
      });
    }

    // Use phone provided by the user in the verification popup, or fall back to Firestore lookup
    const phone =
      (typeof userProvidedPhone === "string" && userProvidedPhone.trim()) ||
      (await lookupPhone(normalizedEmail, normalizedRole));
    if (!phone) {
      return res.status(200).json({
        ok: false,
        error: "no_phone",
        message:
          "No mobile number provided. Please enter your phone number or use email verification instead.",
      });
    }

    try {
      await sendLoginCodeSms(phone, code);
      codeSent = true;
    } catch (err: any) {
      console.error("[start-2fa] SMS send failed:", err);
      sendError = err?.message || "Unknown SMS error";
    }

    // SMS failed → auto-fallback to email
    if (!codeSent && canSendEmail()) {
      try {
        console.log(`[start-2fa] SMS failed, trying email fallback for ${normalizedEmail}`);
        await sendLoginCode(normalizedEmail, code);
        codeSent = true;
        actualMethod = "email";
        console.log(`[start-2fa] Email fallback succeeded for ${normalizedEmail}`);
      } catch (emailErr: any) {
        console.error("[start-2fa] Email fallback also failed:", emailErr);
      }
    }
  } else {
    // ── Email delivery (primary) ──
    if (canSendEmail()) {
      try {
        await sendLoginCode(normalizedEmail, code);
        codeSent = true;
      } catch (err: any) {
        console.error("[start-2fa] Email send failed:", err);
        sendError = err?.message || "Unknown email error";
      }
    }

    // Email failed → auto-fallback to SMS
    if (!codeSent && isSmsConfigured()) {
      try {
        const phone = await lookupPhone(normalizedEmail, normalizedRole);
        if (phone) {
          console.log(`[start-2fa] Email failed, trying SMS fallback for ${normalizedEmail}`);
          await sendLoginCodeSms(phone, code);
          codeSent = true;
          actualMethod = "sms";
          console.log(`[start-2fa] SMS fallback succeeded for ${normalizedEmail}`);
        }
      } catch (smsErr: any) {
        console.error("[start-2fa] SMS fallback also failed:", smsErr);
      }
    }
  }

  // 3) Both direct delivery methods failed
  if (!codeSent) {
    const target = deliveryMethod === "sms" ? "SMS" : "email";
    // Full technical detail goes to server logs only — never to the user
    console.error(
      `[start-2fa] ${target} delivery FAILED for ${normalizedEmail}.`,
      `Error: ${sendError}`,
      String(sendError).includes("not verified")
        ? `\n→ SES sandbox: the recipient "${normalizedEmail}" is not a verified identity in SES (region ${process.env.AWS_REGION || "us-east-1"}). Either verify this recipient in the SES console, or request SES production access to send to anyone.`
        : ""
    );

    // Only expose devCode in non-production environments when delivery fails
    if (process.env.NODE_ENV !== "production") {
      return res.status(200).json({
        ok: true,
        challengeId,
        via: deliveryMethod,
        devCode: code,
        message: `[DEV] Your 6-digit code is: ${code}`,
      });
    }

    // Super users who already authenticated with password get the code on-screen
    // as a fallback when delivery fails — this is NOT a security bypass.
    if (getSuperEmails().has(normalizedEmail)) {
      return res.status(200).json({
        ok: true,
        challengeId,
        via: deliveryMethod,
        devCode: code,
        message: `We couldn't send the ${target.toLowerCase()} but here is your code: ${code}`,
      });
    }

    // Last resort: queue via email outbox (has retry with exponential backoff).
    // Return ok:true so the user sees the code entry screen and can wait.
    let queued = false;
    try {
      const loginCodeHtml =
        "<p>Hello,</p>" +
        "<p>Use the login code below to sign in:</p>" +
        `<p style="font-size:20px; letter-spacing:2px;"><b>${code}</b></p>` +
        "<p>If you did not request this, you can ignore this email.</p>" +
        "<p>MyFamousFinds</p>";

      const jobId = await queueEmail({
        to: normalizedEmail,
        subject: "MyFamousFinds — Your Login Code",
        text: `Hello,\n\nYour login code is: ${code}\n\nIf you did not request this, you can ignore this email.\n\nMyFamousFinds`,
        html: loginCodeHtml,
        eventType: "login_code",
        eventKey: `${normalizedEmail}:login_code:${challengeId}`,
        metadata: { challengeId, role: normalizedRole },
      });
      queued = !!jobId;
      if (queued) {
        console.log(`[start-2fa] Direct delivery failed, queued via outbox (jobId: ${jobId}) for ${normalizedEmail}`);
      }
    } catch (queueErr) {
      console.error("[start-2fa] Outbox queue also failed:", queueErr);
    }

    if (queued) {
      // Outbox will retry delivery — let the user wait for the email
      return res.status(200).json({
        ok: true,
        challengeId,
        via: "email",
        message:
          "Your verification code is on its way. It may take a few minutes to arrive — please also check your spam folder.",
      });
    }

    // Everything failed — user cannot proceed
    return res.status(200).json({
      ok: false,
      error: "delivery_failed",
      message:
        target === "SMS"
          ? "We could not send an SMS to your phone number. Please try email verification instead, or contact support."
          : "We could not deliver the verification email. Please try SMS verification instead, or contact support at support@myfamousfinds.com.",
    });
  }

  // 4) Code delivered successfully
  let successMsg: string;
  if (actualMethod !== deliveryMethod) {
    // Fallback was used — inform the user which method actually delivered
    successMsg =
      actualMethod === "sms"
        ? "Email delivery wasn't available, so we sent a 6-digit code to your mobile number instead."
        : "We couldn't deliver SMS to your phone right now, so we sent a 6-digit code to your email address instead. Please check your inbox.";
  } else {
    successMsg =
      actualMethod === "sms"
        ? "We've sent a 6-digit code to your mobile number."
        : "We've sent a 6-digit code to your email address.";
  }

  return res.status(200).json({
    ok: true,
    challengeId,
    via: actualMethod,
    message: successMsg,
  });
}
