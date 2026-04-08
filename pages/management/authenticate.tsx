// FILE: /pages/management/authenticate.tsx
// Entrupy-style item authentication tool for the management dashboard.
// Lets admins run a structured authenticity check on any listing —
// brand markers, serial/catalogue number, material, hardware, stitching,
// shape, date code — then record a verdict and certificate number.

import { useState, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { adminDb } from "../../utils/firebaseAdmin";
import { useRequireAdmin } from "../../hooks/useRequireAdmin";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Listing = {
  id: string;
  title: string;
  brand: string;
  designer: string;
  model: string;
  color: string;
  catalogue_number: string;
  date_code: string;
  category: string;
  condition: string;
  price: number;
  serial_number: string;
  material: string;
  image_url: string;
  seller: string;
  status: string;
  purchase_source: string;
  purchase_proof: string;
  details: string;
  authenticationStatus: string;
};

type Props = { items: Listing[] };

/* ------------------------------------------------------------------ */
/*  Checklist items — modelled after Entrupy's inspection categories   */
/* ------------------------------------------------------------------ */

const CHECKLIST_ITEMS = [
  {
    key: "brand_markings",
    label: "Brand Markings & Logo",
    description:
      "Verify logo placement, font, spacing, and engraving depth match known authentic examples.",
  },
  {
    key: "serial_catalogue",
    label: "Serial / Catalogue Number",
    description:
      "Cross-reference the serial or catalogue number against the brand's known formats and date-code systems.",
  },
  {
    key: "material_quality",
    label: "Material & Texture",
    description:
      "Inspect leather grain, fabric weave, metal weight, or gemstone quality. Compare to known authentic materials.",
  },
  {
    key: "hardware",
    label: "Hardware & Closures",
    description:
      "Check zippers, clasps, buckles, and chains for correct branding, weight, and finish quality.",
  },
  {
    key: "stitching",
    label: "Stitching & Construction",
    description:
      "Examine stitch count per inch, thread colour, straightness, and internal construction quality.",
  },
  {
    key: "shape_silhouette",
    label: "Shape & Silhouette",
    description:
      "Compare overall proportions, structure, and shape to the brand's official product images.",
  },
  {
    key: "date_code",
    label: "Date Code / Production Tag",
    description:
      "Locate and verify the date code, heat stamp, or production label matches the declared purchase period.",
  },
  {
    key: "packaging_extras",
    label: "Packaging & Extras",
    description:
      "If supplied, verify dust bag, box, authenticity card, receipt, and care booklets match brand standards.",
  },
  {
    key: "smell_feel",
    label: "Smell & Feel (Physical Items Only)",
    description:
      "Genuine leather, metal, and fabrics have distinct textures and scents that differ from counterfeit materials.",
  },
] as const;

type CheckValue = "pass" | "fail" | "na" | "";

type SuggestedMatch = {
  id: string;
  title: string;
  brand: string;
  color: string;
  catalogue_number: string;
  serial_number: string;
  score: number;
  reasons: string[];
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((x) => x.length > 2);
}

function parseColor(value: string): string {
  const normalized = (value || "").toLowerCase();
  const colorWords = [
    "black", "white", "beige", "brown", "tan", "blue", "navy", "red", "burgundy",
    "green", "olive", "pink", "purple", "grey", "gray", "yellow", "orange", "gold",
    "silver", "ivory", "cream",
  ];
  const hit = colorWords.find((c) => normalized.includes(c));
  return hit || "";
}

/* ------------------------------------------------------------------ */
/*  Helper — generate certificate number                               */
/* ------------------------------------------------------------------ */

function generateCertificateNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FF-AUTH-${y}${m}${d}-${rand}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AuthenticatePage({ items }: Props) {
  const { loading } = useRequireAdmin();

  // Search / filter
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "authenticated">("all");

  // Selected listing
  const [selected, setSelected] = useState<Listing | null>(null);

  // Checklist state
  const [checklist, setChecklist] = useState<Record<string, CheckValue>>({});
  const [notes, setNotes] = useState("");
  const [verdict, setVerdict] = useState<"" | "Authentic" | "Not Authentic" | "Inconclusive">("");
  const [confidence, setConfidence] = useState(0);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; cert?: string; error?: string } | null>(null);

  // Items list with local auth status tracking
  const [itemList, setItemList] = useState(items);

  const suggestedMatches = useMemo<SuggestedMatch[]>(() => {
    if (!selected) return [];
    const currentTitleTokens = new Set(tokenize(selected.title));
    const currentDetailTokens = new Set(tokenize(selected.details));
    const selectedColor = (selected.color || parseColor(`${selected.title} ${selected.details}`)).toLowerCase();

    return itemList
      .filter((candidate) => candidate.id !== selected.id)
      .map((candidate) => {
        let score = 0;
        const reasons: string[] = [];

        if (selected.brand && candidate.brand && selected.brand.toLowerCase() === candidate.brand.toLowerCase()) {
          score += 35;
          reasons.push("Same brand");
        }
        if (selected.designer && candidate.designer && selected.designer.toLowerCase() === candidate.designer.toLowerCase()) {
          score += 12;
          reasons.push("Same designer");
        }
        if (selected.model && candidate.model && selected.model.toLowerCase() === candidate.model.toLowerCase()) {
          score += 18;
          reasons.push("Same model name");
        }

        const candidateColor = (candidate.color || parseColor(`${candidate.title} ${candidate.details}`)).toLowerCase();
        if (selectedColor && candidateColor && selectedColor === candidateColor) {
          score += 15;
          reasons.push(`Same color (${selectedColor})`);
        }
        if (
          selected.catalogue_number &&
          candidate.catalogue_number &&
          selected.catalogue_number.toLowerCase() === candidate.catalogue_number.toLowerCase()
        ) {
          score += 40;
          reasons.push("Catalogue number match");
        }
        if (
          selected.serial_number &&
          candidate.serial_number &&
          selected.serial_number.toLowerCase() === candidate.serial_number.toLowerCase()
        ) {
          score += 45;
          reasons.push("Serial number match");
        }

        const overlap = tokenize(`${candidate.title} ${candidate.details}`).filter(
          (token) => currentTitleTokens.has(token) || currentDetailTokens.has(token)
        ).length;
        if (overlap > 0) {
          score += Math.min(overlap, 8);
          reasons.push(`Shared descriptors (${overlap})`);
        }

        return {
          id: candidate.id,
          title: candidate.title,
          brand: candidate.brand,
          color: candidate.color || candidateColor || "—",
          catalogue_number: candidate.catalogue_number || "—",
          serial_number: candidate.serial_number || "—",
          score,
          reasons,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [itemList, selected]);

  const aiPrecheck = useMemo(() => {
    if (!selected) return { missingFields: [] as string[], warnings: [] as string[] };
    const missingFields: string[] = [];
    const warnings: string[] = [];

    if (!selected.brand) missingFields.push("brand");
    if (!selected.color) missingFields.push("color");
    if (!selected.model) missingFields.push("model");
    if (!selected.catalogue_number) missingFields.push("catalogue number");
    if (!selected.serial_number) missingFields.push("serial number");

    const serial = selected.serial_number.trim();
    if (serial && !/^[A-Za-z0-9\-]{6,24}$/.test(serial)) {
      warnings.push("Serial number format looks unusual (expected 6-24 alphanumeric chars).");
    }
    if (suggestedMatches.length === 0) {
      warnings.push("No close inventory matches found. Consider requesting clearer close-up photos.");
    }
    return { missingFields, warnings };
  }, [selected, suggestedMatches.length]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return itemList.filter((item) => {
      if (filterStatus === "pending" && item.authenticationStatus) return false;
      if (filterStatus === "authenticated" && !item.authenticationStatus) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.serial_number.toLowerCase().includes(q) ||
        item.seller.toLowerCase().includes(q)
      );
    });
  }, [itemList, query, filterStatus]);

  // Reset checklist when selecting a new item
  function handleSelect(item: Listing) {
    setSelected(item);
    setChecklist({});
    setNotes("");
    setVerdict("");
    setConfidence(0);
    setResult(null);
  }

  function handleCheckChange(key: string, value: CheckValue) {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-calculate confidence from checklist
  const autoConfidence = useMemo(() => {
    const filled = CHECKLIST_ITEMS.filter((c) => checklist[c.key] && checklist[c.key] !== "na");
    if (filled.length === 0) return 0;
    const passed = filled.filter((c) => checklist[c.key] === "pass").length;
    return Math.round((passed / filled.length) * 100);
  }, [checklist]);

  async function handleSubmit() {
    if (!selected || !verdict) return;
    setSubmitting(true);
    setResult(null);

    const certNumber = generateCertificateNumber();
    const finalConfidence = confidence > 0 ? confidence : autoConfidence;

    try {
      const res = await fetch(`/api/admin/authenticate/${selected.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          confidence: finalConfidence,
          certificateNumber: certNumber,
          checklist,
          notes,
          aiFindings: {
            precheck: aiPrecheck,
            suggestedMatches,
          },
          authenticatedBy: "management",
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to save authentication");
      }

      setResult({ ok: true, cert: certNumber });

      // Update local state
      setItemList((prev) =>
        prev.map((i) =>
          i.id === selected.id ? { ...i, authenticationStatus: verdict } : i
        )
      );
      setSelected((prev) => (prev ? { ...prev, authenticationStatus: verdict } : prev));
    } catch (err: any) {
      setResult({ ok: false, error: err?.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="dashboard-page" />;

  return (
    <>
      <Head>
        <title>Authentication Tool — Management | Famous Finds</title>
      </Head>

      <div className="dashboard-page">
        <Header />

        <main className="dashboard-main" style={{ maxWidth: "100%" }}>
          <div className="dashboard-header">
            <div>
              <h1>Authentication Tool</h1>
              <p>
                Entrupy-style item verification. Select a listing, run the
                checklist, and record your authentication verdict with a
                certificate number.
              </p>
            </div>
            <Link href="/management/dashboard" className="btn-primary-dark">
              ← Back to Dashboard
            </Link>
          </div>

          <div className="auth-layout">
            {/* LEFT: Listing selector */}
            <div className="auth-panel auth-list-panel">
              <h2 className="panel-title">Select Listing</h2>

              <div className="filter-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by title, brand, serial #, seller..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All Items</option>
                  <option value="pending">Not Yet Authenticated</option>
                  <option value="authenticated">Already Authenticated</option>
                </select>
              </div>

              <div className="listing-scroll">
                {visible.length === 0 ? (
                  <p className="muted-text">No listings match your search.</p>
                ) : (
                  visible.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`listing-card ${selected?.id === item.id ? "listing-card-active" : ""}`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="listing-card-top">
                        <span className="listing-card-title">{item.title}</span>
                        {item.authenticationStatus ? (
                          <span
                            className={`auth-badge ${
                              item.authenticationStatus === "Authentic"
                                ? "auth-badge-pass"
                                : item.authenticationStatus === "Not Authentic"
                                ? "auth-badge-fail"
                                : "auth-badge-pending"
                            }`}
                          >
                            {item.authenticationStatus}
                          </span>
                        ) : (
                          <span className="auth-badge auth-badge-none">
                            Not checked
                          </span>
                        )}
                      </div>
                      <div className="listing-card-meta">
                        <span>{item.brand || "—"}</span>
                        <span>{item.category || "—"}</span>
                        <span>
                          {item.price
                            ? `$${item.price.toLocaleString("en-US")}`
                            : "—"}
                        </span>
                      </div>
                      {item.serial_number && (
                        <div className="listing-card-serial">
                          Serial: {item.serial_number}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Authentication workspace */}
            <div className="auth-panel auth-work-panel">
              {!selected ? (
                <div className="empty-state">
                  <div className="empty-icon">&#128270;</div>
                  <h3>Select a listing to authenticate</h3>
                  <p>
                    Choose an item from the list to begin the authentication
                    inspection process.
                  </p>
                </div>
              ) : (
                <>
                  {/* Item summary header */}
                  <div className="item-summary">
                    <div className="item-summary-info">
                      <h2>{selected.title}</h2>
                      <div className="item-summary-details">
                        <span><strong>Brand:</strong> {selected.brand || "—"}</span>
                        <span><strong>Designer:</strong> {selected.designer || "—"}</span>
                        <span><strong>Model:</strong> {selected.model || "—"}</span>
                        <span><strong>Color:</strong> {selected.color || "—"}</span>
                        <span><strong>Category:</strong> {selected.category || "—"}</span>
                        <span><strong>Condition:</strong> {selected.condition || "—"}</span>
                        <span><strong>Material:</strong> {selected.material || "—"}</span>
                        <span><strong>Serial #:</strong> {selected.serial_number || "—"}</span>
                        <span><strong>Catalogue #:</strong> {selected.catalogue_number || "—"}</span>
                        <span><strong>Date code:</strong> {selected.date_code || "—"}</span>
                        <span><strong>Price:</strong> {selected.price ? `$${selected.price.toLocaleString("en-US")}` : "—"}</span>
                        <span><strong>Seller:</strong> {selected.seller}</span>
                        <span><strong>Purchased From:</strong> {selected.purchase_source || "—"}</span>
                        <span><strong>Proof Type:</strong> {selected.purchase_proof || "—"}</span>
                      </div>
                      {selected.details && (
                        <p className="item-details-text">{selected.details}</p>
                      )}
                    </div>
                    <div className="item-summary-actions">
                      <Link
                        href={`/product/${selected.id}`}
                        className="btn-view-product"
                        target="_blank"
                      >
                        View Product Page
                      </Link>
                    </div>
                  </div>

                  <div className="ai-assist-section">
                    <h3 className="section-heading">AI-Assisted Verification</h3>
                    <p className="section-desc">
                      Auto-checks seller data quality and compares the selected item against similar inventory records.
                    </p>
                    <div className="ai-grid">
                      <div className="ai-card">
                        <h4>Pre-check signals</h4>
                        {aiPrecheck.missingFields.length > 0 ? (
                          <p className="ai-warning">
                            Missing key data: {aiPrecheck.missingFields.join(", ")}
                          </p>
                        ) : (
                          <p className="ai-pass">All key metadata fields are present.</p>
                        )}
                        {aiPrecheck.warnings.map((warning) => (
                          <p key={warning} className="ai-warning">{warning}</p>
                        ))}
                      </div>
                      <div className="ai-card">
                        <h4>Closest matches in catalogue</h4>
                        {suggestedMatches.length === 0 ? (
                          <p className="ai-muted">No strong matches detected.</p>
                        ) : (
                          <ul className="ai-match-list">
                            {suggestedMatches.map((match) => (
                              <li key={match.id}>
                                <div className="ai-match-top">
                                  <Link href={`/product/${match.id}`} target="_blank">
                                    {match.title}
                                  </Link>
                                  <strong>{match.score}</strong>
                                </div>
                                <div className="ai-match-meta">
                                  {match.brand} • {match.color} • Cat: {match.catalogue_number} • Serial: {match.serial_number}
                                </div>
                                <div className="ai-match-reasons">{match.reasons.join(" · ")}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confidence meter */}
                  <div className="confidence-section">
                    <div className="confidence-header">
                      <span className="confidence-label">Authentication Confidence</span>
                      <span className="confidence-value">{confidence > 0 ? confidence : autoConfidence}%</span>
                    </div>
                    <div className="confidence-bar-bg">
                      <div
                        className="confidence-bar-fill"
                        style={{
                          width: `${confidence > 0 ? confidence : autoConfidence}%`,
                          background:
                            (confidence > 0 ? confidence : autoConfidence) >= 80
                              ? "#16a34a"
                              : (confidence > 0 ? confidence : autoConfidence) >= 50
                              ? "#f59e0b"
                              : "#dc2626",
                        }}
                      />
                    </div>
                    <div className="confidence-override">
                      <label>
                        Manual override:
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={confidence}
                          onChange={(e) => setConfidence(Number(e.target.value) || 0)}
                          placeholder="Auto"
                          className="confidence-input"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Inspection checklist */}
                  <div className="checklist-section">
                    <h3 className="section-heading">Inspection Checklist</h3>
                    <p className="section-desc">
                      Evaluate each authentication point. Mark as Pass, Fail, or
                      N/A for items that do not apply to this product type.
                    </p>

                    <div className="checklist-grid">
                      {CHECKLIST_ITEMS.map((item) => {
                        const val = checklist[item.key] || "";
                        return (
                          <div key={item.key} className="checklist-row">
                            <div className="checklist-info">
                              <span className="checklist-label">
                                {item.label}
                              </span>
                              <span className="checklist-desc">
                                {item.description}
                              </span>
                            </div>
                            <div className="checklist-buttons">
                              <button
                                type="button"
                                className={`ck-btn ck-pass ${val === "pass" ? "ck-active" : ""}`}
                                onClick={() => handleCheckChange(item.key, "pass")}
                              >
                                Pass
                              </button>
                              <button
                                type="button"
                                className={`ck-btn ck-fail ${val === "fail" ? "ck-active" : ""}`}
                                onClick={() => handleCheckChange(item.key, "fail")}
                              >
                                Fail
                              </button>
                              <button
                                type="button"
                                className={`ck-btn ck-na ${val === "na" ? "ck-active" : ""}`}
                                onClick={() => handleCheckChange(item.key, "na")}
                              >
                                N/A
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="notes-section">
                    <h3 className="section-heading">Authenticator Notes</h3>
                    <textarea
                      className="notes-textarea"
                      rows={4}
                      placeholder="Additional observations, discrepancies, or references used during authentication..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Verdict */}
                  <div className="verdict-section">
                    <h3 className="section-heading">Authentication Verdict</h3>
                    <div className="verdict-options">
                      <button
                        type="button"
                        className={`verdict-btn verdict-authentic ${verdict === "Authentic" ? "verdict-active" : ""}`}
                        onClick={() => setVerdict("Authentic")}
                      >
                        <span className="verdict-icon">&#10003;</span>
                        <span className="verdict-text">Authentic</span>
                        <span className="verdict-sub">
                          Item passes all verification checks
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`verdict-btn verdict-not-authentic ${verdict === "Not Authentic" ? "verdict-active" : ""}`}
                        onClick={() => setVerdict("Not Authentic")}
                      >
                        <span className="verdict-icon">&#10007;</span>
                        <span className="verdict-text">Not Authentic</span>
                        <span className="verdict-sub">
                          Item fails one or more critical checks
                        </span>
                      </button>
                      <button
                        type="button"
                        className={`verdict-btn verdict-inconclusive ${verdict === "Inconclusive" ? "verdict-active" : ""}`}
                        onClick={() => setVerdict("Inconclusive")}
                      >
                        <span className="verdict-icon">?</span>
                        <span className="verdict-text">Inconclusive</span>
                        <span className="verdict-sub">
                          Unable to determine — needs further review
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="submit-section">
                    <button
                      type="button"
                      className="submit-btn"
                      disabled={!verdict || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting
                        ? "Saving..."
                        : `Record Verdict & Issue Certificate`}
                    </button>

                    {result?.ok && (
                      <div className="result-success">
                        <strong>Authentication recorded.</strong>
                        <br />
                        Certificate: <code>{result.cert}</code>
                      </div>
                    )}
                    {result && !result.ok && (
                      <div className="result-error">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        /* Layout */
        .auth-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
          margin-top: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .auth-layout {
            grid-template-columns: 1fr;
          }
        }

        .auth-panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }

        /* Left panel — listing selector */
        .auth-list-panel {
          padding: 16px;
          max-height: calc(100vh - 200px);
          display: flex;
          flex-direction: column;
        }
        .panel-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin: 0 0 12px;
          color: #111827;
        }
        .filter-bar {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 13px;
        }
        .filter-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 13px;
          background: #fff;
        }
        .listing-scroll {
          overflow-y: auto;
          flex: 1;
        }
        .listing-card {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          margin-bottom: 8px;
          transition: border-color 0.15s;
        }
        .listing-card:hover {
          border-color: #111827;
        }
        .listing-card-active {
          border-color: #111827;
          background: #f9fafb;
          box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.12);
        }
        .listing-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .listing-card-title {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .listing-card-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: #6b7280;
        }
        .listing-card-serial {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .auth-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .auth-badge-pass {
          background: #dcfce7;
          color: #166534;
        }
        .auth-badge-fail {
          background: #fef2f2;
          color: #991b1b;
        }
        .auth-badge-pending {
          background: #fef9c3;
          color: #854d0e;
        }
        .auth-badge-none {
          background: #f3f4f6;
          color: #6b7280;
        }
        .muted-text {
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
          padding: 24px 0;
        }

        /* Right panel — authentication workspace */
        .auth-work-panel {
          padding: 20px 24px;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        .empty-state h3 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
        }
        .empty-state p {
          font-size: 14px;
          max-width: 400px;
          margin: 0 auto;
        }

        /* Item summary */
        .item-summary {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }
        .item-summary h2 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #111827;
        }
        .item-summary-details {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #374151;
        }
        .item-details-text {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          line-height: 1.5;
        }
        .btn-view-product {
          display: inline-block;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }
        .btn-view-product:hover {
          background: #1f2937;
        }

        /* Confidence meter */
        .confidence-section {
          margin-bottom: 24px;
        }
        .confidence-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .confidence-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .confidence-value {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
        }
        .confidence-bar-bg {
          height: 10px;
          background: #e5e7eb;
          border-radius: 999px;
          overflow: hidden;
        }
        .confidence-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s, background 0.3s;
        }
        .confidence-override {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        .confidence-override label {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .confidence-input {
          width: 60px;
          padding: 4px 6px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
        }

        /* Checklist */
        .checklist-section {
          margin-bottom: 24px;
        }
        .ai-assist-section {
          margin-bottom: 24px;
        }
        .ai-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 840px) {
          .ai-grid {
            grid-template-columns: 1fr;
          }
        }
        .ai-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
          background: #f9fafb;
        }
        .ai-card h4 {
          margin: 0 0 8px;
          font-size: 13px;
          color: #111827;
        }
        .ai-warning {
          font-size: 12px;
          color: #b45309;
          margin: 0 0 6px;
        }
        .ai-pass {
          font-size: 12px;
          color: #166534;
          margin: 0;
        }
        .ai-muted {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
        .ai-match-list {
          margin: 0;
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-match-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
        }
        .ai-match-top a {
          color: #111827;
          text-decoration: underline;
        }
        .ai-match-meta,
        .ai-match-reasons {
          font-size: 11px;
          color: #4b5563;
          line-height: 1.4;
        }
        .section-heading {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }
        .section-desc {
          font-size: 12px;
          color: #6b7280;
          margin: 0 0 12px;
        }
        .checklist-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .checklist-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fafafa;
        }
        .checklist-info {
          flex: 1;
        }
        .checklist-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #111827;
        }
        .checklist-desc {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
          line-height: 1.4;
        }
        .checklist-buttons {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .ck-btn {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          background: #fff;
          color: #374151;
          transition: all 0.15s;
        }
        .ck-btn:hover {
          border-color: #9ca3af;
        }
        .ck-pass.ck-active {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }
        .ck-fail.ck-active {
          background: #dc2626;
          color: #fff;
          border-color: #dc2626;
        }
        .ck-na.ck-active {
          background: #6b7280;
          color: #fff;
          border-color: #6b7280;
        }

        /* Notes */
        .notes-section {
          margin-bottom: 24px;
        }
        .notes-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 13px;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
        }

        /* Verdict */
        .verdict-section {
          margin-bottom: 24px;
        }
        .verdict-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 10px;
        }
        @media (max-width: 768px) {
          .verdict-options {
            grid-template-columns: 1fr;
          }
        }
        .verdict-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 20px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .verdict-btn:hover {
          border-color: #9ca3af;
        }
        .verdict-icon {
          font-size: 28px;
          margin-bottom: 6px;
        }
        .verdict-text {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .verdict-sub {
          font-size: 11px;
          color: #6b7280;
          margin-top: 4px;
        }
        .verdict-authentic.verdict-active {
          border-color: #16a34a;
          background: #f0fdf4;
        }
        .verdict-authentic.verdict-active .verdict-icon {
          color: #16a34a;
        }
        .verdict-not-authentic.verdict-active {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .verdict-not-authentic.verdict-active .verdict-icon {
          color: #dc2626;
        }
        .verdict-inconclusive.verdict-active {
          border-color: #f59e0b;
          background: #fffbeb;
        }
        .verdict-inconclusive.verdict-active .verdict-icon {
          color: #f59e0b;
        }

        /* Submit */
        .submit-section {
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .submit-btn {
          background: #111827;
          color: #fff;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .submit-btn:not(:disabled):hover {
          background: #1f2937;
        }
        .result-success {
          margin-top: 12px;
          padding: 12px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          font-size: 13px;
          color: #166534;
        }
        .result-success code {
          background: #dcfce7;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 14px;
        }
        .result-error {
          margin-top: 12px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          font-size: 13px;
          color: #991b1b;
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Server-side: load listings for authentication                      */
/* ------------------------------------------------------------------ */

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // Auth check
  const { verifySessionToken, ADMIN_SESSION_COOKIE, getAdminEmails } =
    await import("../../utils/adminSession");
  const raw = ctx.req.cookies?.[ADMIN_SESSION_COOKIE] || "";
  if (!raw) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }
  const result = verifySessionToken(raw);
  if (!result.valid) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }
  const admins = getAdminEmails();
  if (admins.size > 0 && !admins.has(result.email)) {
    return { redirect: { destination: "/management/login", permanent: false } };
  }

  if (!adminDb) return { props: { items: [] } };

  try {
    const snap = await adminDb
      .collection("listings")
      .limit(300)
      .get();

    const items: Listing[] = snap.docs.map((doc) => {
      const d: any = doc.data() || {};
      return {
        id: doc.id,
        title: d.title || "Untitled listing",
        brand: d.brand || d.designer || "",
        designer: d.designer || d.brand || "",
        model: d.model || d.model_name || "",
        color: d.color || parseColor(`${d.title || ""} ${d.details || ""}`),
        catalogue_number: d.catalogue_number || d.catalog_number || d.style_code || "",
        date_code: d.date_code || "",
        category: d.category || "",
        condition: d.condition || "",
        price: Number(d.price || 0),
        serial_number: d.serial_number || "",
        material: d.material || "",
        image_url: d.image_url || d.imageUrl || "",
        seller:
          d.sellerName || d.sellerDisplayName || d.sellerId || "Seller",
        status: d.status || "",
        purchase_source: d.purchase_source || "",
        purchase_proof: d.purchase_proof || "",
        details: d.details || "",
        authenticationStatus: d.authenticationStatus || "",
      };
    });

    return { props: { items } };
  } catch (err) {
    console.error("Error loading listings for authentication", err);
    return { props: { items: [] } };
  }
};
