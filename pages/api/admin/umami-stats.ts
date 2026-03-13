// FILE: /pages/api/admin/umami-stats.ts
// Proxies Umami Cloud API requests so the API key stays server-side.
// Used by the management analytics dashboard to display website traffic data.

import type { NextApiRequest, NextApiResponse } from "next";

const UMAMI_API_URL = process.env.UMAMI_API_URL;
const UMAMI_API_KEY = process.env.UMAMI_API_KEY;
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!UMAMI_API_URL || !UMAMI_API_KEY || !UMAMI_WEBSITE_ID) {
    return res.status(503).json({ error: "Umami not configured" });
  }

  try {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const headers = {
      Accept: "application/json",
      "x-umami-api-key": UMAMI_API_KEY,
    };

    // Fetch active visitors, 24h stats, 7d stats, and 30d stats in parallel
    const [activeRes, stats24hRes, stats7dRes, stats30dRes, topPagesRes, topReferrersRes] =
      await Promise.all([
        fetch(`${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/active`, { headers }),
        fetch(
          `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${oneDayAgo}&endAt=${now}`,
          { headers },
        ),
        fetch(
          `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${sevenDaysAgo}&endAt=${now}`,
          { headers },
        ),
        fetch(
          `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${thirtyDaysAgo}&endAt=${now}`,
          { headers },
        ),
        fetch(
          `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${sevenDaysAgo}&endAt=${now}&type=url&limit=10`,
          { headers },
        ),
        fetch(
          `${UMAMI_API_URL}/api/websites/${UMAMI_WEBSITE_ID}/metrics?startAt=${sevenDaysAgo}&endAt=${now}&type=referrer&limit=10`,
          { headers },
        ),
      ]);

    const [active, stats24h, stats7d, stats30d, topPages, topReferrers] = await Promise.all([
      activeRes.ok ? activeRes.json() : null,
      stats24hRes.ok ? stats24hRes.json() : null,
      stats7dRes.ok ? stats7dRes.json() : null,
      stats30dRes.ok ? stats30dRes.json() : null,
      topPagesRes.ok ? topPagesRes.json() : [],
      topReferrersRes.ok ? topReferrersRes.json() : [],
    ]);

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      active: active?.[0]?.x ?? active?.x ?? 0,
      stats24h: stats24h ?? {},
      stats7d: stats7d ?? {},
      stats30d: stats30d ?? {},
      topPages: Array.isArray(topPages) ? topPages : [],
      topReferrers: Array.isArray(topReferrers) ? topReferrers : [],
    });
  } catch (err) {
    console.error("Umami API error:", err);
    return res.status(502).json({ error: "Failed to fetch Umami data" });
  }
}
