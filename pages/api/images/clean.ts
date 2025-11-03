// FILE: /pages/api/images/clean.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";
import sharp from "sharp";
import formidable, { File as FormidableFile } from "formidable";

export const config = {
  api: {
    bodyParser: false,           // we handle multipart
    responseLimit: false,
  },
};
export const runtime = "nodejs";

function parseForm(req: NextApiRequest): Promise<{ files: formidable.Files; fields: formidable.Fields }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 25 * 1024 * 1024 });
    form.parse(req as any, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ files, fields });
    });
  });
}

async function loadInputBuffer(req: NextApiRequest): Promise<Buffer> {
  const url = (req.query.imageUrl as string) || "";

  if (url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);
    const arrayBuf = await resp.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  const { files } = await parseForm(req);
  const f = (files.file || files.image || files.upload) as FormidableFile | FormidableFile[] | undefined;
  const one = Array.isArray(f) ? f[0] : f;
  if (!one || !one.filepath) throw new Error("No file provided. Use field name 'file' or provide ?imageUrl=");
  return await sharp(one.filepath).toBuffer();
}

async function cleanToWhiteSquare(input: Buffer, size = 2000): Promise<Buffer> {
  const normalized = await sharp(input)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .trim(10)
    .toBuffer();

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  });

  const fitted = await sharp(normalized)
    .resize(size, size, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(fitted).metadata();
  const left = Math.floor((size - (meta.width || size)) / 2);
  const top = Math.floor((size - (meta.height || size)) / 2);

  return await canvas
    .composite([{ input: fitted, left, top }])
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4", force: true })
    .toBuffer();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed. POST a file (field 'file') or use ?imageUrl=" });
    }

    const sizeParam = Number(req.query.size || 2000);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const size = clamp(Number.isFinite(sizeParam) ? sizeParam : 2000, 512, 4096);

    const input = await loadInputBuffer(req);
    const cleaned = await cleanToWhiteSquare(input, size);

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "no-store");
    Readable.from(cleaned).pipe(res);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err?.message || "Unable to process image" });
  }
}
