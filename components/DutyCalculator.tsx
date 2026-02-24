// FILE: /components/DutyCalculator.tsx
// Estimated duties & taxes calculator for international buyers.
// Uses standard duty/VAT rates by country — shows approximate import costs.

import { useState } from "react";

type Props = {
  price: number;
  currency: string;
  category: string;
};

// Common duty rates for luxury/fashion goods by country (approximate)
const COUNTRY_RATES: Record<
  string,
  { name: string; dutyPct: number; vatPct: number; threshold: number }
> = {
  US: { name: "United States", dutyPct: 0, vatPct: 0, threshold: 800 },
  CA: { name: "Canada", dutyPct: 18, vatPct: 5, threshold: 20 },
  GB: { name: "United Kingdom", dutyPct: 12, vatPct: 20, threshold: 135 },
  AU: { name: "Australia", dutyPct: 5, vatPct: 10, threshold: 1000 },
  DE: { name: "Germany", dutyPct: 12, vatPct: 19, threshold: 150 },
  FR: { name: "France", dutyPct: 12, vatPct: 20, threshold: 150 },
  IT: { name: "Italy", dutyPct: 12, vatPct: 22, threshold: 150 },
  ES: { name: "Spain", dutyPct: 12, vatPct: 21, threshold: 150 },
  JP: { name: "Japan", dutyPct: 10, vatPct: 10, threshold: 10000 },
  IL: { name: "Israel", dutyPct: 12, vatPct: 17, threshold: 75 },
  ZA: { name: "South Africa", dutyPct: 45, vatPct: 15, threshold: 50 },
};

export default function DutyCalculator({ price, currency, category }: Props) {
  const [country, setCountry] = useState("");
  const [expanded, setExpanded] = useState(false);

  const rates = country ? COUNTRY_RATES[country] : null;

  let dutyAmount = 0;
  let vatAmount = 0;
  let totalEstimate = price;

  if (rates && price > rates.threshold) {
    dutyAmount = Math.round(price * (rates.dutyPct / 100));
    vatAmount = Math.round((price + dutyAmount) * (rates.vatPct / 100));
    totalEstimate = price + dutyAmount + vatAmount;
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    });

  return (
    <div className="duty-calc">
      <button
        type="button"
        className="duty-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>Estimate duties &amp; taxes</span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="duty-body">
          <label className="duty-label">
            Destination country
            <select
              className="duty-select"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Select country...</option>
              {Object.entries(COUNTRY_RATES).map(([code, r]) => (
                <option key={code} value={code}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          {rates && (
            <div className="duty-result">
              {price <= rates.threshold ? (
                <p className="duty-free">
                  No import duties expected — item value is below the{" "}
                  {rates.name} duty-free threshold of {fmt(rates.threshold)}.
                </p>
              ) : (
                <>
                  <div className="duty-row">
                    <span>Item price</span>
                    <span>{fmt(price)}</span>
                  </div>
                  <div className="duty-row">
                    <span>
                      Est. import duty ({rates.dutyPct}%)
                    </span>
                    <span>{fmt(dutyAmount)}</span>
                  </div>
                  <div className="duty-row">
                    <span>
                      Est. VAT / sales tax ({rates.vatPct}%)
                    </span>
                    <span>{fmt(vatAmount)}</span>
                  </div>
                  <div className="duty-row duty-total">
                    <span>Est. total landed cost</span>
                    <span>{fmt(totalEstimate)}</span>
                  </div>
                </>
              )}
              <p className="duty-disclaimer">
                Estimates only — actual duties and taxes are determined by your
                country&apos;s customs authority at time of import.
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .duty-calc {
          margin-top: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          overflow: hidden;
        }
        .duty-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          text-align: left;
        }
        .duty-toggle:hover {
          background: #f9fafb;
        }
        .duty-body {
          padding: 0 16px 16px;
        }
        .duty-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }
        .duty-select {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          color: #111827;
          background: #f9fafb;
          outline: none;
        }
        .duty-select:focus {
          border-color: #111827;
          background: #fff;
        }
        .duty-result {
          margin-top: 12px;
        }
        .duty-free {
          font-size: 13px;
          color: #15803d;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 10px 12px;
          margin: 0;
          font-weight: 500;
        }
        .duty-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
        }
        .duty-row:last-of-type {
          border-bottom: none;
        }
        .duty-total {
          font-weight: 700;
          color: #111827;
          border-top: 1px solid #e5e7eb;
          margin-top: 4px;
          padding-top: 8px;
          font-size: 14px;
        }
        .duty-disclaimer {
          margin: 10px 0 0;
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
