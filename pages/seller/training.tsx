// FILE: /pages/seller/training.tsx
// Seller reads the Famous Finds training module and completes the certification quiz.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { useEffect, useState } from "react";

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What is required before listing a Bag, Watch, or Jewelry item?",
    options: [
      "A. Just a photo",
      "B. At least 2 of 3 authentication documents and a serial/reference number",
      "C. Only a price",
      "D. Nothing extra",
    ],
  },
  {
    id: "q2",
    question: "How long is the cooling-off period before a seller receives their payout after delivery?",
    options: ["A. 3 days", "B. 7 days", "C. 14 days", "D. 30 days"],
  },
  {
    id: "q3",
    question: "What should a seller do if an item sells and they need to ship it?",
    options: [
      "A. Wait for the buyer to contact them",
      "B. Immediately prepare the item and use the UPS label generated in their dashboard",
      "C. Arrange their own courier",
      "D. Contact support and wait 5 days",
    ],
  },
  {
    id: "q4",
    question: "Can a seller list items without completing their bank account details?",
    options: [
      "A. Yes, always",
      "B. No — bank details are required before listing",
      "C. Only for items under $100",
      "D. Yes, but only 1 item",
    ],
  },
  {
    id: "q5",
    question: "What happens if a listing is rejected by management?",
    options: [
      "A. It is automatically relisted",
      "B. The seller is banned",
      "C. The seller receives an email with the rejection reason and can resubmit",
      "D. Nothing — it disappears silently",
    ],
  },
  {
    id: "q6",
    question: "Which best describes MyFamousFinds' authentication standard?",
    options: [
      "A. Items are sold as-is with no verification",
      "B. Only buyers verify items after purchase",
      "C. Management reviews every listing and checks authenticity documents before approval",
      "D. Authentication is optional",
    ],
  },
  {
    id: "q7",
    question: "What is the platform commission structure?",
    options: [
      "A. Sellers keep 100% of the sale price",
      "B. A platform fee is deducted from the seller payout as per the consignment agreement",
      "C. Buyers pay the commission",
      "D. There is no commission",
    ],
  },
];

const TRAINING_SECTIONS = [
  {
    title: "1. Listing Requirements",
    icon: "📋",
    content: `When creating a listing, every item needs: a Designer, Title, Category, Condition, Price, Purchase Source, and Purchase Proof. For Bags, Watches, and Jewelry you must also provide a Serial/Reference number and upload at least 2 of 3 authentication documents (receipt, certificate of authenticity, insurance appraisal, Entrupy report, or warranty card). Items missing required information will not be approved.`,
  },
  {
    title: "2. Authentication Standards",
    icon: "🔐",
    content: `MyFamousFinds is an authenticated luxury resale marketplace. Every listing is reviewed by management before it goes live. For high-value categories (Bags, Watches, Jewelry), authentication documents are mandatory. Management may request additional proof or reject listings that do not meet our standards. You will receive an email with the reason if a listing is rejected.`,
  },
  {
    title: "3. Banking & Payouts",
    icon: "💳",
    content: `Before you can list items, you must complete your bank account details in the Banking & Payouts section of your dashboard. Payouts are processed after a 14-day cooling-off period following delivery confirmation. This protects both buyers and sellers. You can track your balance and payout history in your Wallet.`,
  },
  {
    title: "4. Shipping with UPS",
    icon: "📦",
    content: `When an item sells, MyFamousFinds generates a pre-paid UPS shipping label automatically. You will receive an email with the label. Go to Orders in your dashboard, print the label, pack your item securely, and drop it at any UPS location. Do not arrange your own courier — using the generated label protects both parties and keeps tracking visible to management.`,
  },
  {
    title: "5. Buyer Offers",
    icon: "🤝",
    content: `If you enable 'Allow Offers' on a listing, buyers can submit offers below your listed price. You will see offers in the Buyer Offers section of your dashboard. You can accept, decline, or let them expire. Accepted offers are binding — the buyer will be charged and the item enters the order process.`,
  },
  {
    title: "6. Platform Commission",
    icon: "📊",
    content: `By listing on MyFamousFinds you agree to the consignment agreement, which outlines the platform fee deducted from your payout. You keep the remainder after the fee is applied. The fee structure is detailed in your signed consignment agreement. Questions about specific rates should be directed to management.`,
  },
  {
    title: "7. Seller Conduct & Integrity",
    icon: "⭐",
    content: `Sellers on MyFamousFinds are expected to list only authentic items, respond promptly to order notifications, ship within the agreed timeframe, and maintain accurate item descriptions. Misrepresentation, late shipping, or disputes may result in account suspension. We are building a trusted community — your reputation matters.`,
  },
];

