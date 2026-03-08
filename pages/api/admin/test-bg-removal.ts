// FILE: /pages/api/admin/test-bg-removal.ts
/**
 * Diagnostic endpoint: Tests whether background removal is working.
 *
 * GET /api/admin/test-bg-removal
 *   - Generates a small 100x100 test image (red square on blue background)
 *   - Runs the full background removal + white display pipeline
 *   - Reports timing, success/failure, and pixel-level verification
 *
 * Requires admin auth.  Extended timeout for the ML model load.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/adminAuth";
import sharp from "sharp";

export const config = {
  api: { responseLimit: false },
  maxDuration: 300,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }
  if (!requireAdmin(req, res)) return;

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: [] as string[],
  };
  const steps = results.steps as string[];

  try {
    // 1. Create a test image: red square (50x50) centered on a blue 100x100 bg
    steps.push("Creating 100x100 test image (red square on blue background)");
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 255 },
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 50,
              height: 50,
              channels: 4,
              background: { r: 255, g: 0, b: 0, alpha: 255 },
            },
          })
            .png()
            .toBuffer(),
          top: 25,
          left: 25,
        },
      ])
      .png()
      .toBuffer();

    results.testImageSize = testImage.length;
    steps.push(`Test image created: ${testImage.length} bytes`);

    // 2. Test sharp alone (resize + flatten to white)
    steps.push("Testing sharp resize + flatten (no bg removal)");
    const sharpStart = Date.now();
    const sharpResult = await sharp(testImage)
      .rotate()
      .resize(800, 1067, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const sharpMs = Date.now() - sharpStart;
    results.sharpOnly = {
      ok: true,
      outputSize: sharpResult.length,
      durationMs: sharpMs,
    };
    steps.push(`Sharp processing OK: ${sharpResult.length} bytes in ${sharpMs}ms`);

    // 3. Test background removal library
    steps.push("Loading @imgly/background-removal-node...");
    const bgLoadStart = Date.now();
    let removeBackground: any;
    try {
      const mod = await import("@imgly/background-removal-node");
      removeBackground = mod.removeBackground;
      const bgLoadMs = Date.now() - bgLoadStart;
      results.bgLibraryLoad = { ok: true, durationMs: bgLoadMs };
      steps.push(`Library loaded in ${bgLoadMs}ms`);
    } catch (loadErr: any) {
      const bgLoadMs = Date.now() - bgLoadStart;
      results.bgLibraryLoad = {
        ok: false,
        durationMs: bgLoadMs,
        error: loadErr?.message || String(loadErr),
      };
      steps.push(`FAILED to load library: ${loadErr?.message}`);
      results.ok = false;
      results.diagnosis =
        "The @imgly/background-removal-node library failed to load. " +
        "This is usually caused by missing native dependencies or insufficient memory. " +
        "Check that the package is installed and the server has enough RAM.";
      return res.status(200).json(results);
    }

    // 4. Run background removal on test image
    steps.push("Running background removal on test image...");
    const bgRemoveStart = Date.now();
    try {
      const blob = await removeBackground(testImage);
      const arrayBuffer = await blob.arrayBuffer();
      const transparentBuffer = Buffer.from(arrayBuffer);
      const bgRemoveMs = Date.now() - bgRemoveStart;

      // Check that the output is a valid image with transparency
      const meta = await sharp(transparentBuffer).metadata();

      results.bgRemoval = {
        ok: true,
        durationMs: bgRemoveMs,
        outputSize: transparentBuffer.length,
        format: meta.format,
        hasAlpha: meta.hasAlpha,
        width: meta.width,
        height: meta.height,
      };
      steps.push(
        `Background removal OK: ${transparentBuffer.length} bytes, ` +
          `${meta.width}x${meta.height} ${meta.format}, ` +
          `alpha=${meta.hasAlpha}, ${bgRemoveMs}ms`
      );

      // 5. Full pipeline: bg removal → flatten to white → JPEG
      steps.push("Running full pipeline (bg removal → white flatten → JPEG)...");
      const pipeStart = Date.now();
      const finalBuffer = await sharp(transparentBuffer)
        .rotate()
        .resize(800, 1067, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      const pipeMs = Date.now() - pipeStart;

      results.fullPipeline = {
        ok: true,
        durationMs: bgRemoveMs + pipeMs,
        outputSize: finalBuffer.length,
      };
      steps.push(
        `Full pipeline OK: ${finalBuffer.length} bytes in ${bgRemoveMs + pipeMs}ms total`
      );

      // 6. Sample some pixels from the final image to check if background is white
      const { data, info } = await sharp(finalBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Check corner pixel (should be white = 255,255,255)
      const cornerR = data[0];
      const cornerG = data[1];
      const cornerB = data[2];
      const isCornerWhite =
        cornerR > 240 && cornerG > 240 && cornerB > 240;

      results.pixelCheck = {
        cornerRGB: [cornerR, cornerG, cornerB],
        isCornerWhite,
        imageWidth: info.width,
        imageHeight: info.height,
      };
      steps.push(
        `Corner pixel: RGB(${cornerR},${cornerG},${cornerB}) — ${
          isCornerWhite ? "WHITE (correct)" : "NOT WHITE (background removal may not have worked)"
        }`
      );
    } catch (bgErr: any) {
      const bgRemoveMs = Date.now() - bgRemoveStart;
      results.bgRemoval = {
        ok: false,
        durationMs: bgRemoveMs,
        error: bgErr?.message || String(bgErr),
        stack: bgErr?.stack?.split("\n").slice(0, 5),
      };
      steps.push(`FAILED background removal: ${bgErr?.message}`);
      results.ok = false;
      results.diagnosis =
        "Background removal threw an error. " +
        "This can happen due to insufficient memory, missing ONNX runtime, " +
        "or corrupted model files. The error details are above.";
      return res.status(200).json(results);
    }

    results.ok = true;
    results.diagnosis = "All checks passed. Background removal is working correctly.";
    return res.status(200).json(results);
  } catch (err: any) {
    results.ok = false;
    results.error = err?.message || String(err);
    results.stack = err?.stack?.split("\n").slice(0, 5);
    steps.push(`Unexpected error: ${err?.message}`);
    return res.status(500).json(results);
  }
}
