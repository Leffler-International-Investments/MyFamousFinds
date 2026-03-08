// FILE: /pages/api/seller/upload-with-processing.ts

import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import sharp from "sharp";
import {
  hasStorageBucket,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
  maxDuration: 300,
};

type ApiOk = {
  ok: true;
  imageUrl: string;
  displayImageUrl: string;
};

type ApiErr = {
  ok: false;
  error: string;
};

function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFileSize: 25 * 1024 * 1024,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
}

function pickFile(files: formidable.Files) {
  const file = files.image || files.file || files.upload || null;
  if (Array.isArray(file)) return file[0];
  return file || null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const file = pickFile(files);

    if (!file || Array.isArray(file)) {
      return res.status(400).json({ ok: false, error: "Missing image file" });
    }

    const buffer = await fs.readFile(file.filepath);
    const contentType = file.mimetype || "image/jpeg";

    if (!hasStorageBucket()) {
      const compressedBuffer = await sharp(buffer)
        .rotate()
        .resize(800, 1067, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer();
      const compressedUrl = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
      return res.status(200).json({
        ok: true,
        imageUrl: compressedUrl,
        displayImageUrl: compressedUrl,
      });
    }

    const stored = await storeListingImages(
      { buffer, contentType },
      "listing-images"
    );

    return res.status(200).json({
      ok: true,
      imageUrl: stored.originalUrl,
      displayImageUrl: stored.displayUrl,
    });
  } catch (error: any) {
    console.error("Image processing error:", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Upload failed" });
  }
}
