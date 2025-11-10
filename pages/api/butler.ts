// FILE: /pages/api/butler.ts
// This is the NEW file that makes the chat respond.
// Please CREATE this file.

import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  answer: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ answer: "I can only accept POST requests." });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ answer: "Pardon me, you didn't say anything." });
  }

  // A simple canned response for demonstration.
  // This can be replaced with a real AI call later.
  const cannedResponse = `Ah, an excellent query regarding "${query}". While I search our exclusive catalogue for that, please feel free to browse our new arrivals.`;

  // Send the response back
  res.status(200).json({ answer: cannedResponse });
}
