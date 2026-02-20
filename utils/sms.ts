// FILE: /utils/sms.ts
// SMS via AWS SNS (replaces Twilio).
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

function cleanEnv(v?: string) {
  return String(v ?? "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .trim();
}

const AWS_REGION = cleanEnv(process.env.AWS_REGION) || "us-east-1";
const AWS_ACCESS_KEY_ID = cleanEnv(process.env.AWS_ACCESS_KEY_ID);
const AWS_SECRET_ACCESS_KEY = cleanEnv(process.env.AWS_SECRET_ACCESS_KEY);
const AWS_SNS_SMS_TYPE = cleanEnv(process.env.AWS_SNS_SMS_TYPE) || "Transactional";
// SNS SenderID must be 1-11 alphanumeric characters
const AWS_SNS_SENDER_ID = cleanEnv(process.env.AWS_SNS_SENDER_ID) || "FamousFinds";

function getClient() {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS SNS is not configured (missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY).");
  }
  return new SNSClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

export function isSmsConfigured(): boolean {
  return Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

/**
 * Normalize a phone number to E.164 format required by SNS.
 * Strips spaces/dashes/parens, ensures leading "+".
 */
export function normalizePhoneE164(raw: string): string {
  let cleaned = raw.replace(/[\s\-().]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

export async function sendSms(to: string, body: string) {
  const normalizedTo = normalizePhoneE164(to);
  const logTag = `[SMS] to=${normalizedTo}`;
  console.log(`${logTag} — attempting to send via AWS SNS`);
  try {
    const client = getClient();
    const command = new PublishCommand({
      PhoneNumber: normalizedTo,
      Message: body,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: AWS_SNS_SMS_TYPE,
        },
        "AWS.SNS.SMS.SenderID": {
          DataType: "String",
          StringValue: AWS_SNS_SENDER_ID,
        },
      },
    });
    const result = await client.send(command);
    console.log(`${logTag} — sent successfully (messageId=${result.MessageId})`);
    return { sid: result.MessageId || "" };
  } catch (err: any) {
    const code = err?.name || err?.code || "";
    const msg = err?.message || "";
    console.error(`${logTag} — FAILED (${code})`, msg, err);
    throw new Error(
      `SMS failed: ${msg || "Unknown AWS SNS error"}${code ? ` (${code})` : ""}`
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
