// FILE: /lib/imageProcessing.ts

import sharp from "sharp";

/**
 * Image processing utility for background removal and white background compositing.
 *
 * Uses remove.bg API for background removal, then composites onto pure white (#FFFFFF).
 * Falls back to alpha flattening if API key is missing or API fails.
 */

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || "";

export type ProcessedImageResult = {
  success: boolean;
  processedBuffer?: Buffer;
  error?: string;
  usedBackgroundRemoval: boolean;
};

/**
 * Remove background using remove.bg API
 * Returns PNG buffer with transparent background
 */
async function removeBackgroundWithApi(imageBuffer: Buffer): Promise<Buffer | null> {
  if (!REMOVE_BG_API_KEY) {
    console.log("[imageProcessing] No REMOVE_BG_API_KEY set, skipping background removal");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("image_file", new Blob([imageBuffer]), "image.jpg");
    formData.append("size", "auto");
    formData.append("format", "png");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[imageProcessing] remove.bg API error:", response.status, errorText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[imageProcessing] remove.bg API call failed:", error);
    return null;
  }
}

/**
 * Composite image onto pure white background using Sharp
 */
async function compositeOntoWhite(imageBuffer: Buffer): Promise<Buffer> {
  // Get image metadata to know dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1080;
  const height = metadata.height || 1080;

  // Create a white background
  const whiteBackground = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Composite the image onto the white background
  const result = await sharp(whiteBackground)
    .composite([{ input: imageBuffer, blend: "over" }])
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();

  return result;
}

/**
 * Flatten any alpha channel onto white (for images without background removal)
 */
async function flattenToWhite(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(1200, 1200, {
      fit: "inside",
      withoutEnlargement: true,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

/**
 * Main processing function: removes background and composites onto white
 *
 * Steps:
 * 1. Try to remove background using remove.bg API
 * 2. If successful, composite the transparent PNG onto white
 * 3. If API fails or key missing, flatten alpha to white (for transparent PNGs)
 * 4. Output as optimized JPEG
 */
export async function processImageWithWhiteBackground(
  imageBuffer: Buffer
): Promise<ProcessedImageResult> {
  try {
    // Step 1: Try background removal API
    const transparentPng = await removeBackgroundWithApi(imageBuffer);

    if (transparentPng) {
      // Step 2: Composite onto white background
      const processedBuffer = await compositeOntoWhite(transparentPng);
      return {
        success: true,
        processedBuffer,
        usedBackgroundRemoval: true,
      };
    }

    // Step 3: Fallback - just flatten alpha to white
    const processedBuffer = await flattenToWhite(imageBuffer);
    return {
      success: true,
      processedBuffer,
      usedBackgroundRemoval: false,
    };
  } catch (error) {
    console.error("[imageProcessing] Processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      usedBackgroundRemoval: false,
    };
  }
}

/**
 * Process a base64 data URL and return processed base64
 */
export async function processBase64Image(
  base64DataUrl: string
): Promise<{ success: boolean; processedDataUrl?: string; error?: string }> {
  try {
    // Extract base64 from data URL
    const match = base64DataUrl.match(/^data:image\/([a-zA-Z]*);base64,([^"]*)/);
    const rawBase64 = match ? match[2] : base64DataUrl;
    const buffer = Buffer.from(rawBase64, "base64");

    const result = await processImageWithWhiteBackground(buffer);

    if (!result.success || !result.processedBuffer) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      processedDataUrl: `data:image/jpeg;base64,${result.processedBuffer.toString("base64")}`,
    };
  } catch (error) {
    console.error("[imageProcessing] Base64 processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process image from URL and return processed buffer
 */
export async function processImageFromUrl(
  imageUrl: string
): Promise<ProcessedImageResult> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch image: ${response.status}`,
        usedBackgroundRemoval: false,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return processImageWithWhiteBackground(buffer);
  } catch (error) {
    console.error("[imageProcessing] URL processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      usedBackgroundRemoval: false,
    };
  }
}
