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
const TWILIO_PHONE_NUMBER = cleanEnv(process.env.TWILIO_PHONE_NUMBER);

function getClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio is not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN).");
  }
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio is not configured (missing TWILIO_PHONE_NUMBER).");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export function isTwilioConfigured(): boolean {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

export async function sendSms(to: string, body: string) {
  const logTag = `[SMS] to=${to}`;
  console.log(`${logTag} — attempting to send`);
  try {
    const client = getClient();
    const message = await client.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`${logTag} — sent successfully (sid=${message.sid})`);
    return message;
  } catch (err) {
    console.error(`${logTag} — FAILED`, err);
    throw err;
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
