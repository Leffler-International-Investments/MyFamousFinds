// FILE: /pages/seller/bulk-upload.tsx
import { useState } from "react";
import Head from "next/head";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file first.");
    setUploading(true);
    setMessage("Uploading image...");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("sellerId", "demo-seller");
    formData.append("category", "bags");
    formData.append("price", "100");

    const res = await fetch("/api/seller/bulk-commit", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    setMessage(data.success ? "Upload successful!" : "Upload failed.");
  };

  return (
    <>
      <Head><title>Bulk Upload - Seller</title></Head>
      <Header />
      <main className="p-6 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-semibold mb-4">Bulk Upload Listing</h1>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-2 w-full mb-4"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-black text-white px-6 py-2 rounded-md"
        >
          {uploading ? "Uploading..." : "Start Upload"}
        </button>
        <p className="mt-4 text-gray-700">{message}</p>
      </main>
      <Footer />
    </>
  );
}
