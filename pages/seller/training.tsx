// FILE: /pages/seller/training.tsx
// Seller reads the Famous Finds training module and completes the certification quiz.

import Head from "next/head";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useRequireSeller } from "../../hooks/useRequireSeller";
import { useEffect, useState, useCallback } from "react";

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
      "B. No \u2014 bank details are required before listing",
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
      "D. Nothing \u2014 it disappears silently",
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
    icon: "\u{1F4CB}",
    content: "When creating a listing, every item needs: a Designer, Title, Category, Condition, Price, Purchase Source, and Purchase Proof. For Bags, Watches, and Jewelry you must also provide a Serial/Reference number and upload at least 2 of 3 authentication documents (receipt, certificate of authenticity, insurance appraisal, Entrupy report, or warranty card). Items missing required information will not be approved.",
  },
  {
    title: "2. Authentication Standards",
    icon: "\u{1F510}",
    content: "MyFamousFinds is an authenticated luxury resale marketplace. Every listing is reviewed by management before it goes live. For high-value categories (Bags, Watches, Jewelry), authentication documents are mandatory. Management may request additional proof or reject listings that do not meet our standards. You will receive an email with the reason if a listing is rejected.",
  },
  {
    title: "3. Banking & Payouts",
    icon: "\u{1F4B3}",
    content: "Before you can list items, you must complete your bank account details in the Banking & Payouts section of your dashboard. Payouts are processed after a 14-day cooling-off period following delivery confirmation. This protects both buyers and sellers. You can track your balance and payout history in your Wallet.",
  },
  {
    title: "4. Shipping with UPS",
    icon: "\u{1F4E6}",
    content: "When an item sells, MyFamousFinds generates a pre-paid UPS shipping label automatically. You will receive an email with the label. Go to Orders in your dashboard, print the label, pack your item securely, and drop it at any UPS location. Do not arrange your own courier \u2014 using the generated label protects both parties and keeps tracking visible to management.",
  },
  {
    title: "5. Buyer Offers",
    icon: "\u{1F91D}",
    content: "If you enable 'Allow Offers' on a listing, buyers can submit offers below your listed price. You will see offers in the Buyer Offers section of your dashboard. You can accept, decline, or let them expire. Accepted offers are binding \u2014 the buyer will be charged and the item enters the order process.",
  },
  {
    title: "6. Platform Commission",
    icon: "\u{1F4CA}",
    content: "By listing on MyFamousFinds you agree to the consignment agreement, which outlines the platform fee deducted from your payout. You keep the remainder after the fee is applied. The fee structure is detailed in your signed consignment agreement. Questions about specific rates should be directed to management.",
  },
  {
    title: "7. Seller Conduct & Integrity",
    icon: "\u{2B50}",
    content: "Sellers on MyFamousFinds are expected to list only authentic items, respond promptly to order notifications, ship within the agreed timeframe, and maintain accurate item descriptions. Misrepresentation, late shipping, or disputes may result in account suspension. We are building a trusted community \u2014 your reputation matters.",
  },
];

// Maps each quiz question to the relevant training section index
const QUESTION_TO_SECTION: Record<string, number> = {
  q1: 0, // Listing Requirements
  q2: 2, // Banking & Payouts
  q3: 3, // Shipping with UPS
  q4: 2, // Banking & Payouts
  q5: 1, // Authentication Standards
  q6: 1, // Authentication Standards
  q7: 5, // Platform Commission
};

