// FILE: /components/ImageUploader.tsx
import { useState } from "react";
import { storage } from "../utils/firebaseClient";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

type ImageUploaderProps = {
  maxImages?: number; // currently we use 1, but we keep it flexible
  onUploadStart?: () => void;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
};

export default function ImageUploader({
  maxImages = 1,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Only one image is actually supported right now (maxImages is just future-proof)
    setPreview(URL.createObjectURL(file));
    e.target.value = "";

    uploadFile(file);
  };

  const uploadFile = (file: File) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      onUploadStart?.();

      const path = `listings/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        (snapshot) => {
          const pct =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(pct);
        },
        (err) => {
          console.error(err);
          const msg = "Image upload failed. Please try again.";
          setError(msg);
          setUploading(false);
          onUploadError?.(msg);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploading(false);
          onUploadComplete(url);
        }
      );
    } catch (err) {
      console.error(err);
      const msg = "Unexpected error uploading image.";
      setError(msg);
      setUploading(false);
      onUploadError?.(msg);
    }
  };

  return (
    <div className="uploader">
      <label
        htmlFor="file-input"
        className="fileLabel"
        style={{
          background: preview ? "#4b5563" : "#2563eb",
          cursor: uploading ? "wait" : "pointer",
        }}
      >
        {uploading
          ? `Uploading ${progress.toFixed(0)}%...`
          : preview
          ? "Change Image"
          : "Select Image"}
      </label>

      <input
        id="file-input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        disabled={uploading}
        onChange={handleFileChange}
      />

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {error && <p className="err">{error}</p>}

      <style jsx>{`
        .uploader {
          border: 1px solid #374151;
          border-radius: 8px;
          padding: 12px;
          background: #020617;
        }
        .fileLabel {
          display: block;
          width: 100%;
          text-align: center;
          padding: 10px 14px;
          color: #fff;
          border-radius: 6px;
          font-size: 14px;
        }
        .preview {
          margin-top: 12px;
          border-radius: 6px;
          overflow: hidden;
          height: 180px;
        }
        .preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .err {
          margin-top: 8px;
          color: #f87171;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
