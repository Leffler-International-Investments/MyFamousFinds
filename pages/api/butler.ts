// FILE: /pages/api/butler.ts

import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  answer: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ answer: "I can only accept POST requests, please." });
  }

  const { query } = req.body as { query?: string };

  if (!query || typeof query !== "string") {
    return res
      .status(400)
      .json({ answer: "Pardon me, you didn’t actually ask me anything." });
  }

  // Simple canned response for now – replace later with real AI call
  const cleaned = query.trim();
  const cannedResponse =
    `Ah, an excellent query regarding "${cleaned}". ` +
    "Right now I’m a demo concierge, so I can’t search live stock yet, " +
    "but I would normally look through the Famous Finds catalogue for you " +
    "and suggest matching bags, watches, jewelry or other pieces.";

  return res.status(200).json({ answer: cannedResponse });
}
