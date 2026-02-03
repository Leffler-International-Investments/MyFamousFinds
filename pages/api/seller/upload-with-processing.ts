// FILE: /pages/api/seller/upload-with-processing.ts

import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import {
  createWhiteDisplayImage,
  hasStorageBucket,
  storeListingImages,
} from "../../../utils/listingImageProcessing";

export const config = {
  api: {
    bodyParser: false, // We need to disable the default parser
  },
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
      const displayBuffer = await createWhiteDisplayImage(buffer, contentType);
      return res.status(200).json({
        ok: true,
        imageUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        displayImageUrl: `data:image/jpeg;base64,${displayBuffer.toString("base64")}`,
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
