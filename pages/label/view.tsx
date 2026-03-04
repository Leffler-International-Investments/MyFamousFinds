// FILE: /pages/label/view.tsx
// Universal shipping label viewer — works on iOS, Android, and desktop.
// Linked from seller emails so download/print works on every device.
//
// Query params:
//   url   – Firebase Storage URL for the label image
//   order – Order ID (display only)

import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useRef, useState } from "react";

export default function LabelView() {
  const router = useRouter();
  const url = String(router.query.url || "");
  const orderId = String(router.query.order || "");
  const imgRef = useRef<HTMLImageElement>(null);
  const [downloading, setDownloading] = useState(false);

  const onDownload = useCallback(async () => {
    if (!url) return;
    setDownloading(true);
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("gif") ? "gif" : "pdf";
      a.download = orderId ? `shipping-label-${orderId}.${ext}` : `shipping-label.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [url, orderId]);

  const onPrint = useCallback(() => {
    if (!url) return;
    const win = window.open("", "_blank");
    if (!win) {
      window.print();
      return;
    }
    win.document.write(
      `<!DOCTYPE html><html><head><title>Print Shipping Label</title>` +
        `<style>@media print{body{margin:0}img{max-width:100%;height:auto}}</style>` +
        `</head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh">` +
        `<img src="${url}" style="max-width:100%;height:auto" onload="window.print();window.close()" />` +
        `</body></html>`
    );
    win.document.close();
  }, [url]);

  if (!url) {
    return (
      <>
        <Head>
          <title>Shipping Label — Famous Finds</title>
        </Head>
        <div style={styles.page}>
          <div style={styles.card}>
            <p style={{ color: "#78716c", fontSize: 16 }}>
              No label URL provided. Please use the link from your email.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Shipping Label{orderId ? ` — ${orderId}` : ""} — Famous Finds</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <p style={styles.headerTitle}>UPS SHIPPING LABEL</p>
            {orderId && <p style={styles.headerSub}>Order {orderId}</p>}
          </div>

          <div style={styles.imageWrap}>
            <img ref={imgRef} src={url} alt="Shipping Label" style={styles.image} />
          </div>

          <div style={styles.actions}>
            <button style={styles.btnDownload} onClick={onDownload} disabled={downloading}>
              {downloading ? "Downloading…" : "Download Label"}
            </button>
            <button style={styles.btnPrint} onClick={onPrint}>
              Print Label
            </button>
          </div>

          <p style={styles.hint}>
            Tip: On iPhone/iPad, tap <strong>Download</strong> to save the label to your
            Files app, or tap <strong>Print</strong> to send it directly to a nearby AirPrint
            printer.
          </p>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f4",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    maxWidth: 520,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    background: "#1c1917",
    padding: "20px 24px",
  },
  headerTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "#d4a843",
    letterSpacing: 0.5,
  },
  headerSub: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#a8a29e",
  },
  imageWrap: {
    padding: 20,
    background: "#ffffff",
    display: "flex",
    justifyContent: "center",
  },
  image: {
    maxWidth: "100%",
    width: 400,
    height: "auto",
    border: "1px solid #e7e5e4",
    borderRadius: 8,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    padding: "0 24px 24px",
    flexWrap: "wrap" as const,
  },
  btnDownload: {
    flex: "1 1 auto",
    minWidth: 160,
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    background: "#b8860b",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  btnPrint: {
    flex: "1 1 auto",
    minWidth: 160,
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    background: "#1c1917",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  hint: {
    margin: 0,
    padding: "0 24px 20px",
    fontSize: 13,
    color: "#78716c",
    lineHeight: 1.5,
    textAlign: "center" as const,
  },
};
