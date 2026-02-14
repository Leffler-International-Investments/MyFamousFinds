// FILE: /utils/sms.ts
import twilio from "twilio";

function cleanEnv(v?: string) {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

const TWILIO_ACCOUNT_SID = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
const TWILIO_AUTH_TOKEN = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER_RAW = cleanEnv(process.env.TWILIO_PHONE_NUMBER);

function getClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio is not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN).");
  }
  if (!TWILIO_PHONE_NUMBER_RAW) {
    throw new Error("Twilio is not configured (missing TWILIO_PHONE_NUMBER).");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export function isTwilioConfigured(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER_RAW);
}

/**
 * Normalize a phone number to E.164 format required by Twilio.
 * Strips spaces/dashes/parens, ensures leading "+".
 * Examples:
 *   "+61478965828"  -> "+61478965828"  (already correct)
 *   "61478965828"   -> "+61478965828"  (missing +)
 *   "14048611733"   -> "+14048611733"  (US without +)
 *   "+1 (404) 861-1733" -> "+14048611733"
 */
export function normalizePhoneE164(raw: string): string {
  // Strip everything except digits and leading +
  let cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

export async function sendSms(to: string, body: string) {
  const normalizedTo = normalizePhoneE164(to);
  const normalizedFrom = normalizePhoneE164(TWILIO_PHONE_NUMBER_RAW);
  const logTag = `[SMS] from=${normalizedFrom} to=${normalizedTo}`;
  console.log(`${logTag} — attempting to send`);
  try {
    const client = getClient();
    const message = await client.messages.create({
      body,
      from: normalizedFrom,
      to: normalizedTo,
    });
    console.log(`${logTag} — sent successfully (sid=${message.sid})`);
    return message;
  } catch (err: any) {
    const twilioCode = err?.code || "";
    const twilioMsg = err?.message || "";
    console.error(`${logTag} — FAILED (code=${twilioCode})`, twilioMsg, err);
    throw new Error(
      `SMS failed: ${twilioMsg || "Unknown Twilio error"}${twilioCode ? ` (code ${twilioCode})` : ""}`
    );
  }
}

/**
 * Send a 2FA login code via SMS
 */
export async function sendLoginCodeSms(to: string, code: string) {
  const phone = String(to || "").trim();
  const c = String(code || "").trim();

  if (!phone) throw new Error("sendLoginCodeSms missing required field: to");
  if (!c) throw new Error("sendLoginCodeSms missing required field: code");

  const body = `MyFamousFinds: Your login code is ${c}. It expires in 10 minutes.`;
  await sendSms(phone, body);
}
