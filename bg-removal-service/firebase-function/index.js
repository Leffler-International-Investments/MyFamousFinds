const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const path = require("path");

if (!admin.apps.length) {
  admin.initializeApp();
}

const storage = admin.storage();

const WATCH_PATH = functions.config().bgremoval?.watch_path || "products/";
const OUTPUT_SUFFIX = "_nobg";
const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

exports.removeBackground = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB",
  })
  .storage.object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const bucket = storage.bucket(object.bucket);

    if (!filePath.startsWith(WATCH_PATH)) {
      console.log(`Skipping ${filePath} — not in watched path ${WATCH_PATH}`);
      return null;
    }

    const fileName = path.basename(filePath, path.extname(filePath));
    if (fileName.endsWith(OUTPUT_SUFFIX)) {
      console.log(`Skipping ${filePath} — already processed`);
      return null;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`Skipping ${filePath} — unsupported extension: ${ext}`);
      return null;
    }

    if (!contentType || !contentType.startsWith("image/")) {
      console.log(`Skipping ${filePath} — not an image content type`);
      return null;
    }

    console.log(`Processing background removal for: ${filePath}`);

    try {
      const file = bucket.file(filePath);
      const [imageBuffer] = await file.download();
      console.log(`Downloaded ${filePath}: ${imageBuffer.length} bytes`);

      const serviceUrl = functions.config().bgremoval?.service_url;
      const apiKey = functions.config().bgremoval?.api_key;

      if (!serviceUrl) {
        throw new Error(
          "bgremoval.service_url not configured. Run: firebase functions:config:set bgremoval.service_url=YOUR_URL"
        );
      }

      const headers = { "Content-Type": contentType };
      if (apiKey) headers["x-api-key"] = apiKey;

      const response = await fetch(`${serviceUrl}/remove-bg`, {
        method: "POST",
        headers,
        body: imageBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `BG removal service returned ${response.status}: ${errorText}`
        );
      }

      const processedBuffer = await response.buffer();
      console.log(`BG removed: ${processedBuffer.length} bytes`);

      const dir = path.dirname(filePath);
      const outputPath = path.join(dir, `${fileName}${OUTPUT_SUFFIX}.png`);

      const outputFile = bucket.file(outputPath);
      await outputFile.save(processedBuffer, {
        metadata: {
          contentType: "image/png",
          metadata: {
            originalFile: filePath,
            processedBy: "bg-removal-service",
            processedAt: new Date().toISOString(),
          },
        },
      });

      await outputFile.makePublic();

      const publicUrl = `https://storage.googleapis.com/${object.bucket}/${outputPath}`;
      console.log(`Saved processed image: ${outputPath}`);
      console.log(`Public URL: ${publicUrl}`);

      // OPTIONAL — uncomment and adjust to update Firestore:
      // const db = admin.firestore();
      // const itemId = fileName;
      // await db.collection("listings").doc(itemId).update({
      //   imageNoBg: publicUrl,
      //   imageNoBgProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
      // });

      return { success: true, outputPath, publicUrl };
    } catch (error) {
      console.error(`Background removal failed for ${filePath}:`, error);
      return { success: false, error: error.message };
    }
  });
