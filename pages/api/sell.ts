// FILE: pages/api/sell.ts
export const config = { api: { bodyParser: false } } // accept FormData
import type { NextApiRequest, NextApiResponse } from 'next'


export default async function handler(req: NextApiRequest, res: NextApiResponse){
if (req.method !== 'POST') return res.status(405).end()
// In a real build, parse FormData, run AI triage, store pending listing in DB.
// For MVP demo we simply respond OK so UI can visualize the flow.
res.status(201).json({ ok: true })
}
