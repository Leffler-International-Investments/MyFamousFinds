import type { NextApiRequest, NextApiResponse } from "next";
import { removeBackground } from "@imgly/background-removal-node";

export const config = {
  api: {
    bodyParser: false
  },
  maxDuration: 60,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const chunks: Uint8Array[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    console.log("[bg-removal] Starting local background removal, image size:", buffer.byteLength);
    const inputBlob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
    const resultBlob = await removeBackground(inputBlob, {
      model: "medium",
      output: { format: "image/png" },
    });
    const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());
    console.log("[bg-removal] Success, received", resultBuffer.byteLength, "bytes");

    res.setHeader("Content-Type", "image/png");
    res.send(resultBuffer);

  } catch (error) {
    console.error("[bg-removal] Handler error:", (error as any)?.message || error);
    res.status(500).json({ error: "Image processing failed", detail: (error as any)?.message });
  }
}
