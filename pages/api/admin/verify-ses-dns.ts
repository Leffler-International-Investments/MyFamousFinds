// FILE: /pages/api/admin/verify-ses-dns.ts
// Diagnostic endpoint — resolves DNS to check whether the DKIM, MAIL FROM,
// SPF, and DMARC records required by AWS SES are visible on the public DNS.
// Usage:  GET /api/admin/verify-ses-dns?key=<ADMIN_PASSWORD>

import type { NextApiRequest, NextApiResponse } from "next";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);

const DOMAIN = "myfamousfinds.com";

/** Expected records — keep in sync with /config/aws-ses-dns-records.json */
const DKIM_HOSTS = [
  "nl5wucbtqwe2j4oqnhbi32efpwa6j7jr",
  "pnbl2z5gtjqs5poinfs4sim3n76y5cd",
  "uduetbrxzyqzlwoyaziiiglxz7mwqivr",
];

interface RecordCheck {
  name: string;
  type: string;
  expected: string;
  actual: string | null;
  ok: boolean;
}

function readBearer(req: NextApiRequest) {
  const h = req.headers.authorization;
  const v = Array.isArray(h) ? h[0] : h;
  if (!v) return "";
  return v.toLowerCase().startsWith("bearer ") ? v.slice(7).trim() : v.trim();
}

async function checkCname(host: string, expected: string): Promise<RecordCheck> {
  try {
    const records = await resolveCname(host);
    const match = records.some(
      (r) => r.replace(/\.$/, "").toLowerCase() === expected.toLowerCase()
    );
    return {
      name: host,
      type: "CNAME",
      expected,
      actual: records.join(", ") || null,
      ok: match,
    };
  } catch {
    return { name: host, type: "CNAME", expected, actual: null, ok: false };
  }
}

async function checkMx(host: string, expectedExchange: string): Promise<RecordCheck> {
  try {
    const records = await resolveMx(host);
    const match = records.some(
      (r) =>
        r.exchange.replace(/\.$/, "").toLowerCase() ===
        expectedExchange.toLowerCase()
    );
    return {
      name: host,
      type: "MX",
      expected: expectedExchange,
      actual: records.map((r) => `${r.priority} ${r.exchange}`).join(", ") || null,
      ok: match,
    };
  } catch {
    return { name: host, type: "MX", expected: expectedExchange, actual: null, ok: false };
  }
}

async function checkTxt(host: string, expectedSubstring: string): Promise<RecordCheck> {
  try {
    const records = await resolveTxt(host);
    const flat = records.map((chunks) => chunks.join(""));
    const match = flat.some((r) =>
      r.toLowerCase().includes(expectedSubstring.toLowerCase())
    );
    return {
      name: host,
      type: "TXT",
      expected: `contains "${expectedSubstring}"`,
      actual: flat.join(" | ") || null,
      ok: match,
    };
  } catch {
    return {
      name: host,
      type: "TXT",
      expected: `contains "${expectedSubstring}"`,
      actual: null,
      ok: false,
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "GET or POST only" });
  }

  // Auth check — accepts key via query param, Bearer header, or POST body
  const adminPass = String(process.env.ADMIN_PASSWORD || "").trim();
  if (!adminPass) {
    return res
      .status(500)
      .json({ ok: false, error: "ADMIN_PASSWORD is not set." });
  }
  const bodyKey = req.method === "POST" ? String(req.body?.key || "").trim() : "";
  const pass = readBearer(req) || bodyKey || String(req.query.key || "").trim();
  if (!pass || pass !== adminPass) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const results: RecordCheck[] = [];

  // 1. DKIM CNAME records
  await Promise.all(
    DKIM_HOSTS.map(async (selector) => {
      const host = `${selector}._domainkey.${DOMAIN}`;
      const expected = `${selector}.dkim.amazonses.com`;
      const check = await checkCname(host, expected);
      results.push(check);
    })
  );

  // 2. MAIL FROM MX record
  results.push(
    await checkMx(
      `mail.${DOMAIN}`,
      "feedback-smtp.us-east-1.amazonses.com"
    )
  );

  // 3. MAIL FROM SPF record
  results.push(
    await checkTxt(`mail.${DOMAIN}`, "include:amazonses.com")
  );

  // 4. DMARC record
  results.push(await checkTxt(`_dmarc.${DOMAIN}`, "v=DMARC1"));

  // 5. Root-domain inbound MX (Google Workspace handles inbound mail)
  results.push(
    await checkMx(DOMAIN, "aspmx.l.google.com")
  );

  // 6. Root-domain SPF
  results.push(await checkTxt(DOMAIN, "include:amazonses.com"));

  const allOk = results.every((r) => r.ok);

  return res.status(200).json({
    ok: allOk,
    domain: DOMAIN,
    summary: allOk
      ? "All DNS records verified — SES should be functional."
      : "Some DNS records are missing or incorrect. See details below.",
    checks: results,
    nextSteps: allOk
      ? [
          "If AWS SES still shows 'Pending', wait up to 72 hours for AWS to detect the records.",
          "Once DKIM shows 'Verified', request production access in SES to leave sandbox mode.",
          "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Vercel env vars.",
        ]
      : [
          "Check the failed records in Vercel DNS and correct the values.",
          "Make sure CNAME values end with .dkim.amazonses.com (no trailing dot or extra text).",
          "Vercel auto-appends the domain — use short hostnames only (e.g. 'abc._domainkey', not 'abc._domainkey.myfamousfinds.com').",
          "After fixing, wait 5-15 minutes for DNS propagation, then re-run this check.",
        ],
  });
}
