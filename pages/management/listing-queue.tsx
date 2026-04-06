// FILE: /pages/management/listing-queue.tsx
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";
import { useState, useMemo } from "react";
import { inferCategoryGroup } from "../../utils/authentication/categoryRules";
import { extractSignals } from "../../utils/authentication/identifierParser";
import { analyzeImageSignals } from "../../utils/authentication/imageSignals";
import { computeScore, DEFAULT_WEIGHTS } from "../../utils/authentication/scoring";
import type { CategoryGroup } from "../../utils/authentication/categoryRules";
import type { ExtractedSignals } from "../../utils/authentication/identifierParser";
import type { ScoreBreakdown, RiskBand, AiRecommendation } from "../../utils/authentication/scoring";

type Listing = {
  id: string;
  title: string;
  seller: string;
  sellerId: string;
  category: string;
  price: number;
  status: "Pending" | "Live" | "Rejected";
  purchase_source: string;
  purchase_proof: string;
  proof_doc_url: string;
  details: string;
  serial_number: string;
  catalogue_number: string;
  date_code: string;
  auth_photos: string[];
  submittedAt: string;
  brand: string;
  designer: string;
  model: string;
  color: string;
  material: string;
  condition: string;
  image_url: string;
  authenticationStatus: string;
};

type ReferenceItem = {
  id: string;
  brand: string;
  title: string;
  category: string;
  categoryGroup: string;
  model: string;
  color: string;
  material: string;
  styleNumber: string;
  catalogueNumber: string;
  serialFormat: string;
  referenceNumber: string;
  keywords: string[];
  imageUrls: string[];
  notes: string;
  active: boolean;
};

type VerificationCandidate = {
  id: string;
  title: string;
  brand: string;
  model: string;
  color: string;
  material: string;
  categoryGroup: string;
  catalogueNumber: string;
  styleNumber: string;
  referenceNumber: string;
  imageUrls: string[];
  score: ScoreBreakdown;
  source: "reference_collection" | "platform_listing";
  matchReasons: string[];
};

type VerificationState = {
  running: boolean;
  done: boolean;
  categoryGroup: CategoryGroup;
  signals: ExtractedSignals;
  imageSignals: ReturnType<typeof analyzeImageSignals>;
  candidates: VerificationCandidate[];
  topCandidate: VerificationCandidate | null;
  overallConfidence: number;
  metadataMatchConfidence: number;
  imageMatchConfidence: number;
  riskBand: RiskBand;
  aiRecommendation: AiRecommendation;
  mismatchWarnings: string[];
  missingData: string[];
};

type Props = { items: Listing[]; referenceItems: ReferenceItem[] };

function generateCertificateNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FF-AUTH-${y}${m}${day}-${rand}`;
}

function ManagementListingQueue({ items: initialItems, referenceItems }: Props) {
  const { loading } = useRequireAdmin();
  const [items, setItems] = useState(initialItems);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rejection reason modal
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const REJECTION_REASONS = [
    "Bad photo",
    "Verification document - poor image",
    "Verification document - not acceptable",
    "Pricing needs to be reviewed",
  ];

  // Proof document modal
  const [proofModal, setProofModal] = useState<Listing | null>(null);
  const [proofDocData, setProofDocData] = useState("");
  const [proofLoading, setProofLoading] = useState(false);

  // Details modal
  const [detailsModal, setDetailsModal] = useState<Listing | null>(null);

  // VERIFICATION PANEL STATE
  const [verifyListing, setVerifyListing] = useState<Listing | null>(null);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [verdictChoice, setVerdictChoice] = useState("");
  const [verdictNotes, setVerdictNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; cert?: string; error?: string } | null>(null);

  function openProofModal(listing: Listing) {
    setProofModal(listing);
    setProofDocData("");
    setProofLoading(true);
    fetch(`/api/admin/proof-doc/${listing.id}`)
      .then((r) => r.json())
      .then((data) => setProofDocData(data.proof_doc_url || ""))
      .catch(() => setProofDocData(""))
      .finally(() => setProofLoading(false));
  }

  if (loading) return <div className="dashboard-page" />;

  const handleAction = async (
    id: string,
    action: "approve" | "reject" | "request-proof" | "delete",
    body?: Record<string, any>
  ) => {
    if (actionLoading) return;
    setActionLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${action}/${id}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed to ${action} item`);
      if (action === "request-proof") {
        setItems((prev) => prev.map((x) => x.id === id ? { ...x, purchase_proof: "Requested" } as any : x));
      } else if (action === "delete") {
        setItems((prev) => prev.filter((x) => x.id !== id));
      } else {
        const nextStatus: Listing["status"] = action === "approve" ? "Live" : "Rejected";
        setItems((prev) => prev.map((x) => x.id === id ? { ...x, status: nextStatus } : x));
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  };

  // RUN AI VERIFICATION
  function runVerification(listing: Listing) {
    setVerifyListing(listing);
    setVerdictChoice("");
    setVerdictNotes("");
    setSubmitResult(null);
    setVerification({ running: true, done: false } as any);

    setTimeout(() => {
      const signals = extractSignals(listing);
      const categoryGroup = inferCategoryGroup(listing.category, listing.title, listing.details);
      const imgSignals = analyzeImageSignals({
        image_url: listing.image_url,
        auth_photos: listing.auth_photos,
        proof_doc_url: listing.proof_doc_url,
      });

      const listingData = {
        brand: signals.brand,
        categoryGroup,
        model: listing.model || "",
        title: listing.title,
        color: signals.color,
        material: signals.material,
        serialNumber: signals.serialNumber,
        catalogueNumber: signals.catalogueNumber,
        styleNumber: signals.styleNumber,
        referenceNumber: signals.referenceNumber,
      };

      const candidates: VerificationCandidate[] = [];

      for (const ref of referenceItems) {
        if (ref.active === false) continue;
        const refCatGroup = ref.categoryGroup || inferCategoryGroup(ref.category, ref.title, "");
        const refData = {
          brand: ref.brand || "",
          categoryGroup: refCatGroup,
          model: ref.model || "",
          title: ref.title || "",
          color: ref.color || "",
          material: ref.material || "",
          serialFormat: ref.serialFormat,
          catalogueNumber: ref.catalogueNumber || "",
          styleNumber: ref.styleNumber || "",
          referenceNumber: ref.referenceNumber || "",
        };
        const score = computeScore(listingData, refData);
        if (score.totalScore > 10) {
          const reasons: string[] = [];
          if (score.brandScore > 0) reasons.push("Brand match");
          if (score.categoryGroupScore > 0) reasons.push("Category match");
          if (score.modelTitleScore > 5) reasons.push("Model/title similarity");
          if (score.colorScore > 0) reasons.push("Color match");
          if (score.materialScore > 0) reasons.push("Material match");
          if (score.identifierScore > 0) reasons.push("Identifier match");
          candidates.push({
            id: ref.id, title: ref.title, brand: ref.brand, model: ref.model,
            color: ref.color, material: ref.material, categoryGroup: refCatGroup,
            catalogueNumber: ref.catalogueNumber, styleNumber: ref.styleNumber,
            referenceNumber: ref.referenceNumber, imageUrls: ref.imageUrls || [],
            score, source: "reference_collection", matchReasons: reasons,
          });
        }
      }

      // Also match against other platform listings
      for (const other of initialItems) {
        if (other.id === listing.id) continue;
        const oSignals = extractSignals(other);
        const oCatGroup = inferCategoryGroup(other.category, other.title, other.details);
        const refData = {
          brand: oSignals.brand,
          categoryGroup: oCatGroup,
          model: other.model || "",
          title: other.title,
          color: oSignals.color,
          material: oSignals.material,
          catalogueNumber: oSignals.catalogueNumber,
          styleNumber: oSignals.styleNumber,
          referenceNumber: oSignals.referenceNumber,
        };
        const score = computeScore(listingData, refData);
        if (score.totalScore > 15) {
          const reasons: string[] = [];
          if (score.brandScore > 0) reasons.push("Brand match");
          if (score.categoryGroupScore > 0) reasons.push("Category match");
          if (score.modelTitleScore > 5) reasons.push("Model/title similarity");
          if (score.colorScore > 0) reasons.push("Color match");
          if (score.materialScore > 0) reasons.push("Material match");
          if (score.identifierScore > 0) reasons.push("Identifier match");
          candidates.push({
            id: other.id, title: other.title, brand: oSignals.brand,
            model: other.model, color: oSignals.color, material: oSignals.material,
            categoryGroup: oCatGroup, catalogueNumber: oSignals.catalogueNumber,
            styleNumber: oSignals.styleNumber, referenceNumber: oSignals.referenceNumber,
            imageUrls: other.image_url ? [other.image_url] : [],
            score, source: "platform_listing", matchReasons: reasons,
          });
        }
      }

      candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);
      const top3 = candidates.slice(0, 3);
      const topCandidate = top3[0] || null;
      const bestScore = topCandidate?.score.totalScore || 0;
      const metaConf = topCandidate ? Math.round(((topCandidate.score.brandScore + topCandidate.score.categoryGroupScore + topCandidate.score.modelTitleScore + topCandidate.score.colorScore + topCandidate.score.materialScore + topCandidate.score.identifierScore) / 95) * 100) : 0;

      const missingData: string[] = [];
      if (!signals.brand) missingData.push("brand");
      if (!signals.color) missingData.push("color");
      if (!signals.material) missingData.push("material");
      if (!signals.serialNumber) missingData.push("serial number");
      if (!signals.catalogueNumber) missingData.push("catalogue/style number");
      if (!listing.model) missingData.push("model");
      if (!listing.purchase_proof) missingData.push("purchase proof");
      if (!listing.auth_photos || listing.auth_photos.length === 0) missingData.push("authentication photos");

      const mismatchWarnings = topCandidate ? [...topCandidate.score.hardMismatches] : [];

      let riskBand: RiskBand = "High Risk";
      if (bestScore >= 85) riskBand = "Low Risk";
      else if (bestScore >= 60) riskBand = "Medium Risk";

      let aiRec: AiRecommendation = "High Mismatch / Expert Review Recommended";
      if (bestScore >= 85 && mismatchWarnings.length === 0) aiRec = "Likely Authentic";
      else if (bestScore >= 60) aiRec = "Review Carefully";

      setVerification({
        running: false, done: true, categoryGroup, signals, imageSignals: imgSignals,
        candidates: top3, topCandidate, overallConfidence: bestScore,
        metadataMatchConfidence: metaConf, imageMatchConfidence: imgSignals.imageMatchConfidence,
        riskBand, aiRecommendation: aiRec, mismatchWarnings, missingData,
      });
    }, 600);
  }

  // SUBMIT VERDICT
  async function handleSubmitVerdict() {
    if (!verifyListing || !verdictChoice || !verification) return;
    setSubmitting(true);
    setSubmitResult(null);
    const cert = generateCertificateNumber();
    try {
      const res = await fetch(`/api/admin/authenticate/${verifyListing.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: verdictChoice,
          confidence: verification.overallConfidence,
          certificateNumber: cert,
          checklist: {},
          notes: verdictNotes,
          authenticatedBy: "management",
          aiEnabled: true,
          aiRecommendation: verification.aiRecommendation,
          aiConfidence: verification.overallConfidence,
          imageMatchConfidence: verification.imageMatchConfidence,
          metadataMatchConfidence: verification.metadataMatchConfidence,
          riskBand: verification.riskBand,
          categoryUsed: verifyListing.category,
          selectedCategoryGroup: verification.categoryGroup,
          mismatchWarnings: verification.mismatchWarnings,
          matchedReferenceId: verification.topCandidate?.id || null,
          matchedReferenceTitle: verification.topCandidate?.title || null,
          matchedReferenceBrand: verification.topCandidate?.brand || null,
          topReferenceCandidates: verification.candidates.map((c) => ({
            id: c.id, title: c.title, brand: c.brand, score: c.score.totalScore,
            source: c.source, reasons: c.matchReasons,
          })),
          extractedSignals: verification.signals,
          aiImageSignals: verification.imageSignals,
          listingSnapshot: {
            title: verifyListing.title, brand: verifyListing.brand,
            category: verifyListing.category, price: verifyListing.price,
            serial_number: verifyListing.serial_number, seller: verifyListing.seller,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to save verdict");
      setSubmitResult({ ok: true, cert });
      setItems((prev) => prev.map((x) => x.id === verifyListing.id ? { ...x, authenticationStatus: verdictChoice } as any : x));
    } catch (err: any) {
      setSubmitResult({ ok: false, error: err?.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  const hasAny = items.length > 0;

  return (
    <>
      <Head><title>Listing Review Queue — Admin</title></Head>
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>Listing Review Queue</h1>
              <p>AI-assisted verification. Review uploaded items, compare against authentic references, and approve or reject with confidence scoring.</p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">← Back to Management Dashboard</Link>
          </div>

          {error && <div className="form-message error" style={{ marginBottom: 16 }}><strong>Error:</strong> {error}</div>}

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Listing</th><th>Seller</th><th>Price</th><th>Category</th>
                  <th>Purchased From</th><th>Proof</th><th>Proof Document</th>
                  <th>Serial #</th><th>Details</th><th>Submitted</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hasAny ? items.map((item) => (
                  <tr key={item.id} className={verifyListing?.id === item.id ? "row-active" : ""}>
                    <td>
                      {item.title}
                      {item.authenticationStatus && (
                        <span className={`auth-inline-badge ${item.authenticationStatus === "Authentic" ? "aib-green" : item.authenticationStatus === "Not Authentic" ? "aib-red" : "aib-amber"}`}>
                          {item.authenticationStatus}
                        </span>
                      )}
                    </td>
                    <td>{item.seller}</td>
                    <td>{item.price ? `US$${item.price.toLocaleString("en-US")}` : "—"}</td>
                    <td>{item.category || "—"}</td>
                    <td>{item.purchase_source || "—"}</td>
                    <td>{item.purchase_proof === "Requested" ? <span className="proof-requested">Requested</span> : (item.purchase_proof || "—")}</td>
                    <td>{item.proof_doc_url ? <button type="button" className="btn-table btn-proof-view" onClick={() => openProofModal(item)}>View proof</button> : <span className="no-proof">Not uploaded</span>}</td>
                    <td>{item.serial_number || "—"}</td>
                    <td>{item.details ? <button type="button" className="btn-table btn-details-view" onClick={() => setDetailsModal(item)}>View details</button> : <span className="no-proof">—</span>}</td>
                    <td>{item.submittedAt || "—"}</td>
                    <td>{item.status}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="btn-table btn-verify" onClick={() => runVerification(item)} disabled={actionLoading === item.id}>Verify</button>
                        <Link href={`/product/${item.id}`} className="btn-table btn-view">View</Link>
                        <button type="button" onClick={() => handleAction(item.id, "approve")} disabled={actionLoading === item.id} className="btn-table btn-approve">Approve</button>
                        <button type="button" onClick={() => { setRejectReason(""); setRejectModal(item.id); }} disabled={actionLoading === item.id} className="btn-table btn-reject">Reject</button>
                        <button type="button" onClick={() => handleAction(item.id, "request-proof")} disabled={actionLoading === item.id} className="btn-table btn-request">Request proof</button>
                        <button type="button" onClick={() => { if (window.confirm("Delete this listing permanently?")) handleAction(item.id, "delete"); }} disabled={actionLoading === item.id} className="btn-table btn-delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={12} className="table-message">No pending listings – go enjoy a coffee</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ===== AI VERIFICATION PANEL ===== */}
          {verifyListing && (
            <div className="verify-panel">
              <div className="verify-header">
                <h2>AI-Assisted Verification — {verifyListing.title}</h2>
                <button type="button" className="modal-close" onClick={() => { setVerifyListing(null); setVerification(null); }}>✕</button>
              </div>

              {verification?.running && (
                <div className="verify-loading"><div className="spinner" /> Running AI-assisted analysis...</div>
              )}

              {verification?.done && (
                <div className="verify-content">
                  {/* SECTION 1: LISTING SNAPSHOT */}
                  <div className="v-section">
                    <h3 className="v-section-title">Listing Snapshot</h3>
                    <div className="v-grid-2">
                      <div className="v-card">
                        <div className="v-field"><strong>Title:</strong> {verifyListing.title}</div>
                        <div className="v-field"><strong>Seller:</strong> {verifyListing.seller}</div>
                        <div className="v-field"><strong>Category:</strong> {verifyListing.category || "—"}</div>
                        <div className="v-field"><strong>Price:</strong> {verifyListing.price ? `$${verifyListing.price.toLocaleString()}` : "—"}</div>
                        <div className="v-field"><strong>Brand:</strong> {verifyListing.brand || "—"}</div>
                        <div className="v-field"><strong>Model:</strong> {verifyListing.model || "—"}</div>
                        <div className="v-field"><strong>Color:</strong> {verifyListing.color || "—"}</div>
                        <div className="v-field"><strong>Material:</strong> {verifyListing.material || "—"}</div>
                        <div className="v-field"><strong>Condition:</strong> {verifyListing.condition || "—"}</div>
                        <div className="v-field"><strong>Serial #:</strong> {verifyListing.serial_number || "—"}</div>
                        <div className="v-field"><strong>Catalogue #:</strong> {verifyListing.catalogue_number || "—"}</div>
                        <div className="v-field"><strong>Date Code:</strong> {verifyListing.date_code || "—"}</div>
                        <div className="v-field"><strong>Purchase Source:</strong> {verifyListing.purchase_source || "—"}</div>
                        <div className="v-field"><strong>Proof:</strong> {verifyListing.purchase_proof || "—"}</div>
                        {verifyListing.details && <div className="v-field v-details"><strong>Details:</strong> {verifyListing.details}</div>}
                      </div>
                      <div className="v-card">
                        <strong>Uploaded Photos</strong>
                        <div className="v-photos">
                          {verifyListing.image_url && <img src={verifyListing.image_url} alt="Primary" className="v-thumb" />}
                          {(verifyListing.auth_photos || []).map((url, i) => <img key={i} src={url} alt={`Auth photo ${i+1}`} className="v-thumb" />)}
                          {!verifyListing.image_url && (!verifyListing.auth_photos || verifyListing.auth_photos.length === 0) && <p className="v-muted">No photos available</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: AI ANALYSIS SUMMARY */}
                  <div className="v-section">
                    <h3 className="v-section-title">AI Analysis Summary</h3>
                    <div className="v-grid-3">
                      <div className="v-card">
                        <h4>Detected Signals</h4>
                        <div className="v-field"><strong>Category Group:</strong> <span className="v-badge v-badge-blue">{verification.categoryGroup}</span></div>
                        <div className="v-field"><strong>Brand:</strong> {verification.signals.brand || "—"}</div>
                        <div className="v-field"><strong>Color:</strong> {verification.signals.color || "—"}</div>
                        <div className="v-field"><strong>Material:</strong> {verification.signals.material || "—"}</div>
                        <div className="v-field"><strong>Item Type:</strong> {verification.signals.itemType || "—"}</div>
                      </div>
                      <div className="v-card">
                        <h4>Extracted Identifiers</h4>
                        <div className="v-field"><strong>Serial #:</strong> {verification.signals.serialNumber || "—"}</div>
                        <div className="v-field"><strong>Catalogue #:</strong> {verification.signals.catalogueNumber || "—"}</div>
                        <div className="v-field"><strong>Style #:</strong> {verification.signals.styleNumber || "—"}</div>
                        <div className="v-field"><strong>Reference #:</strong> {verification.signals.referenceNumber || "—"}</div>
                        <div className="v-field"><strong>Hallmark:</strong> {verification.signals.hallmarkPurity || "—"}</div>
                        <div className="v-field"><strong>Date Code:</strong> {verification.signals.dateCode || "—"}</div>
                      </div>
                      <div className="v-card">
                        <h4>Confidence Scoring</h4>
                        <div className="confidence-bar-wrapper">
                          <div className="confidence-bar-bg">
                            <div className="confidence-bar-fill" style={{ width: `${verification.overallConfidence}%`, background: verification.overallConfidence >= 85 ? "#16a34a" : verification.overallConfidence >= 60 ? "#f59e0b" : "#dc2626" }} />
                          </div>
                          <span className="confidence-val">{verification.overallConfidence}%</span>
                        </div>
                        <div className="v-field"><strong>Metadata Match:</strong> {verification.metadataMatchConfidence}%</div>
                        <div className="v-field"><strong>Image Coverage:</strong> {verification.imageMatchConfidence}%</div>
                        <div className="v-field">
                          <strong>Risk Band:</strong>{" "}
                          <span className={`v-badge ${verification.riskBand === "Low Risk" ? "v-badge-green" : verification.riskBand === "Medium Risk" ? "v-badge-amber" : "v-badge-red"}`}>
                            {verification.riskBand}
                          </span>
                        </div>
                        <div className="v-field">
                          <strong>AI Recommendation:</strong>{" "}
                          <span className={`v-badge ${verification.aiRecommendation === "Likely Authentic" ? "v-badge-green" : verification.aiRecommendation === "Review Carefully" ? "v-badge-amber" : "v-badge-red"}`}>
                            {verification.aiRecommendation}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: REFERENCE MATCHES */}
                  <div className="v-section">
                    <h3 className="v-section-title">Reference Matches</h3>
                    {verification.candidates.length === 0 ? (
                      <div className="v-card"><p className="v-muted">No matching reference items found. Consider adding reference items to the authentication_reference_items collection, or request more details from the seller.</p></div>
                    ) : (
                      <div className="v-candidates">
                        {verification.candidates.map((c, idx) => (
                          <div key={c.id} className={`v-candidate-card ${idx === 0 ? "v-candidate-best" : ""}`}>
                            <div className="v-candidate-header">
                              <span className="v-candidate-rank">#{idx + 1}</span>
                              <span className="v-candidate-title">{c.title}</span>
                              <span className={`v-badge ${c.score.totalScore >= 85 ? "v-badge-green" : c.score.totalScore >= 60 ? "v-badge-amber" : "v-badge-red"}`}>Score: {c.score.totalScore}</span>
                              <span className="v-candidate-source">{c.source === "reference_collection" ? "Reference DB" : "Platform Listing"}</span>
                            </div>
                            <div className="v-candidate-body">
                              <div className="v-candidate-details">
                                <span><strong>Brand:</strong> {c.brand || "—"}</span>
                                <span><strong>Model:</strong> {c.model || "—"}</span>
                                <span><strong>Color:</strong> {c.color || "—"}</span>
                                <span><strong>Material:</strong> {c.material || "—"}</span>
                                <span><strong>Cat #:</strong> {c.catalogueNumber || "—"}</span>
                                <span><strong>Style #:</strong> {c.styleNumber || "—"}</span>
                                <span><strong>Ref #:</strong> {c.referenceNumber || "—"}</span>
                              </div>
                              {/* Side-by-side image comparison */}
                              {(verifyListing.image_url || c.imageUrls.length > 0) && (
                                <div className="v-image-compare">
                                  <div className="v-compare-col">
                                    <span className="v-compare-label">Seller Image</span>
                                    {verifyListing.image_url ? <img src={verifyListing.image_url} alt="Seller" className="v-compare-img" /> : <span className="v-muted">No image</span>}
                                  </div>
                                  <div className="v-compare-col">
                                    <span className="v-compare-label">Reference Image</span>
                                    {c.imageUrls.length > 0 ? <img src={c.imageUrls[0]} alt="Reference" className="v-compare-img" /> : <span className="v-muted">No image</span>}
                                  </div>
                                </div>
                              )}
                              <div className="v-candidate-reasons">{c.matchReasons.join(" · ")}</div>
                              {c.score.hardMismatches.length > 0 && (
                                <div className="v-candidate-mismatches">
                                  {c.score.hardMismatches.map((m, mi) => <span key={mi} className="v-mismatch-item">{m}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 4: WARNINGS */}
                  <div className="v-section">
                    <h3 className="v-section-title">Warnings & Missing Data</h3>
                    <div className="v-grid-2">
                      <div className="v-card">
                        <h4>Mismatch Warnings</h4>
                        {verification.mismatchWarnings.length === 0 ? (
                          <p className="v-pass">No hard mismatches detected.</p>
                        ) : (
                          verification.mismatchWarnings.map((w, i) => <p key={i} className="v-warning-red">{w}</p>)
                        )}
                        {verification.imageSignals.notes.map((n, i) => <p key={`img-${i}`} className="v-warning-amber">{n}</p>)}
                      </div>
                      <div className="v-card">
                        <h4>Missing Data</h4>
                        {verification.missingData.length === 0 ? (
                          <p className="v-pass">All key fields are present.</p>
                        ) : (
                          <p className="v-warning-amber">Missing: {verification.missingData.join(", ")}</p>
                        )}
                        {verification.overallConfidence < 60 && <p className="v-warning-red">Expert review recommended due to low confidence score.</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: FINAL ACTION */}
                  <div className="v-section">
                    <h3 className="v-section-title">Final Management Decision</h3>
                    <div className="verdict-row">
                      {[
                        { key: "Authentic", color: "#16a34a", bg: "#f0fdf4", icon: "\u2713" },
                        { key: "Not Authentic", color: "#dc2626", bg: "#fef2f2", icon: "\u2717" },
                        { key: "Inconclusive", color: "#f59e0b", bg: "#fffbeb", icon: "?" },
                        { key: "Request More Proof", color: "#2563eb", bg: "#eff6ff", icon: "\u21bb" },
                        { key: "Needs Expert Review", color: "#7c3aed", bg: "#f5f3ff", icon: "\u2609" },
                      ].map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          className={`verdict-btn ${verdictChoice === v.key ? "verdict-active" : ""}`}
                          style={{ borderColor: verdictChoice === v.key ? v.color : "#e5e7eb", background: verdictChoice === v.key ? v.bg : "#fff" }}
                          onClick={() => setVerdictChoice(v.key)}
                        >
                          <span className="verdict-icon" style={{ color: v.color }}>{v.icon}</span>
                          <span className="verdict-text">{v.key}</span>
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="verdict-notes"
                      rows={3}
                      placeholder="Notes — additional observations, reasons for your decision..."
                      value={verdictNotes}
                      onChange={(e) => setVerdictNotes(e.target.value)}
                    />
                    <div className="verdict-submit-row">
                      <button type="button" className="btn-submit-verdict" disabled={!verdictChoice || submitting} onClick={handleSubmitVerdict}>
                        {submitting ? "Saving..." : "Save Verdict & Issue Certificate"}
                      </button>
                      <Link href={`/management/authenticate`} className="btn-table btn-view" style={{ marginLeft: 8, padding: "8px 16px" }}>Open Full Authentication Tool</Link>
                    </div>
                    {submitResult?.ok && (
                      <div className="result-success"><strong>Verdict recorded.</strong> Certificate: <code>{submitResult.cert}</code></div>
                    )}
                    {submitResult && !submitResult.ok && (
                      <div className="result-error"><strong>Error:</strong> {submitResult.error}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* PROOF DOCUMENT MODAL */}
      {proofModal && (
        <div className="modal-overlay" onClick={() => setProofModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Proof Document — {proofModal.title}</h3>
              <button type="button" className="modal-close" onClick={() => setProofModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {proofLoading ? (
                <p style={{ textAlign: "center", color: "#6b7280" }}>Loading proof document...</p>
              ) : proofDocData ? (
                proofDocData.startsWith("data:image") ? (
                  <img src={proofDocData} alt="Proof document" style={{ maxWidth: "100%", borderRadius: 8 }} />
                ) : proofDocData.startsWith("data:application/pdf") ? (
                  <iframe src={proofDocData} style={{ width: "100%", height: 500, border: "none", borderRadius: 8 }} title="Proof PDF" />
                ) : (
                  <a href={proofDocData} target="_blank" rel="noopener noreferrer" className="btn-proof-download">Open / Download proof document</a>
                )
              ) : (
                <p style={{ textAlign: "center", color: "#9ca3af" }}>No proof document available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {detailsModal && (
        <div className="modal-overlay" onClick={() => setDetailsModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Details — {detailsModal.title}</h3>
              <button type="button" className="modal-close" onClick={() => setDetailsModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{detailsModal.details}</p>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal-box" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Listing — Select Reason</h3>
              <button type="button" className="modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 12 }}>Select a reason for rejection. The seller will be notified by email.</p>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 14, borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 16, background: "#fff" }}>
                <option value="">-- Select a reason --</option>
                {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setRejectModal(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                <button type="button" disabled={!rejectReason} onClick={() => { const lid = rejectModal; setRejectModal(null); handleAction(lid, "reject", { reason: rejectReason }); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: rejectReason ? "#dc2626" : "#d1d5db", color: "#fff", cursor: rejectReason ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}>Reject Listing</button>
              </div>
            </div>
          </div>
        </div>
      )}


      <style jsx>{`
        .table-wrapper { margin-top: 24px; overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table th, .data-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        .data-table thead th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; background: #f9fafb; }
        .table-message { text-align: center; padding: 24px; color: #6b7280; }
        .table-actions { display: flex; flex-wrap: wrap; gap: 6px; }
        .btn-table { border-radius: 999px; padding: 4px 10px; border: none; font-size: 12px; cursor: pointer; white-space: nowrap; }
        .btn-view { background: #111827; color: #ffffff; text-decoration: none; }
        .btn-approve { background: #16a34a; color: white; }
        .btn-reject { background: #dc2626; color: white; }
        .btn-request { background: #f59e0b; color: black; }
        .btn-delete { background: #4b5563; color: #f9fafb; }
        .btn-verify { background: #7c3aed; color: white; font-weight: 700; }
        .btn-verify:hover { background: #6d28d9; }
        .btn-proof-view { background: #2563eb; color: #ffffff; text-decoration: none; display: inline-block; }
        .btn-proof-view:hover { background: #1d4ed8; }
        .btn-details-view { background: #111827; color: #ffffff; }
        .btn-details-view:hover { background: #1f2937; }
        .proof-requested { color: #d97706; font-weight: 600; font-size: 12px; }
        .no-proof { color: #9ca3af; font-size: 12px; }
        .row-active { background: #f5f3ff; }
        .auth-inline-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; margin-left: 6px; text-transform: uppercase; }
        .aib-green { background: #dcfce7; color: #166534; }
        .aib-red { background: #fef2f2; color: #991b1b; }
        .aib-amber { background: #fef9c3; color: #854d0e; }

        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal-box { background: #fff; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); max-width: 700px; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
        .modal-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
        .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; padding: 4px; }
        .modal-close:hover { color: #111827; }
        .modal-body { padding: 20px; overflow-y: auto; }
        .btn-proof-download { display: inline-block; background: #2563eb; color: #fff; border-radius: 999px; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; }

        /* Verification Panel */
        .verify-panel { margin-top: 24px; background: #fff; border: 2px solid #7c3aed; border-radius: 16px; box-shadow: 0 8px 24px rgba(124,58,237,0.1); }
        .verify-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: #f5f3ff; border-radius: 16px 16px 0 0; }
        .verify-header h2 { margin: 0; font-size: 16px; font-weight: 700; color: #111827; }
        .verify-loading { padding: 40px; text-align: center; color: #6b7280; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 12px; }
        .spinner { width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .verify-content { padding: 20px; }

        .v-section { margin-bottom: 24px; }
        .v-section-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
        .v-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .v-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 960px) { .v-grid-2, .v-grid-3 { grid-template-columns: 1fr; } }
        .v-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fafafa; }
        .v-card h4 { margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #111827; }
        .v-field { font-size: 13px; color: #374151; margin-bottom: 4px; }
        .v-details { margin-top: 8px; font-size: 12px; color: #6b7280; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
        .v-muted { font-size: 12px; color: #9ca3af; }
        .v-pass { font-size: 12px; color: #166534; margin: 0; }

        .v-photos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .v-thumb { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }

        .v-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; display: inline-block; }
        .v-badge-green { background: #dcfce7; color: #166534; }
        .v-badge-amber { background: #fef9c3; color: #854d0e; }
        .v-badge-red { background: #fef2f2; color: #991b1b; }
        .v-badge-blue { background: #dbeafe; color: #1e40af; }

        .confidence-bar-wrapper { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .confidence-bar-bg { flex: 1; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
        .confidence-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s, background 0.4s; }
        .confidence-val { font-size: 18px; font-weight: 800; color: #111827; min-width: 48px; text-align: right; }

        /* Reference candidates */
        .v-candidates { display: flex; flex-direction: column; gap: 12px; }
        .v-candidate-card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff; }
        .v-candidate-best { border-color: #7c3aed; box-shadow: 0 0 0 1px #7c3aed; }
        .v-candidate-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
        .v-candidate-rank { font-size: 13px; font-weight: 800; color: #7c3aed; }
        .v-candidate-title { font-size: 13px; font-weight: 600; color: #111827; flex: 1; }
        .v-candidate-source { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
        .v-candidate-body { padding: 12px 14px; }
        .v-candidate-details { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #374151; margin-bottom: 8px; }
        .v-candidate-reasons { font-size: 11px; color: #4b5563; margin-top: 6px; }
        .v-candidate-mismatches { margin-top: 6px; }
        .v-mismatch-item { display: block; font-size: 11px; color: #dc2626; margin-bottom: 2px; }

        /* Image comparison */
        .v-image-compare { display: flex; gap: 16px; margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
        .v-compare-col { flex: 1; text-align: center; }
        .v-compare-label { display: block; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
        .v-compare-img { max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 8px; border: 1px solid #d1d5db; }

        /* Warnings */
        .v-warning-red { font-size: 12px; color: #dc2626; margin: 0 0 4px; }
        .v-warning-amber { font-size: 12px; color: #b45309; margin: 0 0 4px; }

        /* Verdict */
        .verdict-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .verdict-btn { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 10px; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; transition: all 0.2s; flex: 1; min-width: 120px; background: #fff; }
        .verdict-btn:hover { border-color: #9ca3af; }
        .verdict-active { box-shadow: 0 0 0 2px currentColor; }
        .verdict-icon { font-size: 22px; margin-bottom: 4px; }
        .verdict-text { font-size: 12px; font-weight: 700; color: #111827; }
        .verdict-notes { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 13px; resize: vertical; font-family: inherit; margin-bottom: 12px; }
        .verdict-submit-row { display: flex; align-items: center; }
        .btn-submit-verdict { background: #111827; color: #fff; border: none; border-radius: 999px; padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer; }
        .btn-submit-verdict:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-submit-verdict:not(:disabled):hover { background: #1f2937; }
        .result-success { margin-top: 12px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px; color: #166534; }
        .result-success code { background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
        .result-error { margin-top: 12px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; font-size: 13px; color: #991b1b; }
      `}</style>
    </>
  );
}

export default ManagementListingQueue;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const [listingSnap, refSnap] = await Promise.all([
      adminDb.collection("listings").orderBy("createdAt", "desc").limit(200).get(),
      adminDb.collection("authentication_reference_items").where("active", "==", true).limit(500).get().catch(() => ({ docs: [] })),
    ]);

    const all: Listing[] = listingSnap.docs.map((doc) => {
      const d: any = doc.data() || {};
      const rawStatus = (d.status || "").toString();
      let status: Listing["status"] = "Live";
      if (/pending/i.test(rawStatus)) status = "Pending";
      else if (/reject/i.test(rawStatus)) status = "Rejected";
      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        seller: d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        sellerId: d.sellerId || "",
        category: d.category || "",
        price: Number(d.price || 0),
        status,
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        proof_doc_url: d.proof_doc_url ? "has_proof" : "",
        details: d.details || "",
        serial_number: d.serial_number || "",
        catalogue_number: d.catalogue_number || d.catalog_number || d.style_code || "",
        date_code: d.date_code || "",
        auth_photos: d.auth_photos || [],
        submittedAt: d.createdAt?.toDate?.().toLocaleString("en-US") || "",
        brand: d.brand || d.designer || "",
        designer: d.designer || d.brand || "",
        model: d.model || d.model_name || "",
        color: d.color || "",
        material: d.material || "",
        condition: d.condition || "",
        image_url: d.image_url || d.imageUrl || "",
        authenticationStatus: d.authenticationStatus || "",
      };
    });

    const items = all.filter((i) => i.status === "Pending");

    const referenceItems: ReferenceItem[] = (refSnap as any).docs.map((doc: any) => {
      const d = doc.data() || {};
      return {
        id: doc.id,
        brand: d.brand || "",
        title: d.title || "",
        category: d.category || "",
        categoryGroup: d.categoryGroup || "",
        model: d.model || "",
        color: d.color || "",
        material: d.material || "",
        styleNumber: d.styleNumber || "",
        catalogueNumber: d.catalogueNumber || "",
        serialFormat: d.serialFormat || "",
        referenceNumber: d.referenceNumber || "",
        keywords: d.keywords || [],
        imageUrls: d.imageUrls || [],
        notes: d.notes || "",
        active: d.active !== false,
      };
    });

    return { props: { items, referenceItems } };
  } catch (err) {
    console.error("Error loading listing queue", err);
    return { props: { items: [], referenceItems: [] } };
  }
};
