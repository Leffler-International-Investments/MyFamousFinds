// FILE: /pages/index.tsx

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

type FaqItem = {
  question: string;
  answer: string;
};

type AiProfile = {
  code: string;
  name: string;
  url: string;
  category?: string;
  locations?: string[];
  summary?: string;
  longSummary?: string;
  faq?: FaqItem[];
  keywords?: string[];
  platforms?: string[];
};

type BusinessApiResponse =
  | { profile: any | null }
  | { error: string };

export default function Home() {
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [locations, setLocations] = useState("");
  const [openingHours, setOpeningHours] = useState("Mon–Fri 9:00–17:00");

  const [descriptionShort, setDescriptionShort] = useState("");
  const [descriptionLong, setDescriptionLong] = useState("");
  const [keywords, setKeywords] = useState("");

  // NEW: AI platforms dropdown
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [recalling, setRecalling] = useState(false);

  // ---------------------------
  // Load list of AI platforms
  // ---------------------------
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const res = await fetch("/api/ai-platforms");
        if (!res.ok) throw new Error("Failed platforms");
        const data: { platforms: string[] } = await res.json();
        setPlatformOptions(data.platforms || []);
      } catch (err) {
        console.error("Failed to load AI platforms", err);
        // Fallback list
        setPlatformOptions([
          "OpenAI ChatGPT",
          "Google Gemini",
          "Anthropic Claude",
          "Microsoft Copilot",
          "Perplexity AI",
          "Meta AI",
        ]);
      }
    };
    loadPlatforms();
  }, []);

  // ---------------------------
  // Recall saved business
  // ---------------------------
  const fetchProfile = async () => {
    setRecalling(true);
    try {
      const res = await fetch("/api/business");
      const data: BusinessApiResponse = await res.json();

      if ("profile" in data && data.profile) {
        const p: any = data.profile;

        setBusinessId(p.id || null);
        setName(p.name || "");
        setUrl(p.url || "");
        setCategory(p.category || "");
        setLocations((p.locations || []).join(", "));
        setOpeningHours(p.openingHours || "Mon–Fri 9:00–17:00");
        setDescriptionShort(p.descriptionShort || "");
        setDescriptionLong(p.descriptionLong || "");
        setKeywords((p.keywords || []).join(", "));
        setSelectedPlatforms(p.aiPlatforms || []);

        const preview: AiProfile = {
          code: p.businessCode || "",
          name: p.name || "",
          url: p.url || "",
          category: p.category,
          locations: p.locations || [],
          summary: p.aiSummaryShort || "",
          longSummary: p.aiSummaryLong || "",
          faq: p.aiFaq || [],
          keywords: p.keywords || [],
          platforms: p.aiPlatforms || [],
        };
        setAiProfile(preview);
      } else {
        setAiProfile(null);
      }
    } catch (err) {
      console.error("Failed to recall profile", err);
      alert("Could not recall saved profile.");
    } finally {
      setRecalling(false);
    }
  };

  // auto-recall on first load
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------
  // Save + (optionally) call OpenAI
  // ---------------------------
  const handleSave = async () => {
    setLoading(true);
    try {
      let short = descriptionShort.trim();
      let long = descriptionLong.trim();
      let kw = keywords.trim();

      // If any of the fields are missing, ask OpenAI to fill them
      if (!short || !long || !kw) {
        try {
          const aiRes = await fetch("/api/generate-ai-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              url,
              category,
              locations,
              openingHours,
            }),
          });

          const aiData: any = await aiRes.json();
          if (aiRes.ok && !aiData.error) {
            if (!short && aiData.shortDescription) {
              short = String(aiData.shortDescription).trim();
              setDescriptionShort(short);
            }
            if (!long && aiData.longDescription) {
              long = String(aiData.longDescription).trim();
              setDescriptionLong(long);
            }
            if (!kw && Array.isArray(aiData.keywords)) {
              const joined = aiData.keywords.join(", ");
              kw = joined;
              setKeywords(joined);
            }
          } else {
            console.error("AI generation failed:", aiData.error);
          }
        } catch (err) {
          console.error("AI generation error", err);
        }
      }

      const saveRes = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          url,
          category,
          locations,
          openingHours,
          descriptionShort: short,
          descriptionLong: long,
          keywords: kw,
          aiPlatforms: selectedPlatforms,
        }),
      });

      const saveData: any = await saveRes.json();

      if (!saveRes.ok || saveData.error) {
        alert(saveData.error || "Failed to save profile");
        return;
      }

      if (saveData.profile) {
        const p = saveData.profile;
        setBusinessId(p.id || null);

        const preview: AiProfile = {
          code: p.businessCode || "",
          name: p.name || "",
          url: p.url || "",
          category: p.category,
          locations: p.locations || [],
          summary: p.aiSummaryShort || "",
          longSummary: p.aiSummaryLong || "",
          faq: p.aiFaq || [],
          keywords: p.keywords || [],
          platforms: p.aiPlatforms || [],
        };
        setAiProfile(preview);
      }

      alert("AI profile saved.");
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Publish / refresh everywhere
  // ---------------------------
  const handlePublish = async () => {
    if (!aiProfile) {
      alert("No AI profile to publish.");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            id: businessId,
            ...aiProfile,
          },
        }),
      });
      const data: any = await res.json();
      if (!res.ok || data.ok === false) {
        alert("Publish failed.");
        return;
      }
      alert("Published / refreshed everywhere.");
    } catch (err) {
      console.error(err);
      alert("Publish failed.");
    } finally {
      setPublishing(false);
    }
  };

  const aiProfileJson = aiProfile
    ? JSON.stringify(aiProfile, null, 2)
    : "// Save your profile to see AI JSON preview here.";

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="abl-root">
      <Head>
        <title>AI Business Launcher</title>
      </Head>

      {/* HEADER */}
      <header className="abl-header">
        <div className="abl-header-inner">
          <div className="abl-logo">AI Business Launcher</div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="abl-main">
        <section className="abl-card" style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>
            AI Business Launcher – One Profile, All AI Platforms
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", maxWidth: 640 }}>
            Enter your business details once. AI Business Launcher generates an
            AI-ready profile and links it to your AI Platforms Directory.
          </p>
        </section>

        {/* Two-column layout: form + preview */}
        <div className="abl-grid-2">
          {/* FORM CARD */}
          <section className="abl-card">
            <form
              className="abl-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="abl-grid-2">
                <label>
                  <span>Business name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>

                <label>
                  <span>Website URL</span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </label>
              </div>

              <div className="abl-grid-2">
                <label>
                  <span>Category</span>
                  <input
                    placeholder="e.g. Weight-loss coach, Rehab centre"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </label>

                <label>
                  <span>Locations (comma separated)</span>
                  <input
                    placeholder="Melbourne, Sydney"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                  />
                </label>
              </div>

              <label>
                <span>Opening hours</span>
                <input
                  placeholder="Mon–Fri 9:00–17:00"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                />
              </label>

              {/* NEW: AI PLATFORMS DROPDOWN */}
              <label>
                <span>
                  Choose the AI platforms to launch your business to{" "}
                  <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                    (hold Ctrl / ⌘ to select multiple)
                  </span>
                </span>
                <select
                  multiple
                  value={selectedPlatforms}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions
                    ).map((o) => o.value);
                    setSelectedPlatforms(values);
                  }}
                  style={{
                    minHeight: 80,
                    background: "#020617",
                    borderRadius: 8,
                    border: "1px solid #1f2937",
                    padding: 8,
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                >
                  {platformOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 2,
                  }}
                >
                  This list is maintained by the AI Business Launcher algorithm
                  and refreshed monthly.
                </span>
              </label>

              <label>
                <span>Short description</span>
                <textarea
                  placeholder="Leave blank to let AI suggest this."
                  value={descriptionShort}
                  onChange={(e) => setDescriptionShort(e.target.value)}
                  rows={3}
                />
              </label>

              <label>
                <span>Long description</span>
                <textarea
                  placeholder="Leave blank to let AI suggest this."
                  value={descriptionLong}
                  onChange={(e) => setDescriptionLong(e.target.value)}
                  rows={4}
                />
              </label>

              <label>
                <span>Keywords (comma separated)</span>
                <textarea
                  placeholder="Leave blank to let AI suggest SEO keywords."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={2}
                />
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <button
                    type="submit"
                    className="abl-btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving…"
                      : "Save & Generate AI Profile"}
                  </button>
                  <button
                    type="button"
                    className="abl-btn-secondary"
                    style={{ marginLeft: 8 }}
                    onClick={fetchProfile}
                    disabled={recalling}
                  >
                    {recalling ? "Recalling…" : "Recall Saved Profile"}
                  </button>
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  Management:{" "}
                  <Link href="/management/ai-directory">
                    AI Platforms Directory
                  </Link>
                </p>
              </div>
            </form>
          </section>

          {/* PREVIEW CARD */}
          <section className="abl-card abl-preview">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ fontSize: 16, margin: 0 }}>
                AI Profile Preview (JSON)
              </h2>
              <button
                type="button"
                className="abl-btn-secondary"
                onClick={handlePublish}
                disabled={publishing || !aiProfile}
              >
                {publishing
                  ? "Publishing…"
                  : "Publish / Refresh Everywhere"}
              </button>
            </div>
            <pre>{aiProfileJson}</pre>
          </section>
        </div>
      </main>
    </div>
  );
}

