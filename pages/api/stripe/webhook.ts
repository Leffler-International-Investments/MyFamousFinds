// FILE: /pages/api/stripe/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import webhookHandler from "../webhooks/stripe";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return webhookHandler(req, res);
}
