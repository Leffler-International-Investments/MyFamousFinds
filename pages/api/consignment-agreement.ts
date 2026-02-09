// FILE: /pages/api/consignment-agreement.ts
//
// Generates a PDF Consignment Agreement for a listing submission.
// Called after the seller submits the sell form.
// Stores the signed agreement metadata in Firestore and returns the PDF.

import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { adminDb, FieldValue } from "../../utils/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      sellerName,
      sellerEmail,
      itemTitle,
      itemBrand,
      itemCondition,
      itemPrice,
      itemSerialNumber,
      itemDetails,
      submissionId,
    } = req.body || {};

    if (!sellerName || !sellerEmail || !itemTitle) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const agreementDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const agreementId = `CA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // ── Build PDF ──
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const page = pdf.addPage([612, 792]); // US Letter
    const { height } = page.getSize();
    let y = height - 50;
    const margin = 50;
    const lineHeight = 16;
    const smallLine = 14;

    function drawText(text: string, options?: { bold?: boolean; size?: number; indent?: number }) {
      const f = options?.bold ? fontBold : font;
      const size = options?.size || 11;
      const x = margin + (options?.indent || 0);
      page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }

    function drawLine() {
      page.drawLine({
        start: { x: margin, y },
        end: { x: 562, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= 10;
    }

    function skip(n = 1) { y -= lineHeight * n; }

    // Header
    page.drawText("FAMOUS FINDS", { x: margin, y, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 28;
    drawText("CONSIGNMENT AGREEMENT", { bold: true, size: 14 });
    skip(0.5);
    drawLine();
    skip(0.5);

    // Agreement ID and date
    drawText(`Agreement ID: ${agreementId}`, { size: 9 });
    drawText(`Date: ${agreementDate}`, { size: 9 });
    skip(0.5);

    // Parties
    drawText("PARTIES", { bold: true, size: 12 });
    skip(0.3);
    drawText(`Consignor (Seller): ${sellerName}`, { indent: 10 });
    drawText(`Email: ${sellerEmail}`, { indent: 10 });
    skip(0.3);
    drawText('Consignee (Platform): Famous Finds ("the Platform")', { indent: 10 });
    skip(0.5);

    // Item details
    drawText("CONSIGNED ITEM", { bold: true, size: 12 });
    skip(0.3);
    drawText(`Item: ${itemTitle}`, { indent: 10 });
    drawText(`Brand/Designer: ${itemBrand || "N/A"}`, { indent: 10 });
    if (itemCondition) drawText(`Condition: ${itemCondition}`, { indent: 10 });
    if (itemPrice) drawText(`Listing Price (USD): $${Number(itemPrice).toLocaleString()}`, { indent: 10 });
    if (itemSerialNumber) drawText(`Serial Number: ${itemSerialNumber}`, { indent: 10 });
    if (itemDetails) {
      const details = String(itemDetails).slice(0, 200);
      drawText(`Additional Details: ${details}`, { indent: 10 });
    }
    skip(0.5);

    // Terms
    drawText("TERMS AND CONDITIONS", { bold: true, size: 12 });
    skip(0.3);

    const terms = [
      "1. Authorization to Sell: The Consignor hereby authorizes Famous Finds to list, market, and sell the above-described item on its platform on behalf of the Consignor.",
      "2. Ownership & Authenticity: The Consignor represents and warrants that they are the lawful owner of the item, that the item is authentic, and that they have the legal right to consign it for sale.",
      "3. Condition: The Consignor confirms that the item's condition has been accurately described and that all known defects have been disclosed.",
      "4. Pricing: The item will be listed at the agreed price. Famous Finds may suggest price adjustments, subject to Consignor approval.",
      "5. Commission: Famous Finds will retain a platform commission (as stated in the current fee schedule) from the sale proceeds. The remaining balance will be paid to the Consignor after the cooling period.",
      "6. Cooling Period: After delivery confirmation and signature verification, a cooling period applies before payout, as specified in the platform's payout settings.",
      "7. Returns & Disputes: In the event of a buyer dispute regarding authenticity, the Consignor agrees to cooperate with the platform's resolution process.",
      "8. Liability: The Consignor is solely responsible for any claims, damages, or liabilities arising from the sale of the item, including claims of non-authenticity.",
      "9. Termination: Either party may terminate this agreement at any time prior to sale. If the item has not sold, it will be returned to the Consignor.",
      "10. Governing Law: This agreement is governed by the laws of the State of New York, United States.",
    ];

    for (const term of terms) {
      // Word-wrap long lines
      const words = term.split(" ");
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, 10) > 490) {
          page.drawText(line, { x: margin + 10, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
          y -= smallLine;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        page.drawText(line, { x: margin + 10, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        y -= smallLine;
      }
      y -= 4; // spacing between terms
    }

    skip(0.5);
    drawLine();
    skip(0.3);

    // Digital signature block
    drawText("DIGITAL CONSENT", { bold: true, size: 12 });
    skip(0.3);
    drawText(`By submitting the listing form on ${agreementDate}, the Consignor`, { indent: 10 });
    drawText("electronically agrees to the terms of this Consignment Agreement.", { indent: 10 });
    skip(0.5);
    drawText(`Consignor: ${sellerName}`, { indent: 10, bold: true });
    drawText(`Email: ${sellerEmail}`, { indent: 10 });
    drawText(`Date Signed: ${agreementDate}`, { indent: 10 });
    if (submissionId) drawText(`Submission Reference: ${submissionId}`, { indent: 10 });

    skip(1);
    page.drawText("This document was auto-generated by Famous Finds upon listing submission.", {
      x: margin,
      y,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdf.save();

    // ── Store agreement metadata in Firestore ──
    if (adminDb) {
      try {
        await adminDb.collection("consignment_agreements").add({
          agreementId,
          submissionId: submissionId || null,
          sellerName,
          sellerEmail,
          itemTitle,
          itemBrand: itemBrand || null,
          itemPrice: itemPrice ? Number(itemPrice) : null,
          signedAt: new Date(),
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (dbErr) {
        console.error("Failed to store consignment agreement:", dbErr);
        // Don't block PDF generation if DB write fails
      }
    }

    // Also update the listing submission with the agreement ID
    if (adminDb && submissionId) {
      try {
        await adminDb.collection("listing_submissions").doc(submissionId).set(
          { consignmentAgreementId: agreementId, consignmentSignedAt: new Date() },
          { merge: true }
        );
      } catch {
        // non-fatal
      }
    }

    // Return PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="FamousFinds-Consignment-${agreementId}.pdf"`
    );
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error("consignment-agreement error:", err);
    res.status(500).json({ ok: false, error: err?.message || "Failed to generate agreement" });
  }
}