export default function SellerTraining() {
  const { loading: authLoading } = useRequireSeller();
  const [step, setStep] = useState<"training" | "quiz" | "result">("training");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [sellerId, setSellerId] = useState("");

  useEffect(() => {
    const id = String(
      window.localStorage.getItem("ff-seller-id") ||
      window.localStorage.getItem("ff-email") || ""
    ).trim();
    setSellerId(id);
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    fetch(`/api/management/seller-training?sellerId=${encodeURIComponent(sellerId)}`)
      .then((r) => r.json())
      .then((d) => {
        setTrainingStatus(d);
        if (d.certified) setStep("result");
        else if (d.status === "failed") setStep("quiz");
      })
      .catch(() => {});
  }, [sellerId]);

  const submitQuiz = async () => {
    if (Object.keys(answers).length < QUIZ_QUESTIONS.length) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/management/seller-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", sellerId, answers }),
      });
      const json = await res.json();
      setResult({ score: json.score, total: json.total, passed: json.passed });
      setStep("result");
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div />;

  return (
    <>
      <Head><title>Seller Training & Certification | Famous Finds</title></Head>
      <div className="training-page">
        <Header />
        <main className="training-main">
          <div className="training-back">
            <Link href="/seller/dashboard">← Back to Dashboard</Link>
          </div>

          {/* Header */}
          <div className="training-header">
            <div className="training-badge-icon">🏆</div>
            <h1>Certified Famous Finds Seller</h1>
            <p className="training-subtitle">
              Complete the training and pass the quiz to earn your <strong>Certified FF Seller</strong> badge.
            </p>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-wrap">
            {["Training", "Quiz", "Certificate"].map((label, i) => {
              const stepIdx = step === "training" ? 0 : step === "quiz" ? 1 : 2;
              return (
                <div key={label} className={`progress-step ${stepIdx >= i ? "progress-step--active" : ""}`}>
                  <div className="progress-dot">{stepIdx > i ? "✓" : i + 1}</div>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {/* TRAINING STEP */}
          {step === "training" && (
            <div>
              <p className="step-intro">Read each section below. Once you've read all 7 sections, you can proceed to the quiz.</p>
              {TRAINING_SECTIONS.map((section, i) => (
                <div
                  key={i}
                  className={`training-card ${readSections.has(i) ? "training-card--read" : ""}`}
                  onClick={() => setReadSections((prev) => { const n = new Set(prev); n.add(i); return n; })}
                >
                  <div className="training-card-header">
                    <span className="training-card-icon">{section.icon}</span>
                    <h3 className="training-card-title">{section.title}</h3>
                    {readSections.has(i) && <span className="read-check">✓ Read</span>}
                  </div>
                  <p className="training-card-body">{section.content}</p>
                </div>
              ))}
              <div className="step-actions">
                <button
                  className="btn-primary-train"
                  disabled={readSections.size < TRAINING_SECTIONS.length}
                  onClick={() => setStep("quiz")}
                >
                  {readSections.size < TRAINING_SECTIONS.length
                    ? `Read all sections first (${readSections.size}/${TRAINING_SECTIONS.length} read)`
                    : "Start the Quiz →"}
                </button>
              </div>
            </div>
          )}

          {/* QUIZ STEP */}
          {step === "quiz" && (
            <div>
              <p className="step-intro">Answer all 7 questions. You need 5/7 correct to pass.</p>
              {QUIZ_QUESTIONS.map((q, i) => (
                <div key={q.id} className="quiz-card">
                  <p className="quiz-question"><span className="quiz-num">Q{i + 1}.</span> {q.question}</p>
                  <div className="quiz-options">
                    {q.options.map((opt) => {
                      const letter = opt.charAt(0);
                      const selected = answers[q.id] === letter;
                      return (
                        <label key={opt} className={`quiz-option ${selected ? "quiz-option--selected" : ""}`}>
                          <input
                            type="radio"
                            name={q.id}
                            value={letter}
                            checked={selected}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                            style={{ marginRight: 10 }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="step-actions">
                <button
                  className="btn-primary-train"
                  disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length || submitting}
                  onClick={submitQuiz}
                >
                  {submitting ? "Submitting…" : Object.keys(answers).length < QUIZ_QUESTIONS.length
                    ? `Answer all questions (${Object.keys(answers).length}/${QUIZ_QUESTIONS.length})`
                    : "Submit Quiz"}
                </button>
              </div>
            </div>
          )}

          {/* RESULT STEP */}
          {step === "result" && (
            <div className="result-wrap">
              {(result?.passed || trainingStatus?.certified) ? (
                <div className="result-card result-card--pass">
                  <div className="cert-badge">
                    <span className="cert-badge-icon">🏆</span>
                    <h2 className="cert-title">Certified Famous Finds Seller</h2>
                    <p className="cert-sub">
                      {result ? `You scored ${result.score}/${result.total}.` : ""} Congratulations — you are now a Certified FF Seller!
                    </p>
                    <div className="cert-stamp">✓ CERTIFIED FF SELLER</div>
                  </div>
                  <p className="cert-note">
                    Your certification badge will appear on your seller profile. Management has been notified.
                  </p>
                  <Link href="/seller/dashboard" className="btn-dashboard-link">
                    Go to Dashboard →
                  </Link>
                </div>
              ) : (
                <div className="result-card result-card--fail">
                  <div className="fail-icon">😔</div>
                  <h2>Not quite — {result?.score}/{result?.total} correct</h2>
                  <p style={{ color: "#374151", marginBottom: 20 }}>
                    You need 5/7 to pass. Review the training material and try again.
                  </p>
                  <button className="btn-primary-train" onClick={() => { setAnswers({}); setStep("training"); setReadSections(new Set()); }}>
                    Review Training & Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      <style jsx>{`
        .training-page { background: #f9fafb; min-height: 100vh; color: #111827; }
        .training-main { max-width: 760px; margin: 0 auto; padding: 24px 16px 80px; }
        .training-back a { color: #4b5563; font-size: 13px; text-decoration: none; }
        .training-back a:hover { color: #111827; }
        .training-header { text-align: center; margin: 24px 0 28px; }
        .training-badge-icon { font-size: 52px; margin-bottom: 12px; }
        .training-header h1 { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .training-subtitle { font-size: 15px; color: #6b7280; margin: 0; line-height: 1.6; }

        /* Progress */
        .progress-bar-wrap { display: flex; justify-content: center; gap: 0; margin-bottom: 32px; }
        .progress-step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; max-width: 140px; position: relative; }
        .progress-step:not(:last-child)::after { content: ""; position: absolute; top: 16px; left: 50%; width: 100%; height: 2px; background: #e5e7eb; z-index: 0; }
        .progress-step--active .progress-dot { background: #111827; color: #fff; }
        .progress-step--active::after { background: #111827; }
        .progress-dot { width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; color: #6b7280; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; z-index: 1; position: relative; }
        .progress-step span { font-size: 12px; color: #6b7280; font-weight: 500; }
        .progress-step--active span { color: #111827; font-weight: 700; }

        .step-intro { font-size: 14px; color: #6b7280; margin: 0 0 20px; }

        /* Training cards */
        .training-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; cursor: pointer; transition: border-color 0.15s; }
        .training-card:hover { border-color: #b8860b; }
        .training-card--read { border-color: #16a34a; background: #f0fdf4; }
        .training-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .training-card-icon { font-size: 22px; }
        .training-card-title { font-size: 15px; font-weight: 700; margin: 0; flex: 1; }
        .read-check { font-size: 12px; font-weight: 600; color: #16a34a; background: #dcfce7; padding: 2px 8px; border-radius: 999px; }
        .training-card-body { font-size: 14px; color: #374151; line-height: 1.7; margin: 0; }

        /* Quiz */
        .quiz-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px 20px; margin-bottom: 14px; }
        .quiz-question { font-size: 15px; font-weight: 600; color: #111827; margin: 0 0 14px; line-height: 1.5; }
        .quiz-num { color: #b8860b; margin-right: 6px; }
        .quiz-options { display: flex; flex-direction: column; gap: 8px; }
        .quiz-option { display: flex; align-items: flex-start; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 14px; color: #374151; transition: all 0.15s; }
        .quiz-option:hover { border-color: #b8860b; background: #fffbeb; }
        .quiz-option--selected { border-color: #111827; background: #f3f4f6; font-weight: 600; color: #111827; }

        /* Actions */
        .step-actions { display: flex; justify-content: center; margin-top: 28px; }
        .btn-primary-train { padding: 13px 40px; background: #111827; color: #fff; border: none; border-radius: 999px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .btn-primary-train:hover { opacity: 0.85; }
        .btn-primary-train:disabled { background: #9ca3af; cursor: not-allowed; opacity: 1; }

        /* Result */
        .result-wrap { display: flex; justify-content: center; padding: 20px 0; }
        .result-card { border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 480px; width: 100%; }
        .result-card--pass { background: linear-gradient(135deg, #1c1917 0%, #2d2521 100%); color: #fff; border: 2px solid #b8860b; }
        .result-card--fail { background: #fff; border: 1px solid #e5e7eb; color: #111827; }
        .cert-badge { margin-bottom: 24px; }
        .cert-badge-icon { font-size: 60px; display: block; margin-bottom: 12px; }
        .cert-title { font-size: 24px; font-weight: 800; color: #d4a843; margin: 0 0 8px; }
        .cert-sub { font-size: 15px; color: #e7e5e4; margin: 0; }
        .cert-stamp { display: inline-block; margin-top: 20px; border: 2px solid #d4a843; color: #d4a843; padding: 8px 24px; border-radius: 4px; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; transform: rotate(-2deg); }
        .cert-note { font-size: 13px; color: #a8a29e; margin: 20px 0 24px; }
        .btn-dashboard-link { display: inline-block; background: #d4a843; color: #1c1917; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 999px; }
        .fail-icon { font-size: 48px; margin-bottom: 12px; }
      `}</style>
    </>
  );
}