export default function SellerTraining() {
  const { loading: authLoading } = useRequireSeller();
  const [step, setStep] = useState<"training" | "quiz" | "review" | "result">("training");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [sellerId, setSellerId] = useState("");
  const [failedResults, setFailedResults] = useState<Record<string, { correct: boolean; given: string; expected: string }> | null>(null);
  const [acknowledgedQuestions, setAcknowledgedQuestions] = useState<Set<string>>(new Set());
  const [reviewError, setReviewError] = useState(false);

  useEffect(() => {
    const id = String(
      window.localStorage.getItem("ff-seller-id") ||
      window.localStorage.getItem("ff-email") || ""
    ).trim();
    setSellerId(id);
  }, []);

  // Fetch training status from API
  const fetchTrainingStatus = useCallback(() => {
    if (!sellerId) return;
    fetch(`/api/management/seller-training?sellerId=${encodeURIComponent(sellerId)}`)
      .then((r) => r.json())
      .then((d) => {
        setTrainingStatus(d);
        if (d.results) setFailedResults(d.results);
        if (d.certified) {
          setStep("result");
        } else if (d.status === "failed") {
          setResult({ score: d.score || 0, total: d.total || 7, passed: false });
          setStep("review");
        }
      })
      .catch(() => {});
  }, [sellerId]);

  useEffect(() => {
    fetchTrainingStatus();
  }, [fetchTrainingStatus]);

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
      if (json.passed) {
        setResult({ score: json.score, total: json.total, passed: true });
        setStep("result");
      } else {
        if (json.results) {
          setFailedResults(json.results);
        }
        setResult({ score: json.score, total: json.total, passed: false });
        setAcknowledgedQuestions(new Set());
        setStep("review");
        // If results weren't in the response, re-fetch from Firestore
        if (!json.results) {
          setTimeout(() => fetchTrainingStatus(), 500);
        }
      }
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Derived state for review step — use trainingStatus.results as fallback
  const activeResults = failedResults || trainingStatus?.results || null;
  const failedQuestions = activeResults
    ? QUIZ_QUESTIONS.filter((q) => activeResults[q.id] && !activeResults[q.id].correct)
    : [];
  const allAcknowledged = failedQuestions.length > 0 && failedQuestions.every((q) => acknowledgedQuestions.has(q.id));

  // If on review step but no results loaded, retry fetch once
  useEffect(() => {
    if (step === "review" && failedQuestions.length === 0 && sellerId) {
      const timer = setTimeout(() => fetchTrainingStatus(), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, failedQuestions.length, sellerId, fetchTrainingStatus]);

  const submitReview = useCallback(async () => {
    if (!allAcknowledged || submitting) return;
    setSubmitting(true);
    setReviewError(false);
    try {
      const res = await fetch("/api/management/seller-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete-review", sellerId }),
      });
      const json = await res.json();
      if (json.ok && json.passed) {
        setResult({ score: json.score || json.total, total: json.total, passed: true });
        setStep("result");
      } else {
        setReviewError(true);
      }
    } catch {
      setReviewError(true);
    } finally {
      setSubmitting(false);
    }
  }, [allAcknowledged, submitting, sellerId]);

  // Auto-certify as soon as all failed questions are acknowledged
  useEffect(() => {
    if (allAcknowledged && step === "review" && !submitting) {
      submitReview();
    }
  }, [allAcknowledged, step, submitting, submitReview]);

  if (authLoading) return <div />;

  return (
    <>
      <Head><title>Seller Training & Certification | Famous Finds</title></Head>
      <div className="training-page">
        <Header />
        <main className="training-main">
          <div className="training-back">
            <Link href="/seller/dashboard">{"\u2190"} Back to Dashboard</Link>
          </div>

          {/* Header */}
          <div className="training-header">
            <div className="training-badge-icon">{"\u{1F3C6}"}</div>
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
                  <div className="progress-dot">{stepIdx > i ? "\u2713" : i + 1}</div>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {/* TRAINING STEP */}
          {step === "training" && (
            <div>
              <p className="step-intro">Read each section below. Once you{"'"}ve read all 7 sections, you can proceed to the quiz.</p>
              {TRAINING_SECTIONS.map((section, i) => (
                <div
                  key={i}
                  className={`training-card ${readSections.has(i) ? "training-card--read" : ""}`}
                  onClick={() => setReadSections((prev) => { const n = new Set(prev); n.add(i); return n; })}
                >
                  <div className="training-card-header">
                    <span className="training-card-icon">{section.icon}</span>
                    <h3 className="training-card-title">{section.title}</h3>
                    {readSections.has(i) && <span className="read-check">{"\u2713"} Read</span>}
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
                    : "Start the Quiz \u2192"}
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
                  {submitting ? "Submitting\u2026" : Object.keys(answers).length < QUIZ_QUESTIONS.length
                    ? `Answer all questions (${Object.keys(answers).length}/${QUIZ_QUESTIONS.length})`
                    : "Submit Quiz"}
                </button>
              </div>
            </div>
          )}

          {/* REVIEW STEP — show failed questions with correct answers + acknowledge checkboxes */}
          {step === "review" && (
            <div>
              {failedQuestions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
                  <p>Loading your review questions...</p>
                  <button className="btn-primary-train" style={{ marginTop: 16 }} onClick={fetchTrainingStatus}>
                    Reload
                  </button>
                </div>
              ) : (
                <>
                  <div className="review-header">
                    <div className="review-icon">{"\u{1F4DD}"}</div>
                    <h2 className="review-title">
                      Review {failedQuestions.length} question{failedQuestions.length !== 1 ? "s" : ""} you missed
                    </h2>
                    <p className="step-intro" style={{ textAlign: "center", marginBottom: 0 }}>
                      You scored {result?.score}/{result?.total}. Read the correct answer for each question below and tick the checkbox to confirm you understand.
                    </p>
                  </div>

                  {failedQuestions.map((q) => {
                    const sectionIdx = QUESTION_TO_SECTION[q.id];
                    const section = TRAINING_SECTIONS[sectionIdx];
                    const givenLetter = activeResults![q.id].given;
                    const expectedLetter = activeResults![q.id].expected;
                    const givenOption = q.options.find((o) => o.charAt(0) === givenLetter) || givenLetter;
                    const correctOption = q.options.find((o) => o.charAt(0) === expectedLetter) || expectedLetter;
                    const acknowledged = acknowledgedQuestions.has(q.id);
                    const qNum = QUIZ_QUESTIONS.indexOf(q) + 1;

                    return (
                      <div key={q.id} className="review-block">
                        <div className="review-section-label">Review material for Question {qNum}</div>

                        <div className="training-card training-card--review">
                          <div className="training-card-header">
                            <span className="training-card-icon">{section.icon}</span>
                            <h3 className="training-card-title">{section.title}</h3>
                          </div>
                          <p className="training-card-body">{section.content}</p>
                        </div>

                        <div className={`review-question-card ${acknowledged ? "review-question-card--done" : ""}`}>
                          <p className="quiz-question">
                            <span className="quiz-num">Q{qNum}.</span> {q.question}
                          </p>

                          <div className="review-answer review-answer--wrong">
                            <span className="review-answer-icon">{"\u2717"}</span>
                            <div>
                              <div className="review-answer-label">Your answer</div>
                              <div className="review-answer-text">{givenOption}</div>
                            </div>
                          </div>

                          <div className="review-answer review-answer--correct">
                            <span className="review-answer-icon">{"\u2713"}</span>
                            <div>
                              <div className="review-answer-label">Correct answer</div>
                              <div className="review-answer-text">{correctOption}</div>
                            </div>
                          </div>

                          <label className={`review-checkbox ${acknowledged ? "review-checkbox--checked" : ""}`}>
                            <input
                              type="checkbox"
                              checked={acknowledged}
                              onChange={(e) => {
                                setAcknowledgedQuestions((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(q.id);
                                  else next.delete(q.id);
                                  return next;
                                });
                              }}
                            />
                            <span>I{"'"}ve read and understand the correct answer</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  <div className="step-actions">
                    {submitting ? (
                      <div className="review-status">Completing your certification...</div>
                    ) : reviewError ? (
                      <button className="btn-primary-train" onClick={submitReview}>
                        Try Again
                      </button>
                    ) : (
                      <div className="review-status">
                        {acknowledgedQuestions.size}/{failedQuestions.length} confirmed
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* RESULT STEP — only shows the certified card */}
          {step === "result" && (
            <div className="result-wrap">
              <div className="result-card result-card--pass">
                <div className="cert-badge">
                  <span className="cert-badge-icon">{"\u{1F3C6}"}</span>
                  <h2 className="cert-title">Certified Famous Finds Seller</h2>
                  <p className="cert-sub">
                    Congratulations {"\u2014"} you are now a Certified FF Seller!
                  </p>
                  <div className="cert-stamp">{"\u2713"} CERTIFIED FF SELLER</div>
                </div>
                <p className="cert-note">
                  Your certification badge will appear on your seller profile. Management has been notified.
                </p>
                <Link href="/seller/dashboard" className="btn-dashboard-link">
                  Go to Dashboard {"\u2192"}
                </Link>
              </div>
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
        .training-card--review { border-color: #b8860b; background: #fffbeb; cursor: default; }
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

        /* Review step */
        .review-header { text-align: center; margin-bottom: 28px; }
        .review-icon { font-size: 48px; margin-bottom: 8px; }
        .review-title { font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #111827; }
        .review-block { margin-bottom: 32px; }
        .review-section-label { font-size: 12px; font-weight: 700; color: #b8860b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .review-status { font-size: 14px; color: #6b7280; text-align: center; }

        /* Review question card — red border by default, green when acknowledged */
        .review-question-card { background: #fff; border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin-bottom: 14px; transition: all 0.3s; }
        .review-question-card--done { border-color: #16a34a; background: #f0fdf4; }

        /* Wrong / correct answer display */
        .review-answer { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
        .review-answer--wrong { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .review-answer--correct { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .review-answer-icon { font-weight: 700; font-size: 18px; flex-shrink: 0; line-height: 1.4; }
        .review-answer-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; opacity: 0.7; }
        .review-answer-text { font-weight: 600; }

        /* Checkbox */
        .review-checkbox { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 12px 14px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: #374151; transition: all 0.2s; }
        .review-checkbox:hover { border-color: #b8860b; background: #fffbeb; }
        .review-checkbox--checked { border-color: #16a34a; background: #f0fdf4; color: #15803d; }
        .review-checkbox input[type="checkbox"] { width: 18px; height: 18px; accent-color: #16a34a; cursor: pointer; flex-shrink: 0; }

        /* Actions */
        .step-actions { display: flex; justify-content: center; margin-top: 28px; }
        .btn-primary-train { padding: 13px 40px; background: #111827; color: #fff; border: none; border-radius: 999px; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
        .btn-primary-train:hover { opacity: 0.85; }
        .btn-primary-train:disabled { background: #9ca3af; cursor: not-allowed; opacity: 1; }

        /* Result */
        .result-wrap { display: flex; justify-content: center; padding: 20px 0; }
        .result-card { border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 480px; width: 100%; }
        .result-card--pass { background: linear-gradient(135deg, #1c1917 0%, #2d2521 100%); color: #fff; border: 2px solid #b8860b; }
        .cert-badge { margin-bottom: 24px; }
        .cert-badge-icon { font-size: 60px; display: block; margin-bottom: 12px; }
        .cert-title { font-size: 24px; font-weight: 800; color: #d4a843; margin: 0 0 8px; }
        .cert-sub { font-size: 15px; color: #e7e5e4; margin: 0; }
        .cert-stamp { display: inline-block; margin-top: 20px; border: 2px solid #d4a843; color: #d4a843; padding: 8px 24px; border-radius: 4px; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; transform: rotate(-2deg); }
        .cert-note { font-size: 13px; color: #a8a29e; margin: 20px 0 24px; }
        .btn-dashboard-link { display: inline-block; background: #d4a843; color: #1c1917; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 999px; }
      `}</style>
    </>
  );
}
