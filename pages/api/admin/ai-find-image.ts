// FILE: /pages/api/admin/ai-find-image.ts
// Uses Claude + web_search to find the original designer product image for a listing.
// POST body: { listingId, title, brand }
// Returns: { imageUrl: string } or { error: string }

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";

type Result = { imageUrl: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  const { title, brand } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const searchQuery = `${brand || ""} ${title}`.trim();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
          },
        ],
        system:
          "You are a luxury product image finder. Given a product name and brand, find the official or most authoritative product image URL on the web. Use web search to find a direct image URL (.jpg, .jpeg, .png, .webp) from an official brand website, major retailer, or trusted source like Net-a-Porter, Farfetch, Saks, or the brand's own website. Return ONLY a raw JSON object with no markdown, no code fences, no explanation: {\"imageUrl\": \"<direct_image_url>\"}",
        messages: [
          {
            role: "user",
            content: `Find the original official product image URL for this luxury item: "${searchQuery}". Return only JSON with the imageUrl.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[ai-find-image] Anthropic API error:", errText);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();

    // Extract the final text block from Claude's response
    const textBlock = (data.content || [])
      .filter((b: any) => b.type === "text")
      .pop();

    if (!textBlock?.text) {
      return res.status(404).json({ error: "No result from AI" });
    }

    // Parse JSON from Claude's response
    try {
      const raw = textBlock.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(raw);
      if (parsed.imageUrl && typeof parsed.imageUrl === "string") {
        return res.status(200).json({ imageUrl: parsed.imageUrl });
      }
    } catch {
      // Claude may have returned a URL inline — extract it
      const urlMatch = textBlock.text.match(
        /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/i
      );
      if (urlMatch) {
        return res.status(200).json({ imageUrl: urlMatch[0] });
      }
    }

    return res.status(404).json({ error: "Image URL not found" });
  } catch (err: any) {
    console.error("[ai-find-image] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
