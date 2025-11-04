// /pages/api/butler.ts
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: "You are the Famous Finds Butler assistant." },
          { role: "user", content: query },
        ],
      }),
    });
    const j = await r.json();
    res.status(200).json({ answer: j.choices?.[0]?.message?.content || "..." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
