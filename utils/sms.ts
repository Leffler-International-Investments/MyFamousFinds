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
// SNS SenderID must be 1-11 alphanumeric characters (AWS rejects longer values)
// NOTE: SenderID is NOT supported in the US/Canada — only used for countries that allow it.
const rawSenderId = cleanEnv(process.env.AWS_SNS_SENDER_ID) || "FamousFinds";
const AWS_SNS_SENDER_ID = rawSenderId.replace(/[^A-Za-z0-9]/g, "").slice(0, 11) || "FamousFinds";
// Origination number (toll-free, 10DLC, or short code) — required for US/CA SMS delivery.
// Set this env var to your registered origination number (e.g. "+18005551234").
const AWS_SNS_ORIGINATION_NUMBER = cleanEnv(process.env.AWS_SNS_ORIGINATION_NUMBER) || "";

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

/**
 * Check if a phone number is a US or Canadian number (country code +1).
 */
function isNorthAmerican(e164Phone: string): boolean {
  return e164Phone.startsWith("+1");
}

export async function sendSms(to: string, body: string) {
  const normalizedTo = normalizePhoneE164(to);
  const logTag = `[SMS] to=${normalizedTo}`;
  console.log(`${logTag} — attempting to send via AWS SNS`);
  try {
    const client = getClient();

    // Build message attributes
    const messageAttributes: Record<string, { DataType: string; StringValue: string }> = {
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: AWS_SNS_SMS_TYPE,
      },
    };

    // SenderID is NOT supported in the US/Canada and can cause delivery failures.
    // Only include it for international (non +1) numbers.
    if (!isNorthAmerican(normalizedTo)) {
      messageAttributes["AWS.SNS.SMS.SenderID"] = {
        DataType: "String",
        StringValue: AWS_SNS_SENDER_ID,
      };
    }

    // For US/CA, an origination number (toll-free, 10DLC, short code) is required
    // for reliable delivery. If configured, include it.
    if (isNorthAmerican(normalizedTo) && AWS_SNS_ORIGINATION_NUMBER) {
      messageAttributes["AWS.MM.SMS.OriginationNumber"] = {
        DataType: "String",
        StringValue: AWS_SNS_ORIGINATION_NUMBER,
      };
    }

    const command = new PublishCommand({
      PhoneNumber: normalizedTo,
      Message: body,
      MessageAttributes: messageAttributes,
    });
    const result = await client.send(command);
    console.log(`${logTag} — sent successfully (messageId=${result.MessageId})`);
    return { sid: result.MessageId || "" };
  } catch (err: any) {
    const code = err?.name || err?.code || "";
    const msg = err?.message || "";
    console.error(`${logTag} — FAILED (${code})`, msg, err);
    // Extra guidance for common SNS failures
    if (msg.includes("sandbox") || msg.includes("OptInRequired") || code === "AuthorizationError") {
      console.error(
        `${logTag} — HINT: Your AWS account may be in SMS sandbox mode.\n` +
        `  In sandbox mode, SMS can only be sent to verified phone numbers.\n` +
        `  To send to any number (including international +61 AU, +972 IL):\n` +
        `  1. Go to AWS SNS Console → Text messaging (SMS) → Exit SMS sandbox\n` +
        `  2. Increase your monthly SMS spending limit above $1 (default).`
      );
    }
    if (isNorthAmerican(normalizedTo) && !AWS_SNS_ORIGINATION_NUMBER) {
      console.error(
        `${logTag} — HINT: For US/Canada SMS, you need a registered origination number.\n` +
        `  Set the AWS_SNS_ORIGINATION_NUMBER env var to your toll-free number, 10DLC, or short code.\n` +
        `  Without it, AWS SNS will silently drop or reject US-bound messages.`
      );
    }
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
